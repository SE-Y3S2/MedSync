const app = require('./src/app');

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Doctor Management Service listening on port ${port}`);
});