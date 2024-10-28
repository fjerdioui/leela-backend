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
    url: { type: String },
    postalCode: { type: String },
    timezone: { type: String },
    city: { type: String },
    country: { type: String },
    address: { type: String },
    location: {
        longitude: { type: Number },
        latitude: { type: Number },
    },
    markets: [
        {
            name: { type: String },
            id: { type: String },
        },
    ],
    ada: {
        adaPhones: { type: String },
        adaCustomCopy: { type: String },
        adaHours: { type: String },
    },
});

export default mongoose.model<IVenue>('Venue', VenueSchema);
