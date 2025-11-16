import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

interface UseSocketOptions {
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', (_reason) => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      setError(err.message);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect]);

  // Join a design room
  const joinDesign = (designId: string, userId: string, userName?: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join-design', { designId, userId, userName });
  };

  // Leave a design room
  const leaveDesign = (designId: string, userId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave-design', { designId, userId });
  };

  // Broadcast a design update
  const broadcastDesignUpdate = (data: {
    designId: string;
    userId: string;
    action: 'add' | 'update' | 'delete' | 'reorder' | 'undo-redo';
    layerId?: string;
    layer?: any;
    layers?: any[];
  }) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('design-update', data);
  };

  // Broadcast cursor position
  const broadcastCursorPosition = (data: {
    designId: string;
    userId: string;
    userName?: string;
    x: number;
    y: number;
  }) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('cursor-position', data);
  };

  // Listen for events
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    
    socketRef.current.on(event, callback);
  };

  // Remove event listener
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      socketRef.current.off(event);
    }
  };

  // Generic emit for custom events
  const emit = (event: string, ...args: any[]) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit(event, ...args);
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    joinDesign,
    leaveDesign,
    broadcastDesignUpdate,
    broadcastCursorPosition,
    on,
    off,
    emit,
  };
};

