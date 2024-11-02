// src/models/Venue.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IVenue extends Document {
    name: string;
    url: string;
    postalCode: string;
    timezone: string;
    city: string;
    country: string;
    address: string;
    location: {
        longitude: number;
        latitude: number;
    };
    markets: {
        name: string;
        id: string;
    }[];
    ada: {
        adaPhones: string;
        adaCustomCopy: string;
        adaHours: string;
    };
}

const VenueSchema: Schema = new Schema({
    name: { type: String, required: true },
    url: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    timezone: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    address: { type: String, default: '' },
    location: {
        longitude: { type: Number, required: true },
        latitude: { type: Number, required: true },
    },
    markets: [
        {
            name: { type: String, default: '' },
            id: { type: String, default: '' },
        },
    ],
    ada: {
        adaPhones: { type: String, default: '' },
        adaCustomCopy: { type: String, default: '' },
        adaHours: { type: String, default: '' },
    },
}, { timestamps: true }); // optional timestamps for createdAt and updatedAt

export default mongoose.model<IVenue>('Venue', VenueSchema);
