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

/**
 * AI Companion Endpoint: Generates spontaneous, friendly travel buddy comments
 * as if Hoopo is a close friend riding in the passenger seat.
 */
app.post('/api/hoopo/companion-comment', async (req, res) => {
  const {
    userName = 'Friend',
    category = 'spontaneous',
    currentSpeed = 70,
    speedLimit = 80,
    weather = 'Clear',
    nowPlaying = '',
    tripMinutes = 20,
  } = req.body;

  if (!ai) {
    // Graceful fallback if GEMINI_API_KEY is not configured
    return res.json({
      comment: getFallbackComment(userName, category, weather, nowPlaying, tripMinutes),
      source: 'local_companion',
    });
  }

  try {
    const prompt = `
Context:
- Friend's Name: ${userName}
- Current Vehicle Speed: ${Math.round(currentSpeed)} km/h (posted speed limit: ${speedLimit} km/h)
- Weather along route: ${weather}
- Music/Audio in car: ${nowPlaying || 'Quran & Peaceful Roadtrip Radio'}
- Driving duration so far: ${tripMinutes} minutes
- Target topic focus: ${category} (can be weather, what user is listening to, reminding for a short break/water, peaceful dhikr, or casual friendly banter).

Task:
Say a short, warm, natural remark (1 to 2 sentences max) to ${userName} in a friendly tone as their traveling companion. Always start with or include their name naturally.
`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timeout')), 2200)
    );

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are Hoopo, a warm, caring, witty Muslim bird-drone companion traveling in the car with your close friend. Speak naturally, warmly, and casually—exactly like a loyal friend in the passenger seat. Max 1-2 spoken sentences. Never sound robotic or formal.',
      },
    });

    const response = await Promise.race([aiPromise, timeoutPromise]);
    const comment = response.text?.trim() || getFallbackComment(userName, category, weather, nowPlaying, tripMinutes);
    res.json({ comment, source: 'gemini_ai' });
  } catch (error) {
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
