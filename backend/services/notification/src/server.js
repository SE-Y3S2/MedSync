const express = require('express');
const app = express();
const port = process.env.PORT || 3006;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Notification Service is running');
});

app.listen(port, () => {
  console.log(`Notification Service listening on port ${port}`);
});