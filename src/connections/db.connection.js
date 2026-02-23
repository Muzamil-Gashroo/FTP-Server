
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI not set in environment");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("database connected");

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

module.exports = connectDB;