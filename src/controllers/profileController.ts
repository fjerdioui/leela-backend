import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import UserProfile from '../models/UserProfile';

// Create a new profile
export const createProfile = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, location, bio } = req.body;
    const newProfile = new UserProfile({ name, email, location, bio });
    const savedProfile = await newProfile.save();
    res.status(201).json(savedProfile);
});

// Get profile by ID
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const profile = await UserProfile.findById(id);

    if (!profile) {
        res.status(404).json({ message: "Profile not found" });
        return;
    }

    res.status(200).json(profile);
});

// Update profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const updatedProfile = await UserProfile.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedProfile) {
        res.status(404).json({ message: "Profile not found" });
        return;
    }

    res.status(200).json(updatedProfile);
});

// Delete profile
export const deleteProfile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const deletedProfile = await UserProfile.findByIdAndDelete(id);
    if (!deletedProfile) {
        res.status(404).json({ message: "Profile not found" });
        return;
    }

    res.status(200).json({ message: "Profile deleted successfully" });
});
    