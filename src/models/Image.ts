import mongoose, { Schema, Document } from 'mongoose';

interface Image extends Document {
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
}

const ImageSchema: Schema = new Schema({
    ratio: { type: String },
    url: { type: String },
    width: { type: Number },
    height: { type: Number },
    fallback: { type: Boolean },
});

export default mongoose.model<Image>('Image', ImageSchema);
