import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Design, Layer, HistoryState } from '../types';

interface DesignState {
  currentDesign: Design | null;
  layers: Layer[];
  selectedLayerId: string | null;
  history: HistoryState[];
  historyIndex: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: DesignState = {
  currentDesign: null,
  layers: [],
  selectedLayerId: null,
  history: [],
  historyIndex: -1,
  isLoading: false,
  error: null,
};

const MAX_HISTORY = 20;

const designSlice = createSlice({
  name: 'design',
  initialState,
  reducers: {
    setCurrentDesign: (state, action: PayloadAction<Design>) => {
      state.currentDesign = action.payload;
      state.layers = action.payload.layers;
      // Initialize history with current state
      state.history = [{ layers: action.payload.layers, selectedLayerId: null }];
      state.historyIndex = 0;
    },

    updateDesignMetadata: (state, action: PayloadAction<Design>) => {
      // Update design metadata (timestamps, name) without resetting history
      // Used after saving to update the design object with server response
      if (state.currentDesign) {
        state.currentDesign.updatedAt = action.payload.updatedAt;
        state.currentDesign.createdAt = action.payload.createdAt;
        if (action.payload.name) state.currentDesign.name = action.payload.name;
        if (action.payload.thumbnail) state.currentDesign.thumbnail = action.payload.thumbnail;
        // Keep current layers and dimensions, don't overwrite from server
      }
    },

    clearCurrentDesign: (state) => {
      state.currentDesign = null;
      state.layers = [];
      state.selectedLayerId = null;
      state.history = [];
      state.historyIndex = -1;
    },

    addLayer: (state, action: PayloadAction<Layer>) => {
      state.layers.push(action.payload);
      
      // Normalize zIndex to ensure consecutive values (0, 1, 2, ...)
      const sortedLayers = [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
      sortedLayers.forEach((layer, idx) => {
        layer.zIndex = idx;
      });
      
      // Save to history
      const newHistoryState: HistoryState = {
        layers: [...state.layers],
        selectedLayerId: state.selectedLayerId,
      };
      // Remove future history if we're not at the end
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push(newHistoryState);
      // Limit history size
      if (state.history.length > MAX_HISTORY) {
        state.history.shift();
      } else {
        state.historyIndex++;
      }
    },

    updateLayer: (state, action: PayloadAction<Layer>) => {
      const index = state.layers.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.layers[index] = action.payload;
        // Save to history
        const newHistoryState: HistoryState = {
          layers: [...state.layers],
          selectedLayerId: state.selectedLayerId,
        };
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(newHistoryState);
        if (state.history.length > MAX_HISTORY) {
          state.history.shift();
        } else {
          state.historyIndex++;
        }
      }
    },

    deleteLayer: (state, action: PayloadAction<string>) => {
      state.layers = state.layers.filter((l) => l.id !== action.payload);
      if (state.selectedLayerId === action.payload) {
        state.selectedLayerId = null;
      }
      
      // Normalize zIndex to ensure consecutive values (0, 1, 2, ...)
      const sortedLayers = [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
      sortedLayers.forEach((layer, idx) => {
        layer.zIndex = idx;
      });
      
      // Save to history
      const newHistoryState: HistoryState = {
        layers: [...state.layers],
        selectedLayerId: state.selectedLayerId,
      };
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push(newHistoryState);
      if (state.history.length > MAX_HISTORY) {
        state.history.shift();
      } else {
        state.historyIndex++;
      }
    },

    reorderLayer: (state, action: PayloadAction<{ layerId: string; direction: 'forward' | 'backward' }>) => {
      const { layerId, direction } = action.payload;
      
      // First, normalize zIndex to ensure consecutive values (0, 1, 2, ...)
      const sortedLayers = [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
      sortedLayers.forEach((layer, idx) => {
        layer.zIndex = idx;
      });
      
      // Now find the layer to move
      const layer = state.layers.find((l) => l.id === layerId);
      if (!layer) return;
      
      const currentZIndex = layer.zIndex;
      const maxZIndex = state.layers.length - 1;
      
      if (direction === 'forward') {
        // Move forward means increase zIndex (move toward top)
        if (currentZIndex < maxZIndex) {
          // Find the layer immediately above (zIndex + 1)
          const layerAbove = state.layers.find((l) => l.zIndex === currentZIndex + 1);
          if (layerAbove) {
            // Swap zIndex values
            layer.zIndex = currentZIndex + 1;
            layerAbove.zIndex = currentZIndex;
          }
        }
      } else if (direction === 'backward') {
        // Move backward means decrease zIndex (move toward bottom)
        if (currentZIndex > 0) {
          // Find the layer immediately below (zIndex - 1)
          const layerBelow = state.layers.find((l) => l.zIndex === currentZIndex - 1);
          if (layerBelow) {
            // Swap zIndex values
            layer.zIndex = currentZIndex - 1;
            layerBelow.zIndex = currentZIndex;
          }
        }
      }
      
      // Re-sort layers by zIndex
      state.layers.sort((a, b) => a.zIndex - b.zIndex);
      
      // Save to history
      const newHistoryState: HistoryState = {
        layers: [...state.layers],
        selectedLayerId: state.selectedLayerId,
      };
      state.history = state.history.slice(0, state.historyIndex + 1);
      state.history.push(newHistoryState);
      if (state.history.length > MAX_HISTORY) {
        state.history.shift();
      } else {
        state.historyIndex++;
      }
    },

    renameLayer: (state, action: PayloadAction<{ layerId: string; newName: string }>) => {
      const { layerId, newName } = action.payload;
      const layer = state.layers.find((l) => l.id === layerId);
      if (layer && newName.trim()) {
        layer.name = newName.trim();
        
        // Save to history
        const newHistoryState: HistoryState = {
          layers: [...state.layers],
          selectedLayerId: state.selectedLayerId,
        };
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(newHistoryState);
        if (state.history.length > MAX_HISTORY) {
          state.history.shift();
        } else {
          state.historyIndex++;
        }
      }
    },

    toggleLayerVisibility: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find((l) => l.id === action.payload);
      if (layer) {
        layer.visible = !layer.visible;
        
        // Save to history
        const newHistoryState: HistoryState = {
          layers: [...state.layers],
          selectedLayerId: state.selectedLayerId,
        };
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(newHistoryState);
        if (state.history.length > MAX_HISTORY) {
          state.history.shift();
        } else {
          state.historyIndex++;
        }
      }
    },

    toggleLayerLock: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find((l) => l.id === action.payload);
      if (layer) {
        layer.locked = !layer.locked;
        
        // If locking the currently selected layer, deselect it
        if (layer.locked && state.selectedLayerId === layer.id) {
          state.selectedLayerId = null;
        }
        
        // Save to history
        const newHistoryState: HistoryState = {
          layers: [...state.layers],
          selectedLayerId: state.selectedLayerId,
        };
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(newHistoryState);
        if (state.history.length > MAX_HISTORY) {
          state.history.shift();
        } else {
          state.historyIndex++;
        }
      }
    },

    selectLayer: (state, action: PayloadAction<string | null>) => {
      state.selectedLayerId = action.payload;
    },

    setLayers: (state, action: PayloadAction<Layer[]>) => {
      state.layers = action.payload;
    },

    undo: (state) => {
      if (state.historyIndex > 0) {
        state.historyIndex--;
        const historyState = state.history[state.historyIndex];
        state.layers = historyState.layers;
        state.selectedLayerId = historyState.selectedLayerId;
      }
    },

    redo: (state) => {
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        const historyState = state.history[state.historyIndex];
        state.layers = historyState.layers;
        state.selectedLayerId = historyState.selectedLayerId;
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Remote actions: Apply changes from other users WITHOUT affecting undo history
    remoteAddLayer: (state, action: PayloadAction<Layer>) => {
      state.layers.push(action.payload);
      // Normalize zIndex
      const sortedLayers = [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
      sortedLayers.forEach((layer, idx) => {
        layer.zIndex = idx;
      });
      // NO history update
    },

    remoteUpdateLayer: (state, action: PayloadAction<Layer>) => {
      const index = state.layers.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) {
        state.layers[index] = action.payload;
      }
      // NO history update
    },

    remoteDeleteLayer: (state, action: PayloadAction<string>) => {
      state.layers = state.layers.filter((l) => l.id !== action.payload);
      if (state.selectedLayerId === action.payload) {
        state.selectedLayerId = null;
      }
      // Normalize zIndex
      const sortedLayers = [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
      sortedLayers.forEach((layer, idx) => {
        layer.zIndex = idx;
      });
      // NO history update
    },

    remoteReorderLayer: (state, action: PayloadAction<{ layerId: string; direction: 'up' | 'down' }>) => {
      const { layerId, direction } = action.payload;
      const sortedLayers = [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
      const currentIndex = sortedLayers.findIndex((l) => l.id === layerId);

      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
      if (targetIndex < 0 || targetIndex >= sortedLayers.length) return;

      // Swap zIndex values
      const temp = sortedLayers[currentIndex].zIndex;
      sortedLayers[currentIndex].zIndex = sortedLayers[targetIndex].zIndex;
      sortedLayers[targetIndex].zIndex = temp;

      // Normalize zIndex
      sortedLayers.sort((a, b) => a.zIndex - b.zIndex).forEach((layer, idx) => {
        layer.zIndex = idx;
      });
      // NO history update
    },

    remoteUpdateLayers: (state, action: PayloadAction<Layer[]>) => {
      // Bulk update from remote (e.g., when joining a session)
      state.layers = action.payload;
      // NO history update
    },
  },
});

export const {
  setCurrentDesign,
  updateDesignMetadata,
  clearCurrentDesign,
  addLayer,
  updateLayer,
  deleteLayer,
  reorderLayer,
  renameLayer,
  toggleLayerVisibility,
  toggleLayerLock,
  selectLayer,
  setLayers,
  undo,
  redo,
  setLoading,
  setError,
  remoteAddLayer,
  remoteUpdateLayer,
  remoteDeleteLayer,
  remoteReorderLayer,
  remoteUpdateLayers,
} = designSlice.actions;

export default designSlice.reducer;

