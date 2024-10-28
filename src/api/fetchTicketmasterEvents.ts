import axios from 'axios';
import Event from '../models/Event';
import EventDetails from '../models/EventDetails';
import Classification from '../models/Classification';
import DateInfo from '../models/DateInfo';
import Sales from '../models/Sales';
import Image from '../models/Image';
import Venue from '../models/Venue';
import moment from 'moment';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json`, {
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

        console.log(`Rate Limit Remaining: ${response.headers['rate-limit-available']}`);
        console.log(`Rate Limit Reset Time: ${response.headers['rate-limit-reset']} seconds`);

        const rateLimitAvailable = response.headers['rate-limit-available'];
        const rateLimitReset = parseInt(response.headers['rate-limit-reset'] || '0', 10) * 1000;
        if (rateLimitAvailable === '0') {
            console.log(`Rate limit reached. Waiting ${rateLimitReset / 1000} seconds.`);
            await wait(rateLimitReset);
        }

        console.log(`Event count for ${eventType} in ${city} between ${startDate} and ${endDate}:`, response.data.page.totalElements);
        return response.data.page.totalElements;
    } catch (error) {
        console.error("Error fetching event count:", error);
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

    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        let retryCount = 0;
        let success = false;

        while (!success && retryCount < maxRetries) {
            try {
                console.log(`Fetching page ${currentPage}/${totalPages} for ${eventType} events in ${city}.`);

                const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json`, {
                    params: {
                        apikey: process.env.TICKETMASTER_API_KEY,
                        countryCode,
                        city,
                        classificationName: eventType,
                        size: pageSize,
                        page: currentPage - 1,
                        sort: 'date,asc',
                        startDateTime: moment(startDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z',
                        endDateTime: moment(endDate).format('YYYY-MM-DDTHH:mm:ss') + 'Z',
                    }
                });

                console.log(`Rate Limit Remaining: ${response.headers['rate-limit-available']}`);
                console.log(`Rate Limit Reset Time: ${response.headers['rate-limit-reset']} seconds`);

                const events = response.data._embedded?.events;
                if (events) {
                    console.log(`Page ${currentPage}: Processing ${events.length} events...`);
                    for (const event of events) {
                        const venue = event._embedded?.venues?.[0];
                        const classifications = event.classifications || [];
                        const images = event.images || [];
                        const salesData = event.sales?.public || {};
                        const dateData = event.dates || {};

                        // Insert related data in separate collections and store references
                        const classificationRefs = await Promise.all(classifications.map(async (classItem: any) => {
                            return await Classification.create({
                                segment: classItem.segment?.name,
                                genre: classItem.genre?.name,
                                subGenre: classItem.subGenre?.name,
                                type: classItem.type?.name,
                                subType: classItem.subType?.name,
                            });
                        }));

                        const imageRefs = await Promise.all(images.map(async (image: any) => {
                            return await Image.create({
                                ratio: image.ratio,
                                url: image.url,
                                width: image.width,
                                height: image.height,
                                fallback: image.fallback,
                            });
                        }));

                        const salesRef = await Sales.create({
                            startDateTime: salesData.startDateTime,
                            endDateTime: salesData.endDateTime,
                        });

                        const dateRef = await DateInfo.create({
                            start: dateData.start,
                            end: dateData.end,
                            timezone: dateData.timezone,
                            status: dateData.status?.code,
                        });

                        // Venue reference (single document for each event)
                        const venueRef = await Venue.create({
                            name: venue.name,
                            url: venue.url,
                            postalCode: venue.postalCode,
                            timezone: venue.timezone,
                            city: venue.city?.name,
                            country: venue.country?.countryCode,
                            address: venue.address?.line1,
                            location: {
                                longitude: venue.location?.longitude,
                                latitude: venue.location?.latitude,
                            },
                        });

                        // Final EventDetails document with references to other collections
                        const eventDetailsData = {
                            name: event.name,
                            type: event.type,
                            description: event.description || 'No description available',
                            url: event.url,
                            locale: event.locale,
                            sales: salesRef._id,
                            dates: dateRef._id,
                            classifications: classificationRefs.map(ref => ref._id),
                            images: imageRefs.map(ref => ref._id),
                            venue: venueRef._id,
                            attractions: [], // Add attractions if available in a similar way
                        };

                        await EventDetails.create(eventDetailsData);
                    }
                    console.log(`Successfully processed ${events.length} events from page ${currentPage}.`);
                    success = true;
                } else {
                    console.log(`No events found on page ${currentPage}. Ending fetch.`);
                    return;
                }
            } catch (error: any) {
                retryCount++;
                console.error(`Error fetching page ${currentPage} for ${eventType} events in ${city} (Attempt ${retryCount}):`, error.message);

                if (retryCount < maxRetries) {
                    console.log(`Retrying page ${currentPage}...`);
                    await wait(2000);
                } else {
                    console.error(`Failed to fetch page ${currentPage} after ${maxRetries} attempts. Moving to next page.`);
                }
            }
        }
    }
};
