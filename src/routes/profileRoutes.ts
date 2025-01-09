import { Router } from 'express';
import { createProfile, getProfile, updateProfile, deleteProfile } from '../controllers/profileController';

const router = Router();

router.post('/', createProfile); // Create profile
router.get('/:id', getProfile);  // Get profile by ID
router.put('/:id', updateProfile); // Update profile
router.delete('/:id', deleteProfile); // Delete profile

export default router;
