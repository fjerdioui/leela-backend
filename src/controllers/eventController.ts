// src/controllers/eventController.ts
import { Request, Response } from 'express';
import Event from '../models/Event';
import EventDetails from '../models/EventDetails';
import moment from 'moment';
import { fetchAllTicketmasterEvents } from '../api/fetchTicketmasterEvents';
import Classification from '../models/Classification';
import DateInfo from '../models/DateInfo';
import Sales from '../models/Sales';
import Venue from '../models/Venue';
import Image from '../models/Image';

/**
 * Fetches all events from the database.
 */
export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await EventDetails.find();
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Error fetching events' });
    }
};

/**
 * Creates a new event and saves it to the database.
 */
export const createEvent = async (req: Request, res: Response) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(400).json({ error: 'Error creating event' });
    }
};

/**
 * Bulk uploads events to the database.
 */
export const uploadEvents = async (req: Request, res: Response) => {
    try {
        const events = await Event.insertMany(req.body.events);
        res.status(201).json(events);
    } catch (error) {
        console.error('Error uploading events:', error);
        res.status(400).json({ error: 'Error uploading events' });
    }
};

/**
 * Fetches a specific event by its ID from the database.
 */
export const getEventById = async (req: Request, res: Response) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            console.log(`Event with ID ${req.params.id} not found`);
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        res.status(500).json({ error: 'Error fetching event' });
    }
};

/**
 * Fetches events from Ticketmaster API in 1-week increments for a total of 8 weeks
 * and inserts/updates them in the database.
 */
export const fetchEvents = async (req: Request, res: Response) => {
    const { countryCode, city, type } = req.query;

    // Validate required parameters
    if (!countryCode || !city || !type) {
        console.log('Missing required parameters');
        return res.status(400).json({ message: "countryCode, city, and type are required parameters." });
    }

    // Set initial start and end dates for a weekly range
    let startDate = moment().toISOString();
    let endDate = moment().add(1, 'weeks').toISOString();
    const totalWeeks = 8;

    try {
        for (let week = 0; week < totalWeeks; week++) {
            console.log(`Fetching events for week ${week + 1}: ${startDate} to ${endDate}`);

            // Fetch and store events for the current week range
            await fetchAllTicketmasterEvents(
                countryCode as string,
                city as string,
                type as string,
                startDate,
                endDate
            );

            // Move to the next week
            startDate = moment(startDate).add(1, 'weeks').toISOString();
            endDate = moment(endDate).add(1, 'weeks').toISOString();
        }

        console.log('Successfully completed fetching events for 8 weeks.');
        res.status(200).json({ message: 'Ticketmaster events fetch completed for 8 weeks.' });
    } catch (error) {
        console.error('Error fetching Ticketmaster events:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ message: 'Failed to fetch events from Ticketmaster', error: errorMessage });
    }
};

export const clearDB = async () => {
    await EventDetails.deleteMany({});
    await Classification.deleteMany({});
    await DateInfo.deleteMany({});
    await Sales.deleteMany({});
    await Image.deleteMany({});
    await Venue.deleteMany({});
    console.log('Database cleared successfully before fetching events.');
}
