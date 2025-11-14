import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { sendPasswordResetEmail } from '../utils/emailService.js'

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -verificationToken -verificationTokenExpiry')
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    res.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update user profile (simplified - no file upload, only external URLs)
export const updateUserProfile = async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (req.body.firstName) user.firstName = req.body.firstName;
    if (req.body.lastName) user.lastName = req.body.lastName;
    
    // Update name field (for backward compatibility)
    if (req.body.firstName || req.body.lastName) {
      user.name = `${user.firstName} ${user.lastName}`.trim();
    }
    
    // If profileImage URL is provided directly (from Supabase)
    if (req.body.profileImage) {
      user.profileImage = req.body.profileImage;
    }
    
    // Save the user
    await user.save();
    
    // Return updated user without sensitive fields
    const updatedUser = await User.findById(req.user.id)
      .select('-password -verificationToken -verificationTokenExpiry');
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Request password reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }
    
    const user = await User.findOne({ email })
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = Date.now() + 3600000 // 1 hour
    
    // Save token to database
    user.resetPasswordToken = resetToken
    user.resetPasswordExpiry = resetTokenExpiry
    await user.save()
    
    // Send email with reset link
    const sent = await sendPasswordResetEmail(email, resetToken)
    
    if (!sent) {
      user.resetPasswordToken = undefined
      user.resetPasswordExpiry = undefined
      await user.save()
      return res.status(500).json({ message: 'Failed to send password reset email' })
    }
    
    res.json({ message: 'Password reset link sent to your email' })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' })
    }
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    })
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }
    
    // Update password
    user.password = await bcrypt.hash(password, 10)
    user.resetPasswordToken = undefined
    user.resetPasswordExpiry = undefined
    await user.save()
    
    res.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Error resetting password:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Change password using old password verification
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' })
    }
    
    // Find the user
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }
    
    // Update password
    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()
    
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Remove profile image
export const removeProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Clear the profile image
    user.profileImage = null
    await user.save()
    
    // Return updated user without sensitive fields
    const updatedUser = await User.findById(req.user.id)
      .select('-password -verificationToken -verificationTokenExpiry')
    
    res.json(updatedUser)
  } catch (error) {
    console.error('Error removing profile image:', error)
    res.status(500).json({ message: 'Server error' })
  }
}