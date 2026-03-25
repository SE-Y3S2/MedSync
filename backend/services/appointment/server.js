require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`Appointment Service running on port ${PORT}`);
});