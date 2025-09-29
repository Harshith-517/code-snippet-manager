import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
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
  }, []);

  function initializeGoogleButton() {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    
    window.google.accounts.id.renderButton(
      document.getElementById('googleSignIn'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  }

  async function handleGoogleResponse(response) {
    try {
      const res = await api.post('/auth/google', { token: response.credential });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google signup failed');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    if (!email) {
      setError('Email is required')
      setLoading(false)
      return
    }
    
    try {
      const res = await api.post('/auth/signup', { 
        firstName, 
        lastName, 
        email,
        password
      })
      // Navigate to OTP verification page with email
      navigate('/verify-otp', { 
        state: { 
          contact: email,
          method: 'email' 
        } 
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-semibold mb-2 text-white">Create your account</h2>
        <p className="text-sm text-gray-400 mb-4">Start saving snippets and collaborate with your team.</p>
        {error && <div className="text-red-400 mb-3 p-3 bg-red-900/20 border border-red-800 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-1">First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-300 mb-1">Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email"
              required
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          <div className="flex justify-end">
            <button 
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-lg shadow transition flex items-center gap-2 ${
                loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <div className="px-3 text-sm text-gray-400">or</div>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <div id="googleSignIn" className="w-full flex justify-center"></div>

        <div className="mt-6 text-center text-sm text-gray-400">Already have an account? <a href="/login" className="text-blue-400 font-semibold hover:text-blue-300">Login</a></div>
      </div>
    </div>
  )
}
