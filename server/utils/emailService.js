import nodemailer from 'nodemailer'
import crypto from 'crypto'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Create transporter function to ensure env vars are loaded
const createTransporter = () => {
  console.log('Creating Resend transporter...')
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key not found in environment variables')
  }
  
  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY
    }
  })
}

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString()
}

export const sendVerificationEmail = async (email, otp) => {
  console.log('Sending verification email to:', email);
  const mailOptions = {
    from: {
      name: 'Code Snippet Manager',
      address: process.env.RESEND_FROM_EMAIL
    },
    to: email,
    subject: 'Email Verification - Code Snippet Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
        <p>Hello,</p>
        <p>Thank you for signing up for Code Snippet Manager! Please use the following verification code to complete your registration:</p>

        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>

        <p><strong>Important:</strong> This code will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request this verification, please ignore this email.</p>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        <p style="color: #6c757d; font-size: 12px;">
          This is an automated message from Code Snippet Manager. Please do not reply to this email.
        </p>
      </div>
    `
  }

  try {
    console.log('Setting up email with options:', {
      to: email,
      from: process.env.RESEND_FROM_EMAIL,
      subject: mailOptions.subject
    });

    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: email
    });
    
    return true;
  } catch (error) {
    console.error('Email sending error details:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw error;
  }
}

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
  console.log('Sending password reset email to:', email);
  
  const mailOptions = {
    from: {
      name: 'Code Snippet Manager',
      address: process.env.RESEND_FROM_EMAIL
    },
    to: email,
    subject: 'Password Reset - Code Snippet Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You have requested to reset your password for Code Snippet Manager. Click the button below to reset your password:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>

        <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        <p style="color: #6c757d; font-size: 12px;">
          This is an automated message from Code Snippet Manager. Please do not reply to this email.
        </p>
      </div>
    `
  }

  try {
    const transporter = createTransporter()
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}