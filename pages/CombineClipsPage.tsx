
import React from 'react';
// You might want a different icon, e.g., a film reel or scissors icon
import { UploadIcon } from '../components/Icons'; // Placeholder icon

const CombineClipsPage: React.FC = () => (
  <div className="w-full max-w-4xl text-center p-8 md:p-12 bg-gray-800 rounded-xl shadow-2xl mt-8">
    <div className="flex justify-center mb-6">
      {/* Replace with a more relevant icon if available */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-indigo-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
      </svg>
    </div>
    <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6">
      Combine Video Clips
    </h1>
    <p className="text-xl text-gray-300 mb-4">
      The ability to merge and edit your video clips is on its way!
    </p>
    <p className="text-gray-400">
      We're working hard to bring you a seamless video combining experience. Check back soon!
    </p>
    <div className="mt-8">
      <span className="inline-block bg-indigo-500 bg-opacity-20 text-indigo-300 text-sm font-semibold px-4 py-2 rounded-full">
        Coming Soon
      </span>
    </div>
  </div>
);

export default CombineClipsPage;
