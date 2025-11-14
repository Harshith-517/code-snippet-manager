import express from 'express'
import { 
  getUserProfile,
  updateUserProfile,
  requestPasswordReset,
  resetPassword,
  removeProfileImage,
  changePassword
} from '../controllers/userController.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/users/profile - Get user profile
router.get('/profile', authenticate, getUserProfile)

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticate, updateUserProfile)

// POST /api/users/reset-password-request - Request password reset
router.post('/reset-password-request', requestPasswordReset)

// POST /api/users/reset-password - Reset password with token
router.post('/reset-password', resetPassword)

// DELETE /api/users/profile/image - Remove profile image
router.delete('/profile/image', authenticate, removeProfileImage)

// PUT /api/users/change-password - Change password (requires authentication)
router.put('/change-password', authenticate, changePassword)

export default router