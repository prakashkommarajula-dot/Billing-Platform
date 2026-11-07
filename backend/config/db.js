const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/invoice_billing_platform', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection Warning/Error: ${error.message}`);
    console.log('[MongoDB] If you are running locally, ensure mongod service is started or update MONGODB_URI in backend/.env');
  }
};

module.exports = connectDB;
