import React, { useEffect, useRef, useState } from 'react';
import { Canvas, IText, Rect, Circle, Object as FabricObject } from 'fabric';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { addLayer, updateLayer, selectLayer } from '../../store/designSlice';
import { useSocketContext } from '../../contexts/SocketContext';
import type { Layer } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import './FabricCanvas.css';

export const FabricCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fabricObjectsMapRef = useRef<Map<string, FabricObject>>(new Map());
  const isUpdatingFromCanvasRef = useRef(false);
  const dispatch = useAppDispatch();
  
  const currentDesign = useAppSelector((state) => state.design.currentDesign);
  const layers = useAppSelector((state) => state.design.layers);
  const selectedLayerId = useAppSelector((state) => state.design.selectedLayerId);
  const historyIndex = useAppSelector((state) => state.design.historyIndex);
  
  // Get socket for real-time collaboration
  const socketContext = useSocketContext();
  
  // Keep refs to always have the current values (for event handlers to avoid stale closures)
  const layersRef = useRef<Layer[]>(layers);
  const socketContextRef = useRef(socketContext);
  const prevHistoryIndexRef = useRef(historyIndex);
  
  // Update refs when values change
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);
  
  useEffect(() => {
    socketContextRef.current = socketContext;
  }, [socketContext]);
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Fabric.js canvas
  // Only reinitialize when design ID changes (not when metadata updates)
  const currentDesignId = currentDesign?._id;
  
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: currentDesign?.width || 1080,
      height: currentDesign?.height || 1080,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;
    setIsInitialized(true);

    // Event handlers
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:moving', handleObjectMoving);
    canvas.on('object:scaling', handleObjectScaling);
    canvas.on('object:rotating', handleObjectRotating);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
      setIsInitialized(false);
    };
  }, [currentDesignId]);

  // Smart sync: only update canvas when layers array changes structurally
  useEffect(() => {
    if (!fabricCanvasRef.current || !isInitialized) return;

    const canvas = fabricCanvasRef.current;
    const canvasObjects = canvas.getObjects();
    
    // Get current layer IDs from canvas
    const canvasLayerIds = new Set(canvasObjects.map((obj: any) => obj.layerId));
    const reduxLayerIds = new Set(layers.map(l => l.id));

    // Sort layers by zIndex to check correct order
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const visibleLayers = sortedLayers.filter(l => l.visible);

    // Check if we need to add or remove objects
    const needsAdd = layers.some(l => l.visible && !canvasLayerIds.has(l.id));
    const needsRemove = canvasObjects.some((obj: any) => !reduxLayerIds.has(obj.layerId));
    const needsReorder = canvasObjects.length === visibleLayers.length && 
      canvasObjects.some((obj: any, idx) => obj.layerId !== visibleLayers[idx]?.id);
    
    // Check if visibility changed
    const visibilityChanged = layers.some(l => {
      const isOnCanvas = canvasLayerIds.has(l.id);
      return (l.visible && !isOnCanvas) || (!l.visible && isOnCanvas);
    });

    // Only do a full rebuild if structure changed (add/remove/reorder/visibility)
    if (needsAdd || needsRemove || needsReorder || visibilityChanged) {
      // Update persistent map with current canvas objects
      canvasObjects.forEach((obj: any) => {
        if (obj.layerId) {
          fabricObjectsMapRef.current.set(obj.layerId, obj);
        }
      });

      // Remove deleted layers from the map
      const layerIds = new Set(layers.map(l => l.id));
      const keysToDelete: string[] = [];
      fabricObjectsMapRef.current.forEach((_, layerId) => {
        if (!layerIds.has(layerId)) {
          keysToDelete.push(layerId);
        }
      });
      keysToDelete.forEach(key => fabricObjectsMapRef.current.delete(key));

      canvas.clear();
      
      sortedLayers.forEach((layer) => {
        // Skip invisible layers
        if (!layer.visible) return;
        
        // Try to reuse existing object from persistent map
        let fabricObject: FabricObject | null | undefined = fabricObjectsMapRef.current.get(layer.id);
        
        if (fabricObject) {
          // Reuse existing object - only update lock state, NOT positions
          // Positions are managed by canvas and already in sync via object:modified
          fabricObject.set({
            selectable: !layer.locked,
            evented: !layer.locked,
          });
        } else {
          // Create new object from layer data
          fabricObject = createFabricObject(layer);
          if (fabricObject) {
            fabricObject.set('layerId', layer.id);
            fabricObject.set({
              selectable: !layer.locked,
              evented: !layer.locked,
            });
            // Store in persistent map
            fabricObjectsMapRef.current.set(layer.id, fabricObject);
          }
        }
        
        if (fabricObject) {
          canvas.add(fabricObject);
        }
      });

      canvas.renderAll();
    } else {
      // No structural changes - but update styling properties and lock state
      // This handles undo/redo of property changes and lock toggle
      // NOTE: We intentionally DON'T update transform properties here to avoid
      // resetting canvas drag operations
      if (isUpdatingFromCanvasRef.current) {
        // Skip if update came from canvas to prevent circular updates
        return;
      }
      
      let needsRender = false;
      canvasObjects.forEach((obj: any) => {
        const layer = layers.find(l => l.id === obj.layerId);
        if (!layer) return;
        
        // Update lock state
        const shouldBeLocked = layer.locked;
        const isCurrentlyLocked = !obj.selectable;
        if (shouldBeLocked !== isCurrentlyLocked) {
          obj.set({
            selectable: !layer.locked,
            evented: !layer.locked,
          });
          needsRender = true;
        }
        
        // Update styling properties (for undo/redo support)
        if (layer.type === 'text' && layer.text && obj.type === 'i-text') {
          const textObj = obj as IText;
          if (textObj.text !== layer.text.content ||
              textObj.fontSize !== layer.text.fontSize ||
              textObj.fontFamily !== layer.text.fontFamily ||
              textObj.fill !== layer.text.color ||
              textObj.scaleX !== 1 || textObj.scaleY !== 1) {
            textObj.set({
              text: layer.text.content,
              fontSize: layer.text.fontSize, // This now includes the scaled fontSize
              fontFamily: layer.text.fontFamily,
              fill: layer.text.color,
              // Reset scale to 1 since fontSize already accounts for scale
              scaleX: 1,
              scaleY: 1,
            });
            // Note: Don't set width/height for IText - it calculates its own size based on content and fontSize
            needsRender = true;
          }
        } else if (layer.type === 'shape' && layer.shape) {
          if (layer.shape.shapeType === 'rectangle' && obj.type === 'rect') {
            const rectObj = obj as Rect;
            if (rectObj.fill !== layer.shape.fill ||
                rectObj.stroke !== layer.shape.stroke ||
                rectObj.strokeWidth !== layer.shape.strokeWidth) {
              rectObj.set({
                fill: layer.shape.fill,
                stroke: layer.shape.stroke,
                strokeWidth: layer.shape.strokeWidth || 0,
              });
              needsRender = true;
            }
          } else if (layer.shape.shapeType === 'circle' && obj.type === 'circle') {
            const circleObj = obj as Circle;
            if (circleObj.fill !== layer.shape.fill ||
                circleObj.stroke !== layer.shape.stroke ||
                circleObj.strokeWidth !== layer.shape.strokeWidth) {
              circleObj.set({
                fill: layer.shape.fill,
                stroke: layer.shape.stroke,
                strokeWidth: layer.shape.strokeWidth || 0,
              });
              needsRender = true;
            }
          }
        }
      });
      
      if (needsRender) {
        canvas.renderAll();
      }
    }
  }, [layers, isInitialized]);

  // Handle selection from Redux (when layer clicked in panel)
  useEffect(() => {
    if (!fabricCanvasRef.current || !isInitialized) return;

    const canvas = fabricCanvasRef.current;
    
    if (selectedLayerId) {
      const obj = canvas.getObjects().find((o: any) => o.layerId === selectedLayerId);
      if (obj) {
        canvas.setActiveObject(obj);
        canvas.renderAll();
      }
    } else {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [selectedLayerId, isInitialized]);

  // Detect undo/redo and force update canvas positions
  useEffect(() => {
    if (!fabricCanvasRef.current || !isInitialized) return;
    
    // Check if history index changed (undo/redo occurred)
    if (prevHistoryIndexRef.current !== historyIndex) {
      const canvas = fabricCanvasRef.current;
      
      // Force update all object positions from layer data
      layers.forEach(layer => {
        const fabricObj = canvas.getObjects().find((obj: any) => obj.layerId === layer.id);
        if (fabricObj) {
          // Handle text separately (no width/height, just fontSize)
          if (layer.type === 'text' && fabricObj.type === 'i-text') {
            (fabricObj as IText).set({
              left: layer.position.x,
              top: layer.position.y,
              text: layer.text?.content || '',
              fontSize: layer.text?.fontSize,
              fontFamily: layer.text?.fontFamily,
              fill: layer.text?.color,
              angle: layer.rotation,
              scaleX: 1,
              scaleY: 1,
            });
          } else {
            // For non-text objects, set dimensions
            fabricObj.set({
              left: layer.position.x,
              top: layer.position.y,
              width: layer.dimensions.width,
              height: layer.dimensions.height,
              angle: layer.rotation,
              scaleX: 1,
              scaleY: 1,
            });
            
            // Handle circle radius
            if (fabricObj.type === 'circle') {
              (fabricObj as Circle).set({ radius: layer.dimensions.width / 2 });
            }
            
            // Handle shape properties
            if (layer.type === 'shape' && layer.shape) {
              fabricObj.set({
                fill: layer.shape.fill,
                stroke: layer.shape.stroke,
                strokeWidth: layer.shape.strokeWidth,
              });
            }
          }
          
          fabricObj.setCoords();
        }
      });
      
      canvas.renderAll();
      prevHistoryIndexRef.current = historyIndex;
    }
  }, [historyIndex, layers, isInitialized]);

  // Helper function to broadcast changes to other users
  const broadcastChange = (action: 'add' | 'update' | 'delete' | 'reorder', layerId?: string, layer?: Layer, layers?: Layer[]) => {
    const currentSocketContext = socketContextRef.current;
    if (!currentSocketContext || !currentSocketContext.isConnected || !currentSocketContext.designId) {
      return;
    }
    
    currentSocketContext.socket.broadcastDesignUpdate({
      designId: currentSocketContext.designId,
      userId: currentSocketContext.userId,
      action,
      layerId,
      layer,
      layers,
    });
  };

  const createFabricObject = (layer: Layer): FabricObject | null => {
    switch (layer.type) {
      case 'text':
        if (!layer.text) return null;
        // For IText, don't set width explicitly - it calculates based on content and fontSize
        return new IText(layer.text.content, {
          left: layer.position.x,
          top: layer.position.y,
          fontSize: layer.text.fontSize, // This already includes any scaling
          fontFamily: layer.text.fontFamily,
          fill: layer.text.color,
          angle: layer.rotation,
          scaleX: 1,
          scaleY: 1,
        });

      case 'image':
        if (!layer.image) return null;
        // For now, create a placeholder rectangle
        // In production, you'd load the actual image
        return new Rect({
          left: layer.position.x,
          top: layer.position.y,
          width: layer.dimensions.width,
          height: layer.dimensions.height,
          fill: '#cccccc',
          stroke: '#666666',
          strokeWidth: 2,
          angle: layer.rotation,
        });

      case 'shape':
        if (!layer.shape) return null;
        
        if (layer.shape.shapeType === 'rectangle') {
          return new Rect({
            left: layer.position.x,
            top: layer.position.y,
            width: layer.dimensions.width,
            height: layer.dimensions.height,
            fill: layer.shape.fill,
            stroke: layer.shape.stroke,
            strokeWidth: layer.shape.strokeWidth || 0,
            angle: layer.rotation,
          });
        } else if (layer.shape.shapeType === 'circle') {
          return new Circle({
            left: layer.position.x,
            top: layer.position.y,
            radius: layer.dimensions.width / 2,
            fill: layer.shape.fill,
            stroke: layer.shape.stroke,
            strokeWidth: layer.shape.strokeWidth || 0,
            angle: layer.rotation,
          });
        }
        return null;

      default:
        return null;
    }
  };

  const handleSelection = (e: any) => {
    const activeObject = e.selected?.[0] as any;
    if (activeObject && activeObject.layerId) {
      dispatch(selectLayer(activeObject.layerId));
    }
  };

  const handleSelectionCleared = () => {
    dispatch(selectLayer(null));
  };

  const handleObjectModified = (e: any) => {
    updateLayerFromFabricObject(e.target as FabricObject);
  };

  const handleObjectMoving = (_e: any) => {
    // Optional: Real-time update during drag
  };

  const handleObjectScaling = (_e: any) => {
    // Optional: Real-time update during scale
  };

  const handleObjectRotating = (_e: any) => {
    // Optional: Real-time update during rotate
  };

  const updateLayerFromFabricObject = (obj: FabricObject | undefined) => {
    if (!obj) return;
    
    const layerId = (obj as any).layerId;
    if (!layerId) return;

    const layer = layersRef.current.find((l) => l.id === layerId);
    if (!layer) return;

    const updatedLayer: Layer = {
      ...layer,
      position: {
        x: obj.left || 0,
        y: obj.top || 0,
      },
      dimensions: {
        width: (obj.width || 0) * (obj.scaleX || 1),
        height: (obj.height || 0) * (obj.scaleY || 1),
      },
      rotation: obj.angle || 0,
    };

    // Update text properties from fabric object
    if (layer.type === 'text' && obj.type === 'i-text') {
      const textObj = obj as IText;
      // For text, scale the fontSize based on scaleY (vertical scale)
      const scaledFontSize = (textObj.fontSize || layer.text!.fontSize) * (textObj.scaleY || 1);
      
      updatedLayer.text = {
        ...layer.text!,
        content: textObj.text || '',
        fontSize: Math.round(scaledFontSize), // Scale fontSize and round to nearest integer
        fontFamily: textObj.fontFamily || layer.text!.fontFamily,
        color: (textObj.fill as string) || layer.text!.color,
      };
    }

    // Update shape properties from fabric object
    if (layer.type === 'shape' && layer.shape) {
      const shapeObj = obj as Rect | Circle;
      updatedLayer.shape = {
        ...layer.shape,
        fill: (shapeObj.fill as string) || layer.shape.fill,
        stroke: (shapeObj.stroke as string) || layer.shape.stroke,
        strokeWidth: shapeObj.strokeWidth || layer.shape.strokeWidth,
      };
    }

    // Update Redux - no flag needed because sync effect doesn't update transform properties anyway
    dispatch(updateLayer(updatedLayer));
    
    // Broadcast update to other users
    broadcastChange('update', layerId, updatedLayer);
  };

  // Public method to add objects (will be called from TopBar)
  const addText = () => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const layerId = uuidv4();

    const text = new IText('Text', {
      left: canvas.width! / 2 - 50,
      top: canvas.height! / 2 - 25,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
    });

    (text as any).layerId = layerId;
    canvas.add(text);
    canvas.setActiveObject(text);
    
    // Store in persistent map
    fabricObjectsMapRef.current.set(layerId, text);
    
    canvas.renderAll();

    // Add to Redux
    const layer: Layer = {
      id: layerId,
      type: 'text',
      name: 'Text',
      zIndex: layers.length,
      visible: true,
      locked: false,
      position: { x: text.left || 0, y: text.top || 0 },
      dimensions: { width: text.width || 100, height: text.height || 50 },
      rotation: 0,
      text: {
        content: 'Text',
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#000000',
      },
    };

    dispatch(addLayer(layer));
    broadcastChange('add', layerId, layer);
  };

  const addImage = (url: string) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const layerId = uuidv4();

    // For now, create a placeholder
    // In production, use fabric.Image.fromURL
    const rect = new Rect({
      left: canvas.width! / 2 - 100,
      top: canvas.height! / 2 - 100,
      width: 200,
      height: 200,
      fill: '#cccccc',
      stroke: '#666666',
      strokeWidth: 2,
    });

    (rect as any).layerId = layerId;
    canvas.add(rect);
    canvas.setActiveObject(rect);
    
    // Store in persistent map
    fabricObjectsMapRef.current.set(layerId, rect);
    
    canvas.renderAll();

    // Add to Redux
    const layer: Layer = {
      id: layerId,
      type: 'image',
      name: 'Image',
      zIndex: layers.length,
      visible: true,
      locked: false,
      position: { x: rect.left || 0, y: rect.top || 0 },
      dimensions: { width: 200, height: 200 },
      rotation: 0,
      image: {
        url: url,
        opacity: 1,
      },
    };

    dispatch(addLayer(layer));
    broadcastChange('add', layerId, layer);
  };

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const layerId = uuidv4();

    let shape: FabricObject;

    if (shapeType === 'rectangle') {
      shape = new Rect({
        left: canvas.width! / 2 - 75,
        top: canvas.height! / 2 - 75,
        width: 150,
        height: 150,
        fill: '#3b82f6',
        stroke: '#1e40af',
        strokeWidth: 2,
      });
    } else {
      shape = new Circle({
        left: canvas.width! / 2 - 75,
        top: canvas.height! / 2 - 75,
        radius: 75,
        fill: '#10b981',
        stroke: '#047857',
        strokeWidth: 2,
      });
    }

    (shape as any).layerId = layerId;
    canvas.add(shape);
    canvas.setActiveObject(shape);
    
    // Store in persistent map
    fabricObjectsMapRef.current.set(layerId, shape);
    
    canvas.renderAll();

    // Add to Redux
    const layer: Layer = {
      id: layerId,
      type: 'shape',
      name: shapeType === 'rectangle' ? 'Rectangle' : 'Circle',
      zIndex: layers.length,
      visible: true,
      locked: false,
      position: { x: shape.left || 0, y: shape.top || 0 },
      dimensions: {
        width: shapeType === 'rectangle' ? 150 : 150,
        height: shapeType === 'rectangle' ? 150 : 150,
      },
      rotation: 0,
      shape: {
        shapeType,
        fill: shapeType === 'rectangle' ? '#3b82f6' : '#10b981',
        stroke: shapeType === 'rectangle' ? '#1e40af' : '#047857',
        strokeWidth: 2,
      },
    };

    dispatch(addLayer(layer));
    broadcastChange('add', layerId, layer);
  };

  // Direct update method for Properties Panel
  const updateObjectProperties = (layerId: string, updates: Partial<Layer>) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const fabricObj = canvas.getObjects().find((obj: any) => obj.layerId === layerId);
    if (!fabricObj) return;

    // Set flag to prevent object:modified from updating Redux (would cause circular update)
    isUpdatingFromCanvasRef.current = true;

    // Update position/size/rotation if provided
    if (updates.position) {
      fabricObj.set({ left: updates.position.x, top: updates.position.y });
    }
    if (updates.dimensions) {
      fabricObj.set({ 
        width: updates.dimensions.width, 
        height: updates.dimensions.height,
        scaleX: 1,
        scaleY: 1,
      });
      if (fabricObj.type === 'circle') {
        (fabricObj as Circle).set({ radius: updates.dimensions.width / 2 });
      }
    }
    if (updates.rotation !== undefined) {
      fabricObj.set({ angle: updates.rotation });
    }

    // Update text properties if provided
    if (updates.text && fabricObj.type === 'i-text') {
      const textObj = fabricObj as IText;
      if (updates.text.content !== undefined) textObj.set({ text: updates.text.content });
      if (updates.text.fontSize !== undefined) textObj.set({ fontSize: updates.text.fontSize });
      if (updates.text.fontFamily !== undefined) textObj.set({ fontFamily: updates.text.fontFamily });
      if (updates.text.color !== undefined) textObj.set({ fill: updates.text.color });
    }

    // Update shape properties if provided
    if (updates.shape) {
      if (updates.shape.fill !== undefined) fabricObj.set({ fill: updates.shape.fill });
      if (updates.shape.stroke !== undefined) fabricObj.set({ stroke: updates.shape.stroke });
      if (updates.shape.strokeWidth !== undefined) fabricObj.set({ strokeWidth: updates.shape.strokeWidth });
    }

    fabricObj.setCoords();
    canvas.renderAll();
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromCanvasRef.current = false;
    }, 10);
  };

  // Get current state of an object from canvas (for Properties Panel)
  const getCurrentObjectState = (layerId: string): Partial<Layer> | null => {
    if (!fabricCanvasRef.current) return null;

    const canvas = fabricCanvasRef.current;
    const fabricObj = canvas.getObjects().find((obj: any) => obj.layerId === layerId);
    if (!fabricObj) return null;

    // Read current transform properties from canvas
    return {
      position: {
        x: fabricObj.left || 0,
        y: fabricObj.top || 0,
      },
      dimensions: {
        width: (fabricObj.width || 0) * (fabricObj.scaleX || 1),
        height: (fabricObj.height || 0) * (fabricObj.scaleY || 1),
      },
      rotation: fabricObj.angle || 0,
    };
  };

  // Export canvas to PNG
  const exportToPNG = (filename?: string) => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const designName = currentDesign?.name || 'design';
    const finalFilename = filename || `${designName}.png`;
    
    // Deselect all objects for clean export
    canvas.discardActiveObject();
    canvas.renderAll();
    
    // Convert canvas to data URL
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });
    
    // Create download link and trigger
    const link = document.createElement('a');
    link.download = finalFilename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apply remote layer update directly to canvas
  const applyRemoteLayerUpdate = (layer: Layer) => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const fabricObj = canvas.getObjects().find((obj: any) => obj.layerId === layer.id);
    
    if (!fabricObj) return;
    
    // Handle text separately (use fontSize instead of dimensions)
    if (layer.type === 'text' && layer.text && fabricObj.type === 'i-text') {
      const textObj = fabricObj as IText;
      textObj.set({
        left: layer.position.x,
        top: layer.position.y,
        text: layer.text.content,
        fontSize: layer.text.fontSize,
        fontFamily: layer.text.fontFamily,
        fill: layer.text.color,
        angle: layer.rotation,
        scaleX: 1,
        scaleY: 1,
        visible: layer.visible,
        selectable: !layer.locked,
        evented: !layer.locked,
      });
    } else {
      // For non-text objects, use dimensions
      fabricObj.set({
        left: layer.position.x,
        top: layer.position.y,
        angle: layer.rotation,
        scaleX: 1,
        scaleY: 1,
        visible: layer.visible,
        selectable: !layer.locked,
        evented: !layer.locked,
      });
      
      // Update dimensions
      if (layer.type === 'shape' && layer.shape?.shapeType === 'circle') {
        (fabricObj as Circle).set({ radius: layer.dimensions.width / 2 });
      } else {
        fabricObj.set({
          width: layer.dimensions.width,
          height: layer.dimensions.height,
        });
      }
      
      // Update shape properties
      if (layer.type === 'shape' && layer.shape) {
        fabricObj.set({
          fill: layer.shape.fill,
          stroke: layer.shape.stroke,
          strokeWidth: layer.shape.strokeWidth || 0,
        });
      }
    }
    
    fabricObj.setCoords();
    canvas.renderAll();
  };

  // Force update all canvas positions (for remote undo/redo)
  const forceUpdateAllPositions = (layersData: Layer[]) => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    
    // Update all object positions from layer data
    layersData.forEach(layer => {
      const fabricObj = canvas.getObjects().find((obj: any) => obj.layerId === layer.id);
      if (fabricObj) {
        // Handle text separately (no width/height, just fontSize)
        if (layer.type === 'text' && fabricObj.type === 'i-text') {
          (fabricObj as IText).set({
            left: layer.position.x,
            top: layer.position.y,
            text: layer.text?.content || '',
            fontSize: layer.text?.fontSize,
            fontFamily: layer.text?.fontFamily,
            fill: layer.text?.color,
            angle: layer.rotation,
            scaleX: 1,
            scaleY: 1,
          });
        } else {
          // For non-text objects, set dimensions
          fabricObj.set({
            left: layer.position.x,
            top: layer.position.y,
            width: layer.dimensions.width,
            height: layer.dimensions.height,
            angle: layer.rotation,
            scaleX: 1,
            scaleY: 1,
          });
          
          // Handle circle radius
          if (fabricObj.type === 'circle') {
            (fabricObj as Circle).set({ radius: layer.dimensions.width / 2 });
          }
          
          // Handle shape properties
          if (layer.type === 'shape' && layer.shape) {
            fabricObj.set({
              fill: layer.shape.fill,
              stroke: layer.shape.stroke,
              strokeWidth: layer.shape.strokeWidth,
            });
          }
        }
        
        fabricObj.setCoords();
      }
    });
    
    canvas.renderAll();
  };

  // Expose methods via ref (for parent components to call)
  useEffect(() => {
    if (isInitialized && fabricCanvasRef.current) {
      (window as any).canvasAPI = {
        addText,
        addImage,
        addShape,
        updateObjectProperties,
        getCurrentObjectState,
        exportToPNG,
        applyRemoteLayerUpdate,
        forceUpdateAllPositions,
      };
    }
  }, [isInitialized, layers]);

  return (
    <div className="fabric-canvas-container">
      <div className="fabric-canvas-wrapper">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

