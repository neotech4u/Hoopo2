import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
process.env.DISABLE_HMR = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini SDK on server-side as mandated by guidelines
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory sliding window rate limiter
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string, maxReqs: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = ipRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxReqs) return false;
  record.count++;
  return true;
}

const VALID_CATEGORIES = new Set([
  'weather',
  'music',
  'break',
  'smooth_driving',
  'dhikr',
  'trivia',
  'spontaneous',
  'random',
]);

function sanitizeInput(val: unknown, maxLen: number, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const cleaned = val.replace(/[\r\n\t]/g, ' ').replace(/[^\w\s.,!?'\-()#]/gi, '').trim();
  return cleaned.slice(0, maxLen) || fallback;
}

/**
 * AI Companion Endpoint: Generates spontaneous, friendly travel buddy comments
 * as if Hoopo is a close friend riding in the passenger seat.
 * Input is rigorously validated and rate-limited to avoid prompt manipulation.
 */
app.post('/api/hoopo/companion-comment', async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp, 40, 60000)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment.',
      comment: 'Cruising smoothly ahead! Safe driving is always our top priority.',
      source: 'local_companion',
    });
  }

  const rawCat = typeof req.body?.category === 'string' ? req.body.category.toLowerCase().trim() : 'spontaneous';
  const category = VALID_CATEGORIES.has(rawCat) ? rawCat : 'spontaneous';
  const userName = sanitizeInput(req.body?.userName, 30, 'Friend');
  const weather = sanitizeInput(req.body?.weather, 40, 'Clear');
  const nowPlaying = sanitizeInput(req.body?.nowPlaying, 60, 'Quran & Peaceful Roadtrip Radio');
  const currentSpeed = Math.min(250, Math.max(0, Math.round(Number(req.body?.currentSpeed) || 0)));
  const speedLimit = Math.min(160, Math.max(20, Math.round(Number(req.body?.speedLimit) || 80)));
  const tripMinutes = Math.min(1440, Math.max(0, Math.round(Number(req.body?.tripMinutes) || 15)));

  if (!ai) {
    // Graceful fallback if GEMINI_API_KEY is not configured
    return res.json({
      comment: getFallbackComment(userName, category, weather, nowPlaying, tripMinutes),
      source: 'local_companion',
    });
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, 2400);

  try {
    const prompt = `
Context:
- Friend's Name: ${userName}
- Current Vehicle Speed: ${currentSpeed} km/h (posted speed limit: ${speedLimit} km/h)
- Weather along route: ${weather}
- Music/Audio in car: ${nowPlaying}
- Driving duration so far: ${tripMinutes} minutes
- Target topic focus: ${category} (weather, music, road break/water, peaceful dhikr, road trivia, or casual friendly banter).

Task:
Say a short, warm, natural remark (1 to 2 sentences max) to ${userName} in a friendly tone as their traveling companion. Always start with or include their name naturally.
`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are Hoopo, a warm, caring, witty Muslim bird-drone companion traveling in the car with your close friend. Speak naturally, warmly, and casually—exactly like a loyal friend in the passenger seat. Max 1-2 spoken sentences. Never sound robotic or formal.',
        abortSignal: abortController.signal,
      },
    });

    const response = await aiPromise;
    clearTimeout(timeoutId);
    const comment = response.text?.trim() || getFallbackComment(userName, category, weather, nowPlaying, tripMinutes);
    res.json({ comment, source: 'gemini_ai' });
  } catch (error) {
    clearTimeout(timeoutId);
    res.json({
      comment: getFallbackComment(userName, category, weather, nowPlaying, tripMinutes),
      source: 'local_companion',
    });
  }
});

function getFallbackComment(
  userName: string,
  category: string,
  weather: string,
  nowPlaying: string,
  tripMinutes: number
): string {
  switch (category) {
    case 'weather':
      return `${userName}, the skies are looking great ahead. Perfect cruising conditions for our journey, Alhamdulillah!`;
    case 'music':
      return `${userName}, this audio in the cabin brings such a calm, peaceful vibe. Really enjoying the drive with you!`;
    case 'break':
      return `${userName}, we've been cruising for ${tripMinutes} minutes. Remember to take a quick sip of water and stretch when we reach the next plaza!`;
    case 'smooth_driving':
      return `${userName}, your driving is super smooth today! That steady pace is doing wonders for our fuel economy.`;
    default:
      return `${userName}, Alhamdulillah for this peaceful journey. Let's keep this good rhythm going!`;
  }
}

// Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hoopo Cockpit Server listening on port ${PORT}`);
  });
}

startServer();
