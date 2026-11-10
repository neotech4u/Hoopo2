# Hoopoe Car Companion 🚗🦅

Smart Automotive Cockpit, Real-Time Navigation HUD & Redwing AI Travel Buddy with Islamic Prayer times, Travel Dua recitation, offline map caching, and standard EPA fuel/CO2 emissions logging.

![Hoopoe Logo](public/assets/aistudio/hoopoe_logo_bedb9b31.png)

## 📱 Compiling and Publishing as Android APK on GitHub

This repository is pre-configured with a complete **GitHub Actions Android CI/CD workflow** (`.github/workflows/build-apk.yml`). When you push to GitHub, GitHub automatically compiles the `.apk` file for you in the cloud.

### Step 1: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `hoopoe-car-companion`).
3. Leave it public or private, and click **Create repository**.

### Step 2: Push This Code to GitHub
In your terminal, link and push to your GitHub repo:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/hoopoe-car-companion.git
git branch -M main
git push -u origin main
```

### Step 3: Download Your Compiled `.apk` from GitHub Actions
1. Open your repository on GitHub.
2. Click on the **Actions** tab at the top.
3. You will see the **"Compile Android APK"** workflow running automatically.
4. Once completed (~2 minutes), click on the workflow run, scroll down to **Artifacts**, and download `hoopoe-car-companion-debug-apk.zip` containing your compiled `.apk`!
5. To generate a public release, create a new Release in GitHub and the workflow will automatically attach the `.apk` to the release assets.

---

## ⚡ Direct On-Device Installation (Instant WebAPK)

Android Chrome also includes a built-in WebAPK compiler:
1. Open your app URL in **Google Chrome** on your Android device:
   ```
   https://ais-pre-nvonhn7yskqyazeqwydrre-836165470922.asia-northeast1.run.app
   ```
2. Tap the **"Install APK"** button in the top navigation bar (or Chrome menu `⋮` → **Install app**).
3. Android compiles and installs the app directly with hardware GPS access, offline maps, and full-screen landscape dashboard.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
