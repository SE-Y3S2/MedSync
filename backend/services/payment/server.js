require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { connectProducer } = require('./src/utils/kafka');

const PORT = process.env.PORT || 3005;

const start = async () => {
  await connectDB();
  await connectProducer();
  app.listen(PORT, () => console.log(`[payment] listening on ${PORT}`));
};

start().catch((err) => {
  console.error('[payment] failed to start:', err);
  process.exit(1);
});
