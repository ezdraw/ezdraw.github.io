# ez-write
Simple Drawing utility with a few preset thicknesses, custom color picker, clear drawing feature, eraser, and export options. - Runs in web browser and is made for its bookmarklet version, for annotating web-pages.


## Showcase
The cloud software comes packed with amazing state of the art CaineTech smoothing! Optional levels as well as an option to completely disable.

![web-drawing-screenshot (3)](https://github.com/user-attachments/assets/51f7dbb5-1114-476b-b74a-3d2d4cd640a9)
Note that this image was taken without full anti-aliasing.

## Try the native drawing WebApp
[Click here to use the Native Drawing app!](https://colacaine.github.io/ez-write/draw)
Users on Chromium based browsers can install it as a PWA (Progressive Web App)
For offline use, you can download the HTML file as it has all dependency's kept within that one file, and works completely offline IF downloaded. - However, the PWA may provide offline use as well, but offline use for the WebApp is untested as of 10/1/2025

 <br>
 

## Adding the bookmarklet


Go to raw and copy/drag into your bookmarks bar. You can also copy the text and paste it into a custom bookmark/bookmarklet, no need to add 'javascript:' its already included.

You can also copy from below.

```
javascript: fetch("https://raw.githubusercontent.com/ColaCaine/ez-write/refs/heads/main/bookmarklet.js").then(r => r.text()).then(r => eval(r))
```
