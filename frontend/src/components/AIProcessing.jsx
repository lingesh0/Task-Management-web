import React from 'react';
import Lottie from 'lottie-react';
// You need to provide a Lottie JSON file for the animation below
import aiLoading from '../assets/ai-loading.json';

const AIProcessing = ({ message = 'AI is processing your request...' }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <Lottie animationData={aiLoading} loop={true} style={{ width: 120, height: 120 }} />
    <p className="mt-2 text-lg font-medium text-center text-gray-700 dark:text-gray-200">{message}</p>
  </div>
);

export default AIProcessing; 