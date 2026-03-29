const app = require('./src/app');

const mongoose = require('mongoose');

const port = process.env.PORT || 3002;

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/doctor_db';

mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

app.listen(port, () => {
  console.log(`Doctor Management Service listening on port ${port}`);
});
