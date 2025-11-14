import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fetch from 'node-fetch' // You'll need to install this with: npm install node-fetch
import { generateOTP, sendVerificationEmail } from '../utils/emailService.js'
// SMS functionality removed - using email only
// import { sendSMSOTP, formatPhoneNumber } from '../utils/smsService.js'

export async function signup(req, res) {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'First name, last name, email, password, and confirm password are required' })
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }
    
    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' })
    }
    
    // Check for uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      })
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

// Check if email exists without password
export async function checkEmail(req, res) {
  try {
    const { email } = req.body
    console.log('Checking email:', email);
    
    if (!email) {
      console.log('Email is required');
      return res.status(400).json({ message: 'Email is required' });
    }

    // Case-insensitive search for email
    const user = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email', exists: false });
    }

    // Return success but don't provide too much info for security
    return res.status(200).json({ exists: true });
  } catch (err) {
    console.error('Check email error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    console.log('AuthController: Login attempt for:', req.body.email);
    
    const { email, password } = req.body;
    
    // Validate inputs
    if (!email || !password) {
      console.log('AuthController: Missing email or password');
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    try {
      // Sanitize email input for regex safety
      const sanitizedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      console.log('AuthController: Searching for user with email pattern');
      
      // Find user with case-insensitive search
      const user = await User.findOne({ 
        email: { $regex: new RegExp('^' + sanitizedEmail + '$', 'i') } 
      });
      
      if (!user) {
        console.log('AuthController: User not found with email:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('AuthController: User found:', user._id);
      
      // Google authenticated users might not have a password
      if (!user.password) {
        console.log('AuthController: User has no password (likely Google account)');
        return res.status(401).json({ 
          message: 'This account uses Google Sign-In. Please login with Google.' 
        });
      }
      
      try {
        console.log('AuthController: Comparing passwords');
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
          console.log('AuthController: Password does not match');
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log('AuthController: Password matched successfully');
      } catch (passwordError) {
        console.error('AuthController: Error comparing passwords:', passwordError);
        return res.status(500).json({ message: 'Error verifying credentials' });
      }
      
      // Check if user email is verified
      if (!user.emailVerified) {
        console.log('AuthController: Email not verified for user:', user._id);
        return res.status(403).json({
          message: 'Please verify your email before logging in',
          requiresVerification: true,
          email: user.email
        });
      }
      
      try {
        // Generate JWT token
        console.log('AuthController: Generating JWT token');
        const token = jwt.sign(
          { id: user._id }, 
          process.env.JWT_SECRET || 'dev_secret', 
          { expiresIn: '7d' }
        );
        
        console.log('AuthController: Login successful for user:', user._id);
        
        // Return success response
        return res.json({
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
        });
      } catch (tokenError) {
        console.error('AuthController: Error generating token:', tokenError);
        return res.status(500).json({ message: 'Authentication error' });
      }
    } catch (dbError) {
      console.error('AuthController: Database error during login:', dbError);
      return res.status(500).json({ message: 'Database error during login' });
    }
  } catch (err) {
    console.error('AuthController: Uncaught login error:', err);
    return res.status(500).json({ message: 'Server error' });
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

    // Return success message without token
    res.json({
      message: 'Email verified successfully. You can now log in.',
      email: user.email
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
    const { token, action = 'login' } = req.body;
    
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
    
    if (action === 'login' && !user) {
      // If it's a login attempt but user doesn't exist
      return res.status(404).json({ message: 'No account found with this Google account. Please sign up first.' });
    }
    
    if (user) {
      // Update Google ID if not already set
      if (!user.googleId) {
        user.googleId = userData.sub;
        user.profileImage = userData.picture;
        await user.save();
      }
    } else if (action === 'signup') {
      // Create new user only if it's a signup action
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
