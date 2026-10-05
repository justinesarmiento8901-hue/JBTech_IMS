const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL },
  });

  // Middleware: kailangan ng valid na token para makakonekta
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Kailangan mag-login'));

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Hindi valid ang token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name}`);
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

// Para magamit sa ibang file (hal. controller)
const getIO = () => io;

module.exports = { init, getIO };