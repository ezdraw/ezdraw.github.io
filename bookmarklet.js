(function() {
  const frameId = "ez-draw-bookmarklet-frame";
  
  // Toggle feature: Click again to completely remove the canvas overlay
  const existingFrame = document.getElementById(frameId);
  if (existingFrame) {
    existingFrame.remove();
    return;
  }

  // Create the overlay view
  const iframe = document.createElement("iframe");
  iframe.id = frameId;
  
  // Ensure the iframe itself is entirely see-through and captures the whole viewport
  Object.assign(iframe.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    border: "none",
    zIndex: "9999999", 
    backgroundColor: "transparent",
    colorScheme: "light"
  });

  // Source payload code package with transparent layouts
  const htmlContent = `<!doctype html>
<html>
<head>
<link rel="icon" type="image/png" href="ez.png">
<link rel="manifest" href="manifest.webmanifest">
<script>
  if (typeof navigator.serviceWorker !== 'undefined') {
    navigator.serviceWorker.register('sw.js')
  }
<\/script>
<title>Ez-Draw</title>
    <meta name="theme-color" content="#2196f3">

     <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            user-select: none;
            -webkit-user-select: none;
        }

        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: transparent !important; /* Made transparent to reveal the underlying webpage */
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            touch-action: none; 
        }

        #canvas-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            background: transparent !important;
        }

        canvas {
            display: block;
            touch-action: none;
            background: transparent !important; /* Ensures the canvas drawing layer is see-through */
        }

        #tool-container {
            position: fixed;
            top: 14px;
            right: 14px;
            z-index: 10003;
            padding: 14px;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 10px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-width: 280px;
            max-height: calc(100vh - 28px);
            overflow-y: auto;
            color: #222;
        }

        #tool-container button {
            padding: 6px 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            background: #fff;
            color: #333;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }

        #tool-container button:hover {
            background: #f0f0f5;
            border-color: #bbb;
        }

        #tool-container button:active {
            background: #e0e0e5;
        }

        #tool-container select, #tool-container input[type="text"] {
            padding: 5px 8px;
            border-radius: 6px;
            border: 1px solid #ccc;
            font-size: 13px;
            background: #fff;
        }

        .tool-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 13px;
        }

        .layer-item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 6px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            margin-bottom: 4px;
        }

        .layer-item.active {
            border-color: #2196f3;
            background: #e3f2fd;
        }

        .layer-item button {
            padding: 2px 5px !important;
            font-size: 11px !important;
        }

        #modal-overlay {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.4);
            display: none;
            z-index: 10010;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(4px);
        }

        #modal-box {
            background: #fff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            min-width: 280px;
            max-width: 90vw;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
        }

        #drawing-circle-cursor {
            position: fixed;
            pointer-events: none;
            z-index: 10001;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            display: none;
            box-shadow: 0 0 2px rgba(0,0,0,0.5);
        }
    </style>
</head>
<body>

    <div id="canvas-container"></div>

    <div id="modal-overlay">
        <div id="modal-box">
            <div id="modal-msg"></div>
            <input type="text" id="modal-input" style="display:none; width:100%;">
            <div id="modal-btn-row" style="display:flex; gap:8px;"></div>
        </div>
    </div>

    <button id="close-overlay-widget" style="position:fixed; bottom:14px; right:14px; z-index:10005; padding:8px 14px; background:#ff4d4d; color:white; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; font-family:sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.15);">Exit Canvas</button>

    <script src="https://github.io"><\/script>
    <script>
      document.getElementById('close-overlay-widget').addEventListener('click', () => {
        window.parent.postMessage('close-ez-draw', '*');
      });
    <\/script>
</body>
</html>`;

  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  window.addEventListener("message", function handler(event) {
    if (event.data === "close-ez-draw") {
      iframe.remove();
      window.removeEventListener("message", handler);
    }
  });
})();
