(function() {
    // Prevent duplicate injection
    if (window.removeEzDraw) {
        window.removeEzDraw();
    }

    // --- Custom Modal Dialog (Replaces native alert/confirm) ---
    var modalOverlay = document.createElement('div');
    modalOverlay.id = 'ezdraw-modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.left = '0';
    modalOverlay.style.top = '0';
    modalOverlay.style.width = '100vw';
    modalOverlay.style.height = '100vh';
    modalOverlay.style.background = 'rgba(0, 0, 0, 0.4)';
    modalOverlay.style.display = 'none';
    modalOverlay.style.zIndex = '2147483648'; // Above canvas overlay
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.backdropFilter = 'blur(4px)';
    modalOverlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    var modalBox = document.createElement('div');
    modalBox.style.background = '#ffffff';
    modalBox.style.padding = '20px';
    modalBox.style.borderRadius = '12px';
    modalBox.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)';
    modalBox.style.minWidth = '280px';
    modalBox.style.maxWidth = '90vw';
    modalBox.style.display = 'flex';
    modalBox.style.flexDirection = 'column';
    modalBox.style.alignItems = 'center';
    modalBox.style.gap = '14px';

    var modalMsg = document.createElement('div');
    modalMsg.style.fontSize = '15px';
    modalMsg.style.color = '#222';
    modalMsg.style.textAlign = 'center';
    modalBox.appendChild(modalMsg);

    var modalInput = document.createElement('input');
    modalInput.type = 'text';
    modalInput.style.display = 'none';
    modalInput.style.width = '100%';
    modalInput.style.padding = '6px 10px';
    modalInput.style.border = '1px solid #ccc';
    modalInput.style.borderRadius = '6px';
    modalInput.style.fontSize = '14px';
    modalBox.appendChild(modalInput);

    var modalBtnRow = document.createElement('div');
    modalBtnRow.style.display = 'flex';
    modalBtnRow.style.gap = '8px';
    modalBox.appendChild(modalBtnRow);

    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);

    function showModal(msg, opts) {
        return new Promise((resolve) => {
            modalMsg.textContent = msg;
            modalInput.style.display = opts && opts.input ? 'block' : 'none';
            modalInput.value = opts && opts.value ? opts.value : '';
            modalBtnRow.innerHTML = '';
            modalOverlay.style.display = 'flex';

            function close(result) {
                modalOverlay.style.display = 'none';
                resolve(result);
            }

            if (opts && opts.input) {
                setTimeout(() => modalInput.focus(), 50);
                modalInput.onkeydown = function(e) {
                    if (e.key === 'Enter') close(modalInput.value);
                    if (e.key === 'Escape') close(false);
                };
            }

            var buttons = (opts && opts.buttons) ? opts.buttons : ['OK', 'Cancel'];
            buttons.forEach((label, idx) => {
                var btn = document.createElement('button');
                btn.textContent = label;
                btn.style.padding = '6px 16px';
                btn.style.fontSize = '14px';
                btn.style.borderRadius = '6px';
                btn.style.border = '1px solid #ccc';
                btn.style.background = idx === 0 ? '#2196f3' : '#eee';
                btn.style.color = idx === 0 ? '#fff' : '#222';
                btn.style.cursor = 'pointer';
                btn.onclick = function() {
                    if (opts && opts.input && idx === 0) close(modalInput.value);
                    else close(idx === 0);
                };
                modalBtnRow.appendChild(btn);
            });
        });
    }

    var VIRTUAL_SIZE = 100000;
    var VIRTUAL_HALF = VIRTUAL_SIZE / 2;
    var MIN_ZOOM = 0.05, MAX_ZOOM = 5;

    var zoom = 1.0;
    var offsetX = VIRTUAL_HALF, offsetY = VIRTUAL_HALF;
    var isPanning = false, panLast = { x: 0, y: 0 };
    var drawing = false, isErasing = false;
    var currentLineWidth = 4, currentColor = "#FF0000";
    var currentBrush = 'pen';
    var currentOpacity = 1.0;
    var assistLevel = 2, assistLabels = ["None", "Low", "Medium", "High"];

    var undoStack = [], redoStack = [];
    var layers = [ { name: 'Layer 1', drawingHistory: [], visible: true } ];
    var currentLayerIndex = 0;
    var currentSegment = null;
    var activePointerId = null;

    var canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.zIndex = "2147483647"; // Max z-index to overlay any page element
    canvas.style.pointerEvents = "auto";
    canvas.style.touchAction = "none";
    document.body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;

    var cacheCanvas = document.createElement("canvas");
    var cacheCtx = cacheCanvas.getContext("2d");
    var cacheDirty = true;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        cacheCanvas.width = window.innerWidth * dpr;
        cacheCanvas.height = window.innerHeight * dpr;
        cacheCanvas.style.width = window.innerWidth + "px";
        cacheCanvas.style.height = window.innerHeight + "px";

        cacheDirty = true;
        scheduleRedraw();
    }
    window.addEventListener("resize", resize);

    var toolContainer = document.createElement('div');
    toolContainer.id = 'ezdraw-tool-container';
    toolContainer.style.position = 'fixed';
    toolContainer.style.top = '14px';
    toolContainer.style.right = '14px';
    toolContainer.style.zIndex = '2147483648';
    toolContainer.style.padding = '14px';
    toolContainer.style.background = 'rgba(255, 255, 255, 0.94)';
    toolContainer.style.backdropFilter = 'blur(10px)';
    toolContainer.style.border = '1px solid rgba(0, 0, 0, 0.15)';
    toolContainer.style.borderRadius = '10px';
    toolContainer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.18)';
    toolContainer.style.display = 'flex';
    toolContainer.style.flexDirection = 'column';
    toolContainer.style.gap = '8px';
    toolContainer.style.maxWidth = '280px';
    toolContainer.style.maxHeight = 'calc(100vh - 28px)';
    toolContainer.style.overflowY = 'auto';
    toolContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    toolContainer.style.color = '#222';
    document.body.appendChild(toolContainer);

    function createButton(text, onClick) {
        var btn = document.createElement('button');
        btn.textContent = text;
        btn.onclick = onClick;
        btn.style.padding = '6px 12px';
        btn.style.border = '1px solid #ccc';
        btn.style.borderRadius = '6px';
        btn.style.background = '#fff';
        btn.style.color = '#333';
        btn.style.fontSize = '13px';
        btn.style.fontWeight = '500';
        btn.style.cursor = 'pointer';
        return btn;
    }

    var assistSelect = document.createElement('select');
    assistSelect.title = "Drawing Smoothing / Aim Assist";
    assistSelect.style.padding = '5px 8px';
    assistSelect.style.borderRadius = '6px';
    assistSelect.style.border = '1px solid #ccc';
    assistSelect.style.fontSize = '13px';
    assistLabels.forEach((label, idx) => {
        var opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = "Assist: " + label;
        assistSelect.appendChild(opt);
    });
    assistSelect.value = assistLevel;
    assistSelect.onchange = function() { assistLevel = parseInt(this.value, 10); };
    toolContainer.appendChild(assistSelect);

    // Color Picker
    var colorRow = document.createElement('div');
    colorRow.style.display = 'flex';
    colorRow.style.alignItems = 'center';
    colorRow.style.justifyContent = 'space-between';
    colorRow.style.fontSize = '13px';

    var colorLabel = document.createElement('label');
    colorLabel.textContent = 'Stroke Color:';
    var colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = currentColor;
    colorPicker.style.border = 'none';
    colorPicker.style.width = '32px';
    colorPicker.style.height = '28px';
    colorPicker.style.cursor = 'pointer';
    colorPicker.onchange = function() {
        currentColor = colorPicker.value;
        if (isErasing) toggleEraser();
        updateContextStyle();
        updateCursorSize();
        cacheDirty = true; scheduleRedraw();
    };
    colorRow.appendChild(colorLabel);
    colorRow.appendChild(colorPicker);
    toolContainer.appendChild(colorRow);

    var thicknessRow = document.createElement('div');
    thicknessRow.style.display = 'flex';
    thicknessRow.style.alignItems = 'center';
    thicknessRow.style.justifyContent = 'space-between';
    thicknessRow.style.fontSize = '13px';

    var thicknessLabel = document.createElement('label');
    thicknessLabel.textContent = 'Brush Size:';
    var thicknessSlider = document.createElement('input');
    thicknessSlider.type = 'range';
    thicknessSlider.min = 1;
    thicknessSlider.max = 64;
    thicknessSlider.value = currentLineWidth;
    thicknessSlider.style.width = '70px';

    var thicknessValue = document.createElement('span');
    thicknessValue.textContent = currentLineWidth + 'px';
    thicknessValue.style.cursor = 'pointer';
    thicknessValue.title = 'Click to type exact size';

    thicknessValue.addEventListener('click', function() {
        var input = document.createElement('input');
        input.type = 'number';
        input.min = 1; input.max = 200;
        input.value = thicknessSlider.value;
        input.style.width = '48px';
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') input.blur();
        });
        input.addEventListener('blur', function() {
            var val = parseInt(input.value, 10);
            if (!isNaN(val) && val >= 1) {
                thicknessSlider.value = Math.min(64, val);
                setThickness(val);
            }
            thicknessValue.style.display = '';
            input.remove();
        });
        thicknessValue.style.display = 'none';
        thicknessValue.parentNode.insertBefore(input, thicknessValue);
        input.focus();
    });

    thicknessSlider.oninput = function() { setThickness(parseInt(thicknessSlider.value, 10)); };
    thicknessRow.appendChild(thicknessLabel);
    thicknessRow.appendChild(thicknessSlider);
    thicknessRow.appendChild(thicknessValue);
    toolContainer.appendChild(thicknessRow);

    // Opacity
    var opacityRow = document.createElement('div');
    opacityRow.style.display = 'flex';
    opacityRow.style.alignItems = 'center';
    opacityRow.style.justifyContent = 'space-between';
    opacityRow.style.fontSize = '13px';

    var opacityLabel = document.createElement('label');
    opacityLabel.textContent = 'Opacity:';
    var opacitySlider = document.createElement('input');
    opacitySlider.type = 'range';
    opacitySlider.min = 10; opacitySlider.max = 100; opacitySlider.value = 100;
    opacitySlider.style.width = '70px';

    var opacityValue = document.createElement('span');
    opacityValue.textContent = '100%';
    opacitySlider.oninput = function() {
        currentOpacity = parseInt(opacitySlider.value, 10) / 100;
        opacityValue.textContent = opacitySlider.value + '%';
        updateContextStyle();
        cacheDirty = true; scheduleRedraw();
    };
    opacityRow.appendChild(opacityLabel);
    opacityRow.appendChild(opacitySlider);
    opacityRow.appendChild(opacityValue);
    toolContainer.appendChild(opacityRow);

    var layerContainer = document.createElement('div');
    layerContainer.style.display = 'flex';
    layerContainer.style.flexDirection = 'column';
    layerContainer.style.gap = '4px';

    var layerList = document.createElement('div');
    function renderLayerList() {
        layerList.innerHTML = '';
        layers.forEach((layer, idx) => {
            var row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '6px';
            row.style.padding = '4px 6px';
            row.style.background = idx === currentLayerIndex ? '#e3f2fd' : '#f8f9fa';
            row.style.border = '1px solid ' + (idx === currentLayerIndex ? '#2196f3' : '#e9ecef');
            row.style.borderRadius = '6px';

            var radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'ezdraw-layer-select';
            radio.checked = idx === currentLayerIndex;
            radio.onclick = function() {
                currentLayerIndex = idx;
                renderLayerList();
                cacheDirty = true; scheduleRedraw();
            };

            var label = document.createElement('span');
            label.textContent = layer.name;
            label.style.flex = '1';
            label.style.fontSize = '12px';
            label.style.fontWeight = idx === currentLayerIndex ? 'bold' : 'normal';

            var visBtn = createButton(layer.visible ? '👁️' : '🚫', function() {
                layer.visible = !layer.visible;
                renderLayerList();
                cacheDirty = true; scheduleRedraw();
            });
            visBtn.style.padding = '2px 5px';
            visBtn.style.fontSize = '11px';

            var delBtn = createButton('🗑️', function() {
                if (layers.length === 1) return;
                showModal('Delete layer "' + layer.name + '"?', { buttons: ['Delete', 'Cancel'] }).then((confirm) => {
                    if (!confirm) return;
                    layers.splice(idx, 1);
                    if (currentLayerIndex >= layers.length) currentLayerIndex = layers.length - 1;
                    renderLayerList();
                    cacheDirty = true; scheduleRedraw();
                });
            });
            delBtn.style.padding = '2px 5px';
            delBtn.style.fontSize = '11px';
            delBtn.disabled = layers.length === 1;

            row.appendChild(radio);
            row.appendChild(label);
            row.appendChild(visBtn);
            row.appendChild(delBtn);
            layerList.appendChild(row);
        });
    }

    var addLayerBtn = createButton('+ Add New Layer', function() {
        layers.push({ name: 'Layer ' + (layers.length + 1), drawingHistory: [], visible: true });
        currentLayerIndex = layers.length - 1;
        renderLayerList();
        cacheDirty = true; scheduleRedraw();
    });

    layerContainer.appendChild(layerList);
    layerContainer.appendChild(addLayerBtn);
    toolContainer.appendChild(layerContainer);

    var eraserButton = createButton('Eraser Mode', toggleEraser);
    var undoBtn = createButton('Undo (Ctrl+Z)', undo);
    var redoBtn = createButton('Redo (Ctrl+Y)', redo);
    var originBtn = createButton('Go to Origin', goToOrigin);
    var clearBtn = createButton('Clear Canvas', clearDrawing);
    var exportJsonBtn = createButton('Export JSON', exportJSON);
    var importJsonBtn = createButton('Import JSON', importJSON);
    var exportJpegBtn = createButton('Export JPEG Image', exportJPEG);

    var removeBtn = createButton('Remove Ez-Draw', removeEzDraw);
    removeBtn.style.background = '#f44336';
    removeBtn.style.color = '#fff';
    removeBtn.style.borderColor = '#d32f2f';

    toolContainer.appendChild(eraserButton);
    toolContainer.appendChild(undoBtn);
    toolContainer.appendChild(redoBtn);
    toolContainer.appendChild(originBtn);
    toolContainer.appendChild(clearBtn);
    toolContainer.appendChild(exportJsonBtn);
    toolContainer.appendChild(importJsonBtn);
    toolContainer.appendChild(exportJpegBtn);
    toolContainer.appendChild(removeBtn);

    renderLayerList();

    var circleCursor = document.createElement('div');
    circleCursor.id = 'ezdraw-circle-cursor';
    circleCursor.style.position = 'fixed';
    circleCursor.style.pointerEvents = 'none';
    circleCursor.style.zIndex = '2147483648';
    circleCursor.style.borderRadius = '50%';
    circleCursor.style.transform = 'translate(-50%, -50%)';
    circleCursor.style.display = 'none';
    circleCursor.style.boxShadow = '0 0 2px rgba(0,0,0,0.5)';
    document.body.appendChild(circleCursor);

    function updateCursorSize() {
        var px = (isErasing ? 20 : currentLineWidth) * zoom;
        circleCursor.style.width = px + 'px';
        circleCursor.style.height = px + 'px';
        circleCursor.style.border = isErasing ? '2px dashed #f44336' : '2px solid #222';
    }

    function setThickness(thickness) {
        currentLineWidth = thickness;
        if (isErasing) toggleEraser();
        updateContextStyle();
        updateCursorSize();
        thicknessSlider.value = thickness;
        thicknessValue.textContent = thickness + 'px';
        cacheDirty = true; scheduleRedraw();
    }

    function toggleEraser() {
        isErasing = !isErasing;
        if (isErasing) {
            eraserButton.textContent = 'Draw Mode';
            eraserButton.style.backgroundColor = '#ffebee';
            eraserButton.style.color = '#c62828';
        } else {
            eraserButton.textContent = 'Eraser Mode';
            eraserButton.style.backgroundColor = '#fff';
            eraserButton.style.color = '#333';
        }
        updateContextStyle();
        updateCursorSize();
        cacheDirty = true; scheduleRedraw();
    }

    function goToOrigin() {
        zoom = 1.0;
        offsetX = VIRTUAL_HALF;
        offsetY = VIRTUAL_HALF;
        cacheDirty = true; scheduleRedraw();
    }

    function smoothPoints(pts, level) {
        if (level === 0 || pts.length < 3) return pts.slice();
        const settings = [
            {window: 0, strength: 0},
            {window: 2, strength: 0.4},
            {window: 4, strength: 0.7},
            {window: 8, strength: 0.85},
        ][level] || {window: 2, strength: 0.4};

        const w = settings.window, s = settings.strength;
        let out = [];
        for (let i = 0; i < pts.length; i++) {
            let sx = 0, sy = 0, count = 0;
            for (let j = -w; j <= w; j++) {
                let idx = Math.max(0, Math.min(pts.length - 1, i + j));
                sx += pts[idx].x;
                sy += pts[idx].y;
                count++;
            }
            let avgx = sx / count, avgy = sy / count;
            out.push({
                x: pts[i].x * (1 - s) + avgx * s,
                y: pts[i].y * (1 - s) + avgy * s
            });
        }
        return out;
    }

    function applyCanvasTransform(targetCtx) {
        var transX = (window.innerWidth / 2 - offsetX * zoom) * dpr;
        var transY = (window.innerHeight / 2 - offsetY * zoom) * dpr;
        targetCtx.setTransform(zoom * dpr, 0, 0, zoom * dpr, transX, transY);
    }

    function drawSmoothLineSegment(context, segment) {
        let pts = segment.points;
        if (!pts || pts.length === 0) return;

        pts = smoothPoints(pts, segment.assistLevel ?? assistLevel);
        context.save();
        context.globalCompositeOperation = segment.isErasing ? 'destination-out' : 'source-over';

        let opacity = typeof segment.opacity === 'number' ? segment.opacity : currentOpacity;
        let color = segment.isErasing ? '#ffffff' : hexToRgba(segment.color || '#FF0000', opacity);

        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = segment.isErasing ? (segment.thickness || 20) : (segment.thickness || currentLineWidth);

        context.beginPath();
        context.moveTo(pts[0].x, pts[0].y);

        if (pts.length === 1) {
            context.arc(pts[0].x, pts[0].y, context.lineWidth / 2, 0, 2 * Math.PI);
            context.fill();
        } else if (pts.length === 2) {
            context.lineTo(pts[1].x, pts[1].y);
            context.stroke();
        } else {
            for (let i = 1; i < pts.length - 2; i++) {
                let xc = (pts[i].x + pts[i + 1].x) / 2;
                let yc = (pts[i].y + pts[i + 1].y) / 2;
                context.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
            }
            let n = pts.length - 1;
            context.quadraticCurveTo(pts[n - 1].x, pts[n - 1].y, pts[n].x, pts[n].y);
            context.stroke();
        }
        context.restore();
    }

    function updateCacheCanvas() {
        cacheCanvas.width = window.innerWidth * dpr;
        cacheCanvas.height = window.innerHeight * dpr;
        cacheCtx.clearRect(0, 0, cacheCanvas.width, cacheCanvas.height);

        layers.forEach((layer, lidx) => {
            if (!layer.visible) return;
            var maxIdx = layer.drawingHistory.length - (drawing && lidx === currentLayerIndex ? 1 : 0);
            for (var i = 0; i < maxIdx; i++) {
                var seg = layer.drawingHistory[i];
                applyCanvasTransform(cacheCtx);
                drawSmoothLineSegment(cacheCtx, seg);
            }
        });
        cacheDirty = false;
    }

    var redrawScheduled = false;
    function scheduleRedraw() {
        if (!redrawScheduled) {
            redrawScheduled = true;
            requestAnimationFrame(redraw);
        }
    }

    function redraw() {
        redrawScheduled = false;
        if (cacheDirty) updateCacheCanvas();

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw cached strokes
        ctx.drawImage(cacheCanvas, 0, 0);

        // Render current active stroke in progress
        if (drawing && layers[currentLayerIndex] && layers[currentLayerIndex].drawingHistory.length) {
            var dh = layers[currentLayerIndex].drawingHistory;
            var activeSeg = dh[dh.length - 1];
            if (activeSeg) {
                applyCanvasTransform(ctx);
                drawSmoothLineSegment(ctx, activeSeg);
            }
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        updateContextStyle();
    }

    function hexToRgba(hex, alpha) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
        var r = parseInt(hex.substring(0,2), 16) || 0;
        var g = parseInt(hex.substring(2,4), 16) || 0;
        var b = parseInt(hex.substring(4,6), 16) || 0;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function updateContextStyle() {
        ctx.strokeStyle = isErasing ? '#ffffff' : hexToRgba(currentColor, currentOpacity);
        ctx.lineWidth = isErasing ? 20 : currentLineWidth;
    }

    function pushToUndo() {
        var dh = layers[currentLayerIndex].drawingHistory;
        undoStack.push(JSON.stringify(dh));
        if (undoStack.length > 100) undoStack.shift();
    }

    function undo() {
        if (undoStack.length === 0) return;
        var dh = layers[currentLayerIndex].drawingHistory;
        redoStack.push(JSON.stringify(dh));
        layers[currentLayerIndex].drawingHistory = JSON.parse(undoStack.pop());
        cacheDirty = true; scheduleRedraw();
    }

    function redo() {
        if (redoStack.length === 0) return;
        var dh = layers[currentLayerIndex].drawingHistory;
        undoStack.push(JSON.stringify(dh));
        layers[currentLayerIndex].drawingHistory = JSON.parse(redoStack.pop());
        cacheDirty = true; scheduleRedraw();
    }

    function getVirtualPointer(e) {
        var px = e.clientX, py = e.clientY;
        var vpx = (px - window.innerWidth / 2) / zoom + offsetX;
        var vpy = (py - window.innerHeight / 2) / zoom + offsetY;
        return { x: vpx, y: vpy, screenX: px, screenY: py };
    }

    function isPanEvent(e) {
        return (e.button === 1 || e.button === 2) || (e.shiftKey && e.button === 0);
    }

    canvas.oncontextmenu = function(e) { e.preventDefault(); return false; };

    function pointerDownHandler(e) {
        if (toolContainer.contains(e.target)) return;

        try {
            canvas.setPointerCapture(e.pointerId);
            activePointerId = e.pointerId;
        } catch (err) {}

        if (isPanEvent(e)) {
            isPanning = true;
            panLast = { x: e.clientX, y: e.clientY };
        } else if (e.button === 0 || e.pointerType === 'touch' || e.pointerType === 'pen') {
            drawing = true;
            pushToUndo();
            redoStack = [];

            currentSegment = {
                color: currentColor,
                isErasing: isErasing,
                thickness: currentLineWidth,
                points: [],
                assistLevel: assistLevel,
                opacity: currentOpacity,
                brush: currentBrush
            };

            layers[currentLayerIndex].drawingHistory.push(currentSegment);
            updateContextStyle();

            var pos = getVirtualPointer(e);
            currentSegment.points.push({ x: pos.x, y: pos.y });
            currentSegment.points.push({ x: pos.x, y: pos.y });

            scheduleRedraw();
            circleCursor.style.display = 'none';
        }
        e.preventDefault();
    }

    function pointerMoveHandler(e) {
        circleCursor.style.display = (e.target === canvas) ? 'block' : 'none';
        circleCursor.style.left = e.clientX + 'px';
        circleCursor.style.top = e.clientY + 'px';

        if (isPanning) {
            var dx = (e.clientX - panLast.x) / zoom;
            var dy = (e.clientY - panLast.y) / zoom;
            offsetX -= dx;
            offsetY -= dy;
            panLast = { x: e.clientX, y: e.clientY };
            cacheDirty = true; scheduleRedraw();
        } else if (drawing && currentSegment) {
            var pos = getVirtualPointer(e);
            currentSegment.points.push({ x: pos.x, y: pos.y });
            scheduleRedraw();
        }
    }

    function endDrawing(e) {
        if (activePointerId !== null) {
            try { canvas.releasePointerCapture(activePointerId); } catch(err) {}
            activePointerId = null;
        }

        if (isPanning) isPanning = false;
        if (drawing) {
            drawing = false;
            currentSegment = null;
            cacheDirty = true; scheduleRedraw();
            circleCursor.style.display = 'block';
        }
    }

    canvas.addEventListener('pointerdown', pointerDownHandler);
    window.addEventListener('pointermove', pointerMoveHandler);
    window.addEventListener('pointerup', endDrawing);
    window.addEventListener('pointercancel', endDrawing);

    function wheelHandler(e) {
        if (toolContainer.contains(e.target)) return;

        var mx = e.clientX, my = e.clientY;
        var wx = (mx - window.innerWidth / 2) / zoom + offsetX;
        var wy = (my - window.innerHeight / 2) / zoom + offsetY;

        var delta = -e.deltaY * (e.deltaMode === 1 ? 0.01 : 0.002);
        var newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * (1 + delta)));

        offsetX = wx - (mx - window.innerWidth / 2) / newZoom;
        offsetY = wy - (my - window.innerHeight / 2) / newZoom;
        zoom = newZoom;

        updateCursorSize();
        cacheDirty = true; scheduleRedraw();
        e.preventDefault();
    }
    window.addEventListener('wheel', wheelHandler, { passive: false });

    function keydownHandler(e) {
        if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
            e.preventDefault(); undo();
        } else if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
            e.preventDefault(); redo();
        }
    }
    document.addEventListener('keydown', keydownHandler);

    function downloadFile(data, filename, type) {
        var file = new Blob([data], { type: type });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function clearDrawing() {
        showModal('Are you sure you want to clear all drawing layers?', { buttons: ['Yes', 'Cancel'] }).then((result) => {
            if (!result) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            layers.length = 0;
            layers.push({ name: 'Layer 1', drawingHistory: [], visible: true });
            currentLayerIndex = 0;
            undoStack = []; redoStack = [];
            renderLayerList();
            cacheDirty = true; scheduleRedraw();
        });
    }

    function exportJSON() {
        var jsonState = JSON.stringify({
            url: window.location.href,
            timestamp: new Date().toISOString(),
            layers: layers
        });
        downloadFile(jsonState, 'ez-draw-layers.json', 'application/json');
    }

    function importJSON() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(event) {
                try {
                    var data = JSON.parse(event.target.result);
                    if (data && (data.layers || data.history)) {
                        pushToUndo();
                        if (data.layers) {
                            layers = data.layers;
                        } else {
                            layers = [{ name: 'Imported', drawingHistory: data.history, visible: true }];
                        }
                        currentLayerIndex = 0;
                        redoStack = [];
                        renderLayerList();
                        cacheDirty = true; scheduleRedraw();
                        showModal('Drawing imported successfully!', { buttons: ['OK'] });
                    } else {
                        throw new Error('Invalid JSON structure');
                    }
                } catch (error) {
                    showModal('Error importing drawing: ' + error.message, { buttons: ['OK'] });
                }
                if (input.parentNode) input.parentNode.removeChild(input);
            };
            reader.readAsText(file);
        };
        document.body.appendChild(input);
        input.click();
    }

    function exportJPEG() {
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = window.innerWidth * dpr;
        tempCanvas.height = window.innerHeight * dpr;
        var tempCtx = tempCanvas.getContext('2d');
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        try {
            var imageDataURL = tempCanvas.toDataURL('image/jpeg', 0.9);
            var link = document.createElement('a');
            link.href = imageDataURL;
            link.download = 'ez-draw-screenshot.jpeg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            showModal('Export failed due to canvas security restrictions.', { buttons: ['OK'] });
        }
    }

    function removeEzDraw() {
        if (toolContainer && toolContainer.parentNode) toolContainer.parentNode.removeChild(toolContainer);
        if (circleCursor && circleCursor.parentNode) circleCursor.parentNode.removeChild(circleCursor);
        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
        if (modalOverlay && modalOverlay.parentNode) modalOverlay.parentNode.removeChild(modalOverlay);

        window.removeEventListener("resize", resize);
        window.removeEventListener('wheel', wheelHandler);
        canvas.removeEventListener('pointerdown', pointerDownHandler);
        window.removeEventListener('pointermove', pointerMoveHandler);
        window.removeEventListener('pointerup', endDrawing);
        window.removeEventListener('pointercancel', endDrawing);
        document.removeEventListener('keydown', keydownHandler);

        delete window.removeEzDraw;
    }
    window.removeEzDraw = removeEzDraw;

    setThickness(4);
    updateCursorSize();
    resize();
    goToOrigin();
})();