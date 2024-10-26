import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI as string; // Ensure MONGO_URI is defined
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables.');
        }

        // Connect to MongoDB without deprecated options
        const conn = await mongoose.connect(mongoUri); // No need for useNewUrlParser or useUnifiedTopology
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('An unknown error occurred');
        }
        process.exit(1); // Exit the application on failure
    }
};

export default connectDB;
