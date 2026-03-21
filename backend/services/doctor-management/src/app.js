const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Doctor Management Service is running');
});

module.exports = app;