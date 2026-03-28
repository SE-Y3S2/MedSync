const app = require('./src/app');
const { connectProducer } = require('./src/utils/kafka');

const port = process.env.PORT || 3003;

<<<<<<< HEAD
const startServer = async () => {
  await connectProducer();
  
  app.listen(PORT, () => {
    console.log(`Appointment Service running on port ${PORT}`);
  });
};

startServer();
=======
app.listen(port, () => {
  console.log(`Appointment Service listening on port ${port}`);
});
>>>>>>> origin/main
