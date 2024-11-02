// models/EventsToReview.ts
import mongoose, { Schema, Document } from 'mongoose';

interface EventsToReview extends Document {
    name: string;
    description: string;
    url: string;
    classification: string;
    dateInfo: string;
    venue?: string; // Optional since this is for incomplete venue data
}

const EventsToReviewSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: 'No description available' },
    url: { type: String, required: true },
    classification: { type: Schema.Types.ObjectId, ref: 'Classification', required: true },
    dateInfo: { type: Schema.Types.ObjectId, ref: 'DateInfo', required: true },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue' }, // Optional for events with missing address details
});

export default mongoose.model<EventsToReview>('EventsToReview', EventsToReviewSchema);
