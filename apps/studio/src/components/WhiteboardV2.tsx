/**
 * Interactive Whiteboard with Shape-Snap Technology
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { WhiteboardProps, Shape, DrawingPoint } from '../types';
import { snapToShape, shapeToSVG, exportToSVG } from '../lib/snap';

type DrawingTool = 'pen' | 'line' | 'rectangle' | 'circle' | 'eraser';

const WhiteboardV2: React.FC<WhiteboardProps> = ({
  assignment,
  shapes: initialShapes,
  onShapeAdd,
  onShapeUpdate,
  onShapeDelete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawingPoint[]>([]);
  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [activeTool, setActiveTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [autoSnap, setAutoSnap] = useState(true);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw initial content
    redrawCanvas();
  }, []);

  // Redraw entire canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Draw all shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape, shape.id === selectedShapeId);
    });

    // Draw current drawing
    if (currentPoints.length > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.stroke();
    }
  }, [shapes, currentPoints, showGrid, selectedShapeId, color, strokeWidth]);

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Draw a shape
  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape, isSelected: boolean = false) => {
    if (shape.points.length === 0) return;

    ctx.strokeStyle = shape.style.stroke || '#000000';
    ctx.lineWidth = shape.style.strokeWidth || 2;
    ctx.fillStyle = shape.style.fill || 'transparent';
    ctx.globalAlpha = shape.style.opacity || 1;

    if (isSelected) {
      ctx.strokeStyle = '#2196f3';
      ctx.lineWidth = (shape.style.strokeWidth || 2) + 1;
    }

    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);

    for (let i = 1; i < shape.points.length; i++) {
      ctx.lineTo(shape.points[i].x, shape.points[i].y);
    }

    if (shape.type === 'circle' || shape.type === 'rectangle') {
      ctx.closePath();
    }

    ctx.stroke();
    if (shape.style.fill && shape.style.fill !== 'none') {
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Draw snap indicator if snapped
    if (shape.snapped) {
      ctx.save();
      ctx.font = '12px Arial';
      ctx.fillStyle = '#4caf50';
      ctx.fillText('✓ Snapped', shape.points[0].x, shape.points[0].y - 10);
      ctx.restore();
    }
  };

  // Redraw when shapes or points change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPoints(prev => [...prev, { x, y }]);
  };

  // Mouse up handler
  const handleMouseUp = () => {
    if (!isDrawing || currentPoints.length === 0) {
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);

    // Create shape from points
    let newShape: Shape;

    if (autoSnap && currentPoints.length > 3) {
      // Use snap-to-shape for automatic shape recognition
      newShape = snapToShape(currentPoints);
    } else {
      // Create freeform shape
      newShape = {
        id: `shape-${Date.now()}`,
        type: 'polygon',
        points: currentPoints,
        style: {
          stroke: color,
          strokeWidth: strokeWidth,
          fill: 'none'
        },
        snapped: false
      };
    }

    // Add shape to collection
    const updatedShapes = [...shapes, newShape];
    setShapes(updatedShapes);
    onShapeAdd(newShape);

    // Add to history
    addToHistory(updatedShapes);

    // Clear current points
    setCurrentPoints([]);
  };

  // Add to undo/redo history
  const addToHistory = (newShapes: Shape[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setShapes(history[historyIndex - 1]);
    }
  };

  // Redo
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setShapes(history[historyIndex + 1]);
    }
  };

  // Clear all
  const clearAll = () => {
    if (confirm('Clear all shapes?')) {
      const emptyShapes: Shape[] = [];
      setShapes(emptyShapes);
      addToHistory(emptyShapes);
    }
  };

  // Delete selected shape
  const deleteSelected = () => {
    if (selectedShapeId) {
      const updatedShapes = shapes.filter(s => s.id !== selectedShapeId);
      setShapes(updatedShapes);
      onShapeDelete(selectedShapeId);
      addToHistory(updatedShapes);
      setSelectedShapeId(null);
    }
  };

  // Export as SVG
  const exportSVG = () => {
    if (!canvasRef.current) return;

    const svg = exportToSVG(shapes, canvasRef.current.width, canvasRef.current.height);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-${assignment?.id || 'drawing'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  const widths = [1, 2, 4, 8];

  return (
    <div className="whiteboard-v2">
      <div className="whiteboard-toolbar">
        <div className="toolbar-section">
          <label>Tool:</label>
          <div className="tool-buttons">
            <button
              className={`tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
              onClick={() => setActiveTool('pen')}
              title="Free Draw"
            >
              ✏️ Pen
            </button>
            <button
              className={`tool-btn ${activeTool === 'line' ? 'active' : ''}`}
              onClick={() => setActiveTool('line')}
              title="Draw Line"
            >
              📏 Line
            </button>
            <button
              className={`tool-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
              onClick={() => setActiveTool('rectangle')}
              title="Draw Rectangle"
            >
              ▭ Rectangle
            </button>
            <button
              className={`tool-btn ${activeTool === 'circle' ? 'active' : ''}`}
              onClick={() => setActiveTool('circle')}
              title="Draw Circle"
            >
              ⭕ Circle
            </button>
            <button
              className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => setActiveTool('eraser')}
              title="Eraser"
            >
              🗑️ Eraser
            </button>
          </div>
        </div>

        <div className="toolbar-section">
          <label>Color:</label>
          <div className="color-picker">
            {colors.map(c => (
              <button
                key={c}
                className={`color-btn ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <label>Width:</label>
          <div className="width-picker">
            {widths.map(w => (
              <button
                key={w}
                className={`width-btn ${strokeWidth === w ? 'active' : ''}`}
                onClick={() => setStrokeWidth(w)}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <label>Options:</label>
          <button
            className={`option-btn ${autoSnap ? 'active' : ''}`}
            onClick={() => setAutoSnap(!autoSnap)}
            title="Auto-snap shapes"
          >
            {autoSnap ? '✓' : '✗'} Auto-Snap
          </button>
          <button
            className={`option-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Show grid"
          >
            {showGrid ? '✓' : '✗'} Grid
          </button>
        </div>

        <div className="toolbar-section">
          <button onClick={undo} disabled={historyIndex <= 0} title="Undo">
            ↶ Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
            ↷ Redo
          </button>
          <button onClick={clearAll} title="Clear all">
            🗑️ Clear
          </button>
          {selectedShapeId && (
            <button onClick={deleteSelected} className="danger" title="Delete selected">
              ✕ Delete
            </button>
          )}
          <button onClick={exportSVG} title="Export as SVG">
            📤 Export SVG
          </button>
        </div>
      </div>

      <div className="whiteboard-canvas-container">
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>

      <div className="whiteboard-status">
        <div className="status-item">
          Shapes: {shapes.length} {shapes.filter(s => s.snapped).length > 0 && `(${shapes.filter(s => s.snapped).length} snapped)`}
        </div>
        {assignment && (
          <div className="status-item">
            Assignment: {assignment.title}
          </div>
        )}
        <div className="status-item">
          {autoSnap ? '✨ Auto-snap enabled' : '🖊️ Freehand mode'}
        </div>
      </div>
    </div>
  );
};

export default WhiteboardV2;
