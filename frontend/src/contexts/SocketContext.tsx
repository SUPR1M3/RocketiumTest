import React, { createContext, useContext } from 'react';

interface SocketContextValue {
  socket: any;
  isConnected: boolean;
  userId: string;
  designId?: string;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return null; // Return null if not in a socket provider (graceful degradation)
  }
  return context;
};

export const SocketProvider: React.FC<{
  children: React.ReactNode;
  value: SocketContextValue;
}> = ({ children, value }) => {
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

