# ez-write
Simple Drawing utility with a few preset thicknesses, custom color picker, clear drawing feature, eraser, and export options. - Runs in web browser and is made for its bookmarklet version, for annotating web-pages.
<br>
## Changelog
### Update v1.2 released!
This version adds layering, custom px sizes, opacity control, and some quality of life bug fixes and performance enhancements.
#### Additional Mini Updates
v1.2.1 Simplified html code and fixed a bug where the user would click down, but if the cursor didn't move, it wouldn't generate a full colored circle/line segment, instead it would leave a tiny black square. This was caused by the drawing function being triggered by mousemove and wasn't set to trigger on initial mousedown.

v1.2.2 - v1.2.5 <br>
Various fixes to the offline usage for the app.


<br>
<br>
## Showcase
The cloud software comes packed with amazing state of the art CaineTech smoothing! Optional levels as well as an option to completely disable.

![web-drawing-screenshot (3)](https://github-production-user-asset-6210df.s3.amazonaws.com/202117867/496136087-51f7dbb5-1114-476b-b74a-3d2d4cd640a9.jpeg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20251007%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251007T110728Z&X-Amz-Expires=300&X-Amz-Signature=03babd70289648e1511d3641db06e5d654550178737beb8c3a353b7d1bd40935&X-Amz-SignedHeaders=host)
Note that this image was taken without full anti-aliasing.

## Try the native drawing WebApp
[Click here to use the Native Drawing app!](https://ezdraw.github.io/draw)
Users on Chromium based browsers can install it as a PWA (Progressive Web App)
For offline use, you can download the HTML file as it has all dependency's kept within that one file, and works completely offline IF downloaded. - However, the PWA may provide offline use as well, but offline use for the WebApp is untested as of 10/1/2025

 <br>
 

## Adding the bookmarklet


Go to raw and copy/drag into your bookmarks bar. You can also copy the text and paste it into a custom bookmark/bookmarklet, no need to add 'javascript:' its already included.

You can also copy from below.

```
javascript: fetch("https://raw.githubusercontent.com/ColaCaine/ez-write/refs/heads/main/bookmarklet.js").then(r => r.text()).then(r => eval(r))
```
