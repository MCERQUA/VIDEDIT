
import React, { ChangeEvent, useRef } from 'react';
import { UploadIcon } from './Icons';

interface FileUploaderProps {
  label: string;
  onFileUpload: (file: File) => void;
  accept: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ label, onFileUpload, accept }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileUpload(event.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-center justify-center px-4 py-2 border border-dashed border-gray-500 rounded-md text-sm font-medium text-gray-300 hover:text-indigo-400 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-150"
      >
        <UploadIcon className="w-5 h-5 mr-2" />
        Choose File
      </button>
    </div>
  );
};
