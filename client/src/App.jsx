import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import OTPVerificationPage from './pages/OTPVerificationPage'
import Dashboard from './pages/Dashboard'
import ProfileSettings from './pages/ProfileSettings'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import { ThemeProvider } from './utils/ThemeContext.jsx'
import { useTheme } from './utils/ThemeContext.jsx'

// Create a ToasterWrapper to access the theme context
function ToasterWrapper() {
  const { isDarkMode } = useTheme();
  
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        // Style based on theme
        style: {
          background: isDarkMode ? '#374151' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#1f2937',
          border: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
          maxWidth: '420px',
          textAlign: 'center',
        },
        // Custom success and error styles
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: 'white',
          },
        },
        duration: 3000,
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToasterWrapper />
      <Routes>
        {/* SignInPage without navbar */}
        <Route path="/signin" element={<SignInPage />} />
        
        {/* Routes with navbar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="verify-otp" element={<OTPVerificationPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<ProfileSettings />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}
