const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = require('./src/app');
const { connectProducer } = require('./src/utils/kafka');

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  await connectProducer();

  app.listen(PORT, () => {
    console.log(`Appointment Service listening on port ${PORT}`);
  });
};

startServer();
