// Helper to wire socket.io and the email queue to an existing Express app/server.
// Put this in lib/socketQueueSetup.js and call from your server entrypoint to keep server.js tidy.
//
// Usage in server.js (example):
//   const { setupSocketAndQueue } = require('./lib/socketQueueSetup');
//   const { io, emailQueue } = setupSocketAndQueue(server, app);
//   // app now has app.set('io', io) and app.set('emailQueue', emailQueue)
const { Server } = require('socket.io');
const Queue = require('bull');

function setupSocketAndQueue(server, app) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? 'http://3.109.154.71:3000' : 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(String(userId));
        console.log(`Socket ${socket.id} joined room ${userId}`);
      }
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected', socket.id);
    });
  });

  app.set('io', io);

  let emailQueue = null;
  if (process.env.REDIS_URL) {
    try {
      emailQueue = new Queue('emailQueue', process.env.REDIS_URL);
      console.log('Email queue created (Bull) with REDIS_URL');
    } catch (err) {
      console.warn('Failed to initialize Bull email queue, continuing without background queue:', err);
    }
  } else {
    console.log('REDIS_URL not set, emailQueue not created. Background email jobs disabled.');
  }
  app.set('emailQueue', emailQueue);

  return { io, emailQueue };
}

module.exports = { setupSocketAndQueue };
