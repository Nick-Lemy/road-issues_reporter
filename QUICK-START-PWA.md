# 🚀 QUICK START - Deploy Dryvupp as PWA

## ⚡ 3-Minute Setup

### 1️⃣ Build

```bash
npm run build
```

### 2️⃣ Deploy to Netlify (Choose ONE method)

**Option A - Drag & Drop (Fastest - 1 minute)**

1. Go to: https://app.netlify.com/drop
2. Drag the `dist` folder
3. Done! ✅

**Option B - CLI (Best for updates)**

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### 3️⃣ Install on Phone

1. Open the deployed URL on your phone
2. iOS: Tap Share → "Add to Home Screen"
3. Android: Tap menu → "Install app"

---

## 📱 What You Get

✅ App installs on home screen
✅ Works offline (after first visit)
✅ Looks like native app (no browser UI)
✅ Loads instantly
✅ Auto-updates when you deploy

---

## 🎨 Optional: Custom Icons

**Later, when ready:**

1. Create 512x512px logo as `app-logo.png`
2. Run: `chmod +x generate-icons.sh && ./generate-icons.sh`
3. Or use: https://www.pwabuilder.com/imageGenerator
4. Copy icons to `public/icons/`
5. Rebuild and redeploy

---

## ✅ Files Already Created

- `public/manifest.json` - App config
- `public/service-worker.js` - Offline support
- `index.html` - PWA meta tags
- `DEPLOYMENT-GUIDE.md` - Full instructions

---

## 🔗 After Deployment

You'll get a URL like: `https://dryvupp.netlify.app`

Share this with users - they can install with one tap!

---

## 🆘 Need Help?

Read the full guide: `DEPLOYMENT-GUIDE.md`

**Common Issues:**

- Icons not showing? → Use placeholder for now, add custom icons later
- Service worker error? → Check console, ensure `service-worker.js` is in `public/`
- Can't install? → Must be on HTTPS (Netlify provides this automatically)

---

That's it! Your app is now installable! 🎉
