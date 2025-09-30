import express from 'express'
import { signup, login, googleAuth, verifyOTP, resendOTP } from '../controllers/authController.js'

const router = express.Router()

// POST /api/auth/signup
router.post('/signup', signup)

// POST /api/auth/login
router.post('/login', login)

// POST /api/auth/google
router.post('/google', googleAuth)

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOTP)

// POST /api/auth/resend-otp
router.post('/resend-otp', resendOTP)

// GET /api/auth/test-email (Development only)
if (process.env.NODE_ENV !== 'production') {
  router.get('/test-email', async (req, res) => {
    try {
      // Import email service functions
      const { sendVerificationEmail, generateOTP } = await import('../utils/emailService.js')
      
      // Generate test OTP
      const testOTP = generateOTP()
      
      // Send test email
      await sendVerificationEmail(process.env.EMAIL_USER, testOTP)
      
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        sentTo: process.env.EMAIL_USER,
        otp: testOTP 
      })
    } catch (error) {
      console.error('Test email error:', error)
      res.status(500).json({ 
        success: false, 
        message: 'Email test failed', 
        error: error.message,
        details: {
          code: error.code,
          command: error.command
        }
      })
    }
  })
}

export default router
