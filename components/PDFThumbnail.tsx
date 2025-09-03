"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, ExternalLink } from "lucide-react";

// Declare PDF.js types
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PDFThumbnailProps {
  pdfUrl: string;
  fileName?: string;
  className?: string;
  showControls?: boolean;
}

export const PDFThumbnail: React.FC<PDFThumbnailProps> = ({
  pdfUrl,
  fileName,
  className = "",
  showControls = false,
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    generateThumbnail();
  }, [pdfUrl]);

  const loadPDFJS = async () => {
    if (window.pdfjsLib) {
      return window.pdfjsLib;
    }

    // Load PDF.js from CDN
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;

    return new Promise((resolve, reject) => {
      script.onload = () => {
        // Configure PDF.js worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const generateThumbnail = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Try to load PDF.js and generate content thumbnail
      try {
        const pdfjsLib = await loadPDFJS();

        // First, try to get the PDF through our proxy API to avoid CORS issues
        let pdfDataUrl = pdfUrl;

        try {
          const proxyResponse = await fetch("/api/pdf-thumbnail", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ pdfUrl }),
          });

          if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            pdfDataUrl = proxyData.dataUrl;
          } else {
            console.warn("Proxy failed, trying direct access");
          }
        } catch (proxyError) {
          console.warn(
            "Proxy request failed, trying direct access:",
            proxyError
          );
        }

        // Load the PDF document
        const pdf = await pdfjsLib.getDocument(pdfDataUrl).promise;

        // Get the first page
        const page = await pdf.getPage(1);

        // Set up canvas for rendering
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Canvas context not available");
        }

        // Calculate scale to fit thumbnail size
        const thumbnailSize = 300;
        const viewport = page.getViewport({ scale: 1 });
        const scale = thumbnailSize / Math.max(viewport.width, viewport.height);
        const scaledViewport = page.getViewport({ scale });

        // Set canvas size
        canvas.width = thumbnailSize;
        canvas.height = thumbnailSize;

        // Draw white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Center the PDF content
        const xOffset = (canvas.width - scaledViewport.width) / 2;
        const yOffset = (canvas.height - scaledViewport.height) / 2;

        // Render the PDF page
        const renderContext = {
          canvasContext: ctx,
          viewport: scaledViewport,
          transform: [1, 0, 0, 1, xOffset, yOffset],
        };

        await page.render(renderContext).promise;

        // Add a subtle border
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Convert to data URL
        const thumbnailDataUrl = canvas.toDataURL("image/png");
        setThumbnailUrl(thumbnailDataUrl);
      } catch (pdfError) {
        console.warn("PDF.js failed, trying alternative approach:", pdfError);

        // Try alternative approach using iframe capture
        try {
          await generateThumbnailFromIframe();
        } catch (iframeError) {
          console.warn(
            "Iframe approach failed, falling back to icon:",
            iframeError
          );
          // Fall back to icon-based thumbnail
          generateIconThumbnail();
        }
      }
    } catch (error) {
      console.error("Error generating PDF thumbnail:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const generateThumbnailFromIframe = async () => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Create a hidden iframe to load the PDF
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        iframe.style.width = "300px";
        iframe.style.height = "300px";
        iframe.src = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&zoom=50`;

        document.body.appendChild(iframe);

        // Wait for iframe to load
        iframe.onload = () => {
          setTimeout(() => {
            try {
              // Create canvas to capture iframe content
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              if (!ctx) {
                throw new Error("Canvas context not available");
              }

              canvas.width = 300;
              canvas.height = 300;

              // Draw white background
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Try to capture iframe content (this might not work due to CORS)
              try {
                const iframeDoc =
                  iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                  // This will likely fail due to CORS, but we try anyway
                  ctx.drawImage(iframe as unknown as CanvasImageSource, 0, 0, canvas.width, canvas.height);
                }
              } catch (captureError) {
                // If capture fails, draw a PDF preview placeholder
                drawPDFPreview(ctx, canvas.width, canvas.height);
              }

              // Add border
              ctx.strokeStyle = "#e5e7eb";
              ctx.lineWidth = 1;
              ctx.strokeRect(0, 0, canvas.width, canvas.height);

              const thumbnailDataUrl = canvas.toDataURL("image/png");
              setThumbnailUrl(thumbnailDataUrl);

              // Clean up
              document.body.removeChild(iframe);
              resolve();
            } catch (error) {
              document.body.removeChild(iframe);
              reject(error);
            }
          }, 2000); // Wait 2 seconds for PDF to load
        };

        iframe.onerror = () => {
          document.body.removeChild(iframe);
          reject(new Error("Failed to load PDF in iframe"));
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
            reject(new Error("Iframe load timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  };

  const drawPDFPreview = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Draw a more detailed PDF preview
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw document background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(20, 20, width - 40, height - 40);

    // Draw document border
    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Draw some content lines to simulate PDF content
    ctx.fillStyle = "#6c757d";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";

    const lines = [
      "PDF Document",
      "First page preview",
      "Content would appear here",
      "if CORS allowed access",
    ];

    lines.forEach((line, index) => {
      ctx.fillText(line, 30, 50 + index * 20);
    });

    // Add PDF icon in corner
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(width - 50, 30, 20, 25);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PDF", width - 40, 45);
  };

  const generateIconThumbnail = () => {
    try {
      // Create a canvas to draw the PDF icon thumbnail
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      // Set canvas size (thumbnail size)
      canvas.width = 300;
      canvas.height = 300;

      // Draw a clean white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add a subtle border
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // Create a more sophisticated PDF icon
      const iconSize = 80;
      const iconX = (canvas.width - iconSize) / 2;
      const iconY = (canvas.height - iconSize) / 2 - 10;

      // Draw PDF document shape
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(iconX, iconY, iconSize, iconSize * 1.2);

      // Add document fold effect
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.moveTo(iconX + iconSize - 15, iconY);
      ctx.lineTo(iconX + iconSize, iconY + 15);
      ctx.lineTo(iconX + iconSize - 15, iconY + 15);
      ctx.closePath();
      ctx.fill();

      // Add white lines to represent text content
      ctx.fillStyle = "#ffffff";
      const lineSpacing = 8;
      const startY = iconY + 15;
      const lineWidth = iconSize - 20;

      for (let i = 0; i < 6; i++) {
        const lineY = startY + i * lineSpacing;
        if (lineY < iconY + iconSize * 1.2 - 10) {
          // Vary line lengths to look more realistic
          const lineLength = lineWidth * (0.7 + Math.random() * 0.3);
          ctx.fillRect(iconX + 10, lineY, lineLength, 2);
        }
      }

      // Add "PDF" text below the icon
      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("PDF", canvas.width / 2, iconY + iconSize * 1.2 + 20);

      // Add file name if provided (truncated)
      if (fileName) {
        ctx.fillStyle = "#6b7280";
        ctx.font = "10px Arial";
        const truncatedName =
          fileName.length > 20 ? fileName.substring(0, 20) + "..." : fileName;
        ctx.fillText(
          truncatedName,
          canvas.width / 2,
          iconY + iconSize * 1.2 + 35
        );
      }

      // Convert canvas to data URL
      const thumbnailDataUrl = canvas.toDataURL("image/png");
      setThumbnailUrl(thumbnailDataUrl);
    } catch (error) {
      console.error("Error generating icon thumbnail:", error);
      setHasError(true);
    }
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

  if (isLoading) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-xs text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasError || !thumbnailUrl) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4 ${className}`}
      >
        <FileText className="h-12 w-12 text-gray-400 mb-2" />
        <span className="text-xs text-gray-600 font-medium">PDF</span>
        {showControls && (
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleDownload}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Download PDF"
            >
              <Download className="h-3 w-3" />
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="text-gray-500 hover:text-gray-700 p-1"
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={thumbnailUrl}
        alt="PDF Thumbnail"
        className="w-full h-full object-cover rounded-lg"
      />
      {showControls && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={handleDownload}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded p-1"
            title="Download PDF"
          >
            <Download className="h-3 w-3 text-gray-600" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded p-1"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
};
