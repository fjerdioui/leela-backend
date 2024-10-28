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
    priceRanges: {
        currency: string;
    }[];
    venue: mongoose.Schema.Types.ObjectId; // Reference to Venue
    attractions: mongoose.Schema.Types.ObjectId[]; // Array of Attraction references
}

const EventDetailsSchema: Schema = new Schema({
    name: { type: String, required: true },
    type: { type: String },
    description: { type: String },
    url: { type: String },
    locale: { type: String },
    sales: { type: mongoose.Schema.Types.ObjectId, ref: 'Sales' },
    dates: { type: mongoose.Schema.Types.ObjectId, ref: 'DateInfo' },
    classifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classification' }],
    images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    priceRanges: [
        {
            currency: { type: String },
        },
    ],
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    attractions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attraction' }],
});

export default mongoose.model<IEventDetails>('EventDetails', EventDetailsSchema);
