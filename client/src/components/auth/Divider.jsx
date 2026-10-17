import React from 'react';

export default function Divider() {
  return (
    <div className="mt-8 mb-6 relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-800" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-[#0a0a0a] text-gray-500 font-medium">
          Or continue with email
        </span>
      </div>
    </div>
  );
}