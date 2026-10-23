# softframe

Instagram story templates. Upload a photo, pick one of five pastel frames, download a 1080x1920 PNG.
Static site, no build step, no backend.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server` in this folder.

## Deploy
1. Push this folder to a GitHub repo.
2. On vercel.com: Add New > Project > import the repo > Deploy. (Framework preset: Other. No build command.)

## Add a template
1. Drop a 9:16 image into `templates/`.
2. Add an entry in the `TEMPLATES` array in `app.js` with the photo window position (x, y, w, h measured in pixels on the original image, scaled automatically from 736x1308).
