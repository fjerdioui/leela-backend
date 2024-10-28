// src/models/Event.ts
import mongoose, { Schema, Document } from 'mongoose';

// Event interface to define the structure of an event document
export interface IEvent extends Document {
    name: string;
    venueName: string;
    address: string;
    location: {
        lat: number;
        lon: number;
    };
    date: {
        start: Date;
        end: Date;
    };
    time: string;
    priceRange: {
        min: number;
        max: number;
    };
    musicStyle: string;
    thumbnailImage: string;
    shortDescription: string;
    ticketLink: string;
}

// Event schema to define the fields and structure of event data in MongoDB
const EventSchema: Schema = new Schema({
    name: { type: String, required: true },
    venueName: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    date: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
    },
    time: { type: String, required: true },
    priceRange: {
        min: { type: Number },
        max: { type: Number },
    },
    musicStyle: { type: String, required: true },
    thumbnailImage: { type: String },
    shortDescription: { type: String },
    ticketLink: { type: String, required: true },
});

export default mongoose.model<IEvent>('Event', EventSchema);
