const express = require('express');
const connectDB = require('./config/db');
const doctorRoutes = require('./routes/doctorRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

const app = express();

// Connect to Database
connectDB();

app.use(express.json());

app.use('/api/doctors', doctorRoutes);
app.use('/api/doctors/:id/availability', availabilityRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

app.get('/', (req, res) => {
  res.send('Doctor Management Service is running');
});

module.exports = app;