// Utility functions for generating and caching PDF thumbnails

export const generatePDFThumbnail = async (
  pdfUrl: string
): Promise<string | null> => {
  try {
    // Load PDF.js if not already loaded
    if (!window.pdfjsLib) {
      await loadPDFJS();
    }

    // Try to get PDF through proxy API to avoid CORS issues
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
      }
    } catch (proxyError) {
      console.warn("Proxy request failed, trying direct access:", proxyError);
    }

    // Load the PDF document
    const pdf = await window.pdfjsLib.getDocument(pdfDataUrl).promise;

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
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error generating PDF thumbnail:", error);
    return null;
  }
};

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

export const getThumbnailCacheKey = (url: string) => {
  return `pdf_thumbnail_${btoa(url).replace(/[^a-zA-Z0-9]/g, "")}`;
};

export const loadCachedThumbnail = (url: string): string | null => {
  try {
    const cacheKey = getThumbnailCacheKey(url);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { dataUrl, timestamp } = JSON.parse(cached);
      // Check if cache is less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return dataUrl;
      } else {
        // Remove expired cache
        localStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn("Error loading cached thumbnail:", error);
  }
  return null;
};

export const saveThumbnailToCache = (
  url: string,
  dataUrl: string,
  fileName?: string
) => {
  try {
    const cacheKey = getThumbnailCacheKey(url);
    const cacheData = {
      dataUrl,
      timestamp: Date.now(),
      fileName: fileName || "document.pdf",
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Error saving thumbnail to cache:", error);
  }
};
