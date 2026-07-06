import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';

export default function UploadArea({ onFileSelect, isUploading }) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateAndSelect = (file) => {
    setErrorMsg(null);
    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (extension !== '.pdf' && extension !== '.txt') {
      setErrorMsg('Unsupported format. Please upload a PDF or TXT document.');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 outline-none
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50/40 shadow-inner' 
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50/50 shadow-soft'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        {/* Upload Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:text-blue-500 transition-colors border border-gray-100 shadow-sm">
          <UploadCloud className="h-6 w-6 text-gray-500" />
        </div>

        {/* Helper Texts */}
        <p className="text-sm font-semibold text-gray-700">
          Drag and drop your file here, or <span className="text-blue-600 font-bold hover:underline">browse</span>
        </p>
        
        <p className="mt-1.5 text-xs text-gray-400">
          Supports PDF or TXT documents (Max 25MB)
        </p>

        {/* Accepted File formats badge */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/10">
            PDF
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            TXT
          </span>
        </div>
      </div>

      {/* Local Error feedback */}
      {errorMsg && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-100 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
