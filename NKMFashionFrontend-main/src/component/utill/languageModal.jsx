// LanguageModal.jsx
import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';

export default function LanguageModal({ isOpen, onClose, onLanguageChange, currentLanguage }) {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  const handleLanguageChange = () => {
    onLanguageChange(selectedLanguage);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <Dialog.Title className="text-lg font-semibold">Change Language</Dialog.Title>
        <div className="mt-4">
          <h2>No Languages Available.</h2>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleLanguageChange}
            className="bg-[#35AF87] px-4 py-2 rounded-lg text-sm font-medium text-white hover:bg-[#2e9873]"
          >
            Done
          </button>
        </div>
      </div>
    </Dialog>
  );
}
