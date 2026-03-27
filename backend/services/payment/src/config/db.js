const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGO_URI || 'mongodb://localhost:27019/payment_db'
        );
        console.log(`[Payment] MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[Payment] DB Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
