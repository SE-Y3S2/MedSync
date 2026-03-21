const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Notification Service is running');
});

module.exports = app;