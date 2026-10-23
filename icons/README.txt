Second app icon files

Upload these files into an icons/ folder at the root of your website repository:
- icon-192.png
- icon-512.png
- apple-touch-icon.png
- favicon-48.png

For a static website, add inside <head> (adjust paths if the site is hosted in a subdirectory):
<link rel="icon" type="image/png" sizes="48x48" href="icons/favicon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">

For a PWA, your manifest icons should include:
{"src":"icons/icon-192.png","sizes":"192x192","type":"image/png"},
{"src":"icons/icon-512.png","sizes":"512x512","type":"image/png"}

If hosted on GitHub Pages under /repository-name/, paths may need to start with /repository-name/.
