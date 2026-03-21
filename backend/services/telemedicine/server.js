const app = require('./src/app');

const port = process.env.PORT || 3004;

app.listen(port, () => {
  console.log(`Telemedicine Service listening on port ${port}`);
});