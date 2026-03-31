const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const app = require('./src/app');
const { connectProducer } = require('./src/utils/kafka');

const PORT = process.env.PORT || 3005;

const mongoOpts = {
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 20000,
  socketTimeoutMS: 45000,
  family: 4,
};
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medsync';

if (!process.env.MONGO_URI) {
  console.warn('[payment] MONGO_URI is not set; using local default.');
}

const startServer = async () => {
  try {
    const conn = await mongoose.connect(mongoUri, mongoOpts);
    console.log(`[Payment] MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[Payment] DB Error: ${err.message}`);
  }

  await connectProducer();

  app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
  });
};

startServer();
