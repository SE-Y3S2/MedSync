const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const app = require('./src/app');
const { connectProducer } = require('./src/utils/kafka');

const port = process.env.PORT || 3001;
const mongoOpts = {
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 20000,
  socketTimeoutMS: 45000,
  family: 4,
};
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medsync';

if (!process.env.MONGO_URI) {
  console.warn('[patient-management] MONGO_URI is not set; using local default.');
}

mongoose.connect(mongoUri, mongoOpts)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

connectProducer();

app.listen(port, () => {
  console.log(`Patient Management Service listening on port ${port}`);
});
