import mongoose, { Schema, Document } from 'mongoose';

interface Sales extends Document {
    startDateTime: string;
    endDateTime: string;
}

const SalesSchema: Schema = new Schema({
    startDateTime: { type: String },
    endDateTime: { type: String },
});

export default mongoose.model<Sales>('Sales', SalesSchema);
