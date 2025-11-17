import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { WhiteboardProps, Shape, DrawingPoint } from '../types';

type DrawTool = 'pen' | 'marker' | 'line' | 'rectangle' | 'circle' | 'ellipse' | 'text' | 'eraser' | 'select';
type GridType = 'none' | 'dots' | 'lines' | 'graph';

interface CurrentStroke {
  points: DrawingPoint[];
  tool: DrawTool;
  color: string;
  width: number;
}

const Whiteboard: React.FC<WhiteboardProps> = ({
  assignment,
  shapes,
  onShapeAdd,
  onShapeUpdate,
  onShapeDelete
}) => {
  const [selectedTool, setSelectedTool] = useState<DrawTool>('pen');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<CurrentStroke | null>(null);
  const [localShapes, setLocalShapes] = useState<Shape[]>(shapes);
  const [history, setHistory] = useState<Shape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [gridType, setGridType] = useState<GridType>('dots');
  const [showShapeSnap, setShowShapeSnap] = useState(true);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTextDialog, setShowTextDialog] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canvasWidth = 1200;
  const canvasHeight = 800;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const gridCanvas = gridCanvasRef.current;
    if (!canvas || !gridCanvas) return;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    gridCanvas.width = canvasWidth;
    gridCanvas.height = canvasHeight;

    drawGrid();
    redrawShapes();
  }, []);

  // Draw grid background
  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gridType === 'none') return;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    if (gridType === 'dots') {
      const spacing = 20;
      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          ctx.fillStyle = '#d0d0d0';
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    } else if (gridType === 'lines') {
      const spacing = 40;
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    } else if (gridType === 'graph') {
      const spacing = 40;
      // Light grid lines
      ctx.strokeStyle = '#f0f0f0';
      for (let x = 0; x < canvas.width; x += spacing / 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += spacing / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      // Darker major grid lines
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      // Axes
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, canvas.height);
      ctx.stroke();
    }
  }, [gridType]);

  useEffect(() => {
    drawGrid();
  }, [gridType, drawGrid]);

  // Redraw all shapes
  const redrawShapes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    localShapes.forEach(shape => {
      drawShape(ctx, shape);
    });
  }, [localShapes]);

  useEffect(() => {
    redrawShapes();
  }, [localShapes, redrawShapes]);

  // Draw a single shape
  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.style.stroke || '#000';
    ctx.fillStyle = shape.style.fill || 'transparent';
    ctx.lineWidth = shape.style.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = shape.style.opacity || 1;

    const points = shape.points;

    if (shape.type === 'line' && points.length >= 2) {
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    } else if (shape.type === 'rectangle' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const width = end.x - start.x;
      const height = end.y - start.y;
      ctx.beginPath();
      ctx.rect(start.x, start.y, width, height);
      ctx.stroke();
      if (shape.style.fill && shape.style.fill !== 'transparent') {
        ctx.fill();
      }
    } else if (shape.type === 'circle' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      if (shape.style.fill && shape.style.fill !== 'transparent') {
        ctx.fill();
      }
    } else if (shape.type === 'ellipse' && points.length >= 2) {
      const start = points[0];
      const end = points[points.length - 1];
      const radiusX = Math.abs(end.x - start.x);
      const radiusY = Math.abs(end.y - start.y);
      ctx.beginPath();
      ctx.ellipse(start.x, start.y, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
      if (shape.style.fill && shape.style.fill !== 'transparent') {
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  };

  // Shape recognition algorithm
  const recognizeShape = (points: DrawingPoint[]): { type: Shape['type']; snapped: boolean } => {
    if (!showShapeSnap || points.length < 10) {
      return { type: 'line', snapped: false };
    }

    // Calculate bounding box
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = maxX - minX;
    const height = maxY - minY;

    // Check if it's a closed shape (start and end are close)
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const distance = Math.sqrt(
      Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2)
    );
    const isClosed = distance < 30;

    // Detect rectangle (4 corners, roughly rectangular)
    if (isClosed && Math.abs(width - height) > 20) {
      const aspectRatio = width / height;
      if (aspectRatio > 0.5 && aspectRatio < 2) {
        // Might be a square/rectangle
        return { type: 'rectangle', snapped: true };
      }
    }

    // Detect circle (closed, width ≈ height)
    if (isClosed && Math.abs(width - height) < width * 0.3) {
      return { type: 'circle', snapped: true };
    }

    // Detect line (roughly straight)
    if (points.length > 5) {
      const straightness = (maxX - minX) / points.length + (maxY - minY) / points.length;
      if (straightness > 2) {
        return { type: 'line', snapped: true };
      }
    }

    return { type: 'line', snapped: false };
  };

  // Snap shape to perfect geometry
  const snapShape = (points: DrawingPoint[], recognizedType: Shape['type']): DrawingPoint[] => {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    if (recognizedType === 'rectangle') {
      return [
        { x: minX, y: minY },
        { x: maxX, y: maxY }
      ];
    } else if (recognizedType === 'circle') {
      const radius = Math.max(maxX - minX, maxY - minY) / 2;
      return [
        { x: centerX, y: centerY },
        { x: centerX + radius, y: centerY }
      ];
    } else if (recognizedType === 'line') {
      return [points[0], points[points.length - 1]];
    }

    return points;
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'text') {
      setTextPosition({ x, y });
      setShowTextDialog(true);
      return;
    }

    if (selectedTool === 'eraser') {
      // Find and remove shape at this position
      const clickedShape = localShapes.find(shape => {
        return shape.points.some(point =>
          Math.abs(point.x - x) < 10 && Math.abs(point.y - y) < 10
        );
      });
      if (clickedShape) {
        const updated = localShapes.filter(s => s.id !== clickedShape.id);
        setLocalShapes(updated);
        onShapeDelete(clickedShape.id);
        addToHistory(updated);
      }
      return;
    }

    setIsDrawing(true);
    setCurrentStroke({
      points: [{ x, y, timestamp: Date.now() }],
      tool: selectedTool,
      color: selectedColor,
      width: strokeWidth
    });
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, { x, y, timestamp: Date.now() }]
    };
    setCurrentStroke(updatedStroke);

    // Draw preview
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectedTool === 'pen' || selectedTool === 'marker') {
      // Draw line segment
      const points = updatedStroke.points;
      const lastPoint = points[points.length - 2];
      const currentPoint = points[points.length - 1];

      ctx.strokeStyle = updatedStroke.color;
      ctx.lineWidth = updatedStroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = selectedTool === 'marker' ? 0.5 : 1;

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
    } else {
      // For shapes, redraw everything including preview
      redrawShapes();

      const tempShape: Shape = {
        id: 'temp-preview',
        type: selectedTool as Shape['type'],
        points: updatedStroke.points,
        style: {
          stroke: updatedStroke.color,
          strokeWidth: updatedStroke.width,
          fill: 'transparent'
        }
      };
      drawShape(ctx, tempShape);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (!isDrawing || !currentStroke) return;

    setIsDrawing(false);

    if (currentStroke.points.length < 2) {
      setCurrentStroke(null);
      return;
    }

    let finalType: Shape['type'] = currentStroke.tool as Shape['type'];
    let finalPoints = currentStroke.points;
    let snapped = false;

    // Apply shape recognition for pen/marker
    if ((currentStroke.tool === 'pen' || currentStroke.tool === 'marker') && showShapeSnap) {
      const recognition = recognizeShape(currentStroke.points);
      if (recognition.snapped) {
        finalType = recognition.type;
        finalPoints = snapShape(currentStroke.points, recognition.type);
        snapped = true;
      }
    }

    const newShape: Shape = {
      id: `shape-${Date.now()}`,
      type: finalType,
      points: finalPoints,
      style: {
        stroke: currentStroke.color,
        strokeWidth: currentStroke.width,
        fill: 'transparent',
        opacity: currentStroke.tool === 'marker' ? 0.5 : 1
      },
      snapped
    };

    const updated = [...localShapes, newShape];
    setLocalShapes(updated);
    onShapeAdd(newShape);
    addToHistory(updated);

    setCurrentStroke(null);
    redrawShapes();
  };

  // Add text
  const handleAddText = () => {
    if (!textInput.trim() || !textPosition) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw text on canvas
    ctx.font = '24px sans-serif';
    ctx.fillStyle = selectedColor;
    ctx.fillText(textInput, textPosition.x, textPosition.y);

    // Create text shape (stored as points for simplicity)
    const newShape: Shape = {
      id: `text-${Date.now()}`,
      type: 'line', // Store text as a special "line" type
      points: [{ x: textPosition.x, y: textPosition.y }],
      style: {
        stroke: selectedColor,
        strokeWidth: 1
      }
    };

    const updated = [...localShapes, newShape];
    setLocalShapes(updated);
    onShapeAdd(newShape);
    addToHistory(updated);

    setTextInput('');
    setTextPosition(null);
    setShowTextDialog(false);
  };

  // History management
  const addToHistory = (shapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(shapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setLocalShapes(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setLocalShapes(history[newIndex]);
    }
  };

  const clearCanvas = () => {
    if (window.confirm('Clear the entire whiteboard?')) {
      setLocalShapes([]);
      addToHistory([]);
      redrawShapes();
    }
  };

  // Export as image
  const exportAsImage = () => {
    const canvas = canvasRef.current;
    const gridCanvas = gridCanvasRef.current;
    if (!canvas || !gridCanvas) return;

    // Create a temporary canvas to combine grid and drawings
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw white background
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw grid
    tempCtx.drawImage(gridCanvas, 0, 0);

    // Draw shapes
    tempCtx.drawImage(canvas, 0, 0);

    // Export
    tempCanvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `whiteboard-${assignment?.id || 'drawing'}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="whiteboard" ref={containerRef}>
      <div className="whiteboard-header">
        <h3>🎨 Digital Whiteboard</h3>
        {assignment && <p>Working on: {assignment.title}</p>}
      </div>

      {/* Toolbar */}
      <div className="whiteboard-toolbar">
        <div className="toolbar-section">
          <button
            className={`tool-btn ${selectedTool === 'pen' ? 'active' : ''}`}
            onClick={() => setSelectedTool('pen')}
            title="Pen Tool"
          >
            ✏️ Pen
          </button>
          <button
            className={`tool-btn ${selectedTool === 'marker' ? 'active' : ''}`}
            onClick={() => setSelectedTool('marker')}
            title="Marker (Semi-transparent)"
          >
            🖍️ Marker
          </button>
          <button
            className={`tool-btn ${selectedTool === 'line' ? 'active' : ''}`}
            onClick={() => setSelectedTool('line')}
            title="Draw Line"
          >
            📏 Line
          </button>
          <button
            className={`tool-btn ${selectedTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setSelectedTool('rectangle')}
            title="Draw Rectangle"
          >
            🔸 Rectangle
          </button>
          <button
            className={`tool-btn ${selectedTool === 'circle' ? 'active' : ''}`}
            onClick={() => setSelectedTool('circle')}
            title="Draw Circle"
          >
            ⭕ Circle
          </button>
          <button
            className={`tool-btn ${selectedTool === 'text' ? 'active' : ''}`}
            onClick={() => setSelectedTool('text')}
            title="Add Text"
          >
            📝 Text
          </button>
          <button
            className={`tool-btn ${selectedTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setSelectedTool('eraser')}
            title="Eraser"
          >
            🗑️ Erase
          </button>
        </div>

        <div className="toolbar-section">
          <label className="color-picker-label">
            Color:
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="color-picker"
            />
          </label>
          <label className="stroke-width-label">
            Width:
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="stroke-width-slider"
            />
            <span>{strokeWidth}px</span>
          </label>
        </div>

        <div className="toolbar-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showShapeSnap}
              onChange={(e) => setShowShapeSnap(e.target.checked)}
            />
            Shape Snap
          </label>
          <select
            value={gridType}
            onChange={(e) => setGridType(e.target.value as GridType)}
            className="grid-select"
          >
            <option value="none">No Grid</option>
            <option value="dots">Dots</option>
            <option value="lines">Lines</option>
            <option value="graph">Graph Paper</option>
          </select>
        </div>

        <div className="toolbar-section">
          <button onClick={undo} disabled={historyIndex <= 0} className="tool-btn">
            ↶ Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="tool-btn">
            ↷ Redo
          </button>
          <button onClick={clearCanvas} className="tool-btn danger">
            🗑️ Clear
          </button>
          <button onClick={exportAsImage} className="tool-btn">
            💾 Export PNG
          </button>
        </div>

        <div className="toolbar-section shape-count">
          {localShapes.length} shapes
        </div>
      </div>

      {/* Canvas */}
      <div className="whiteboard-canvas-container">
        <div className="canvas-wrapper">
          <canvas ref={gridCanvasRef} className="grid-canvas" />
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: selectedTool === 'eraser' ? 'crosshair' : 'default' }}
          />
        </div>
      </div>

      {/* Text Input Dialog */}
      {showTextDialog && (
        <div className="text-dialog-overlay" onClick={() => setShowTextDialog(false)}>
          <div className="text-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Add Text</h4>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddText();
                }
              }}
            />
            <div className="dialog-actions">
              <button onClick={() => setShowTextDialog(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleAddText} className="btn-primary">
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .whiteboard {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--gray-50);
        }

        .whiteboard-header {
          padding: var(--space-md);
          background: white;
          border-bottom: 1px solid var(--gray-200);
        }

        .whiteboard-header h3 {
          margin: 0 0 var(--space-xs) 0;
          color: var(--gray-800);
        }

        .whiteboard-header p {
          margin: 0;
          color: var(--gray-600);
          font-size: var(--text-sm);
        }

        .whiteboard-toolbar {
          display: flex;
          gap: var(--space-md);
          padding: var(--space-sm);
          background: white;
          border-bottom: 1px solid var(--gray-200);
          flex-wrap: wrap;
          align-items: center;
        }

        .toolbar-section {
          display: flex;
          gap: var(--space-xs);
          align-items: center;
        }

        .tool-btn {
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid var(--gray-300);
          background: white;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-sm);
          transition: all var(--transition-fast);
        }

        .tool-btn:hover:not(:disabled) {
          background: var(--gray-100);
          border-color: var(--gray-400);
        }

        .tool-btn.active {
          background: var(--blue-500);
          color: white;
          border-color: var(--blue-600);
        }

        .tool-btn.danger {
          color: var(--red-600);
        }

        .tool-btn.danger:hover {
          background: var(--red-50);
          border-color: var(--red-300);
        }

        .tool-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .color-picker-label,
        .stroke-width-label,
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          font-size: var(--text-sm);
          color: var(--gray-700);
        }

        .color-picker {
          width: 40px;
          height: 30px;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        .stroke-width-slider {
          width: 100px;
        }

        .grid-select {
          padding: var(--space-xs);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
        }

        .shape-count {
          font-size: var(--text-sm);
          color: var(--gray-600);
          margin-left: auto;
        }

        .whiteboard-canvas-container {
          flex: 1;
          overflow: auto;
          background: var(--gray-100);
          padding: var(--space-lg);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .canvas-wrapper {
          position: relative;
          box-shadow: var(--shadow-xl);
          background: white;
        }

        .grid-canvas,
        .drawing-canvas {
          display: block;
        }

        .drawing-canvas {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: all;
        }

        .text-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .text-dialog {
          background: white;
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          min-width: 400px;
        }

        .text-dialog h4 {
          margin: 0 0 var(--space-md) 0;
          color: var(--gray-800);
        }

        .text-dialog input {
          width: 100%;
          padding: var(--space-sm);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: var(--text-base);
        }

        .dialog-actions {
          display: flex;
          gap: var(--space-sm);
          justify-content: flex-end;
          margin-top: var(--space-md);
        }

        .btn-primary,
        .btn-secondary {
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          font-size: var(--text-sm);
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .btn-primary {
          background: var(--blue-500);
          color: white;
        }

        .btn-primary:hover {
          background: var(--blue-600);
        }

        .btn-secondary {
          background: var(--gray-200);
          color: var(--gray-700);
        }

        .btn-secondary:hover {
          background: var(--gray-300);
        }
      `}</style>
    </div>
  );
};

export default Whiteboard;