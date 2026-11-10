import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Terminal,
  ShieldCheck,
  Sparkles,
  Layers,
  Cpu,
  ArrowRight,
  HardDrive,
  GitBranch,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose,
  appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-nvonhn7yskqyazeqwydrre-836165470922.asia-northeast1.run.app',
}) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'instant' | 'cloud' | 'github' | 'native'>('instant');

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const capacitorCommands = `npm run build
npx @capacitor/cli add android
npx @capacitor/cli open android
# In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(capacitorCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const gitPublishCommands = `git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/hoopoe-car-companion.git
git branch -M main
git push -u origin main`;

  const handleCopyGitCmd = () => {
    navigator.clipboard.writeText(gitPublishCommands);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  const handleDownloadManifest = () => {
    const manifestData = {
      id: '/',
      name: 'Hoopoe Car Companion',
      short_name: 'Hoopoe',
      description: 'Automotive car companion, navigation HUD, and Redwing AI travel buddy.',
      theme_color: '#090d16',
      background_color: '#090d16',
      display: 'standalone',
      orientation: 'landscape',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };

    const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(appUrl)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apk-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Android APK &bull; Package &amp; Deploy
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  v1.0.0 APK
                </span>
              </div>
              <h2 id="apk-modal-title" className="text-base font-extrabold text-white">
                Compile &amp; Install as Android APK
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 my-3 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'instant'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Instant WebAPK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'cloud'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>2. Cloud APK Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'github'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>3. GitHub APK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('native')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'native'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>4. Android Studio</span>
          </button>
        </div>

        {/* TAB 1: Instant WebAPK Install */}
        {activeTab === 'instant' && (
          <div className="space-y-3.5 my-1">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Direct WebAPK On-Device Compilation
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Android OS features an automatic <strong>WebAPK</strong> engine. When you install Hoopoe Cockpit, Android generates a signed native APK on the fly, adding it to your app drawer with standalone windowing, offline map caching, and hardware GPS integration.
                  </p>
                </div>
              </div>

              {/* Install Button if triggered */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                {isInstallable ? (
                  <button
                    type="button"
                    onClick={install}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4 animate-bounce" />
                    <span>Install Hoopoe APK to This Device</span>
                  </button>
                ) : isInstalled ? (
                  <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>Already Running as Installed Native App</span>
                  </div>
                ) : (
                  <div className="w-full text-xs text-slate-300 space-y-1.5">
                    <span className="font-semibold text-emerald-400 block">
                      To install on your Android phone right now:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] pl-1">
                      <li>Open this URL in <strong>Google Chrome</strong> on your phone.</li>
                      <li>Tap the Chrome menu (<strong>⋮</strong> three dots top right).</li>
                      <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                      <li>Android will automatically compile and install the WebAPK file!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Share / Open URL */}
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                App Installation Link (Open on phone)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-1.5 px-3 text-xs text-slate-300 font-mono truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Cloud 1-Click APK Generator (PWABuilder) */}
        {activeTab === 'cloud' && (
          <div className="space-y-3.5 my-1">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Cloud APK &amp; AAB Generator (PWABuilder / Google TWA)
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Uses Microsoft's open-source <strong>PWABuilder</strong> (powered by Google's Bubblewrap) to package this PWA into an installable <strong>signed .APK</strong> and <strong>Google Play Store .AAB package</strong> without needing Android Studio installed locally.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Generate Signed APK on PWABuilder</span>
                </a>
                <span className="text-[10px] text-slate-400 block text-center">
                  Takes ~30 seconds to generate a downloadable APK ready for Android sideloading or Play Store release.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Export Web App Manifest</span>
                <span className="text-[10px] text-slate-400">
                  Pre-configured with icons, standalone display, and theme colors.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadManifest}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>manifest.json</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: GitHub Actions Automated Cloud APK Build */}
        {activeTab === 'github' && (
          <div className="space-y-3.5 my-1">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Publish to GitHub &bull; Automated APK Build
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    This project includes a ready-to-run <strong>GitHub Actions CI/CD workflow</strong> (<code>.github/workflows/build-apk.yml</code>). When you push code to your GitHub repo, GitHub automatically sets up Java 17 + Android SDK, builds the app, and produces an installable <code>.apk</code> artifact and release.
                  </p>
                </div>
              </div>

              {/* Steps to push */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2.5 text-xs">
                <div>
                  <span className="font-bold text-emerald-400 block mb-1">
                    Step 1: Create a repository on GitHub
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    Create a new empty repo at <a href="https://github.com/new" target="_blank" rel="noreferrer" className="text-emerald-400 underline">github.com/new</a> named <code>hoopoe-car-companion</code>.
                  </span>
                </div>

                <div>
                  <span className="font-bold text-emerald-400 block mb-1">
                    Step 2: Push code to your repository
                  </span>
                  <div className="relative bg-slate-950 rounded-xl p-2.5 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                    <button
                      type="button"
                      onClick={handleCopyGitCmd}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Copy git commands"
                    >
                      {copiedGitCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="pr-10">{gitPublishCommands}</pre>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-emerald-400 block mb-1">
                    Step 3: Download your compiled APK
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    Open the <strong>Actions</strong> tab on your GitHub repository. The <em>"Compile Android APK"</em> job will run (~2 minutes) and attach <code>hoopoe-car-companion-debug-apk.zip</code> for instant download!
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Local Android Studio & Capacitor Build */}
        {activeTab === 'native' && (
          <div className="space-y-3.5 my-1">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Compile Native APK via Capacitor &amp; Android Studio
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    The project already contains <code>capacitor.config.json</code> with package ID <code>com.hoopoe.carcompanion</code>. Run these commands locally to produce the debug and release <code>.apk</code> binaries:
                  </p>
                </div>
              </div>

              {/* Code snippet */}
              <div className="mt-3 relative bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                <button
                  type="button"
                  onClick={handleCopyCmd}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Copy commands"
                >
                  {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <pre className="pr-10">{capacitorCommands}</pre>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                <p>Output file will be generated at:</p>
                <code className="text-slate-300 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 block truncate">
                  android/app/build/outputs/apk/debug/app-debug.apk
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800 mt-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
