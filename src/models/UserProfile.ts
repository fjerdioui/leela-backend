import mongoose, { Document, Schema } from 'mongoose';

export interface IUserProfile extends Document {
    name: string;
    email: string;
    location: {
        type: string;
        coordinates: [number, number];
    };
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserProfileSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        location: {
            type: { type: String, enum: ['Point'], required: true },
            coordinates: { type: [Number], required: true },
        },
        bio: { type: String },
    },
    { timestamps: true }
);

UserProfileSchema.index({ location: '2dsphere' }); // Geospatial index

export default mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);
