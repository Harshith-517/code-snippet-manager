import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
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
      setError(err.response?.data?.message || 'Google login failed');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch (err) {
      const errorData = err.response?.data
      if (errorData?.requiresVerification) {
        // Navigate to OTP verification if email not verified
        navigate('/verify-otp', { state: { email: errorData.email } })
      } else {
        setError(errorData?.message || 'Login failed')
      }
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4 text-white">Welcome back</h2>
        <p className="text-sm text-gray-400 mb-4">Log in to access your snippets and team workspace.</p>
        {error && <div className="text-red-400 mb-3 p-3 bg-red-900/20 border border-red-800 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer">Forgot password?</div>
            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition">Login</button>
          </div>
        </form>

        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <div className="px-3 text-sm text-gray-400">or</div>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <div id="googleSignIn" className="w-full flex justify-center"></div>

        <div className="mt-6 text-center text-sm text-gray-400">Don't have an account? <a href="/signup" className="text-blue-400 font-semibold hover:text-blue-300">Sign up</a></div>
      </div>
    </div>
  )
}
