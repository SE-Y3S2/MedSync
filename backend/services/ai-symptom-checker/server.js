const app = require('./src/app');

const port = process.env.PORT || 3007;

app.listen(port, () => {
  console.log(`AI Symptom Checker Service listening on port ${port}`);
});
