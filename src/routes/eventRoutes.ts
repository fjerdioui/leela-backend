// src/routes/eventRoutes.ts
import { Router, Request, Response } from 'express';
import { getEvents, createEvent, uploadEvents, getEventById, fetchEvents, clearDB } from '../controllers/eventController';
import EventDetails from '../models/EventDetails';

const router = Router();

// Route to get events within specified geographic bounds
router.get('/events', async (req: Request, res: Response): Promise<void> => {
    const { minLat, maxLat, minLng, maxLng } = req.query;

    // Log incoming bounds to verify they match expected values
    console.log("Incoming bounds:", { minLat, maxLat, minLng, maxLng });

    if (!minLat || !maxLat || !minLng || !maxLng) {
        res.status(400).json({ message: "Missing required query parameters for bounding box." });
        return;
    }

    try {
        const parsedMinLat = parseFloat(minLat as string);
        const parsedMaxLat = parseFloat(maxLat as string);
        const parsedMinLng = parseFloat(minLng as string);
        const parsedMaxLng = parseFloat(maxLng as string);

        // Log parsed bounds for debugging
        console.log("Parsed bounds:", {
            minLat: parsedMinLat,
            maxLat: parsedMaxLat,
            minLng: parsedMinLng,
            maxLng: parsedMaxLng
        });

        // Geospatial query to find events within the bounding box
        const events = await EventDetails.find({
            "location.latitude": { $gte: parsedMinLat, $lte: parsedMaxLat },
            "location.longitude": { $gte: parsedMinLng, $lte: parsedMaxLng }
        });

        // Log number of events found
        console.log(`Found ${events.length} events within bounds.`);
        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching events within bounds:", error instanceof Error ? error.message : error);
        res.status(500).json({ message: "Failed to fetch events.", error: error instanceof Error ? error.message : "Unknown error" });
    }
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
// src/routes/eventRoutes.ts
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
