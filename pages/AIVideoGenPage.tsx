
import React from 'react';
import { MagicWandIcon } from '../components/Icons'; // Assuming MagicWandIcon is appropriate

const AIVideoGenPage: React.FC = () => (
  <div className="w-full max-w-4xl text-center p-8 md:p-12 bg-gray-800 rounded-xl shadow-2xl mt-8">
    <div className="flex justify-center mb-6">
      <MagicWandIcon className="w-16 h-16 text-indigo-400" />
    </div>
    <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-6">
      AI Video Generation
    </h1>
    <p className="text-xl text-gray-300 mb-4">
      This cutting-edge feature is currently under development.
    </p>
    <p className="text-gray-400">
      Soon, you'll be able to generate amazing video content using the power of AI. Stay tuned for updates!
    </p>
    <div className="mt-8">
      <span className="inline-block bg-indigo-500 bg-opacity-20 text-indigo-300 text-sm font-semibold px-4 py-2 rounded-full">
        Coming Soon
      </span>
    </div>
  </div>
);

export default AIVideoGenPage;
