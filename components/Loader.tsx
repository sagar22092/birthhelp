import { useState, useEffect } from 'react';

export default function SimpleUnicodeLoader() {
  return (
    <div className="min-h-screen dark:bg-gray-900 bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Circular spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-sky-200 dark:border-sky-900/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-600 dark:border-t-sky-400 animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            ক্রয় হচ্ছে...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            একটি মুহূর্ত অপেক্ষা করুন
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2 mt-2">
          <div className="w-2 h-2 bg-sky-600 dark:bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-sky-600 dark:bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-sky-600 dark:bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}