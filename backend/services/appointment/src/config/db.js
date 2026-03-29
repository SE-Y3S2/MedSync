const mongoose = require('mongoose');

const mongoOpts = {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    family: 4,
};

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medsync';
        if (!process.env.MONGO_URI) {
            console.warn('[appointment] MONGO_URI is not set; using local default.');
        }
        const conn = await mongoose.connect(uri, mongoOpts);
        console.log(`[Appointment] MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[Appointment] DB Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
