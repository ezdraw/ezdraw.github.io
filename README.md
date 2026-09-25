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
<br>
**_Note that EzDraw is built for Chromebooks, made for school students, it likely will not work on other devices._**


<br>
<br>
 
## Showcase

The cloud software comes packed with amazing state of the art CaineTech smoothing! Optional levels as well as an option to completely disable.

![drawing.jpeg](https://ezdraw.github.io/drawing.jpeg)
Note that this image was taken without full anti-aliasing.

## Try the native drawing WebApp
[Click here to use the Native Drawing app!](https://ezdraw.github.io/draw)
Users on Chromium based browsers can install it as a PWA (Progressive Web App)
For offline use, you can download the HTML file as it has all dependency's kept within that one file, and works completely offline IF downloaded. - However, the PWA may provide offline use as well, but offline use for the WebApp is untested as of 10/1/2025

 <br>
 

## Adding the bookmarklet

Drag the link below into your bookmarks bar: <br>
<a href="javascript:(function(){var s=document.createElement('script');s.src='https://raw.githubusercontent.com/ezdraw/ezdraw.github.io/refs/heads/main/bookmarklet.js';document.body.appendChild(s);})();">test</a>
<br>

## True offline Single-File html
Don't want to worry about downloading a PWA, not being able to use it offline if you cleared cache? Well you DON'T have to worry!
Click the link below to download an html file thta you can open and use offline! <br>
<a href="offline.html" download="ezdraw-offline.html">Click Here</a>
<br>
<br>

[View License](https://ezdraw.github.io/mit)
