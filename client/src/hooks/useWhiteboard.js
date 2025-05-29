import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing interactive whiteboard functionality
 * 
 * @param {Object} socketHook - The socket hook instance for real-time updates
 * @param {Object} options - Whiteboard configuration options
 * @returns {Object} Whiteboard methods and state
 */
const useWhiteboard = (socketHook, options = {}) => {
  // Whiteboard state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState('pen'); // pen, eraser, etc.
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(3);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [remoteDrawing, setRemoteDrawing] = useState(null);

  // Canvas and context refs
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  
  // Store last point for smooth drawing
  const lastPositionRef = useRef({ x: 0, y: 0 });
  
  // Store throttle timer
  const throttleTimerRef = useRef(null);
  
  // Default options
  const defaultOptions = {
    throttleTime: 10,
    backgroundColor: '#ffffff',
    historyLimit: 20,
    ...options
  };

  // Initialize canvas context
  const initializeCanvas = useCallback((canvas) => {
    if (!canvas) return;
    
    canvasRef.current = canvas;
    
    // Set canvas size to match parent container
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    // Get and configure canvas context
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentStrokeWidth;
    
    // Store context reference
    contextRef.current = ctx;
    
    // Fill with background color
    ctx.fillStyle = defaultOptions.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save initial state to history
    saveCanvasState();
  }, [currentColor, currentStrokeWidth, defaultOptions.backgroundColor]);

  // Save current canvas state to history
  const saveCanvasState = useCallback(() => {
    if (!canvasRef.current || !contextRef.current) return;
    
    const canvas = canvasRef.current;
    const currentImage = canvas.toDataURL();
    
    // Limit history size
    const newHistory = [...canvasHistory.slice(0, historyIndex + 1), currentImage]
      .slice(-defaultOptions.historyLimit);
    
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [canvasHistory, historyIndex, defaultOptions.historyLimit]);

  // Apply canvas state from history
  const applyCanvasState = useCallback((imageData) => {
    if (!canvasRef.current || !contextRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    
    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
    };
    image.src = imageData;
  }, []);

  // Handle undo action
  const undo = useCallback(() => {
    if (historyIndex <= 0 || canvasHistory.length === 0) return;
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    applyCanvasState(canvasHistory[newIndex]);
    
    // Emit undo event if socket is connected
    if (socketHook?.socket && socketHook.isConnected) {
      socketHook.emit('whiteboard_undo', { historyIndex: newIndex });
    }
  }, [historyIndex, canvasHistory, applyCanvasState, socketHook]);

  // Handle redo action
  const redo = useCallback(() => {
    if (historyIndex >= canvasHistory.length - 1) return;
    
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    applyCanvasState(canvasHistory[newIndex]);
    
    // Emit redo event if socket is connected
    if (socketHook?.socket && socketHook.isConnected) {
      socketHook.emit('whiteboard_redo', { historyIndex: newIndex });
    }
  }, [historyIndex, canvasHistory, applyCanvasState, socketHook]);

  // Clear the whiteboard
  const clearWhiteboard = useCallback(() => {
    if (!canvasRef.current || !contextRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    
    ctx.fillStyle = defaultOptions.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    saveCanvasState();
    
    // Emit clear event if socket is connected
    if (socketHook?.socket && socketHook.isConnected) {
      socketHook.emit('whiteboard_clear');
    }
  }, [defaultOptions.backgroundColor, saveCanvasState, socketHook]);

  // Start drawing
  const startDrawing = useCallback((x, y) => {
    if (!contextRef.current) return;
    
    const ctx = contextRef.current;
    
    // Set stroke style based on drawing mode
    if (drawingMode === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    } else if (drawingMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
    }
    
    ctx.lineWidth = currentStrokeWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    lastPositionRef.current = { x, y };
    setIsDrawing(true);
    
    // Emit drawing start event if socket is connected
    if (socketHook?.socket && socketHook.isConnected) {
      socketHook.emit('whiteboard_draw_start', {
        x,
        y,
        color: currentColor,
        strokeWidth: currentStrokeWidth,
        mode: drawingMode
      });
    }
  }, [currentColor, currentStrokeWidth, drawingMode, socketHook]);

  // Continue drawing
  const draw = useCallback((x, y) => {
    if (!isDrawing || !contextRef.current) return;
    
    const ctx = contextRef.current;
    
    // Draw line to new point
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Begin a new path to continue smooth drawing
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Throttle emission of drawing events to reduce network traffic
    if (socketHook?.socket && socketHook.isConnected) {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      
      throttleTimerRef.current = setTimeout(() => {
        socketHook.emit('whiteboard_draw', {
          startX: lastPositionRef.current.x,
          startY: lastPositionRef.current.y,
          endX: x,
          endY: y,
          color: currentColor,
          strokeWidth: currentStrokeWidth,
          mode: drawingMode
        });
        
        lastPositionRef.current = { x, y };
      }, defaultOptions.throttleTime);
    }
  }, [isDrawing, currentColor, currentStrokeWidth, drawingMode, socketHook, defaultOptions.throttleTime]);

  // End drawing
  const endDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    
    setIsDrawing(false);
    saveCanvasState();
    
    // Emit drawing end event if socket is connected
    if (socketHook?.socket && socketHook.isConnected) {
      socketHook.emit('whiteboard_draw_end');
    }
  }, [isDrawing, saveCanvasState, socketHook]);

  // Handle remote drawing events
  const handleRemoteDrawing = useCallback((data) => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const ctx = contextRef.current;
    
    // Save current context settings
    const prevCompositeOperation = ctx.globalCompositeOperation;
    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;
    
    // Apply remote drawing settings
    if (data.mode === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = data.color;
    } else if (data.mode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
    }
    
    ctx.lineWidth = data.strokeWidth;
    
    // Draw the remote line
    ctx.beginPath();
    ctx.moveTo(data.startX, data.startY);
    ctx.lineTo(data.endX, data.endY);
    ctx.stroke();
    
    // Restore previous context settings
    ctx.globalCompositeOperation = prevCompositeOperation;
    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
    
    // Update remote drawing state for UI indicators (optional)
    setRemoteDrawing({
      userId: data.userId,
      timestamp: Date.now()
    });
  }, []);

  // Register socket event listeners
  useEffect(() => {
    if (!socketHook?.socket || !socketHook.isConnected) return;
    
    // Subscribe to whiteboard events
    const unsubscribeDraw = socketHook.subscribe('whiteboard_draw', handleRemoteDrawing);
    
    const unsubscribeClear = socketHook.subscribe('whiteboard_clear', () => {
      clearWhiteboard();
    });
    
    const unsubscribeState = socketHook.subscribe('whiteboard_state', (data) => {
      if (data.imageData) {
        applyCanvasState(data.imageData);
        setCanvasHistory([data.imageData]);
        setHistoryIndex(0);
      }
    });
    
    const unsubscribeUndo = socketHook.subscribe('whiteboard_undo', (data) => {
      if (data.historyIndex >= 0 && data.historyIndex < canvasHistory.length) {
        setHistoryIndex(data.historyIndex);
        applyCanvasState(canvasHistory[data.historyIndex]);
      }
    });
    
    const unsubscribeRedo = socketHook.subscribe('whiteboard_redo', (data) => {
      if (data.historyIndex >= 0 && data.historyIndex < canvasHistory.length) {
        setHistoryIndex(data.historyIndex);
        applyCanvasState(canvasHistory[data.historyIndex]);
      }
    });
    
    // Clean up subscriptions
    return () => {
      unsubscribeDraw();
      unsubscribeClear();
      unsubscribeState();
      unsubscribeUndo();
      unsubscribeRedo();
    };
  }, [
    socketHook, 
    handleRemoteDrawing, 
    clearWhiteboard, 
    applyCanvasState, 
    canvasHistory
  ]);

  // Handle window resize to make canvas responsive
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !contextRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      
      // Save current canvas content
      const currentImage = canvas.toDataURL();
      
      // Resize canvas to match parent container
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      
      // Restore context settings
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentStrokeWidth;
      
      // Restore canvas content
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = currentImage;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentColor, currentStrokeWidth]);

  // Export whiteboard as image
  const exportImage = useCallback((type = 'png') => {
    if (!canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const exportType = type === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    return canvas.toDataURL(exportType);
  }, []);

  // Import image to whiteboard
  const importImage = useCallback((imageData) => {
    if (!canvasRef.current || !contextRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    
    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      saveCanvasState();
      
      // Emit image import if socket is connected
      if (socketHook?.socket && socketHook.isConnected) {
        socketHook.emit('whiteboard_state', { imageData: canvas.toDataURL() });
      }
    };
    image.src = imageData;
  }, [saveCanvasState, socketHook]);

  // Request current whiteboard state from peers
  const requestWhiteboardState = useCallback(() => {
    if (!socketHook?.socket || !socketHook.isConnected) return;
    
    socketHook.emit('whiteboard_request_state');
  }, [socketHook]);

  // Share current whiteboard state with peers
  const shareWhiteboardState = useCallback(() => {
    if (!canvasRef.current || !socketHook?.socket || !socketHook.isConnected) return;
    
    const imageData = canvasRef.current.toDataURL();
    socketHook.emit('whiteboard_state', { imageData });
  }, [socketHook]);

  return {
    canvasRef,
    isDrawing,
    drawingMode,
    currentColor,
    currentStrokeWidth,
    remoteDrawing,
    canUndoRedo: {
      canUndo: historyIndex > 0,
      canRedo: historyIndex < canvasHistory.length - 1
    },
    // Methods
    initializeCanvas,
    setDrawingMode,
    setCurrentColor,
    setCurrentStrokeWidth,
    startDrawing,
    draw,
    endDrawing,
    undo,
    redo,
    clearWhiteboard,
    exportImage,
    importImage,
    requestWhiteboardState,
    shareWhiteboardState
  };
};

export default useWhiteboard;