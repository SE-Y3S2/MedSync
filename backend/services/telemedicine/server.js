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
    
    const clients = io.sockets.adapter.rooms.get(roomId);
    const numClients = clients ? clients.size : 0;
    console.log(`[Telemedicine] ${socket.id} joined ${roomId}. Members: ${numClients}`);
    
    // Broadcast presence so others know to start the 'Pulse'
    socket.to(roomId).emit('user_joined', { socketId: socket.id });
  });

  // Aggressive Pulse Relay
  socket.on('peer_ready', (data) => {
    socket.to(data.roomId).emit('peer_ready', { socketId: socket.id });
  });

  socket.on('webrtc_offer', (data) => {
    console.log(`[Telemedicine] Relay Offer from ${socket.id} in ${data.roomId}`);
    socket.to(data.roomId).emit('webrtc_offer', { sdp: data.sdp, sender: socket.id });
  });

  socket.on('webrtc_answer', (data) => {
    console.log(`[Telemedicine] Relay Answer from ${socket.id} in ${data.roomId}`);
    socket.to(data.roomId).emit('webrtc_answer', { sdp: data.sdp, sender: socket.id });
  });

  socket.on('ice_candidate', (data) => {
    socket.to(data.roomId).emit('ice_candidate', { candidate: data.candidate, sender: socket.id });
  });

  socket.on('disconnect', () => {
    console.log(`[Telemedicine] Disconnect: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`Telemedicine Stack Online: Port ${port}`);
});
