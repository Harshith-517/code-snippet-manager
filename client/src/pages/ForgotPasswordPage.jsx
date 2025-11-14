import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useTheme } from '../utils/ThemeContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { isDarkMode } = useTheme()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await api.post('/users/reset-password-request', { email })
      setSubmitted(true)
      toast.success('Password reset link sent to your email')
    } catch (error) {
      console.error('Failed to request password reset:', error)
      toast.error(error.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-center">
          <img 
            src="/logo/logo-64.png" 
            alt="Code Snippet Manager" 
            className="h-16 w-16"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Reset Your Password
        </h1>
        
        {submitted ? (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              A password reset link has been sent to <strong>{email}</strong>.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please check your email inbox and follow the instructions to reset your password.
              The link will expire in 1 hour.
            </p>
            <div className="mt-6">
              <Link to="/signin" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-700 dark:text-gray-300">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
            
            <div className="text-center">
              <Link to="/signin" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}