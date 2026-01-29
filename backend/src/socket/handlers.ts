import { Server as SocketIOServer, Socket } from 'socket.io';

interface JoinDesignData {
  designId: string;
  userId: string;
  userName?: string;
}

interface DesignUpdateData {
  designId: string;
  userId: string;
  action: 'add' | 'update' | 'delete' | 'reorder' | 'undo-redo';
  layerId?: string;
  layer?: any;
  layers?: any[];
}

interface CursorPositionData {
  designId: string;
  userId: string;
  userName?: string;
  x: number;
  y: number;
}

// Track active users in each design room
const activeUsers = new Map<string, Set<string>>();

export const setupSocketHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // Join a design room
    socket.on('join-design', (data: JoinDesignData) => {
      const { designId, userId, userName } = data;
      
      console.log(`👤 User ${userName || userId} joining design ${designId}`);
      
      // Join the socket room for this design
      socket.join(`design:${designId}`);
      
      // Track active user
      if (!activeUsers.has(designId)) {
        activeUsers.set(designId, new Set());
      }
      activeUsers.get(designId)!.add(userId);
      
      // Store user info on socket for later use
      (socket as any).userId = userId;
      (socket as any).userName = userName;
      (socket as any).currentDesignId = designId;
      
      // Notify others that a new user joined
      socket.to(`design:${designId}`).emit('user-joined', {
        userId,
        userName,
        timestamp: new Date().toISOString(),
      });

      // Send active users to all other users in the room
      socket.to(`design:${designId}`).emit('active-users', { designId, users: Array.from(activeUsers.get(designId) || []) });
      
      // Send current active users to the joining user
      const users = Array.from(activeUsers.get(designId) || []);
      socket.emit('active-users', { designId, users });
    });

    // Leave a design room
    socket.on('leave-design', (data: { designId: string; userId: string }) => {
      const { designId, userId } = data;
      
      console.log(`👋 User ${userId} leaving design ${designId}`);
      
      socket.leave(`design:${designId}`);
      
      // Remove from active users
      if (activeUsers.has(designId)) {
        activeUsers.get(designId)!.delete(userId);
        if (activeUsers.get(designId)!.size === 0) {
          activeUsers.delete(designId);
        }
      }
      socket.to(`design:${designId}`).emit('active-users', { designId, users: Array.from(activeUsers.get(designId) || []) });
      
      // Notify others that user left
      socket.to(`design:${designId}`).emit('user-left', {
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Broadcast design updates
    socket.on('design-update', (data: DesignUpdateData) => {
      const { designId, userId, action, layerId, layer, layers } = data;
      
      console.log(`🔄 Design update from ${userId} in ${designId}: ${action}`);
      
      // Broadcast to all other users in the room (except sender)
      socket.to(`design:${designId}`).emit('design-update', {
        userId,
        action,
        layerId,
        layer,
        layers,
        timestamp: new Date().toISOString(),
      });
    });

    // Cursor position updates (optional, for showing other users' cursors)
    socket.on('cursor-position', (data: CursorPositionData) => {
      const { designId, userId, userName, x, y } = data;
      
      // Broadcast cursor position to others (throttled on client side)
      socket.to(`design:${designId}`).emit('cursor-position', {
        userId,
        userName,
        x,
        y,
      });
    });

    // Comment added (real-time comments)
    socket.on('comment-added', (data: { designId: string; comment: any }) => {
      const { designId, comment } = data;
      
      console.log(`💬 New comment in design ${designId}`);
      
      // Broadcast new comment to all other users in the room
      socket.to(`design:${designId}`).emit('new-comment', {
        designId,
        comment,
      });
    });

    // Request current state (when a user joins and wants latest unsaved state)
    socket.on('request-current-state', (data: { designId: string; userId: string }) => {
      const { designId, userId } = data;
      
      console.log(`📋 User ${userId} requesting current state for design ${designId}`);
      
      // Broadcast request to all OTHER users in the room
      socket.to(`design:${designId}`).emit('state-request', {
        requestingUserId: userId,
      });
    });

    // Send current state (response to state request)
    socket.on('send-current-state', (data: { designId: string; userId: string; requestingUserId: string; layers: any[] }) => {
      const { designId, requestingUserId, layers } = data;
      
      console.log(`📤 Sending current state to user ${requestingUserId} for design ${designId}`);
      
      // Send directly to the requesting user
      io.to(`design:${designId}`).emit('receive-current-state', {
        requestingUserId,
        layers,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = (socket as any).userId;
      const designId = (socket as any).currentDesignId;
      
      console.log(`❌ Socket disconnected: ${socket.id}`);
      
      if (designId && userId) {
        // Remove from active users
        if (activeUsers.has(designId)) {
          activeUsers.get(designId)!.delete(userId);
          if (activeUsers.get(designId)!.size === 0) {
            activeUsers.delete(designId);
          }
        }
        socket.to(`design:${designId}`).emit('active-users', { designId, users: Array.from(activeUsers.get(designId) || []) });
        
        // Notify others
        socket.to(`design:${designId}`).emit('user-left', {
          userId,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });
};

