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

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    
    // Get all other users in the room
    const clients = io.sockets.adapter.rooms.get(roomId);
    const numClients = clients ? clients.size : 0;
    
    console.log(`[Telemedicine] Socket ${socket.id} joined room ${roomId}. Total: ${numClients}`);
    
    // Send back current room state to the joiner
    socket.emit('room_ready', {
      isFirst: numClients === 1,
      others: Array.from(clients || []).filter(id => id !== socket.id)
    });

    // Broadcast to others that someone arrived
    socket.to(roomId).emit('user_joined', { socketId: socket.id });
  });

  // Relay a WebRTC Session Description Offer
  socket.on('webrtc_offer', (data) => {
    console.log(`[Telemedicine] Relay offer from ${socket.id} in room ${data.roomId}`);
    socket.to(data.roomId).emit('webrtc_offer', {
      sdp: data.sdp,
      sender: socket.id
    });
  });

  // Relay a WebRTC Session Description Answer
  socket.on('webrtc_answer', (data) => {
    console.log(`[Telemedicine] Relay answer from ${socket.id} in room ${data.roomId}`);
    socket.to(data.roomId).emit('webrtc_answer', {
      sdp: data.sdp,
      sender: socket.id
    });
  });

  // Relay ICE Candidates
  socket.on('ice_candidate', (data) => {
    socket.to(data.roomId).emit('ice_candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Cleanup
  socket.on('disconnect', () => {
    console.log(`[Telemedicine] Socket disconnected: ${socket.id}`);
    socket.broadcast.emit('user_disconnected', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Telemedicine & WebSocket Engine listening on port ${port}`);
});
