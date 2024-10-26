import { Request, Response } from 'express';
import Event from '../models/Event';
import { fetchTicketmasterEvents } from '../api/fetchTicketmasterEvents';

// Example: Get all events
export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching events' });
    }
};

// Example: Create a new event
export const createEvent = async (req: Request, res: Response) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ error: 'Error creating event' });
    }
};

// Example: Upload multiple events
export const uploadEvents = async (req: Request, res: Response) => {
    try {
        const events = await Event.insertMany(req.body.events);
        res.status(201).json(events);
    } catch (error) {
        res.status(400).json({ error: 'Error uploading events' });
    }
};

// Example: Get a single event by ID
export const getEventById = async (req: Request, res: Response) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching event' });
    }
};

// Fetch events from Ticketmaster and save to database
export const fetchTicketmasterEventsHandler = async (req: Request, res: Response) => {
    try {
        await fetchTicketmasterEvents();
        res.status(200).json({ message: 'Events fetched and saved from Ticketmaster' });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching events from Ticketmaster' });
    }
};
