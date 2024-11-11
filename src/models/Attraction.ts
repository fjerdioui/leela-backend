import mongoose, { Schema, Document } from 'mongoose';

interface Attraction extends Document {
    name: string;
    url: string;
    externalLinks: {
        [key: string]: { url: string }[];
    };
    aliases?: string[];
}

const AttractionSchema: Schema = new Schema({
    name: { type: String, required: true },
    url: { type: String, default: '' },
    externalLinks: { type: Map, of: [{ url: String }] },
    aliases: [{ type: String }]
}, { timestamps: true });

export default mongoose.model<Attraction>('Attraction', AttractionSchema);
