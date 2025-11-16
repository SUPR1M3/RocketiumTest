import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { selectLayer, deleteLayer, reorderLayer, renameLayer, toggleLayerVisibility, toggleLayerLock } from '../../store/designSlice';
import { useSocketContext } from '../../contexts/SocketContext';
import { showSuccessToast } from '../../utils/toast';
import './LayersPanel.css';

export const LayersPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const layers = useAppSelector((state) => state.design.layers);
  const selectedLayerId = useAppSelector((state) => state.design.selectedLayerId);
  const socketContext = useSocketContext();
  
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Sort layers by zIndex for display (highest at top)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  // Helper to broadcast changes
  const broadcastChange = (action: 'delete' | 'reorder', layerId: string) => {
    if (!socketContext || !socketContext.isConnected || !socketContext.designId) return;
    
    socketContext.socket.broadcastDesignUpdate({
      designId: socketContext.designId,
      userId: socketContext.userId,
      action,
      layerId,
      layers, // Send current layers state for reorder
    });
  };

  const handleSelectLayer = (layerId: string) => {
    dispatch(selectLayer(layerId));
  };

  const handleBringForward = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(reorderLayer({ layerId, direction: 'forward' }));
    broadcastChange('reorder', layerId);
  };

  const handleSendBackward = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(reorderLayer({ layerId, direction: 'backward' }));
    broadcastChange('reorder', layerId);
  };

  const handleDeleteLayer = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this layer?')) {
      const layerName = layers.find(l => l.id === layerId)?.name || 'Layer';
      dispatch(deleteLayer(layerId));
      broadcastChange('delete', layerId);
      showSuccessToast(`${layerName} deleted`);
    }
  };

  const handleToggleVisibility = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleLayerVisibility(layerId));
    
    // Broadcast visibility toggle (send updated layer after Redux updates)
    setTimeout(() => {
      const updatedLayer = layers.find(l => l.id === layerId);
      if (updatedLayer && socketContext && socketContext.isConnected && socketContext.designId) {
        socketContext.socket.broadcastDesignUpdate({
          designId: socketContext.designId,
          userId: socketContext.userId,
          action: 'update',
          layerId,
          layer: { ...updatedLayer, visible: !updatedLayer.visible }, // Toggle the visibility
        });
      }
    }, 0);
  };

  const handleToggleLock = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleLayerLock(layerId));
    
    // Broadcast lock toggle (send updated layer after Redux updates)
    setTimeout(() => {
      const updatedLayer = layers.find(l => l.id === layerId);
      if (updatedLayer && socketContext && socketContext.isConnected && socketContext.designId) {
        socketContext.socket.broadcastDesignUpdate({
          designId: socketContext.designId,
          userId: socketContext.userId,
          action: 'update',
          layerId,
          layer: { ...updatedLayer, locked: !updatedLayer.locked }, // Toggle the lock
        });
      }
    }, 0);
  };

  const handleStartRename = (layerId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLayerId(layerId);
    setEditingName(currentName);
  };

  const handleFinishRename = (layerId: string) => {
    if (editingName.trim()) {
      dispatch(renameLayer({ layerId, newName: editingName }));
    }
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, layerId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinishRename(layerId);
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text':
        return 'T';
      case 'image':
        return '🖼';
      case 'shape':
        return '◼';
      default:
        return '?';
    }
  };

  if (layers.length === 0) {
    return (
      <div className="layers-panel">
        <div className="layers-header">
          <h3>Layers</h3>
        </div>
        <div className="layers-empty">
          <p>No layers yet</p>
          <small>Add text, images, or shapes to get started</small>
        </div>
      </div>
    );
  }

  return (
    <div className="layers-panel">
      <div className="layers-header">
        <h3>Layers</h3>
        <span className="layers-count">{layers.length}</span>
      </div>
      <div className="layers-list">
        {sortedLayers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${selectedLayerId === layer.id ? 'layer-item-selected' : ''} ${!layer.visible ? 'layer-item-hidden' : ''} ${layer.locked ? 'layer-item-locked' : ''}`}
            onClick={() => !layer.locked && handleSelectLayer(layer.id)}
          >
            <span className="layer-icon">{getLayerIcon(layer.type)}</span>
            {editingLayerId === layer.id ? (
              <input
                type="text"
                className="layer-name-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleFinishRename(layer.id)}
                onKeyDown={(e) => handleRenameKeyDown(e, layer.id)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                className="layer-name"
                onDoubleClick={(e) => handleStartRename(layer.id, layer.name, e)}
                title="Double-click to rename"
              >
                {layer.name}
              </span>
            )}
            <div className="layer-actions">
              <button
                className={`layer-action-btn ${!layer.visible ? 'layer-action-active' : ''}`}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
                onClick={(e) => handleToggleVisibility(layer.id, e)}
              >
                {layer.visible ? '👁' : '👁‍🗨'}
              </button>
              <button
                className={`layer-action-btn ${layer.locked ? 'layer-action-active' : ''}`}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                onClick={(e) => handleToggleLock(layer.id, e)}
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>
              <button
                className="layer-action-btn"
                title="Bring forward"
                onClick={(e) => handleBringForward(layer.id, e)}
              >
                ↑
              </button>
              <button
                className="layer-action-btn"
                title="Send backward"
                onClick={(e) => handleSendBackward(layer.id, e)}
              >
                ↓
              </button>
              <button
                className="layer-action-btn layer-delete"
                title="Delete"
                onClick={(e) => handleDeleteLayer(layer.id, e)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



