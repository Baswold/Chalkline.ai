import React from 'react';
import type { WhiteboardProps } from '../types';

const Whiteboard: React.FC<WhiteboardProps> = ({
  assignment,
  shapes,
  onShapeAdd,
  onShapeUpdate,
  onShapeDelete
}) => {
  return (
    <div className="whiteboard">
      <div className="whiteboard-header">
        <h3>🎨 Digital Whiteboard</h3>
        {assignment && (
          <p>Working on: {assignment.title}</p>
        )}
      </div>
      
      <div className="whiteboard-content">
        <div className="coming-soon">
          <div className="feature-preview">
            <h4>🚧 Coming Soon: Interactive Whiteboard</h4>
            <div className="preview-features">
              <div className="feature-item">
                <span className="feature-icon">✏️</span>
                <div>
                  <strong>Drawing Tools</strong>
                  <p>Pen, brush, and marker tools with pressure sensitivity</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">📐</span>
                <div>
                  <strong>Shape Recognition</strong>
                  <p>Draw rough shapes and they'll snap to perfect geometry</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🧮</span>
                <div>
                  <strong>Mathematical Tools</strong>
                  <p>Graph paper, coordinate grids, and equation templates</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <div>
                  <strong>AI-Powered Enhancement</strong>
                  <p>Convert sketches to clean diagrams and illustrations</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🎨</span>
                <div>
                  <strong>Rich Media Support</strong>
                  <p>Images, text boxes, and multimedia elements</p>
                </div>
              </div>
            </div>
            
            <div className="mockup-tools">
              <h5>Drawing Toolbar Preview:</h5>
              <div className="mock-toolbar">
                <button disabled>✏️ Pen</button>
                <button disabled>🖍️ Marker</button>
                <button disabled>🔸 Rectangle</button>
                <button disabled>⭕ Circle</button>
                <button disabled>📏 Line</button>
                <button disabled>📝 Text</button>
                <button disabled>🗑️ Erase</button>
                <button disabled>🔄 Undo</button>
              </div>
            </div>
            
            <div className="shape-snap-demo">
              <h5>Shape-Snap Technology:</h5>
              <div className="demo-grid">
                <div className="demo-before">
                  <strong>You draw:</strong>
                  <div className="rough-shape">📐 Rough sketch</div>
                </div>
                <div className="demo-arrow">→</div>
                <div className="demo-after">
                  <strong>AI creates:</strong>
                  <div className="clean-shape">📐 Perfect geometry</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="whiteboard-canvas-placeholder">
        <div className="placeholder-content">
          <div className="canvas-mockup">
            <div className="mockup-grid">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="grid-line" />
              ))}
            </div>
            <div className="mockup-content">
              <p>🎨 Your digital canvas will appear here</p>
              <small>Perfect for math problems, diagrams, brainstorming, and visual thinking</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;