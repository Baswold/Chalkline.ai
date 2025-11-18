/**
 * PDF Annotator with PDF.js integration
 * Features:
 * - PDF rendering
 * - Highlighting
 * - Text annotations
 * - Drawing/ink annotations
 * - W3C Web Annotation export
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { PDFAnnotation, W3CAnnotation, PDFAnnotatorProps } from '../types';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type AnnotationTool = 'select' | 'highlight' | 'note' | 'ink';

const PDFAnnotatorV2: React.FC<PDFAnnotatorProps> = ({
  pdfUrl,
  assignment,
  annotations,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete
}) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [localAnnotations, setLocalAnnotations] = useState<PDFAnnotation[]>(annotations);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationLayerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sample PDF for demonstration
  const samplePdfUrl = pdfUrl || 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(samplePdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        console.log(`PDF loaded: ${pdf.numPages} pages`);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPdf();

    return () => {
      pdfDoc?.destroy();
    };
  }, [samplePdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;

      const viewport = page.getViewport({ scale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Render text layer for selection
      await renderTextLayer(page, viewport);

      // Render annotations
      renderAnnotations();
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // Render text layer for text selection
  const renderTextLayer = async (page: PDFPageProxy, viewport: any) => {
    if (!textLayerRef.current) return;

    const textContent = await page.getTextContent();
    textLayerRef.current.innerHTML = '';

    // Simple text layer rendering (production would use PDF.js TextLayer)
    textLayerRef.current.style.width = `${viewport.width}px`;
    textLayerRef.current.style.height = `${viewport.height}px`;
  };

  // Render annotations on the page
  const renderAnnotations = () => {
    if (!annotationLayerRef.current) return;

    annotationLayerRef.current.innerHTML = '';

    const pageAnnotations = localAnnotations.filter(a => a.page === currentPage);

    pageAnnotations.forEach(annotation => {
      const element = document.createElement('div');
      element.className = `pdf-annotation ${annotation.type} ${
        selectedAnnotation === annotation.id ? 'selected' : ''
      }`;
      element.style.position = 'absolute';
      element.style.left = `${annotation.bounds.x * scale}px`;
      element.style.top = `${annotation.bounds.y * scale}px`;
      element.style.width = `${annotation.bounds.width * scale}px`;
      element.style.height = `${annotation.bounds.height * scale}px`;

      if (annotation.type === 'highlight') {
        element.style.backgroundColor = annotation.color || '#ffeb3b';
        element.style.opacity = '0.4';
        element.style.pointerEvents = 'auto';
      } else if (annotation.type === 'note') {
        element.innerHTML = `
          <div class="note-marker" style="
            background: ${annotation.color || '#2196f3'};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            cursor: pointer;
          ">📝</div>
        `;
        if (annotation.content) {
          element.title = annotation.content;
        }
      }

      element.onclick = () => handleAnnotationClick(annotation.id);

      annotationLayerRef.current!.appendChild(element);
    });
  };

  // Handle mouse events for creating annotations
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'select') return;

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    setIsDrawing(true);

    if (activeTool === 'note') {
      createNoteAnnotation(x, y);
    } else if (activeTool === 'highlight' || activeTool === 'ink') {
      // Start drawing
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'select') return;

    // Handle drawing/highlighting
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Finalize annotation creation
  };

  // Create a note annotation
  const createNoteAnnotation = (x: number, y: number) => {
    const content = prompt('Enter note content:');
    if (!content) return;

    const annotation: PDFAnnotation = {
      id: `annotation-${Date.now()}`,
      type: 'note',
      page: currentPage,
      bounds: { x, y, width: 24, height: 24 },
      content,
      color: '#2196f3',
      timestamp: new Date(),
      author: 'Current User'
    };

    setLocalAnnotations(prev => [...prev, annotation]);
    onAnnotationAdd(annotation);
  };

  // Create highlight annotation from selection
  const createHighlightFromSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const x = (rect.left - canvasRect.left) / scale;
    const y = (rect.top - canvasRect.top) / scale;
    const width = rect.width / scale;
    const height = rect.height / scale;

    const annotation: PDFAnnotation = {
      id: `annotation-${Date.now()}`,
      type: 'highlight',
      page: currentPage,
      bounds: { x, y, width, height },
      content: selection.toString(),
      color: '#ffeb3b',
      timestamp: new Date(),
      author: 'Current User'
    };

    setLocalAnnotations(prev => [...prev, annotation]);
    onAnnotationAdd(annotation);
    selection.removeAllRanges();
  };

  // Handle annotation selection
  const handleAnnotationClick = (id: string) => {
    setSelectedAnnotation(id);
  };

  // Delete selected annotation
  const deleteSelectedAnnotation = () => {
    if (!selectedAnnotation) return;

    setLocalAnnotations(prev => prev.filter(a => a.id !== selectedAnnotation));
    onAnnotationDelete(selectedAnnotation);
    setSelectedAnnotation(null);
  };

  // Export annotations as W3C Web Annotations
  const exportAnnotations = () => {
    const w3cAnnotations: W3CAnnotation[] = localAnnotations.map(annotation => ({
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      id: `urn:uuid:${annotation.id}`,
      type: 'Annotation',
      body: {
        type: 'TextualBody',
        value: annotation.content || '',
        format: 'text/plain'
      },
      target: {
        source: samplePdfUrl,
        selector: {
          type: 'FragmentSelector',
          start: annotation.bounds.x,
          end: annotation.bounds.x + annotation.bounds.width,
          exact: annotation.content
        }
      },
      created: annotation.timestamp.toISOString(),
      creator: annotation.author
    }));

    const json = JSON.stringify(w3cAnnotations, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations-${assignment?.id || 'document'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Navigation
  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className="pdf-annotator-v2">
      <div className="pdf-toolbar">
        <div className="pdf-tools">
          <button
            className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => setActiveTool('select')}
            title="Select Tool"
          >
            🖱️ Select
          </button>
          <button
            className={`tool-btn ${activeTool === 'highlight' ? 'active' : ''}`}
            onClick={() => setActiveTool('highlight')}
            title="Highlight Tool"
          >
            🖍️ Highlight
          </button>
          <button
            className={`tool-btn ${activeTool === 'note' ? 'active' : ''}`}
            onClick={() => setActiveTool('note')}
            title="Note Tool"
          >
            📝 Note
          </button>
          <button
            className={`tool-btn ${activeTool === 'ink' ? 'active' : ''}`}
            onClick={() => setActiveTool('ink')}
            title="Draw Tool"
          >
            ✏️ Draw
          </button>
          <div className="tool-divider"></div>
          <button
            className="tool-btn"
            onClick={createHighlightFromSelection}
            title="Highlight Selected Text"
          >
            ✨ Highlight Selection
          </button>
          {selectedAnnotation && (
            <button
              className="tool-btn danger"
              onClick={deleteSelectedAnnotation}
              title="Delete Selected Annotation"
            >
              🗑️ Delete
            </button>
          )}
        </div>

        <div className="pdf-controls">
          <button onClick={() => setScale(scale - 0.1)} disabled={scale <= 0.5}>
            🔍-
          </button>
          <span className="scale-display">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(scale + 0.1)} disabled={scale >= 3}>
            🔍+
          </button>
          <div className="tool-divider"></div>
          <button className="tool-btn" onClick={exportAnnotations} title="Export Annotations">
            📤 Export
          </button>
        </div>
      </div>

      <div className="pdf-viewer">
        <div className="pdf-canvas-container">
          <canvas ref={canvasRef} className="pdf-canvas" />
          <div ref={textLayerRef} className="pdf-text-layer" />
          <div ref={annotationLayerRef} className="pdf-annotation-layer" />
          <canvas
            ref={drawingCanvasRef}
            className="pdf-drawing-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: canvasRef.current?.width,
              height: canvasRef.current?.height,
              pointerEvents: activeTool === 'select' ? 'none' : 'auto'
            }}
          />
        </div>
      </div>

      <div className="pdf-navigation">
        <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
          ⏮️ First
        </button>
        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
          ◀️ Previous
        </button>
        <span className="page-indicator">
          Page {currentPage} of {numPages}
        </span>
        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === numPages}>
          Next ▶️
        </button>
        <button onClick={() => goToPage(numPages)} disabled={currentPage === numPages}>
          Last ⏭️
        </button>
      </div>

      <div className="pdf-annotations-panel">
        <h4>Annotations ({localAnnotations.length})</h4>
        <div className="annotations-list">
          {localAnnotations.filter(a => a.page === currentPage).length === 0 ? (
            <div className="no-annotations">No annotations on this page</div>
          ) : (
            localAnnotations
              .filter(a => a.page === currentPage)
              .map(annotation => (
                <div
                  key={annotation.id}
                  className={`annotation-item ${
                    selectedAnnotation === annotation.id ? 'selected' : ''
                  }`}
                  onClick={() => handleAnnotationClick(annotation.id)}
                >
                  <div className="annotation-type-icon">
                    {annotation.type === 'highlight' ? '🖍️' : '📝'}
                  </div>
                  <div className="annotation-content">
                    <div className="annotation-text">
                      {annotation.content?.substring(0, 50)}
                      {annotation.content && annotation.content.length > 50 ? '...' : ''}
                    </div>
                    <div className="annotation-meta">
                      {annotation.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFAnnotatorV2;
