const { Kafka } = require('kafkajs');
const Patient = require('./models/Patient');

const kafka = new Kafka({
  clientId: 'patient-management-prescription-sync',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const consumer = kafka.consumer({ groupId: 'prescription-sync-group' });

const connectPrescriptionConsumer = async () => {
  try {
    await consumer.connect();
    console.log('[Patient Service] Kafka Prescription Consumer connected');

    await consumer.subscribe({ topic: 'doctor-events', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          
          if (payload.type === 'PRESCRIPTION_ISSUED') {
            console.log(`[Patient Service] Syncing prescription: ${payload.verificationId} for patient: ${payload.patientId}`);
            
            const { patientId, medications, instructions, doctorName, verificationId, timestamp } = payload;
            
            // 1. Update Patient's Prescriptions Array
            // 2. Add as a Document for permanence
            await Patient.findByIdAndUpdate(patientId, {
              $push: {
                prescriptions: {
                  date: timestamp || new Date(),
                  medication: medications.map(m => m.medication).join(', '),
                  dosage: medications.map(m => `${m.medication}: ${m.dosage}`).join(' | '),
                  frequency: medications.map(m => m.frequency).join(', '),
                  duration: medications.map(m => m.duration).join(', '),
                  instructions: instructions,
                  prescribedBy: `Dr. ${doctorName}`
                },
                documents: {
                  fileName: `Prescription_${verificationId}.pdf`,
                  fileUrl: `/prescription/${verificationId}`, // Virtual URL for viewing
                  uploadDate: new Date(),
                  type: 'Prescription'
                }
              }
            });
            
            console.log(`[Patient Service] Successfully synced prescription ${verificationId} to patient ${patientId}`);
          }
        } catch (err) {
          console.error('[Patient Service] Error processing Kafka message:', err);
        }
      },
    });
  } catch (error) {
    console.error('[Patient Service] Kafka Consumer connection error:', error);
  }
};

module.exports = { connectPrescriptionConsumer };
