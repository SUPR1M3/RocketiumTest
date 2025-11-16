import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EditorLayout } from '../../components/Layout/EditorLayout';
import { TopBar } from '../../components/TopBar/TopBar';
import { LayersPanel } from '../../components/LayersPanel/LayersPanel';
import { PropertiesPanel } from '../../components/PropertiesPanel/PropertiesPanel';
import CommentsPanel from '../../components/CommentsPanel/CommentsPanel';
import { FabricCanvas } from '../../components/Canvas/FabricCanvas';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { 
  setCurrentDesign, 
  setLoading, 
  setError, 
  undo, 
  redo,
  remoteAddLayer,
  remoteUpdateLayer,
  remoteDeleteLayer,
  remoteUpdateLayers,
} from '../../store/designSlice';
import { designsApi } from '../../services/designsApi';
import { useSocket } from '../../hooks/useSocket';
import { SocketProvider } from '../../contexts/SocketContext';
import { showErrorToast } from '../../utils/toast';
import './EditorPage.css';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.design.isLoading);
  const error = useAppSelector((state) => state.design.error);
  const currentDesign = useAppSelector((state) => state.design.currentDesign);
  
  // Initialize Socket.io
  const socket = useSocket();
  
  // Extract isConnected to trigger re-renders when it changes
  const isSocketConnected = socket.isConnected;
  
  // Generate a unique user ID for this session (in a real app, use actual user ID)
  const userId = React.useMemo(() => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, []);
  
  // Memoize socket context value to prevent unnecessary re-renders but update when isConnected changes
  const socketContextValue = React.useMemo(() => {
    return {
      socket,
      isConnected: isSocketConnected,
      userId,
      designId: currentDesign?._id,
    };
  }, [socket, isSocketConnected, userId, currentDesign?._id]);

  // Load design when component mounts
  useEffect(() => {
    if (id) {
      loadDesign(id);
    }
  }, [id]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && !e.shiftKey && e.key === 'z') {
        // Ctrl+Z or Cmd+Z: Undo
        e.preventDefault();
        dispatch(undo());
      } else if (isCtrlOrCmd && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        // Ctrl+Y or Ctrl+Shift+Z or Cmd+Y or Cmd+Shift+Z: Redo
        e.preventDefault();
        dispatch(redo());
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch]);

  // Join/leave design room for real-time collaboration
  useEffect(() => {
    if (!currentDesign?._id || !socket.isConnected) return;

    const designId = currentDesign._id;
    socket.joinDesign(designId, userId, 'Guest User');

    // Request current state from other users (to get unsaved changes)
    setTimeout(() => {
      if (socket.socket) {
        socket.socket.emit('request-current-state', { designId, userId });
      }
    }, 500); // Small delay to ensure we're fully joined

    return () => {
      socket.leaveDesign(designId, userId);
    };
  }, [currentDesign?._id, socket.isConnected, userId, socket.socket]);

  // Listen for remote design updates
  useEffect(() => {
    if (!socket.isConnected) return;

    const handleRemoteUpdate = (data: {
      userId: string;
      action: 'add' | 'update' | 'delete' | 'reorder' | 'undo-redo';
      layerId?: string;
      layer?: any;
      layers?: any[];
    }) => {
      // Ignore updates from self
      if (data.userId === userId) return;

      // Apply remote changes without affecting undo history
      switch (data.action) {
        case 'add':
          if (data.layer) {
            dispatch(remoteAddLayer(data.layer));
          }
          break;
        case 'update':
          if (data.layer) {
            // Update Redux state
            dispatch(remoteUpdateLayer(data.layer));
            
            // Also update canvas directly (bypass sync restrictions)
            const canvasAPI = (window as any).canvasAPI;
            if (canvasAPI && canvasAPI.applyRemoteLayerUpdate) {
              canvasAPI.applyRemoteLayerUpdate(data.layer);
            }
          }
          break;
        case 'delete':
          if (data.layerId) {
            dispatch(remoteDeleteLayer(data.layerId));
          }
          break;
        case 'reorder':
        case 'undo-redo':
          // For reorder and undo/redo, update all layers to match remote state
          if (data.layers) {
            dispatch(remoteUpdateLayers(data.layers));
            
            // For undo-redo, also force update canvas positions
            if (data.action === 'undo-redo') {
              const canvasAPI = (window as any).canvasAPI;
              if (canvasAPI && canvasAPI.forceUpdateAllPositions) {
                canvasAPI.forceUpdateAllPositions(data.layers);
              }
            }
          }
          break;
      }
    };

    socket.on('design-update', handleRemoteUpdate);

    return () => {
      socket.off('design-update', handleRemoteUpdate);
    };
  }, [socket.isConnected, userId, dispatch]);
  
  // Broadcast undo/redo changes to other users
  const layers = useAppSelector((state) => state.design.layers);
  const historyIndex = useAppSelector((state) => state.design.historyIndex);
  // Handle state request/response for new users
  useEffect(() => {
    if (!socket.socket || !currentDesign?._id) return;

    // When another user requests state, send our current state
    const handleStateRequest = (data: { requestingUserId: string }) => {
      if (data.requestingUserId === userId) return; // Don't respond to our own request
      
      socket.socket!.emit('send-current-state', {
        designId: currentDesign._id,
        userId,
        requestingUserId: data.requestingUserId,
        layers,
      });
    };

    // When we receive state from another user, update our layers
    const handleReceiveState = (data: { requestingUserId: string; layers: any[] }) => {
      if (data.requestingUserId !== userId) return; // Only process if it's for us
      
      // Use remoteUpdateLayers to update without affecting history
      dispatch(remoteUpdateLayers(data.layers));
      
      // Force update canvas positions/sizes (since sync effect skips transform properties)
      // Use a delay to ensure Redux state is updated first, and retry if canvas isn't ready
      let retries = 0;
      const maxRetries = 10;
      const tryUpdate = () => {
        const canvasAPI = (window as any).canvasAPI;
        if (canvasAPI && canvasAPI.forceUpdateAllPositions) {
          canvasAPI.forceUpdateAllPositions(data.layers);
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(tryUpdate, 100);
        }
      };
      setTimeout(tryUpdate, 200);
    };

    socket.socket.on('state-request', handleStateRequest);
    socket.socket.on('receive-current-state', handleReceiveState);

    return () => {
      socket.socket?.off('state-request', handleStateRequest);
      socket.socket?.off('receive-current-state', handleReceiveState);
    };
  }, [socket.socket, currentDesign?._id, userId, layers, dispatch]);

  const prevHistoryIndexRef = React.useRef(historyIndex);
  
  useEffect(() => {
    // Detect if history index changed (undo/redo happened)
    if (prevHistoryIndexRef.current !== historyIndex && prevHistoryIndexRef.current !== -1) {
      // Broadcast the entire layer state after undo/redo
      if (socket.isConnected && currentDesign?._id) {
        socket.broadcastDesignUpdate({
          designId: currentDesign._id,
          userId,
          action: 'undo-redo',
          layers,
        });
      }
    }
    
    prevHistoryIndexRef.current = historyIndex;
  }, [historyIndex, layers, socket.isConnected, currentDesign?._id, userId, socket.broadcastDesignUpdate]);

  const loadDesign = async (designId: string) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      const design = await designsApi.get(designId);
      dispatch(setCurrentDesign(design));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load design';
      dispatch(setError(errorMessage));
      showErrorToast(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (isLoading) {
    return (
      <div className="editor-loading">
        <div className="loading-spinner"></div>
        <p>Loading design...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-error">
        <p>Error: {error}</p>
        <button onClick={() => id && loadDesign(id)}>Try Again</button>
      </div>
    );
  }

  return (
    <SocketProvider value={socketContextValue}>
      <EditorLayout
        topBar={<TopBar />}
        leftPanel={<LayersPanel />}
        canvas={<FabricCanvas />}
        rightPanel={<PropertiesPanel />}
        commentsPanel={<CommentsPanel />}
      />
    </SocketProvider>
  );
};



