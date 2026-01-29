import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { undo, redo, updateDesignMetadata } from '../../store/designSlice';
import { toggleLayersPanel, togglePropertiesPanel, toggleCommentsPanel, setSaving } from '../../store/uiSlice';
import { designsApi } from '../../services/designsApi';
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from '../../utils/toast';
import { validateImageUrl } from '../../utils/validation';
import './TopBar.css';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentDesign = useAppSelector((state) => state.design.currentDesign);
  const layers = useAppSelector((state) => state.design.layers);
  const historyIndex = useAppSelector((state) => state.design.historyIndex);
  const history = useAppSelector((state) => state.design.history);
  const collaborators = useAppSelector((state) => state.design.collaborators);
  
  const isSaving = useAppSelector((state) => state.ui.isSaving);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (canUndo) dispatch(undo());
  };

  const handleRedo = () => {
    if (canRedo) dispatch(redo());
  };

  const handleAddText = () => {
    const canvasAPI = (window as any).canvasAPI;
    if (canvasAPI) {
      canvasAPI.addText();
      showInfoToast('Text element added');
    }
  };

  const handleAddImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      // Validate the URL
      const validation = validateImageUrl(url);
      
      if (!validation.isValid) {
        showErrorToast(validation.error || 'Invalid URL');
        return;
      }
      
      if (validation.error) {
        // Show warning but still allow adding
        showWarningToast(validation.error);
      }
      
      const canvasAPI = (window as any).canvasAPI;
      if (canvasAPI) {
        try {
          canvasAPI.addImage(url);
          showInfoToast('Image added to canvas');
        } catch (error) {
          showErrorToast('Failed to add image. Please check the URL.');
        }
      }
    }
  };

  const handleAddRectangle = () => {
    const canvasAPI = (window as any).canvasAPI;
    if (canvasAPI) {
      canvasAPI.addShape('rectangle');
      showInfoToast('Rectangle added');
    }
  };

  const handleAddCircle = () => {
    const canvasAPI = (window as any).canvasAPI;
    if (canvasAPI) {
      canvasAPI.addShape('circle');
      showInfoToast('Circle added');
    }
  };

  const handleExportPNG = () => {
    const canvasAPI = (window as any).canvasAPI;
    if (canvasAPI) {
      canvasAPI.exportToPNG();
      showSuccessToast('Design exported successfully!');
    }
  };

  const handleSave = async () => {
    if (!currentDesign) return;

    try {
      dispatch(setSaving(true));
      setSaveStatus('idle');

      // Update design with current layers
      const updatedDesign = await designsApi.update(currentDesign._id, {
        name: currentDesign.name,
        width: currentDesign.width,
        height: currentDesign.height,
        layers,
      });

      // Update Redux metadata (timestamps, etc) without resetting history
      dispatch(updateDesignMetadata(updatedDesign));
      
      setSaveStatus('success');
      showSuccessToast('Design saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      console.error('Failed to save design:', error);
      setSaveStatus('error');
      showErrorToast(error.response?.data?.message || error.message || 'Failed to save design');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      dispatch(setSaving(false));
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="topbar-btn topbar-back" onClick={() => navigate('/')} title="Back to designs">
          ← Back
        </button>
        <div className="topbar-divider" />
        <h1 className="topbar-title">{currentDesign?.name || 'Untitled Design'}</h1>
        <span className="topbar-collaborators">{collaborators.length} collaborators: {collaborators.join(', ')}</span>
        {isSaving && <span className="topbar-saving">Saving...</span>}
      </div>

      <div className="topbar-center">
        <button className="topbar-btn" onClick={handleAddText} title="Add Text">
          + Text
        </button>
        <button className="topbar-btn" onClick={handleAddImage} title="Add Image">
          + Image
        </button>
        <button className="topbar-btn" onClick={handleAddRectangle} title="Add Rectangle">
          + Rectangle
        </button>
        <button className="topbar-btn" onClick={handleAddCircle} title="Add Circle">
          + Circle
        </button>
        <div className="topbar-divider" />
        <button
          className="topbar-btn"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        <button
          className="topbar-btn"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
      </div>

      <div className="topbar-right">
        <button
          className="topbar-btn"
          onClick={() => dispatch(toggleLayersPanel())}
          title="Toggle Layers Panel"
        >
          Layers
        </button>
        <button
          className="topbar-btn"
          onClick={() => dispatch(togglePropertiesPanel())}
          title="Toggle Properties Panel"
        >
          Properties
        </button>
        <button
          className="topbar-btn"
          onClick={() => dispatch(toggleCommentsPanel())}
          title="Toggle Comments Panel"
        >
          Comments
        </button>
        <div className="topbar-divider" />
        <button 
          className="topbar-btn topbar-primary" 
          onClick={handleExportPNG}
          title="Download as PNG"
        >
          ⬇ Download PNG
        </button>
        <button 
          className="topbar-btn topbar-primary" 
          onClick={handleSave}
          disabled={isSaving || !currentDesign}
        >
          {isSaving ? 'Saving...' : saveStatus === 'success' ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
};



