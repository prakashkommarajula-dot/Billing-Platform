const mongoose = require('mongoose');

// Never buffer queries when connection is offline or negotiating. Fail fast to instant fallback.
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 2000);

let isConnected = false;

const connectDB = async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/invoice_billing_platform';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection Warning/Error: ${error.message}`);
    console.log('[MongoDB] Running in Resilient Mode. Demo accounts and mock fallbacks are active.');
  }
};

mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[MongoDB] State: CONNECTED');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] State: DISCONNECTED');
});

mongoose.connection.on('error', (err) => {
  console.warn(`[MongoDB] Connection Event Error: ${err.message}`);
});

module.exports = connectDB;
