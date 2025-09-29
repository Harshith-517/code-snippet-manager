import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fetch from 'node-fetch' // You'll need to install this with: npm install node-fetch
import { generateOTP, sendVerificationEmail } from '../utils/emailService.js'
// SMS functionality removed - using email only
// import { sendSMSOTP, formatPhoneNumber } from '../utils/smsService.js'

export async function signup(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'First name, last name, email, and password are required' })
    }

    // Check for existing user by email only
    const existing = await User.findOne({ email })
    if (existing) {
      if (existing.emailVerified) {
        return res.status(409).json({ message: 'User already exists' })
      } else {
        // Resend OTP for unverified user
        const otp = generateOTP()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        existing.firstName = firstName
        existing.lastName = lastName
        existing.email = email
        existing.password = await bcrypt.hash(password, 10)
        existing.verificationToken = otp
        existing.verificationTokenExpiry = otpExpiry

        await existing.save()

        const sent = await sendVerificationEmail(email, otp)

        if (!sent) {
          return res.status(500).json({ message: 'Failed to send verification email' })
        }

        return res.status(200).json({
          message: 'Verification code sent to your email',
          contact: email,
          method: 'email'
        })
      }
    }

    const hashed = await bcrypt.hash(password, 10)
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    const fullName = `${firstName} ${lastName}`.trim()

    const userData = {
      name: fullName,
      firstName,
      lastName,
      email: email,
      password: hashed,
      verificationToken: otp,
      verificationTokenExpiry: otpExpiry
    }

    const user = await User.create(userData)

    const sent = await sendVerificationEmail(email, otp)

    if (!sent) {
      await User.findByIdAndDelete(user._id)
      return res.status(500).json({ message: 'Failed to send verification email' })
    }

    res.status(201).json({
      message: 'Verification code sent to your email',
      contact: email,
      method: 'email'
    })
  } catch (err) {
    console.error('Signup error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Invalid credentials' })

    // Check if user email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email
      })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '7d',
    })

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      }
    })
  } catch (err) {
    console.error('Login error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' })
    }

    const user = await User.findOne({
      email: email,
      verificationToken: otp,
      verificationTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' })
    }

    // Mark email verification as complete
    user.emailVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpiry = undefined
    await user.save()

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '7d',
    })

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified
      }
    })
  } catch (err) {
    console.error('OTP verification error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function resendOTP(req, res) {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' })
    }

    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    user.verificationToken = otp
    user.verificationTokenExpiry = otpExpiry
    await user.save()

    const sent = await sendVerificationEmail(email, otp)

    if (!sent) {
      return res.status(500).json({ message: 'Failed to send verification email' })
    }

    res.json({ message: 'Verification code sent to your email' })
  } catch (err) {
    console.error('Resend OTP error', err)
    res.status(500).json({ message: 'Server error' })
  }
}

export async function googleAuth(req, res) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }
    
    // Verify the Google ID token
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    
    if (!response.ok) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    const userData = await response.json();
    
    // Check if user exists
    let user = await User.findOne({ email: userData.email });
    
    if (user) {
      // Update Google ID if not already set
      if (!user.googleId) {
        user.googleId = userData.sub;
        user.profileImage = userData.picture;
        await user.save();
      }
    } else {
      // Create new user
      const nameParts = userData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      user = await User.create({
        name: userData.name,
        firstName,
        lastName,
        email: userData.email,
        googleId: userData.sub,
        profileImage: userData.picture,
        emailVerified: true // Google accounts are pre-verified
      });
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '7d',
    });
    
    res.json({
      token: jwtToken,
      user: { 
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage,
        emailVerified: user.emailVerified
      }
    });
  } catch (err) {
    console.error('Google auth error', err);
    res.status(500).json({ message: 'Server error' });
  }
}
