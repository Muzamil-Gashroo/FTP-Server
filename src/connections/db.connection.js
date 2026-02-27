
const mongoose = require('mongoose');

let cached = global.mongoose || { conn: null, promise: null };

const connectDB = async () => {
    
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

global.mongoose = cached;

    module.exports = connectDB;
