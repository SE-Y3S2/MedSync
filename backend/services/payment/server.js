require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3005;

app.listen(port, () => {
  console.log(`Payment Service listening on port ${port}`);
});
