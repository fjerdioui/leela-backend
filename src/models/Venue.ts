import mongoose, { Schema, Document } from 'mongoose';

interface Venue extends Document {
    name: string;
    url: string;
    postalCode: string;
    timezone: string;
    city: string;
    country: string;
    address: {
        line1: string;
        line2?: string;
    };
    location: {
        latitude: number;
        longitude: number;
    };
    markets?: Array<{ name: string; id: string }>;
    dmas?: Array<{ id: number }>;
    parkingDetail?: string;
    accessibleSeatingDetail?: string;
    generalInfo?: {
        childRule?: string;
    };
    ada?: {
        adaPhones?: string;
        adaCustomCopy?: string;
        adaHours?: string;
    };
}

const VenueSchema: Schema = new Schema({
    name: { type: String, required: true },
    url: { type: String, default: '' },
    postalCode: { type: String },
    timezone: { type: String },
    city: { type: String },
    country: { type: String },
    address: {
        line1: { type: String },
        line2: { type: String, default: '' }
    },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    markets: [{ name: String, id: String }],
    dmas: [{ id: Number }],
    parkingDetail: { type: String },
    accessibleSeatingDetail: { type: String },
    generalInfo: {
        childRule: { type: String }
    },
    ada: {
        adaPhones: { type: String },
        adaCustomCopy: { type: String },
        adaHours: { type: String }
    }
});

export default mongoose.model<Venue>('Venue', VenueSchema);
