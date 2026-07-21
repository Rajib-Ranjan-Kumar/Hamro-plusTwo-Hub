import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Loader2, Maximize, Minimize, ExternalLink, Image as ImageIcon, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface SecurePDFViewerProps {
  url: string;
  title: string;
  onClose: () => void;
  allowDownload?: boolean;
}

// Sub-component to render individual PDF pages onto their own canvas
interface PDFPageRendererProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
}

const PDFPageRenderer: React.FC<PDFPageRendererProps> = ({ pdfDoc, pageNum, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        // Cancel any ongoing render task for this page canvas
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') {
          return; // Expected cancellation on fast scrolling/zooming
        }
        console.error(`Error rendering page ${pageNum} onto canvas:`, err);
      }
    };

    renderPage();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale]);

  return <canvas ref={canvasRef} className="max-w-full h-auto block select-none pointer-events-none" />;
};

export const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ url, title, onClose, allowDownload = false }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    // Prevent scrolling on body while viewer is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Intercept Ctrl + Scroll Wheel over the PDF area to zoom the PDF instead of the website
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Zoom in/out by 10% steps
        const zoomFactor = 0.1;
        const delta = e.deltaY < 0 ? zoomFactor : -zoomFactor;
        setScale(currentScale => Math.min(3.0, Math.max(0.5, currentScale + delta)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isLoading, pdfDoc]);

  // Check if the URL is likely an image
  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) || 
                  (url.includes('firebasestorage.googleapis.com') && url.includes('%2Fimages%2F'));

  // Load PDF.js and document
  useEffect(() => {
    if (isImage) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadPdfJs = async () => {
      try {
        // 1. Dynamically append PDF.js library if not already loaded
        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
          script.async = true;
          document.body.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load PDF.js script from CDN"));
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        // Configure PDF.js Worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        console.log("SecurePDFViewer: fetching PDF document ->", url);
        const loadingTask = pdfjsLib.getDocument({
          url: url,
          withCredentials: false
        });
        
        const pdf = await loadingTask.promise;
        
        if (isMounted) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("PDF.js loading failed:", err);
        if (isMounted) {
          setError(err.message || "Failed to parse PDF document. Please verify your connection or download options.");
          setIsLoading(false);
        }
      }
    };

    loadPdfJs();

    return () => {
      isMounted = false;
    };
  }, [url, isImage]);

  // Handle scroll events to detect current page number in viewport
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const pageElements = container.querySelectorAll('[data-page-number]');
    
    let currentVisiblePage = 1;
    let minDiff = Infinity;
    
    pageElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const diff = Math.abs(rect.top - 80); // Offset by roughly the header height
      if (diff < minDiff) {
        minDiff = diff;
        currentVisiblePage = parseInt(el.getAttribute('data-page-number') || '1', 10);
      }
    });
    
    setPageNum(currentVisiblePage);
  };

  const viewerContent = (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onContextMenu={(e) => e.preventDefault()}
      className="pdf-viewer-container fixed inset-0 h-[100dvh] z-[10002] flex flex-col bg-slate-950/95 backdrop-blur-md select-none"
    >
      {/* Dynamic CSS styles to ensure fullscreen mode preserves flex column layout and background */}
      <style>{`
        .pdf-viewer-container:fullscreen {
          background-color: #020617 !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        .pdf-viewer-container:-webkit-full-screen {
          background-color: #020617 !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        .pdf-viewer-container canvas {
          user-select: none !important;
          -webkit-user-select: none !important;
          pointer-events: none !important;
        }
        .pdf-viewer-container img {
          user-select: none !important;
          -webkit-user-select: none !important;
          -webkit-user-drag: none !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* Global Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-slate-900/80 border-b border-slate-800 text-white backdrop-blur-md z-50 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
            {isImage ? (
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            ) : (
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            )}
          </div>
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-sm sm:text-lg font-bold leading-tight truncate">{title}</h2>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
              Secure Document Viewer
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {allowDownload && (
            <a 
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white flex items-center gap-1 text-sm font-semibold"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors text-slate-400"
            title="Close Viewer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Viewer Main Body */}
      <div className="flex-1 w-full relative min-h-0 flex flex-col bg-slate-950">
        
        {/* PDF Floating Navigation & Zoom Control Overlay */}
        {!isImage && pdfDoc && !error && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 px-4 py-2 bg-slate-900/90 border border-slate-800 text-white rounded-full shadow-2xl backdrop-blur-md z-40 select-none">
            {/* Page Status Indicator */}
            <div className="text-xs font-semibold text-slate-300 pr-4 border-r border-slate-800">
              Page {pageNum} / {numPages}
            </div>

            {/* Compact Zoom Controls (+ and -) */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                disabled={scale <= 0.5}
                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-full text-base font-bold transition-colors cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-xs font-semibold text-slate-300 min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => setScale(s => Math.min(3.0, s + 0.25))}
                disabled={scale >= 3.0}
                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-full text-base font-bold transition-colors cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Document Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full h-full relative overflow-y-auto p-4 flex flex-col items-center min-h-0 scroll-smooth"
        >
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-400 animate-pulse">Loading document...</p>
            </div>
          )}

          {/* Error Fallback */}
          {error ? (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto z-10">
              <FileText className="w-16 h-16 text-rose-500 mb-4" />
              <p className="text-slate-200 font-medium mb-2">Could Not Render PDF</p>
              <p className="text-xs text-slate-400 mb-6">{error}</p>
              {isAdmin && (
                <a 
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open PDF in New Tab
                </a>
              )}
            </div>
          ) : isImage ? (
            <img 
              src={url} 
              alt={title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain z-10 pointer-events-none select-none"
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            !isLoading && pdfDoc && (
              <div className="flex flex-col items-center gap-6 max-w-full z-10 py-4">
                {Array.from({ length: numPages }, (_, index) => (
                  <div 
                    key={index + 1} 
                    data-page-number={index + 1}
                    className="relative shadow-2xl bg-white p-2 rounded-lg max-w-full select-none"
                  >
                    <PDFPageRenderer pdfDoc={pdfDoc} pageNum={index + 1} scale={scale} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );

  return createPortal(viewerContent, document.body);
};
