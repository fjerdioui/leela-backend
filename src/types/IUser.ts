import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
  headline?: string; // "Full Stack Dev at XYZ"
  bio?: string;
  
  followers: Types.ObjectId[];
  following: Types.ObjectId[];

  // Model instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}
