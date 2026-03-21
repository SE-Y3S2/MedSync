const app = require('./src/app');

const port = process.env.PORT || 3006;

app.listen(port, () => {
  console.log(`Notification Service listening on port ${port}`);
});