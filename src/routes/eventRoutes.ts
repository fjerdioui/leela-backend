import { Router, Request, Response } from 'express';
import {
    createEvent,
    uploadEvents,
    getEventById,
    fetchEvents,
    clearDB,
    getEvents, // Import getEvents controller
} from '../controllers/eventController';

const router = Router();

// Route to get events within specified geographic bounds
router.get('/events', async (req: Request, res: Response): Promise<void> => {
    // Call the getEvents controller
    await getEvents(req, res);
});

// Route to create a new event in the database
router.post('/events', async (req: Request, res: Response): Promise<void> => {
    await createEvent(req, res);
});

// Route to bulk upload events to the database
router.post('/uploadEvents', async (req: Request, res: Response): Promise<void> => {
    await uploadEvents(req, res);
});

// Route to get a specific event by its ID
router.get('/events/:id', async (req: Request, res: Response): Promise<void> => {
    await getEventById(req, res);
});

// Route to fetch events from Ticketmaster API with optional database clearing
router.get('/fetchTicketmasterEvents', async (req: Request, res: Response): Promise<void> => {
    const { clear, countryCode, city, type } = req.query;

    // Check for required parameters
    if (!countryCode || !city || !type) {
        res.status(400).json({ message: "countryCode, city, and type are required parameters." });
        return;
    }

    try {
        if (clear === 'true') {
            await clearDB();
        }

        await fetchEvents(req, res);  // Ensure this function receives the correct parameters

        if (!res.headersSent) {  // Ensure single response
            res.status(200).json({ message: 'Events fetched successfully' });
        }
    } catch (error) {
        console.error("Error fetching events from Ticketmaster:", error instanceof Error ? error.message : error);
        if (!res.headersSent) {  // Ensure single error response
            res.status(500).json({ message: 'Failed to fetch events from Ticketmaster', error: error instanceof Error ? error.message : "Unknown error" });
        }
    }
});

export default router;
