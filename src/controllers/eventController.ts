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
import mongoose from 'mongoose';

/**
 * Fetches events within specified geographic bounds.
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
    const { minLat, maxLat, minLng, maxLng, musicType, genre, startDate, endDate } = req.query;

    console.log("Backend: Incoming filters:", { minLat, maxLat, minLng, maxLng, musicType, genre, startDate, endDate });

    if (!minLat || !maxLat || !minLng || !maxLng) {
        res.status(400).json({ message: "Bounding box parameters are required." });
        return;
    }

    try {
        const parsedMinLat = parseFloat(minLat as string);
        const parsedMaxLat = parseFloat(maxLat as string);
        const parsedMinLng = parseFloat(minLng as string);
        const parsedMaxLng = parseFloat(maxLng as string);

        if (isNaN(parsedMinLat) || isNaN(parsedMaxLat) || isNaN(parsedMinLng) || isNaN(parsedMaxLng)) {
            res.status(400).json({ message: "Invalid bounding box parameters." });
            return;
        }

        const query: any = [
            // Stage 1: $match - Apply bounding box filter
            {
                $match: {
                    "location.latitude": { $gte: parsedMinLat, $lte: parsedMaxLat },
                    "location.longitude": { $gte: parsedMinLng, $lte: parsedMaxLng },
                }
            },
            // Stage 2: $lookup - Join collections
            {
                $lookup: {
                    from: "classifications",
                    localField: "classifications", // Assuming classifications is an ObjectId or array of ObjectIds
                    foreignField: "_id",
                    as: "classifications"
                }
            },
            {
                $lookup: {
                    from: "venues",
                    localField: "venue",
                    foreignField: "_id",
                    as: "venue"
                }
            },
            {
                $lookup: {
                    from: "sales",
                    localField: "sales",
                    foreignField: "_id",
                    as: "sales"
                }
            },
            {
                $lookup: {
                    from: "dateinfos",
                    localField: "dates",
                    foreignField: "_id",
                    as: "dates"
                }
            },
            // Stage 3: $addFields - Ensure all arrays exist
            {
                $addFields: {
                    classifications: { $ifNull: ["$classifications", []] },
                    dates: { $ifNull: ["$dates", []] },
                    sales: { $ifNull: ["$sales", []] },
                    venue: { $ifNull: ["$venue", []] }
                }
            },
            // Stage 4: $match - Apply filters for classifications and dates
            {
                $match: {
                    ...(musicType && { "classifications.segment": musicType }),
                    ...(genre && { "classifications.genre": genre }),
                    ...(startDate || endDate
                        ? {
                              "dates.start.dateTime": {
                                  ...(startDate ? { $gte: new Date(startDate as string) } : {}),
                                  ...(endDate ? { $lte: new Date(endDate as string) } : {})
                              }
                          }
                        : {})
                }
            },
            // Stage 5: $project - Select required fields
            {
                $project: {
                    name: 1,
                    location: 1,
                    url: 1,
                    "venue.address": 1,
                    "sales.startDateTime": 1,
                    "sales.endDateTime": 1,
                    "dates.start.dateTime": 1,
                    "dates.end.dateTime": 1,
                    "classifications.segment": 1,
                    "classifications.genre": 1
                }
            }
        ];

        const events = await EventDetails.aggregate(query);

        if (events.length === 0) {
            console.log("No events found with specified filters.");
            res.status(404).json({ message: "No events found with specified filters." });
            return;
        }

        console.log(`Found ${events.length} events with specified filters.`);
        res.status(200).json(events);

    } catch (error: any) {
        console.error("Error fetching events:", error.message);
        res.status(500).json({
            error: "Error fetching events",
            details: error.message,
        });
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
        const eventId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID format' });
        }

        // Aggregation pipeline to match the event by ID and populate all related fields
        const event = await EventDetails.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(eventId) } },

            // Populate images
            {
                $lookup: {
                    from: 'images',
                    localField: 'images',
                    foreignField: '_id',
                    as: 'images'
                }
            },

            // Populate venue
            {
                $lookup: {
                    from: 'venues',
                    localField: 'venue',
                    foreignField: '_id',
                    as: 'venue'
                }
            },

            // Populate classifications
            {
                $lookup: {
                    from: 'classifications',
                    localField: 'classifications',
                    foreignField: '_id',
                    as: 'classifications'
                }
            },

            // Populate dates
            {
                $lookup: {
                    from: 'dates',
                    localField: 'dates',
                    foreignField: '_id',
                    as: 'dates'
                }
            },

            // Populate sales
            {
                $lookup: {
                    from: 'sales',
                    localField: 'sales',
                    foreignField: '_id',
                    as: 'sales'
                }
            },

            // Populate attractions
            {
                $lookup: {
                    from: 'attractions',
                    localField: 'attractions',
                    foreignField: '_id',
                    as: 'attractions'
                }
            },

            // Conditional lookup for priceRanges (only if it exists and is not empty)
            {
                $lookup: {
                    from: 'priceRanges',
                    localField: 'priceRanges',
                    foreignField: '_id',
                    as: 'priceRanges'
                }
            },

            // Remove empty priceRanges if it does not contain valid references
            {
                $addFields: {
                    priceRanges: {
                        $cond: {
                            if: { $or: [{ $eq: ["$priceRanges", []] }, { $eq: ["$priceRanges", null] }] },
                            then: [],
                            else: "$priceRanges"
                        }
                    }
                }
            }
        ]);

        if (!event || event.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(event[0]); // Return the first item in the array
    } catch (error) {
        console.error('Error fetching event by ID:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * Fetches events from Ticketmaster API in 1-week increments for a total of 8 weeks
 * and inserts/updates them in the database.
 */
export const fetchEvents = async (req: Request, res: Response) => {
    const { countryCode, city, type } = req.query;

    if (!countryCode || !city || !type) {
        console.log('Missing required parameters');
        return res.status(400).json({ message: "countryCode, city, and type are required parameters." });
    }

    let startDate = moment().toISOString();
    let endDate = moment().add(1, 'weeks').toISOString();
    const totalWeeks = 8;

    try {
        for (let week = 0; week < totalWeeks; week++) {
            console.log(`Fetching events for week ${week + 1}: ${startDate} to ${endDate}`);

            await fetchAllTicketmasterEvents({
                countryCode: countryCode as string,
                city: city as string,
                eventType: type as string,
                startDate,
                endDate
            });

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
