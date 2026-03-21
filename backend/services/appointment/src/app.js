const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Appointment Service is running');
});

module.exports = app;