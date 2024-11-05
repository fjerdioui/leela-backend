// src/models/PriceRange.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IPriceRange extends Document {
    type: string;
    currency: string;
    min: number;
    max: number;
}

const PriceRangeSchema: Schema = new Schema({
    type: { type: String, default: 'standard' },
    currency: { type: String, required: true, default: 'USD' },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model<IPriceRange>('PriceRange', PriceRangeSchema);
