import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OTPVerificationPage from './pages/OTPVerificationPage'
import Dashboard from './pages/Dashboard'

export default function App() {
  useEffect(() => {
    // Add dark class to html element for Tailwind dark mode
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="verify-otp" element={<OTPVerificationPage />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
