// /src/components/HowToPlayButton.tsx
import { useState } from 'react';
import HowToPlayModal from './HowToPlayModal';

export default function HowToPlayButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 shadow-md"
      >
        遊び方
      </button>
      
      <HowToPlayModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}