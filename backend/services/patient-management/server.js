const mongoose = require('mongoose');
const app = require('./src/app');
const { connectProducer } = require('./src/utils/kafka');

const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/patient_db';

mongoose.connect(mongoUri)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

connectProducer();

app.listen(port, () => {
  console.log(`Patient Management Service listening on port ${port}`);
});