// src/models/Attraction.ts
import mongoose, { Schema, Document } from 'mongoose';

interface Attraction extends Document {
    name: string;
    url: string;
    externalLinks: {
        [key: string]: { url: string }[];
    };
}

const AttractionSchema: Schema = new Schema({
    name: { type: String, required: true },
    url: { type: String, default: '' },
    externalLinks: { type: Map, of: [{ url: String }] } // e.g., links to Spotify, Apple Music
}, { timestamps: true });

export default mongoose.model<Attraction>('Attraction', AttractionSchema);
