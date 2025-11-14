import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/api'

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [contact, setContact] = useState('')
  const [method, setMethod] = useState('email')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Get contact info and method from navigation state
    const contactFromState = location.state?.contact || location.state?.email
    const methodFromState = location.state?.method || 'email'

    if (contactFromState) {
      setContact(contactFromState)
      setMethod(methodFromState)
      // Auto-focus first OTP input
      setTimeout(() => {
        const firstInput = document.getElementById('otp-0')
        if (firstInput) firstInput.focus()
      }, 100)
    } else {
      // If no contact info, redirect to signup
      navigate('/signin')
    }
  }, [location, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    
    for (let i = 0; i < pasteData.length && i < 6; i++) {
      newOtp[i] = pasteData[i]
    }
    
    setOtp(newOtp)
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(pasteData.length, 5)
    const nextInput = document.getElementById(`otp-${nextIndex}`)
    if (nextInput) nextInput.focus()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const otpString = otp.join('')
      const res = await api.post('/auth/verify-otp', { 
        email: contact, 
        otp: otpString
      })
      // Instead of storing token and redirecting to dashboard,
      // redirect to login page with a success message
      navigate('/signin', { 
        state: { 
          verificationSuccess: true,
          email: contact 
        }
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOTP() {
    setResendLoading(true)
    setError(null)

    try {
      await api.post('/auth/resend-otp', { 
        email: contact
      })
      setCountdown(60) // 60 second countdown
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-semibold mb-2 text-white">Verify Your Email</h2>
        <p className="text-sm text-gray-400 mb-6">
          We've sent a 6-digit verification code to <strong className="text-white">{contact}</strong>
        </p>

        {error && <div className="text-red-400 mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-3">Verification Code</label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(e)}
                  className="w-12 h-12 text-center text-xl font-mono border border-gray-600 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  maxLength="1"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.some(digit => digit === '')}
            className="w-full bg-blue-600 text-white px-5 py-3 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOTP}
            disabled={resendLoading || countdown > 0}
            className="text-blue-400 font-semibold hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/signin')}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            ← Back to Sign Up
          </button>
        </div>
      </div>
    </div>
  )
}