"use client";

import React, { useState } from "react";
import { FileText, Download, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string;
  fileName?: string;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  fileName,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName || "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, "_blank");
  };

  if (hasError) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex flex-col items-center justify-center p-8 ${className}`}
      >
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          PDF Preview Unavailable
        </h3>
        <p className="text-gray-600 text-center mb-4">
          Unable to display PDF preview. You can still download or open the
          file.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={handleDownload}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="btn-primary flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open PDF</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-gray-900">
              {fileName || "PDF Document"}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Download PDF"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="aspect-square bg-gray-50">
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0"
            onLoad={handleLoad}
            onError={handleError}
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};
