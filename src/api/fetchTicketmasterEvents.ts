import axios from 'axios';
import EventDetails from '../models/EventDetails';
import Classification from '../models/Classification';
import DateInfo from '../models/DateInfo';
import Sales from '../models/Sales';
import Image from '../models/Image';
import Venue from '../models/Venue';
import moment from 'moment';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface TicketmasterResponse {
    _embedded?: { events: any[] };
    page: { totalElements: number };
}

interface GeocodeResponse {
    lat: string;
    lon: string;
}

/**
 * Geocode address to obtain latitude and longitude if coordinates are missing.
 */
const geocodeAddress = async (
    address: string,
    postalCode?: string,
    city?: string,
    country?: string
): Promise<{ latitude: number; longitude: number } | null> => {
    try {
        const query = [address, postalCode, city, country].filter(Boolean).join(", ");
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 1,
            },
            headers: {
                'User-Agent': 'MyAppName/1.0 (your-email@example.com)',
            }
        });

        // Cast response.data to expected type
        const data = response.data as GeocodeResponse[]; // Adjust if GeocodeResponse is an array

        if (data[0]) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
            };
        }
    } catch (error: unknown) {
        // Cast error as Error for safe access
        console.error(`Geocoding failed for address "${address}":`, (error as Error).message);
    }
    return null;
};


/**
 * Get the total count of events in a specific city and type for a given date range.
 */
export const getEventCountForZone = async (
    countryCode: string,
    city: string,
    eventType: string,
    startDate: string,
    endDate: string
): Promise<number> => {
    try {
        const response = await axios.get<TicketmasterResponse>(`https://app.ticketmaster.com/discovery/v2/events.json`, {
            params: {
                apikey: process.env.TICKETMASTER_API_KEY,
                countryCode,
                city,
                classificationName: eventType,
                size: 1,
                startDateTime: moment(startDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z',
                endDateTime: moment(endDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z',
            }
        });

        const data = response.data as TicketmasterResponse;
        return data.page.totalElements;
    } catch (error) {
        console.error("Error fetching event count:", (error as any).message);
        return 0;
    }
};

/**
 * Fetch events from Ticketmaster for the specified date range and parameters,
 * and store them in the database using references to normalized data models.
 */
export const fetchAllTicketmasterEvents = async (
    countryCode: string,
    city: string,
    eventType: string,
    startDate: string,
    endDate: string
) => {
    const pageSize = 200;
    const maxRetries = 3;
    const eventCount = await getEventCountForZone(countryCode, city, eventType, startDate, endDate);
    const totalPages = Math.ceil(eventCount / pageSize);

    if (totalPages > 4) {
        console.log("Event count too high; please refine with more filters.");
        return;
    }

    const fetchPage = async (pageNumber: number) => {
        let retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                const response = await axios.get<TicketmasterResponse>(`https://app.ticketmaster.com/discovery/v2/events.json`, {
                    params: {
                        apikey: process.env.TICKETMASTER_API_KEY,
                        countryCode,
                        city,
                        classificationName: eventType,
                        size: pageSize,
                        page: pageNumber - 1,
                        sort: 'date,asc',
                        startDateTime: moment(startDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z',
                        endDateTime: moment(endDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z',
                    }
                });

                const events = response.data._embedded?.events || [];
                console.log(`Page ${pageNumber}: Found ${events.length} events.`);
                return events;
            } catch (error: unknown) {
                retryCount++;
                console.error(`Error fetching page ${pageNumber}, attempt ${retryCount}:`, (error as any).message);
                if (retryCount < maxRetries) await wait(2000);
            }
        }
        return [];
    };

    const pages = await Promise.all(Array.from({ length: totalPages }, (_, i) => fetchPage(i + 1)));
    const allEvents = pages.flat();

    const eventDetailsData = await Promise.all(allEvents.map(async (event: any) => {
        const venue = event._embedded?.venues?.[0];

        if (!venue || !venue.address?.line1) {
            console.warn(`Skipping event "${event.name}" due to missing address.`);
            return null;
        }

        let latitude = parseFloat(venue.location?.latitude);
        let longitude = parseFloat(venue.location?.longitude);

        // Geocode if coordinates are missing
        if (isNaN(latitude) || isNaN(longitude)) {
            console.warn(`Event "${event.name}" has an address but missing coordinates. Attempting geocoding.`);
            const geocodedLocation = await geocodeAddress(
                venue.address.line1,
                venue.postalCode,
                venue.city,
                venue.country
            );
            if (geocodedLocation) {
                latitude = geocodedLocation.latitude;
                longitude = geocodedLocation.longitude;
                console.log(`Geocoded address for event "${event.name}":`, geocodedLocation);
            } else {
                console.warn(`Geocoding failed for event "${event.name}".`);
            }
        }

        latitude = isNaN(latitude) ? 0 : latitude;
        longitude = isNaN(longitude) ? 0 : longitude;

        const classificationRefs = await Promise.all((event.classifications || []).map(async (classItem: any) => {
            const existing = await Classification.findOne({
                segment: classItem.segment?.name,
                genre: classItem.genre?.name,
                subGenre: classItem.subGenre?.name
            });
            return existing ?? Classification.create({
                segment: classItem.segment?.name,
                genre: classItem.genre?.name,
                subGenre: classItem.subGenre?.name,
                type: classItem.type?.name,
                subType: classItem.subType?.name,
            });
        }));

        const imageRefs = await Promise.all((event.images || []).map(async (image: any) => {
            return Image.create({
                ratio: image.ratio,
                url: image.url,
                width: image.width,
                height: image.height,
                fallback: image.fallback,
            });
        }));

        const salesRef = await Sales.create({
            startDateTime: event.sales?.public?.startDateTime,
            endDateTime: event.sales?.public?.endDateTime,
        });

        const dateRef = await DateInfo.create({
            start: event.dates?.start,
            end: event.dates?.end,
            timezone: event.dates?.timezone,
            status: event.dates?.status?.code,
        });

        const venueRef = await Venue.findOneAndUpdate(
            { name: venue.name, location: { longitude, latitude } },
            {
                name: venue.name,
                url: venue.url,
                postalCode: venue.postalCode,
                timezone: venue.timezone,
                city: venue.city?.name,
                country: venue.country?.countryCode,
                address: venue.address?.line1,
                location: { longitude, latitude }
            },
            { upsert: true, new: true }
        );

        return {
            name: event.name,
            type: event.type,
            description: event.description || 'No description available',
            url: event.url,
            locale: event.locale,
            sales: salesRef._id,
            dates: dateRef._id,
            classifications: classificationRefs.map((ref: any) => ref._id),
            images: imageRefs.map((ref: any) => ref._id),
            venue: venueRef._id,
            location: { latitude, longitude }, // Assign location directly to EventDetails
            attractions: [],
        };
    }));

    const validEventData = eventDetailsData.filter(eventData => eventData !== null);
    await EventDetails.insertMany(validEventData);
    console.log(`Successfully saved ${validEventData.length} events.`);
};
