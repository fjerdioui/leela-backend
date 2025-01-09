import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Event from '../models/Event';
import EventDetails from '../models/EventDetails';
import moment from 'moment';
import mongoose from 'mongoose';
import { fetchAllTicketmasterEvents } from '../api/fetchTicketmasterEvents';
import Classification from '../models/Classification';
import DateInfo from '../models/DateInfo';
import Sales from '../models/Sales';
import Venue from '../models/Venue';
import Image from '../models/Image';

/**
 * Fetches events within specified geographic bounds.
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
    const { minLat, maxLat, minLng, maxLng, eventType, genre, startDate, endDate } = req.query;

    console.log("Backend: Incoming filters:", { minLat, maxLat, minLng, maxLng, eventType, genre, startDate, endDate });

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
            {
                $match: {
                    "location.latitude": { $gte: parsedMinLat, $lte: parsedMaxLat },
                    "location.longitude": { $gte: parsedMinLng, $lte: parsedMaxLng }
                }
            },
            {
                $lookup: {
                    from: "classifications",
                    localField: "classifications",
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
            {
                $addFields: {
                    classifications: { $ifNull: ["$classifications", []] },
                    dates: { $ifNull: ["$dates", []] },
                    sales: { $ifNull: ["$sales", []] },
                    venue: { $ifNull: ["$venue", []] }
                }
            },
            {
                $match: {
                    ...(eventType && { "classifications.segment": { $regex: new RegExp(eventType as string, "i") } }),
                    ...(genre && { "classifications.genre": { $regex: new RegExp(genre as string, "i") } }),
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
            },
            {
                $facet: {
                    events: [{ $match: {} }],
                    eventTypes: [
                        { $unwind: "$classifications" },
                        { $group: { _id: "$classifications.segment" } }
                    ],
                    genresByEventType: [
                        { $unwind: "$classifications" },
                        {
                            $group: {
                                _id: "$classifications.segment",
                                genres: { $addToSet: "$classifications.genre" }
                            }
                        }
                    ]
                }
            }
        ];

        const result = await EventDetails.aggregate(query);

        if (!result || result.length === 0) {
            res.status(404).json({ message: "No events found with specified filters." });
            return;
        }

        const { events, eventTypes, genresByEventType } = result[0];

        // Format genresByEventType into a map
        const genresMap = genresByEventType.reduce((acc: any, item: any) => {
            acc[item._id] = item.genres;
            return acc;
        }, {});

        res.status(200).json({
            events,
            eventTypes: eventTypes.map((type: { _id: string }) => type._id),
            genresByEventType: genresMap
        });
    } catch (error: any) {
        console.error("Error fetching events:", error.message);
        res.status(500).json({
            error: "Error fetching events",
            details: error.message
        });
    }
};


/**
 * Creates a new event and saves it to the database.
 */
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
});

/**
 * Bulk uploads events to the database.
 */
export const uploadEvents = asyncHandler(async (req: Request, res: Response) => {
    const events = await Event.insertMany(req.body.events);
    res.status(201).json(events);
});

/**
 * Fetches a specific event by its ID from the database.
 */
export const getEventById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid event ID format." });
        return;
    }

    const pipeline = buildEventAggregationPipeline({ _id: new mongoose.Types.ObjectId(id) });
    const event = await EventDetails.aggregate(pipeline);

    if (!event || event.length === 0) {
        res.status(404).json({ message: "Event not found." });
        return;
    }

    res.status(200).json(event[0]);
});

/**
 * Fetch detailed information for multiple events by their IDs.
 */
export const handleBatchEventDetails = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.query;

    if (!ids || typeof ids !== 'string') {
        res.status(400).json({ error: "Invalid or missing `ids` parameter." });
        return;
    }

    const eventIds = ids.split(',').map(id => id.trim());
    const invalidIds = eventIds.filter(id => !mongoose.Types.ObjectId.isValid(id));

    if (invalidIds.length > 0) {
        res.status(400).json({ message: `Invalid event ID format: ${invalidIds.join(', ')}` });
        return;
    }

    const pipeline = buildEventAggregationPipeline({ _id: { $in: eventIds.map(id => new mongoose.Types.ObjectId(id)) } });
    const events = await EventDetails.aggregate(pipeline);

    res.status(200).json(events);
});

/**
 * Fetches events from Ticketmaster API in 1-week increments for a total of 8 weeks
 * and inserts/updates them in the database.
 */
export const fetchEvents = asyncHandler(async (req: Request, res: Response) => {
    const { countryCode, city, type } = req.query;

    if (!countryCode || !city || !type) {
        res.status(400).json({ message: "countryCode, city, and type are required parameters." });
        return;
    }

    let startDate = moment().toISOString();
    let endDate = moment().add(1, 'weeks').toISOString();
    const totalWeeks = 8;

    for (let week = 0; week < totalWeeks; week++) {
        await fetchAllTicketmasterEvents({
            countryCode: countryCode as string,
            city: city as string,
            eventType: type as string,
            startDate,
            endDate,
        });

        startDate = moment(startDate).add(1, 'weeks').toISOString();
        endDate = moment(endDate).add(1, 'weeks').toISOString();
    }

    res.status(200).json({ message: "Ticketmaster events fetch completed for 8 weeks." });
});

/**
 * Clears the database.
 */
export const clearDB = asyncHandler(async (_req: Request, res: Response) => {
    await Promise.all([
        EventDetails.deleteMany({}),
        Classification.deleteMany({}),
        DateInfo.deleteMany({}),
        Sales.deleteMany({}),
        Image.deleteMany({}),
        Venue.deleteMany({}),
    ]);
    res.status(200).json({ message: "Database cleared successfully." });
});

/**
 * Builds an aggregation pipeline for querying events.
 */
export const buildEventAggregationPipeline = (filter: object = {}) => {
    return [
        { $match: filter },
        { $lookup: { from: 'images', localField: 'images', foreignField: '_id', as: 'images' } },
        { $lookup: { from: 'venues', localField: 'venue', foreignField: '_id', as: 'venue' } },
        { $lookup: { from: 'classifications', localField: 'classifications', foreignField: '_id', as: 'classifications' } },
        { $lookup: { from: 'dates', localField: 'dates', foreignField: '_id', as: 'dates' } },
        { $lookup: { from: 'sales', localField: 'sales', foreignField: '_id', as: 'sales' } },
        { $lookup: { from: 'attractions', localField: 'attractions', foreignField: '_id', as: 'attractions' } },
        { $lookup: { from: 'priceRanges', localField: 'priceRanges', foreignField: '_id', as: 'priceRanges' } },
        { $addFields: { priceRanges: { $ifNull: ["$priceRanges", []] } } },
    ];
};
