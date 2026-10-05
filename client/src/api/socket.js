import { io } from 'socket.io-client';

// Aalisin ang "/api" sa dulo para makuha ang base URL ng server
const SOCKET_URL = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, { auth: { token } });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;