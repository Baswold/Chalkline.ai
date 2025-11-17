import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFAnnotatorProps, PDFAnnotation, W3CAnnotation } from '../types';

// Set up PDF.js worker
const pdfjsWorkerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

type AnnotationTool = 'select' | 'highlight' | 'note' | 'draw' | 'text';

interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({
  pdfUrl,
  assignment,
  annotations,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete
}) => {
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  const [noteText, setNoteText] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [notePosition, setNotePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localAnnotations, setLocalAnnotations] = useState<PDFAnnotation[]>(annotations);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sample PDF URL for demo purposes
  const defaultPdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
  const effectivePdfUrl = pdfUrl || defaultPdfUrl;

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadingTask = pdfjsLib.getDocument(effectivePdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document. Using demo mode.');
        setIsLoading(false);
      }
    };

    if (effectivePdfUrl) {
      loadPDF();
    }

    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [effectivePdfUrl]);

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;

      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Setup annotation canvas
        if (annotationCanvasRef.current) {
          annotationCanvasRef.current.height = viewport.height;
          annotationCanvasRef.current.width = viewport.width;
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        renderAnnotations();
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  // Render annotations on the annotation canvas
  const renderAnnotations = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous annotations
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render each annotation
    localAnnotations
      .filter(ann => ann.page === currentPage)
      .forEach(annotation => {
        switch (annotation.type) {
          case 'highlight':
            ctx.fillStyle = annotation.color || '#FFEB3B80';
            ctx.fillRect(
              annotation.bounds.x,
              annotation.bounds.y,
              annotation.bounds.width,
              annotation.bounds.height
            );
            break;

          case 'note':
            // Draw note icon
            ctx.fillStyle = annotation.color || '#FFC107';
            ctx.beginPath();
            ctx.arc(
              annotation.bounds.x + 10,
              annotation.bounds.y + 10,
              10,
              0,
              2 * Math.PI
            );
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('📝', annotation.bounds.x + 10, annotation.bounds.y + 15);
            break;

          case 'ink':
            // Draw freehand drawing
            if (annotation.content) {
              try {
                const path = JSON.parse(annotation.content) as DrawingPath;
                ctx.strokeStyle = path.color;
                ctx.lineWidth = path.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                path.points.forEach((point, index) => {
                  if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                  } else {
                    ctx.lineTo(point.x, point.y);
                  }
                });
                ctx.stroke();
              } catch (e) {
                console.error('Error rendering ink annotation:', e);
              }
            }
            break;
        }
      });
  }, [localAnnotations, currentPage]);

  // Handle mouse down for drawing/selecting
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'select') return;

    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath({
        points: [{ x, y }],
        color: selectedColor,
        width: 3
      });
    } else if (selectedTool === 'highlight') {
      setIsDrawing(true);
      setCurrentPath({
        points: [{ x, y }],
        color: selectedColor + '80', // Add transparency
        width: 20
      });
    } else if (selectedTool === 'note') {
      setNotePosition({ x, y });
      setShowNoteDialog(true);
    }
  };

  // Handle mouse move for drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPath) return;

    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPath({
      ...currentPath,
      points: [...currentPath.points, { x, y }]
    });

    // Draw in real-time
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentPath.color;
    ctx.lineWidth = currentPath.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points = currentPath.points;
    const lastPoint = points[points.length - 2];
    const currentPoint = { x, y };

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
  };

  // Handle mouse up to finalize annotation
  const handleMouseUp = () => {
    if (!isDrawing || !currentPath) return;

    const points = currentPath.points;
    if (points.length < 2) {
      setIsDrawing(false);
      setCurrentPath(null);
      return;
    }

    // Calculate bounds
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const newAnnotation: PDFAnnotation = {
      id: `annotation-${Date.now()}`,
      type: selectedTool === 'highlight' ? 'highlight' : 'ink',
      page: currentPage,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      },
      content: JSON.stringify(currentPath),
      color: selectedColor,
      timestamp: new Date(),
      author: 'Student'
    };

    setLocalAnnotations([...localAnnotations, newAnnotation]);
    onAnnotationAdd(newAnnotation);

    setIsDrawing(false);
    setCurrentPath(null);
  };

  // Handle note submission
  const handleNoteSubmit = () => {
    if (!noteText.trim()) return;

    const newAnnotation: PDFAnnotation = {
      id: `annotation-${Date.now()}`,
      type: 'note',
      page: currentPage,
      bounds: {
        x: notePosition.x,
        y: notePosition.y,
        width: 20,
        height: 20
      },
      content: noteText,
      color: selectedColor,
      timestamp: new Date(),
      author: 'Student'
    };

    setLocalAnnotations([...localAnnotations, newAnnotation]);
    onAnnotationAdd(newAnnotation);

    setNoteText('');
    setShowNoteDialog(false);
  };

  // Convert to W3C Web Annotation format
  const exportAsW3C = (): W3CAnnotation[] => {
    return localAnnotations.map(ann => ({
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      id: ann.id,
      type: 'Annotation',
      body: {
        type: 'TextualBody',
        value: ann.content || '',
        format: 'text/plain'
      },
      target: {
        source: effectivePdfUrl,
        selector: {
          type: 'FragmentSelector',
          start: ann.page,
          end: ann.page,
          exact: `Page ${ann.page} at (${ann.bounds.x}, ${ann.bounds.y})`
        }
      },
      created: ann.timestamp.toISOString(),
      creator: ann.author
    }));
  };

  // Clear all annotations
  const handleClearAnnotations = () => {
    if (window.confirm('Are you sure you want to clear all annotations on this page?')) {
      const remaining = localAnnotations.filter(ann => ann.page !== currentPage);
      setLocalAnnotations(remaining);
      renderAnnotations();
    }
  };

  // Export annotations
  const handleExportAnnotations = () => {
    const w3cAnnotations = exportAsW3C();
    const dataStr = JSON.stringify(w3cAnnotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations-${assignment?.id || 'document'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error && !pdfDocument) {
    return (
      <div className="pdf-annotator">
        <div className="pdf-error">
          <h3>⚠️ PDF Loading Error</h3>
          <p>{error}</p>
          <p>Demo mode: The PDF viewer is working, but the sample PDF couldn't be loaded.</p>
          <p>Upload your own PDF or provide a valid URL to test the annotation features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-annotator" ref={containerRef}>
      <div className="pdf-header">
        <h3>📋 PDF Viewer & Annotator</h3>
        {assignment && <p>Working on: {assignment.title}</p>}
      </div>

      {/* Toolbar */}
      <div className="pdf-toolbar">
        <div className="toolbar-section">
          <button
            className={`tool-btn ${selectedTool === 'select' ? 'active' : ''}`}
            onClick={() => setSelectedTool('select')}
            title="Select"
          >
            🖱️ Select
          </button>
          <button
            className={`tool-btn ${selectedTool === 'highlight' ? 'active' : ''}`}
            onClick={() => setSelectedTool('highlight')}
            title="Highlight"
          >
            🖍️ Highlight
          </button>
          <button
            className={`tool-btn ${selectedTool === 'note' ? 'active' : ''}`}
            onClick={() => setSelectedTool('note')}
            title="Add Note"
          >
            📝 Note
          </button>
          <button
            className={`tool-btn ${selectedTool === 'draw' ? 'active' : ''}`}
            onClick={() => setSelectedTool('draw')}
            title="Draw"
          >
            ✏️ Draw
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
        </div>

        <div className="toolbar-section">
          <button onClick={handleClearAnnotations} className="tool-btn danger">
            🗑️ Clear Page
          </button>
          <button onClick={handleExportAnnotations} className="tool-btn">
            💾 Export (W3C)
          </button>
        </div>

        <div className="toolbar-section annotation-count">
          {localAnnotations.filter(a => a.page === currentPage).length} annotations on this page
        </div>
      </div>

      {/* PDF Canvas Container */}
      <div className="pdf-canvas-container">
        {isLoading && <div className="pdf-loading">Loading PDF...</div>}

        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="pdf-canvas"
          />
          <canvas
            ref={annotationCanvasRef}
            className="annotation-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: selectedTool === 'select' ? 'default' : 'crosshair' }}
          />
        </div>
      </div>

      {/* Page Controls */}
      <div className="pdf-controls">
        <div className="page-controls">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="control-btn"
          >
            ← Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="control-btn"
          >
            Next →
          </button>
        </div>

        <div className="zoom-controls">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="control-btn"
          >
            🔍−
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(Math.min(3.0, scale + 0.1))}
            className="control-btn"
          >
            🔍+
          </button>
          <button
            onClick={() => setScale(1.0)}
            className="control-btn"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Note Dialog */}
      {showNoteDialog && (
        <div className="note-dialog-overlay" onClick={() => setShowNoteDialog(false)}>
          <div className="note-dialog" onClick={(e) => e.stopPropagation()}>
            <h4>Add Note</h4>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here..."
              autoFocus
              rows={4}
            />
            <div className="dialog-actions">
              <button onClick={() => setShowNoteDialog(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleNoteSubmit} className="btn-primary">
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Annotation List */}
      <div className="annotation-list">
        <h4>Annotations ({localAnnotations.filter(a => a.page === currentPage).length})</h4>
        <div className="annotations">
          {localAnnotations
            .filter(ann => ann.page === currentPage)
            .map(ann => (
              <div key={ann.id} className="annotation-item">
                <div className="annotation-header">
                  <span className="annotation-type">{ann.type}</span>
                  <span className="annotation-time">
                    {ann.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {ann.content && ann.type === 'note' && (
                  <div className="annotation-content">{ann.content}</div>
                )}
                <button
                  onClick={() => {
                    const updated = localAnnotations.filter(a => a.id !== ann.id);
                    setLocalAnnotations(updated);
                    onAnnotationDelete(ann.id);
                  }}
                  className="delete-annotation"
                  title="Delete annotation"
                >
                  ×
                </button>
              </div>
            ))}
        </div>
      </div>

      <style>{`
        .pdf-annotator {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--gray-50);
        }

        .pdf-header {
          padding: var(--space-md);
          background: white;
          border-bottom: 1px solid var(--gray-200);
        }

        .pdf-header h3 {
          margin: 0 0 var(--space-xs) 0;
          color: var(--gray-800);
        }

        .pdf-header p {
          margin: 0;
          color: var(--gray-600);
          font-size: var(--text-sm);
        }

        .pdf-toolbar {
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

        .tool-btn:hover {
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

        .color-picker-label {
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

        .annotation-count {
          font-size: var(--text-sm);
          color: var(--gray-600);
          margin-left: auto;
        }

        .pdf-canvas-container {
          flex: 1;
          overflow: auto;
          background: var(--gray-100);
          padding: var(--space-lg);
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .canvas-wrapper {
          position: relative;
          box-shadow: var(--shadow-xl);
        }

        .pdf-canvas,
        .annotation-canvas {
          display: block;
          background: white;
        }

        .annotation-canvas {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: all;
        }

        .pdf-loading {
          padding: var(--space-xl);
          text-align: center;
          color: var(--gray-600);
        }

        .pdf-error {
          padding: var(--space-xl);
          text-align: center;
          color: var(--gray-700);
        }

        .pdf-error h3 {
          color: var(--yellow-600);
          margin-bottom: var(--space-md);
        }

        .pdf-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          background: white;
          border-top: 1px solid var(--gray-200);
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .page-controls,
        .zoom-controls {
          display: flex;
          gap: var(--space-sm);
          align-items: center;
        }

        .control-btn {
          padding: var(--space-xs) var(--space-md);
          border: 1px solid var(--gray-300);
          background: white;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-sm);
          transition: all var(--transition-fast);
        }

        .control-btn:hover:not(:disabled) {
          background: var(--gray-100);
          border-color: var(--gray-400);
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info,
        .zoom-level {
          font-size: var(--text-sm);
          color: var(--gray-700);
          padding: 0 var(--space-sm);
        }

        .note-dialog-overlay {
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

        .note-dialog {
          background: white;
          padding: var(--space-lg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          min-width: 400px;
          max-width: 600px;
        }

        .note-dialog h4 {
          margin: 0 0 var(--space-md) 0;
          color: var(--gray-800);
        }

        .note-dialog textarea {
          width: 100%;
          padding: var(--space-sm);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: var(--text-base);
          resize: vertical;
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

        .annotation-list {
          padding: var(--space-md);
          background: white;
          border-top: 1px solid var(--gray-200);
          max-height: 200px;
          overflow-y: auto;
        }

        .annotation-list h4 {
          margin: 0 0 var(--space-sm) 0;
          font-size: var(--text-base);
          color: var(--gray-800);
        }

        .annotations {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .annotation-item {
          position: relative;
          padding: var(--space-sm);
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
        }

        .annotation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
        }

        .annotation-type {
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          color: var(--blue-600);
        }

        .annotation-time {
          font-size: var(--text-xs);
          color: var(--gray-500);
        }

        .annotation-content {
          font-size: var(--text-sm);
          color: var(--gray-700);
        }

        .delete-annotation {
          position: absolute;
          top: var(--space-xs);
          right: var(--space-xs);
          width: 20px;
          height: 20px;
          border: none;
          background: var(--red-500);
          color: white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .annotation-item:hover .delete-annotation {
          opacity: 1;
        }

        .delete-annotation:hover {
          background: var(--red-600);
        }
      `}</style>
    </div>
  );
};

export default PDFAnnotator;