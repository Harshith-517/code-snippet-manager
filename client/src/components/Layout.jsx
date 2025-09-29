import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-400 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="font-medium">© {new Date().getFullYear()} Code Snippet Manager</div>
          <div className="space-x-4">
            <a className="hover:text-white transition-colors cursor-pointer">Privacy</a>
            <a className="hover:text-white transition-colors cursor-pointer">Terms</a>
            <a className="hover:text-white transition-colors cursor-pointer">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
