import mongoose, { Schema, Document } from 'mongoose';

interface Sales extends Document {
    startDateTime: string;
    endDateTime: string;
    startTBD?: boolean;
    startTBA?: boolean;
    endTBD?: boolean;
    endTBA?: boolean;
}

const SalesSchema: Schema = new Schema({
    startDateTime: { type: String },
    endDateTime: { type: String },
    startTBD: { type: Boolean, default: false },
    startTBA: { type: Boolean, default: false },
    endTBD: { type: Boolean, default: false },
    endTBA: { type: Boolean, default: false }
});

export default mongoose.model<Sales>('Sales', SalesSchema);
