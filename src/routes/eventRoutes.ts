import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import {
    createEvent,
    uploadEvents,
    getEventById,
    fetchEvents,
    getEvents,
    handleBatchEventDetails,
    clearDB,
} from '../controllers/eventController';

const router = Router();

// Route to get events within specified geographic bounds
router.get('/events', asyncHandler(getEvents));

// Route to create a new event in the database
router.post('/events', asyncHandler(createEvent));

// Route to bulk upload events to the database
router.post('/uploadEvents', asyncHandler(uploadEvents));

// Route to get batch for preloading
router.get('/events/details', asyncHandler(handleBatchEventDetails));

// Route to get a specific event by its ID
router.get('/events/:id', asyncHandler(getEventById));

// Route to fetch events from Ticketmaster API
router.get(
    '/fetchTicketmasterEvents',
    asyncHandler(async (req, res, next) => {
        const { clear, countryCode, city, type } = req.query;

        if (!countryCode || !city || !type) {
            res.status(400).json({ message: "countryCode, city, and type are required parameters." });
            return;
        }

        if (clear === 'true') {
            await clearDB(req, res, next); // Pass next to clearDB
        }

        await fetchEvents(req, res, next); // Pass next to fetchEvents
        res.status(200).json({ message: 'Events fetched successfully' });
    })
);

export default router;
