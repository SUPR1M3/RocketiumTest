import React from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { updateLayer } from '../../store/designSlice';
import { useSocketContext } from '../../contexts/SocketContext';
import type { Layer } from '../../types';
import './PropertiesPanel.css';

export const PropertiesPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const layers = useAppSelector((state) => state.design.layers);
  const selectedLayerId = useAppSelector((state) => state.design.selectedLayerId);
  const socketContext = useSocketContext();

  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);

  const handleUpdateLayer = (updates: Partial<Layer>) => {
    if (!selectedLayer) return;
    
    // Get current canvas state to avoid overwriting dragged positions
    const canvasAPI = (window as any).canvasAPI;
    let currentCanvasState = {};
    
    if (canvasAPI && canvasAPI.getCurrentObjectState) {
      currentCanvasState = canvasAPI.getCurrentObjectState(selectedLayer.id) || {};
    }
    
    // Update canvas directly with the new properties
    if (canvasAPI && canvasAPI.updateObjectProperties) {
      canvasAPI.updateObjectProperties(selectedLayer.id, updates);
    }
    
    // Merge all updates for Redux and broadcasting
    const mergedLayer = {
      ...selectedLayer,
      ...currentCanvasState, // Current canvas position/size/rotation
      ...updates,            // New property values from user
    };
    
    // Update Redux
    dispatch(updateLayer(mergedLayer));
    
    // Broadcast update to other users
    if (socketContext && socketContext.isConnected && socketContext.designId) {
      socketContext.socket.broadcastDesignUpdate({
        designId: socketContext.designId,
        userId: socketContext.userId,
        action: 'update',
        layerId: selectedLayer.id,
        layer: mergedLayer,
      });
    }
  };

  if (!selectedLayer) {
    return (
      <div className="properties-panel">
        <div className="properties-header">
          <h3>Properties</h3>
        </div>
        <div className="properties-empty">
          <p>No layer selected</p>
          <small>Select a layer to edit its properties</small>
        </div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>Properties</h3>
        <span className="properties-type">{selectedLayer.type}</span>
      </div>

      <div className="properties-content">
        {/* Common Properties */}
        <div className="property-section">
          <h4>Layer</h4>
          <div className="property-field">
            <label>Name</label>
            <input type="text" value={selectedLayer.name} readOnly />
          </div>
        </div>

        {/* Position & Size */}
        <div className="property-section">
          <h4>Transform</h4>
          <div className="property-row">
            <div className="property-field">
              <label>X</label>
              <input 
                type="number" 
                value={Math.round(selectedLayer.position.x)} 
                onChange={(e) => handleUpdateLayer({ 
                  position: { ...selectedLayer.position, x: Number(e.target.value) } 
                })}
              />
            </div>
            <div className="property-field">
              <label>Y</label>
              <input 
                type="number" 
                value={Math.round(selectedLayer.position.y)} 
                onChange={(e) => handleUpdateLayer({ 
                  position: { ...selectedLayer.position, y: Number(e.target.value) } 
                })}
              />
            </div>
          </div>
          <div className="property-row">
            <div className="property-field">
              <label>Width</label>
              <input 
                type="number" 
                value={Math.round(selectedLayer.dimensions.width)} 
                onChange={(e) => handleUpdateLayer({ 
                  dimensions: { ...selectedLayer.dimensions, width: Number(e.target.value) } 
                })}
                min="1"
              />
            </div>
            <div className="property-field">
              <label>Height</label>
              <input 
                type="number" 
                value={Math.round(selectedLayer.dimensions.height)} 
                onChange={(e) => handleUpdateLayer({ 
                  dimensions: { ...selectedLayer.dimensions, height: Number(e.target.value) } 
                })}
                min="1"
              />
            </div>
          </div>
          <div className="property-field">
            <label>Rotation (degrees)</label>
            <input 
              type="number" 
              value={Math.round(selectedLayer.rotation)} 
              onChange={(e) => handleUpdateLayer({ rotation: Number(e.target.value) })}
              step="1"
            />
          </div>
        </div>

        {/* Type-specific Properties */}
        {selectedLayer.type === 'text' && selectedLayer.text && (
          <div className="property-section">
            <h4>Text</h4>
            <div className="property-field">
              <label>Content</label>
              <textarea 
                value={selectedLayer.text.content} 
                onChange={(e) => handleUpdateLayer({ 
                  text: { ...selectedLayer.text!, content: e.target.value } 
                })}
                rows={3}
              />
            </div>
            <div className="property-field">
              <label>Font Family</label>
              <select 
                value={selectedLayer.text.fontFamily}
                onChange={(e) => handleUpdateLayer({ 
                  text: { ...selectedLayer.text!, fontFamily: e.target.value } 
                })}
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Impact">Impact</option>
              </select>
            </div>
            <div className="property-row">
              <div className="property-field">
                <label>Font Size</label>
                <input 
                  type="number" 
                  value={selectedLayer.text.fontSize}
                  onChange={(e) => handleUpdateLayer({ 
                    text: { ...selectedLayer.text!, fontSize: Number(e.target.value) } 
                  })}
                  min="8"
                  max="200"
                />
              </div>
              <div className="property-field">
                <label>Color</label>
                <input 
                  type="color" 
                  value={selectedLayer.text.color}
                  onChange={(e) => handleUpdateLayer({ 
                    text: { ...selectedLayer.text!, color: e.target.value } 
                  })}
                />
              </div>
            </div>
          </div>
        )}

        {selectedLayer.type === 'image' && selectedLayer.image && (
          <div className="property-section">
            <h4>Image</h4>
            <div className="property-field">
              <label>URL</label>
              <input type="text" value={selectedLayer.image.url} readOnly />
            </div>
            {selectedLayer.image.opacity !== undefined && (
              <div className="property-field">
                <label>Opacity</label>
                <input type="number" value={selectedLayer.image.opacity} min="0" max="1" step="0.1" readOnly />
              </div>
            )}
          </div>
        )}

        {selectedLayer.type === 'shape' && selectedLayer.shape && (
          <div className="property-section">
            <h4>Shape</h4>
            <div className="property-field">
              <label>Type</label>
              <input type="text" value={selectedLayer.shape.shapeType} readOnly />
            </div>
            <div className="property-field">
              <label>Fill</label>
              <input 
                type="color" 
                value={selectedLayer.shape.fill}
                onChange={(e) => handleUpdateLayer({ 
                  shape: { ...selectedLayer.shape!, fill: e.target.value } 
                })}
              />
            </div>
            {selectedLayer.shape.stroke && (
              <>
                <div className="property-field">
                  <label>Stroke</label>
                  <input 
                    type="color" 
                    value={selectedLayer.shape.stroke}
                    onChange={(e) => handleUpdateLayer({ 
                      shape: { ...selectedLayer.shape!, stroke: e.target.value } 
                    })}
                  />
                </div>
                {selectedLayer.shape.strokeWidth !== undefined && (
                  <div className="property-field">
                    <label>Stroke Width</label>
                    <input 
                      type="number" 
                      value={selectedLayer.shape.strokeWidth}
                      onChange={(e) => handleUpdateLayer({ 
                        shape: { ...selectedLayer.shape!, strokeWidth: Number(e.target.value) } 
                      })}
                      min="0"
                      max="50"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};




