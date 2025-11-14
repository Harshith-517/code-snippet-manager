import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useTheme } from '../utils/ThemeContext.jsx'

export default function SignInPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [emailExists, setEmailExists] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({
    length: true,
    uppercase: true,
    lowercase: true,
    number: true,
    specialChar: true,
    match: false
  })
  const navigate = useNavigate()
  const location = useLocation()
  const { isDarkMode } = useTheme()

  useEffect(() => {
    // Check if coming from successful verification
    if (location.state?.verificationSuccess) {
      setSuccessMessage('Email verified! You can continue to log in now.');
      if (location.state?.email) {
        setEmail(location.state.email);
      }
      setIsSignUp(false);
    }
    
    // Initialize Google Identity Services
    if (window.google) {
      initializeGoogleButton();
    } else {
      // If the script hasn't loaded yet, wait for it
      const checkGoogleScript = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleScript);
          initializeGoogleButton();
        }
      }, 100);
      return () => clearInterval(checkGoogleScript);
    }
  }, [isDarkMode, location.state, isSignUp]);

  function initializeGoogleButton() {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    
    window.google.accounts.id.renderButton(
      document.getElementById('googleSignIn'),
      { 
        theme: isDarkMode ? 'filled_black' : 'outline',
        size: 'large', 
        width: '100%',
        text: 'continue_with',
        logo_alignment: 'center',
        type: 'standard'
      }
    );
  }

  async function handleGoogleResponse(response) {
    try {
      const res = await api.post('/auth/google', { 
        token: response.credential,
        action: isSignUp ? 'signup' : 'login'
      });
      localStorage.setItem('token', res.data.token);
      toast.success(isSignUp ? 'Account created successfully with Google!' : 'Login successful with Google! Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Google ${isSignUp ? 'signup' : 'login'} failed`;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }

  async function checkEmailExists() {
    if (!email) {
      setError('Email is required')
      return
    }
    
    setCheckingEmail(true)
    setError(null)
    
    try {
      console.log('Checking email:', email);
      const response = await api.post('/auth/check-email', { email });
      console.log('Email check response:', response.data);
      setEmailExists(true);
      setError(null);
    } catch (err) {
      console.error('Email check error:', err);
      const errorData = err.response?.data;
      if (err.response?.status === 404) {
        setError('No account found with this email');
      } else {
        setError(errorData?.message || 'Error checking email');
      }
    } finally {
      setCheckingEmail(false);
    }
  }

  // Check password strength and validate
  const validatePassword = (pass, confirmPass) => {
    const errors = {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /\d/.test(pass),
      specialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass),
      match: pass === confirmPass && pass !== ''
    }
    
    setPasswordErrors(errors)
    
    return Object.values(errors).every(val => val === true)
  }
  
  // Update password validation on every change
  useEffect(() => {
    if (isSignUp) {
      validatePassword(password, confirmPassword)
    }
  }, [password, confirmPassword, isSignUp])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    
    if (isSignUp) {
      // Sign up logic
      setLoading(true)
      
      if (!email) {
        setError('Email is required')
        setLoading(false)
        return
      }
      
      if (!validatePassword(password, confirmPassword)) {
        setError('Please fix the password issues before submitting')
        setLoading(false)
        return
      }
      
      try {
        const res = await api.post('/auth/signup', { 
          firstName, 
          lastName, 
          email,
          password,
          confirmPassword
        })
        toast.success('Account created successfully! Please verify your email.')
        navigate('/verify-otp', { 
          state: { 
            contact: email,
            method: 'email' 
          } 
        })
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Signup failed';
        setError(errorMsg)
        toast.error(errorMsg)
        setLoading(false)
      }
    } else {
      // Sign in logic
      if (!emailExists) {
        await checkEmailExists()
        return
      }
      
      if (!password) {
        setError('Password is required')
        return
      }
      
      try {
        const res = await api.post('/auth/login', { email, password })
        localStorage.setItem('token', res.data.token)
        toast.success('Login successful! Welcome back.')
        navigate('/dashboard')
      } catch (err) {
        const errorData = err.response?.data
        if (errorData?.requiresVerification) {
          navigate('/verify-otp', { state: { email: errorData.email } })
        } else {
          const errorMsg = errorData?.message || 'Login failed';
          setError(errorMsg)
          toast.error(errorMsg)
        }
      }
    }
  }

  const switchMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setSuccessMessage(null)
    setEmailExists(false)
    setPassword('')
    setConfirmPassword('')
    setFirstName('')
    setLastName('')
    setEmail('')
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative">
      {/* Simple Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo/logo-64.png" 
              alt="Code Snippet Manager" 
              className="h-10 w-10 transition-opacity duration-200"
            />
            <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Code Snippet Manager
            </span>
          </div>
        </div>
      </header>      {/* Back to Home Button - Below navbar on left */}
      <div className="absolute top-20 left-6 z-30">
        <Link 
          to="/" 
          className="flex items-center text-white hover:text-gray-200 transition-colors px-4 py-2 rounded-md hover:bg-white/10 backdrop-blur-sm border border-white/30 hover:border-white/50 shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
      
      {/* Main Content Container */}
      <div className="flex-1 flex overflow-hidden relative">
      
      {/* Form Container - slides left and right */}
      <div 
        className={`absolute inset-y-0 w-1/2 flex items-center justify-center p-8 bg-white dark:bg-gray-900 transition-all duration-700 ease-in-out ${
          isSignUp ? 'left-0 z-10' : 'left-1/2 z-20'
        }`}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-all duration-500">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 transition-all duration-500">
              {isSignUp 
                ? 'Start saving snippets and collaborate with your team.' 
                : 'Log in to access your snippets and team workspace.'
              }
            </p>
          </div>

          {error && <div className="text-red-600 dark:text-red-400 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors text-sm">{error}</div>}
          {successMessage && <div className="text-green-600 dark:text-green-400 mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg transition-colors text-sm">{successMessage}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 transition-all duration-500">
            {/* First Name & Last Name for Sign Up */}
            {isSignUp && (
              <div className="flex gap-3">
                <input 
                  type="text"
                  placeholder="First Name"
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-sm"
                />
                <input 
                  type="text"
                  placeholder="Last Name"
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-sm"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <input 
                type="email"
                placeholder="Email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isSignUp && emailExists} 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 disabled:opacity-70 text-sm" 
                required
              />
              {!isSignUp && emailExists && (
                <button
                  type="button"
                  onClick={() => {
                    setEmailExists(false);
                    setError(null);
                    setPassword('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Change email"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Password */}
            {(isSignUp || (!isSignUp && emailExists)) && (
              <input 
                type="password"
                placeholder="Password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-sm" 
                required
                autoFocus={!isSignUp && emailExists}
              />
            )}

            {/* Confirm Password & Password Validation for Sign Up */}
            {isSignUp && (
              <div className="space-y-4">
                <input 
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className={`w-full p-3 border ${password && !passwordErrors.match ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 text-sm`}
                  required
                />
                
                {/* Password strength indicators */}
                {password && (
                  <div className="text-xs space-y-1">
                    <div className={`flex items-center transition-colors duration-200 ${passwordErrors.length ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.length ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center transition-colors duration-200 ${passwordErrors.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.uppercase ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      One uppercase letter
                    </div>
                    <div className={`flex items-center transition-colors duration-200 ${passwordErrors.lowercase ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.lowercase ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      One lowercase letter
                    </div>
                    <div className={`flex items-center transition-colors duration-200 ${passwordErrors.number ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.number ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      One number
                    </div>
                    <div className={`flex items-center transition-colors duration-200 ${passwordErrors.specialChar ? 'text-green-500' : 'text-gray-400'}`}>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {passwordErrors.specialChar ? 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : 
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        }
                      </svg>
                      One special character (!@#$%)
                    </div>
                    {password && confirmPassword && !passwordErrors.match && (
                      <p className="text-red-500 text-xs transition-all duration-200">Passwords don't match</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Forgot Password Link for Sign In */}
            {!isSignUp && !emailExists && (
              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Submit Button */}
            {!isSignUp && emailExists ? (
              <div className="flex items-center justify-between">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
                <button 
                  type="submit" 
                  disabled={loading || checkingEmail}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  {checkingEmail ? 'Checking...' : 'Sign In'}
                </button>
              </div>
            ) : (
              <div className={`${isSignUp ? 'flex justify-end' : ''}`}>
                <button 
                  type="submit" 
                  disabled={loading || checkingEmail}
                  className={`${isSignUp ? 'px-5 py-2 bg-blue-600 hover:bg-blue-700' : 'w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 uppercase tracking-wide'} text-white font-semibold rounded-lg transition-colors disabled:opacity-70 text-sm flex items-center gap-2 justify-center`}
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : checkingEmail ? 'Checking...' : (
                    isSignUp ? 'Create account' : 'Continue'
                  )}
                </button>
              </div>
            )}
          </form>

          <div className="my-4 flex items-center transition-all duration-300">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600 transition-colors"></div>
            <div className="px-3 text-sm text-gray-500 dark:text-gray-400 transition-colors">or</div>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600 transition-colors"></div>
          </div>

          <div id="googleSignIn" className="w-full flex justify-center mb-4 transition-all duration-300"></div>
        </div>
      </div>

      {/* Welcome Panel - slides left and right */}
      <div 
        className={`absolute inset-y-0 w-1/2 bg-slate-900 dark:bg-gray-900 flex items-center justify-center p-8 text-white transition-all duration-700 ease-in-out overflow-hidden ${
          isSignUp ? 'left-1/2 z-20' : 'left-0 z-10'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3Ccircle cx='0' cy='30' r='4'/%3E%3Ccircle cx='60' cy='30' r='4'/%3E%3Ccircle cx='30' cy='0' r='4'/%3E%3Ccircle cx='30' cy='60' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      >
        {/* Floating Code Elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <svg className="w-8 h-8 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
        </div>
        <div className="absolute bottom-32 right-16 opacity-20">
          <svg className="w-6 h-6 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div className="absolute top-1/3 right-8 opacity-20">
          <svg className="w-5 h-5 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="text-center max-w-md">
          {/* Code Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <svg className="w-24 h-24 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5 5.5L4 10l4.5 4.5L10 13l-2.5-2.5L10 8 8.5 5.5zM15.5 5.5L14 8l2.5 2.5L14 13l1.5 1.5L20 10l-4.5-4.5z"/>
                <path d="M12 2l-1 4-1-4h2zm0 20l1-4 1 4h-2z" opacity="0.5"/>
              </svg>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-4 transition-all duration-500 text-white">
            {isSignUp ? 'Welcome Back!' : 'Join Our Community'}
          </h2>
          <p className="text-lg mb-8 text-gray-300 transition-all duration-500 leading-relaxed">
            {isSignUp 
              ? 'Ready to continue your coding journey? Access your saved snippets and collaborate with your team.'
              : 'Start organizing your code snippets, share with your team, and boost your productivity.'
            }
          </p>

          {/* Features List - Only show when NOT in signup mode (i.e., when showing "Join Our Community") */}
          {!isSignUp && (
            <div className="mb-8 space-y-2 text-left">
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-indigo-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-sm">Organize code snippets by language & tags</span>
              </div>
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-indigo-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-sm">Share & collaborate with your team</span>
              </div>
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-indigo-400 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-sm">Search & find snippets instantly</span>
              </div>
            </div>
          )}

          {isSignUp ? (
            <button 
              onClick={switchMode}
              className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-slate-900 transition-all duration-300 uppercase tracking-wide transform hover:scale-105"
              style={{ fontSize: '1rem', fontWeight: '600', minWidth: '10em' }}
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={switchMode}
              className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-slate-900 transition-all duration-300 uppercase tracking-wide transform hover:scale-105"
              style={{ fontSize: '1rem', fontWeight: '600', minWidth: '10em' }}
            >
              Sign Up
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}