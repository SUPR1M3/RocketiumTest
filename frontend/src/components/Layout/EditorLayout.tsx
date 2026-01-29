import React from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import './EditorLayout.css';

interface EditorLayoutProps {
  connection: 'connected' | 'disconnected';
  topBar: React.ReactNode;
  leftPanel: React.ReactNode;
  canvas: React.ReactNode;
  rightPanel: React.ReactNode;
  commentsPanel: React.ReactNode;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  connection,
  topBar,
  leftPanel,
  canvas,
  rightPanel,
  commentsPanel,
}) => {
  const showLayersPanel = useAppSelector((state) => state.ui.showLayersPanel);
  const showPropertiesPanel = useAppSelector((state) => state.ui.showPropertiesPanel);
  const showCommentsPanel = useAppSelector((state) => state.ui.showCommentsPanel);

  return (
    <div className="editor-layout">
      {connection === 'disconnected' && (
        <div className="editor-connection-status">
          <p>Disconnected from server</p>
        </div>
      )}
      {connection === 'connected' && (
        <div className="editor-connection-status-connected">
          <p>Connected to server</p>
        </div>
      )}
      <div className="editor-topbar">{topBar}</div>
      <div className="editor-main">
        {showLayersPanel && <div className="editor-left-panel">{leftPanel}</div>}
        <div className="editor-canvas-area">{canvas}</div>
        {showPropertiesPanel && <div className="editor-right-panel">{rightPanel}</div>}
        {showCommentsPanel && <div className="editor-comments-panel">{commentsPanel}</div>}
      </div>
    </div>
  );
};




