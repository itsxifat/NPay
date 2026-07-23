import { Server } from 'socket.io';
import { config } from './config.js';

let io = null;

export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.webOrigin, credentials: true },
  });

  io.on('connection', (socket) => {
    // Checkout pages subscribe to a single payment reference.
    socket.on('watch:payment', (reference) => {
      if (typeof reference === 'string') socket.join(`payment:${reference}`);
    });
    // Dashboards subscribe to all of a user's payment updates.
    socket.on('watch:user', (userId) => {
      if (typeof userId === 'string') socket.join(`user:${userId}`);
    });
  });

  return io;
}

export const getIo = () => io;
