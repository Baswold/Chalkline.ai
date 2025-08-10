import React from 'react';
import type { PDFAnnotatorProps } from '../types';

const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({
  pdfUrl,
  assignment,
  annotations,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete
}) => {
  return (
    <div className="pdf-annotator">
      <div className="pdf-header">
        <h3>📋 PDF Viewer & Annotator</h3>
        {assignment && (
          <p>Working on: {assignment.title}</p>
        )}
      </div>
      
      <div className="pdf-content">
        <div className="coming-soon">
          <div className="feature-preview">
            <h4>🚧 Coming Soon: Advanced PDF Features</h4>
            <div className="preview-features">
              <div className="feature-item">
                <span className="feature-icon">📄</span>
                <div>
                  <strong>PDF Document Viewing</strong>
                  <p>View and navigate through PDF assignments and worksheets</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🖍️</span>
                <div>
                  <strong>Highlight & Annotate</strong>
                  <p>Highlight important text and add your own notes</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">✏️</span>
                <div>
                  <strong>Drawing Tools</strong>
                  <p>Draw diagrams and mark up documents with ink tools</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">💾</span>
                <div>
                  <strong>W3C Web Annotations</strong>
                  <p>Portable annotations that work across platforms</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🔄</span>
                <div>
                  <strong>Google Drive Integration</strong>
                  <p>Sync with your Google Drive and classroom documents</p>
                </div>
              </div>
            </div>
            
            <div className="mockup-tools">
              <h5>Annotation Toolbar Preview:</h5>
              <div className="mock-toolbar">
                <button disabled>🖍️ Highlight</button>
                <button disabled>📝 Note</button>
                <button disabled>✏️ Draw</button>
                <button disabled>📐 Shape</button>
                <button disabled>📄 Text</button>
                <button disabled>🗑️ Erase</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pdf-placeholder">
        <div className="placeholder-content">
          <p>Upload a PDF document or select an assignment with attached files to begin annotating.</p>
          <button className="upload-btn" disabled>
            📎 Upload PDF (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFAnnotator;