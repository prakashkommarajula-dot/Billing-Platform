const mongoose = require('mongoose');

// Cap mongoose buffer timeout to 1.5 seconds to prevent long hangs if cluster is unreachable
mongoose.set('bufferTimeoutMS', 1500);

let isConnected = false;

const connectDB = async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/invoice_billing_platform';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 4000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection Warning/Error: ${error.message}`);
    console.log('[MongoDB] Running in Resilient Offline Mode. Demo accounts and mock fallbacks are fully active.');
    return false;
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

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;
