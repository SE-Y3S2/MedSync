const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');

const port = process.env.PORT || 3004;

const server = http.createServer(app);

// Setup Socket.io Signaling
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

io.on('connection', (socket) => {
  console.log(`[Telemedicine] Socket connected: ${socket.id}`);

  // When a user selects a consultation room to enter
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`[Telemedicine] Socket ${socket.id} joined room ${roomId}`);
    
    // Broadcast to the other person in the room that someone arrived
    socket.to(roomId).emit('user_joined', socket.id);
  });

  // Relay a WebRTC Session Description Offer (Video caller init)
  socket.on('webrtc_offer', (data) => {
    socket.to(data.roomId).emit('webrtc_offer', {
      sdp: data.sdp,
      sender: socket.id
    });
  });

  // Relay a WebRTC Session Description Answer (Video caller accept)
  socket.on('webrtc_answer', (data) => {
    socket.to(data.roomId).emit('webrtc_answer', {
      sdp: data.sdp,
      sender: socket.id
    });
  });

  // Relay Network traversal coordinates (ICE Candidates)
  socket.on('ice_candidate', (data) => {
    socket.to(data.roomId).emit('ice_candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Cleanup when a client unexpectedly drops
  socket.on('disconnect', () => {
    console.log(`[Telemedicine] Socket disconnected: ${socket.id}`);
    socket.broadcast.emit('user_disconnected', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Telemedicine & WebSocket Engine listening on port ${port}`);
});
