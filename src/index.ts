import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import eventRoutes from './routes/eventRoutes';
import profileRoutes from './routes/profileRoutes';

dotenv.config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 4000; // Set the default port to 4000 if not defined in .env

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable JSON parsing for incoming requests

// Connect to MongoDB
connectDB();

// Fetch events on server start (optional)
// fetchEventbriteEvents()  ; // Uncomment if you want to fetch from Eventbrite
// fetchTicketmasterEvents(); // Fetch events from Ticketmaster

// Routes

//-- Event routes
app.use('/api', eventRoutes); // Use the event routes

//-- profile routes
app.use('/api/profiles', profileRoutes);

// Test Route to verify server and DB connection
app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'Server is running and connected to MongoDB!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
