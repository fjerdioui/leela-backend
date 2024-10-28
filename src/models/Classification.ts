import mongoose, { Schema, Document } from 'mongoose';

interface Classification extends Document {
    segment: string;
    genre: string;
    subGenre: string;
    type: string;
    subType: string;
}

const ClassificationSchema: Schema = new Schema({
    segment: { type: String },
    genre: { type: String },
    subGenre: { type: String },
    type: { type: String },
    subType: { type: String },
});

export default mongoose.model<Classification>('Classification', ClassificationSchema);
