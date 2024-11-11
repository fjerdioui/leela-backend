// import axios from 'axios';
// import Event from '../models/Event';

// export const fetchEventbriteEvents = async () => {
//     try {
//         const response = await axios.get(
//             `https://www.eventbriteapi.com/v3/events/search/`,
//             {
//                 params: {
//                     'location.address': 'London',
//                 },
//                 headers: {
//                     Authorization: `Bearer ${process.env.EVENTBRITE_API_KEY}`,
//                 },
//             }
//         );

//         const events = response.data.events;

//         for (const event of events) {
//             const newEvent = new Event({
//                 name: event.name.text,
//                 address: event.venue?.address?.localized_address_display || 'Unknown',
//                 musicStyle: 'Unknown',
//                 price: event.is_free ? 0 : event.price || 0, // Handle price
//                 location: {
//                     lat: event.venue?.latitude,
//                     lon: event.venue?.longitude,
//                 },
//                 description: event.description?.text || 'No description available',
//                 ticketLink: event.url,
//             });

//             await newEvent.save();
//         }

//         console.log(`${events.length} events saved to MongoDB from Eventbrite.`);
//     } catch (error) {
//         console.error('Error fetching events from Eventbrite:', error);
//     }
// };
