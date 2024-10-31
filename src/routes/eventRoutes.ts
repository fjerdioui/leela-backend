// src/routes/eventRoutes.ts
import { Router, Request, Response } from 'express';
import { getEvents, createEvent, uploadEvents, getEventById, fetchEvents } from '../controllers/eventController';
import EventModel from '../models/Event';
import EventDetails from '../models/EventDetails';

const router = Router();

// Route to get all events from the database
router.get('/events', async (req: Request, res: Response) => {
    await getEvents(req, res);
});

// Route to create a new event in the database
router.post('/events', async (req: Request, res: Response) => {
    await createEvent(req, res);
});

// Route to bulk upload events to the database
router.post('/uploadEvents', async (req: Request, res: Response) => {
    await uploadEvents(req, res);
});

// Route to get a specific event by its ID
router.get('/events/:id', async (req: Request, res: Response) => {
    await getEventById(req, res);
});

// Route to fetch events from Ticketmaster API with filtering
router.get('/fetchTicketmasterEvents', async (req: Request, res: Response) => {
    const { clear } = req.query;

    try {
        // Check if 'clear' is present and set to 'true', then clear the database
        if (clear === 'true') {
            await EventModel.deleteMany({});
            await EventDetails.deleteMany({});
            console.log('Database cleared successfully before fetching events.');
        }

        // Proceed to fetch events
        await fetchEvents(req, res);

        res.status(200).json({ message: 'Events fetched successfully' });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Failed to fetch events from Ticketmaster', error: errorMessage });
    }
});


export default router;
