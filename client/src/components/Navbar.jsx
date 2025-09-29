import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const token = localStorage.getItem('token')
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <header className="bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-600">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">CS</div>
          <Link to="/" className="text-lg sm:text-xl font-semibold text-white">Code Snippet Manager</Link>
        </div>

        <nav className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-6 text-sm text-gray-300">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <Link to="/dashboard" className="hover:text-white transition">My Snippets</Link>
          </div>

          <div className="flex items-center space-x-3">
            {token ? (
              <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition shadow-sm">Logout</button>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-md hover:bg-gray-600 transition">Login</Link>
                <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow">Sign Up</Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
