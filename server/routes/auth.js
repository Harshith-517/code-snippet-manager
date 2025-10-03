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


export default router
