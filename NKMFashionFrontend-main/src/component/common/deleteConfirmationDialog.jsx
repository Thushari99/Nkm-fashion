import React from 'react';
import { FaTrashAlt } from 'react-icons/fa'; // Import trash icon

const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 backdrop-blur-sm z-50">
            <div className="bg-white p-4 rounded-lg shadow-xl max-w-sm w-full transform transition-transform duration-300 scale-105">
                <div className="flex justify-center mb-3 mt-3">
                    <FaTrashAlt className="text-red-500 text-6xl animate-pulse" />
                </div>
                <p className="text-center text-l font-medium text-gray-800 mb-6">
                    {message}
                </p>
                <div className="flex justify-around gap-2 mt-4">
                    <button
                        className="bg-red-600 w-1/2 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        Yes, Delete!
                    </button>
                    <button
                        className="bg-gray-300 w-1/2 text-gray-800 py-2 px-3 rounded-lg hover:bg-gray-400 transition-all duration-300 transform hover:scale-105"
                        onClick={onClose}
                    >
                        No, Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
