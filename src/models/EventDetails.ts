// src/models/EventDetails.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IEventDetails extends Document {
    name: string;
    type: string;
    description: string;
    url: string;
    locale: string;
    sales: mongoose.Schema.Types.ObjectId; // Reference to Sales
    dates: mongoose.Schema.Types.ObjectId; // Reference to DateInfo
    classifications: mongoose.Schema.Types.ObjectId[]; // Array of Classification references
    images: mongoose.Schema.Types.ObjectId[]; // Array of Image references
    priceRanges: mongoose.Schema.Types.ObjectId[]; // Array of references to PriceRange
    venue: mongoose.Schema.Types.ObjectId; // Reference to Venue
    attractions: mongoose.Schema.Types.ObjectId[]; // Array of Attraction references
    location: { latitude: number; longitude: number }; // Location field
    source: string; // e.g., "ticketmaster"
    sourceId: string; // e.g., the ID from Ticketmaster or another source
}

const EventDetailsSchema: Schema = new Schema({
    name: { type: String, required: true },
    type: { type: String, default: 'event' },
    description: { type: String, default: 'No description available' },
    url: { type: String, default: '' },
    locale: { type: String, default: 'en-us' },
    sales: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales' },
    dates: { type: mongoose.Schema.Types.ObjectId, ref: 'DateInfo' },
    classifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classification' }],
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    priceRanges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PriceRange' }], // References to PriceRange
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    attractions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' }],
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    source: { type: String, required: true },
    sourceId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IEventDetails>('EventDetails', EventDetailsSchema);
