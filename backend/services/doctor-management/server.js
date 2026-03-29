const path = require('path');
// Local dev: repo-root .env. Docker: vars from compose / env_file (no valid path to monorepo .env in image).
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./src/app');

const mongoose = require('mongoose');

const port = process.env.PORT || 3002;

const mongoOpts = {
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 20000,
  socketTimeoutMS: 45000,
  family: 4,
};

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medsync';

if (!process.env.MONGO_URI) {
  console.warn('[doctor-management] MONGO_URI is not set; using local default (will fail inside Docker if Mongo is not on the host network).');
}

mongoose.connect(mongoUri, mongoOpts)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB', err));

app.listen(port, () => {
  console.log(`Doctor Management Service listening on port ${port}`);
});
