import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../utils/ThemeContext.jsx'
import toast from 'react-hot-toast'
import api, { getBaseUrl } from '../utils/api'

export default function Navbar() {
  const token = localStorage.getItem('token')
  const navigate = useNavigate()
  const { isDarkMode, toggleTheme } = useTheme()
  const [userProfile, setUserProfile] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch user data if logged in
  // Function to fetch user data
  const fetchUserData = async () => {
    if (token) {
      try {
        console.log('Navbar: Fetching user profile data');
        const { data } = await api.get('/users/profile');
        
        // Process profile image URL if it exists
        if (data.profileImage) {
          console.log('Navbar: Original profile image URL:', data.profileImage);
          
          // Handle different image URL scenarios
          if (data.profileImage.startsWith('http')) {
            // External URLs (Supabase, Google, etc.) are already complete
            console.log('Navbar: Using direct external image URL');
            
            // Preload image to ensure it's in browser cache
            const img = new Image();
            img.src = data.profileImage;
          } else {
            // Local file storage URLs need the base URL
            const formattedUrl = `${getBaseUrl()}${data.profileImage}`;
            console.log('Navbar: Formatted local image URL:', formattedUrl);
            data.profileImage = formattedUrl;
            
            // Preload image to ensure it's in browser cache
            const img = new Image();
            img.src = formattedUrl;
          }
        }
        
        console.log('Navbar: Setting user profile data');
        setUserProfile(data);
      } catch (error) {
        console.error('Navbar: Failed to fetch user profile:', error);
        
        // More detailed error handling
        if (error.response) {
          console.error('Navbar: Error response:', error.response.status, error.response.data);
          if (error.response.status === 401) {
            console.log('Navbar: Unauthorized, clearing token');
            localStorage.removeItem('token');
            navigate('/');
          }
        } else if (error.request) {
          console.error('Navbar: No response received:', error.request);
        } else {
          console.error('Navbar: Error setting up request:', error.message);
        }
      }
    }
  }
  
  // Initial fetch user data
  useEffect(() => {
    fetchUserData()
  }, [token, navigate])
  
  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserData()
    }
    
    window.addEventListener('profileUpdated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [token])

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    setUserProfile(null)
    toast.success('Logged out successfully!')
    navigate('/')
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/logo/logo-64.png" 
              alt="Code Snippet Manager" 
              className="h-10 w-10 transition-opacity duration-200"
            />
            <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Code Snippet Manager
            </span>
          </Link>
        </div>

        <nav className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
            {token && <Link to="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>}
            {token && <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">My Snippets</Link>}
          </div>

          <div className="flex items-center space-x-3">
            {token ? (
              <div className="flex items-center space-x-3">
                {/* Profile settings dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="User profile"
                  >
                    {userProfile?.profileImage ? (
                      <img 
                        src={userProfile.profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover select-none pointer-events-none"
                        draggable="false"
                        onError={(e) => {
                          console.error('Navbar: Failed to load profile image:', e);
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.src = ''; // Clear the src
                          e.target.style.display = 'none'; // Hide the img element
                          e.target.parentNode.classList.add('bg-gray-200', 'dark:bg-gray-700', 'flex', 'items-center', 'justify-center');
                          
                          // Add fallback icon
                          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                          svg.setAttribute('class', 'w-6 h-6 text-gray-500 dark:text-gray-400');
                          svg.setAttribute('fill', 'currentColor');
                          svg.setAttribute('viewBox', '0 0 20 20');
                          
                          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                          path.setAttribute('fillRule', 'evenodd');
                          path.setAttribute('d', 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z');
                          path.setAttribute('clipRule', 'evenodd');
                          
                          svg.appendChild(path);
                          e.target.parentNode.appendChild(svg);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                      {userProfile && (
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {userProfile?.profileImage ? (
                              <img 
                                src={userProfile.profileImage} 
                                alt="Profile" 
                                className="w-10 h-10 rounded-full object-cover select-none pointer-events-none"
                                draggable="false"
                                onError={(e) => {
                                  console.error('Navbar Dropdown: Failed to load profile image:', e);
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center" style={{display: userProfile?.profileImage ? 'none' : 'flex'}}>
                              <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {userProfile.firstName} {userProfile.lastName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {userProfile.email}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <Link 
                        to="/profile" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        <svg
                          className="w-5 h-5 mr-2 text-[#007AFF]"
                          viewBox="0 0 512 512"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M256 176a80 80 0 1 0 80 80 80.24 80.24 0 0 0-80-80Zm160 80a159.3 159.3 0 0 1-1.64 22.07l45.11 35.41a10.81 10.81 0 0 1 2.45 13.9l-42.66 73.88a10.81 10.81 0 0 1-13.14 4.72l-44.61-18.11a160.8 160.8 0 0 1-38.17 22.07l-6.68 47.32a10.81 10.81 0 0 1-10.68 9.26h-85.32a10.81 10.81 0 0 1-10.68-9.26l-6.68-47.32a160.8 160.8 0 0 1-38.17-22.07l-44.61 18.11a10.81 10.81 0 0 1-13.14-4.72l-42.66-73.88a10.81 10.81 0 0 1 2.45-13.9l45.11-35.41A159.3 159.3 0 0 1 96 256a159.3 159.3 0 0 1 1.64-22.07l-45.11-35.41a10.81 10.81 0 0 1-2.45-13.9l42.66-73.88a10.81 10.81 0 0 1 13.14-4.72l44.61 18.11a160.8 160.8 0 0 1 38.17-22.07l6.68-47.32A10.81 10.81 0 0 1 196.68 45h85.32a10.81 10.81 0 0 1 10.68 9.26l6.68 47.32a160.8 160.8 0 0 1 38.17 22.07l44.61-18.11a10.81 10.81 0 0 1 13.14 4.72l42.66 73.88a10.81 10.81 0 0 1-2.45 13.9l-45.11 35.41A159.3 159.3 0 0 1 416 256Z"/>
                        </svg>
                        Profile Settings
                      </Link>
                      
                      <Link 
                        to="/profile#password" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          setShowDropdown(false);
                          // If already on profile page, scroll to password section
                          if (window.location.pathname === '/profile' || window.location.pathname === '/profile-settings') {
                            setTimeout(() => {
                              const passwordSection = document.getElementById('password');
                              if (passwordSection) {
                                passwordSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }, 100);
                          }
                        }}
                      >
                        <svg
                          className="w-5 h-5 mr-2 fill-gray-800 dark:fill-gray-50"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12.65 10A5.002 5.002 0 0 0 3 12a5 5 0 0 0 9.65 2H17v2h2v-2h2v-4zM7 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                        </svg>
                        Change Password
                      </Link>
                      
                      <button
                        onClick={toggleTheme}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      >
                        <span className="mr-2">
                          {isDarkMode ? (
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                          )}
                        </span>
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </button>
                      
                      {/* SVG moved inside the Logout button before the text */} 
                        <div>
                          <button
                            onClick={() => {
                              handleLogout();
                              setShowDropdown(false);
                            }}
                            className="w-full text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center px-4 py-2"
                            aria-label="Logout"
                          >
                          <svg
                            className="w-5 h-5 mr-2 stroke-red-600 dark:stroke-red-400"
                            viewBox="0 0 512 512"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="32"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M304 336v40a40 40 0 0 1-40 40H112a40 40 0 0 1-40-40V136a40 40 0 0 1 40-40h152a40 40 0 0 1 40 40v40" />
                            <path d="M368 336 448 256 368 176" />
                            <path d="M176 256h272" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/signin" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow flex items-center">
                  Sign in
                </Link>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDarkMode ? (
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
