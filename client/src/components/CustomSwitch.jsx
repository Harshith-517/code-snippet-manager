import React from 'react'
import './CustomSwitch.css'

export default function CustomSwitch({ 
  checked, 
  onChange, 
  id,
  disabled = false,
  className = ''
}) {
  return (
    <label className={`switch ${className}`} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="slider"></span>
    </label>
  )
}