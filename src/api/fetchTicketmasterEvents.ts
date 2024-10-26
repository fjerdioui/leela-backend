import axios from 'axios';
import Event from '../models/Event';

export const fetchAllTicketmasterEvents = async () => {
    let page = 0;
    let totalPages = 1; // Initially set to 1, will update after the first call
    const eventsPerPage = 200; // Max allowed per Ticketmaster's API

    try {
        while (page < totalPages) {
            const response = await axios.get(
                `https://app.ticketmaster.com/discovery/v2/events.json`,
                {
                    params: {
                        apikey: process.env.TICKETMASTER_API_KEY, // Your Ticketmaster API key
                        city: 'London',
                        countryCode: 'GB',
                        size: eventsPerPage,
                        page,
                        sort: 'date,asc',
                    },
                }
            );

            const events = response.data._embedded?.events;
            if (!events || events.length === 0) {
                console.log("No more events found.");
                break;
            }

            // Update the totalPages based on the API response
            totalPages = response.data.page.totalPages;

            // Process and insert each event into MongoDB
            const bulkOps = events.map((event) => {
                const venue = event._embedded?.venues?.[0];
                const genre = event.classifications?.[0]?.genre?.name || 'Unknown';
                const price = event.priceRanges?.[0]?.min || 'Unknown';
                const latitude = venue?.location?.latitude;
                const longitude = venue?.location?.longitude;

                // Construct eventData object
                const eventData = {
                    name: event.name,
                    address: venue?.address?.line1 || 'Unknown',
                    musicStyle: genre,
                    price: price,
                    location: {
                        lat: latitude,
                        lon: longitude,
                    },
                    description: event.info || 'No description available',
                    ticketLink: event.url,
                    date: {
                        start: event.dates.start.localDate || null,
                        end: event.dates.end ? event.dates.end.localDate : null,
                    },
                };

                // Return the upsert operation for MongoDB's bulkWrite
                return {
                    updateOne: {
                        filter: {
                            name: event.name,
                            'location.lat': latitude,
                            'location.lon': longitude,
                        },
                        update: { $set: eventData },
                        upsert: true,
                    },
                };
            });

            // Execute bulk operations
            if (bulkOps.length > 0) {
                await Event.bulkWrite(bulkOps);
                console.log(`Inserted/Updated ${bulkOps.length} events from page ${page + 1} of ${totalPages}`);
            }

            // Move to the next page
            page += 1;
        }

        console.log("All events have been fetched and inserted/updated.");
    } catch (error) {
        console.error("Error fetching events from Ticketmaster:", error);
    }
};
