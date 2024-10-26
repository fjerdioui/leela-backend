// src/models/EventDetails.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IEventDetails extends Document {
    eventId: string;
    fullDescription: string;
    images: string[];
    additionalVenues: string[];
    completeAddress: string;
    priceBreakdown: string;
    attractions: string[];
    categories: string[];
    additionalNotes: string;
    promoterInfo: string;
    ticketLink: string;
}

const EventDetailsSchema: Schema = new Schema({
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    fullDescription: { type: String, required: true },
    images: [{ type: String }],
    additionalVenues: [{ type: String }],
    completeAddress: { type: String },
    priceBreakdown: { type: String },
    attractions: [{ type: String }],
    categories: [{ type: String }],
    additionalNotes: { type: String },
    promoterInfo: { type: String },
    ticketLink: { type: String, required: true },
});

export default mongoose.model<IEventDetails>('EventDetails', EventDetailsSchema);
