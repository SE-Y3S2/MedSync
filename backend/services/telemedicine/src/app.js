const express = require('express');
const { connectRedis } = require('./config/redis');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();

// Connect to Redis
connectRedis();

app.use(express.json());

app.use('/api/sessions', sessionRoutes);

app.get('/', (req, res) => {
  res.send('Telemedicine Service is running');
});

module.exports = app;