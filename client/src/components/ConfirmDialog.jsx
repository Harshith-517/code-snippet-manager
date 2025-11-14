import React from 'react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden transition-colors">
        <div className="px-6 py-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors">
              {title}
            </h3>
          )}
          <p className="text-gray-700 dark:text-gray-300 transition-colors">{message}</p>
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 flex justify-end space-x-2 transition-colors">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}