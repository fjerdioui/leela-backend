import { Router, Request, Response } from 'express';
import { getEvents, createEvent, uploadEvents, getEventById, fetchTicketmasterEventsHandler } from '../controllers/eventController';

const router = Router();

// Route to get all events
router.get('/events', async (req: Request, res: Response) => {
    await getEvents(req, res);
});

// Route to create a new event
router.post('/events', async (req: Request, res: Response) => {
    await createEvent(req, res);
});

// Route to upload multiple events
router.post('/uploadEvents', async (req: Request, res: Response) => {
    await uploadEvents(req, res);
});

// Route to fetch a single event by ID
router.get('/events/:id', async (req: Request, res: Response) => {
    await getEventById(req, res);
});

// Route to fetch events from Ticketmaster
router.get('/fetchTicketmasterEvents', async (req: Request, res: Response) => {
    await fetchTicketmasterEventsHandler(req, res);
});

export default router;
