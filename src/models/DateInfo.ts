import mongoose, { Schema, Document } from 'mongoose';

interface DateInfo extends Document {
    start: {
        localDate: string;
        localTime: string;
        dateTime: string;
    };
    end: {
        localTime: string;
        dateTime: string;
    };
    timezone: string;
    status: string;
}

const DateInfoSchema: Schema = new Schema({
    start: {
        localDate: { type: String },
        localTime: { type: String },
        dateTime: { type: String },
    },
    end: {
        localTime: { type: String },
        dateTime: { type: String },
    },
    timezone: { type: String },
    status: { type: String },
});

export default mongoose.model<DateInfo>('DateInfo', DateInfoSchema);
