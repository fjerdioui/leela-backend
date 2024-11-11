import mongoose, { Schema, Document } from 'mongoose';

interface DateInfo extends Document {
    start: {
        localDate: string;
        localTime: string;
        dateTime: string;
        dateTBD?: boolean;
        dateTBA?: boolean;
        timeTBA?: boolean;
        noSpecificTime?: boolean;
    };
    end: {
        localTime: string;
        dateTime: string;
        approximate?: boolean;
        noSpecificTime?: boolean;
    };
    access?: {
        startDateTime: string;
        endDateTime: string;
    };
    timezone: string;
    status: string;
    spanMultipleDays?: boolean;
}

const DateInfoSchema: Schema = new Schema({
    start: {
        localDate: { type: String },
        localTime: { type: String },
        dateTime: { type: String },
        dateTBD: { type: Boolean, default: false },
        dateTBA: { type: Boolean, default: false },
        timeTBA: { type: Boolean, default: false },
        noSpecificTime: { type: Boolean, default: false }
    },
    end: {
        localTime: { type: String },
        dateTime: { type: String },
        approximate: { type: Boolean, default: false },
        noSpecificTime: { type: Boolean, default: false }
    },
    access: {
        startDateTime: { type: String },
        endDateTime: { type: String }
    },
    timezone: { type: String },
    status: { type: String },
    spanMultipleDays: { type: Boolean, default: false }
});

export default mongoose.model<DateInfo>('DateInfo', DateInfoSchema);
