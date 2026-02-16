# Deploy Leshono (web preview) to Netlify

## What I prepared
- `build_web_netlify.zip` (contains the Flutter Web release build)

## Fastest deploy (drag & drop)
1. Go to https://app.netlify.com/
2. Log in
3. Open **Sites**
4. Drag & drop the **unzipped** folder contents OR:
   - unzip `build_web_netlify.zip`
   - drag the extracted folder `build/web` into Netlify

Netlify will give you a public URL like:
- `https://<name>.netlify.app`

## Notes
- If you update the app, repeat `flutter build web --release` and upload again.
