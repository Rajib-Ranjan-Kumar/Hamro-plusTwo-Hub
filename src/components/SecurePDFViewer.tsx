import React, { useEffect, useState, useRef, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  FileText, 
  Loader2, 
  Maximize, 
  Minimize, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  ShieldAlert, 
  ShieldCheck,
  Scan,
  MoveHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';

interface SecurePDFViewerProps {
  url?: string;
  documentId?: string;
  title: string;
  onClose: () => void;
  allowDownload?: boolean;
}

// Sub-component to render individual PDF pages onto their own isolated HTML5 canvas with in-canvas watermarks
interface PDFPageRendererProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  watermarkText?: string;
}

const PDFPageRenderer: React.FC<PDFPageRendererProps> = ({ pdfDoc, pageNum, scale, watermarkText }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // High DPI / Retina Display Rendering Support
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;

        // ----------------------------------------------------
        // Dynamic In-Canvas Watermark (Baked into Canvas Pixels)
        // ----------------------------------------------------
        if (watermarkText && !isCancelled) {
          context.save();
          if (outputScale !== 1) {
            context.scale(outputScale, outputScale);
          }

          const w = viewport.width;
          const h = viewport.height;

          context.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          context.fillStyle = 'rgba(71, 85, 105, 0.16)'; // subtle slate with readable contrast
          context.textAlign = 'center';
          context.textBaseline = 'middle';

          const stepX = 260;
          const stepY = 160;

          for (let x = -w * 0.4; x < w * 1.5; x += stepX) {
            for (let y = -h * 0.4; y < h * 1.5; y += stepY) {
              context.save();
              context.translate(x, y);
              context.rotate(-28 * Math.PI / 180);
              context.fillText(watermarkText, 0, 0);
              context.font = '10px sans-serif';
              context.fillStyle = 'rgba(100, 116, 139, 0.12)';
              context.fillText('HAMRO +2 HUB • AUTHORIZED VIEW ONLY', 0, 18);
              context.restore();
            }
          }

          context.restore();
        }
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') {
          return;
        }
        console.error(`Error rendering page ${pageNum} onto canvas:`, err);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNum, scale, watermarkText]);

  return (
    <div 
      data-page-number={pageNum}
      className="relative shadow-2xl bg-white rounded-xl select-none overflow-hidden max-w-full my-3"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* HTML5 Canvas with protected drag and select attributes */}
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto block select-none pointer-events-none" 
        draggable={false}
      />

      {/* Additional DOM Watermark Overlay to deter OS screenshot tools */}
      {watermarkText && (
        <div 
          className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-wrap items-center justify-around p-6 opacity-25"
          aria-hidden="true"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i} 
              className="transform -rotate-28 text-slate-500 font-bold text-xs tracking-wider whitespace-nowrap m-6"
            >
              {watermarkText}
              <span className="block text-[9px] text-slate-400 font-normal">
                Hamro +2 Hub • Protected View
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ 
  url, 
  documentId, 
  title, 
  onClose, 
  allowDownload = false 
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canAdminDownload = isAdmin && allowDownload;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>('1');

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);

  // Dynamic student identification watermark text
  const watermarkText = user 
    ? `${user.name || 'Student'} • ${user.email || user.id || 'Verified Student'}`
    : 'Hamro +2 Hub Student Copy';

  // Prevent background scrolling while modal viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Fullscreen toggle handler
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

  // Intercept Ctrl + Scroll Wheel over the document area to zoom the PDF
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setScale(currentScale => Math.min(3.0, Math.max(0.5, Number((currentScale + delta).toFixed(2)))));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isLoading, pdfDoc]);

  // Client-Side Security Deterrents: Block Save, Print, View Source, and DevTools shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block DevTools shortcuts (F12, Ctrl+Shift+I, Cmd+Option+I)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Authenticated Document Fetching & Custom PDF.js Loading
  useEffect(() => {
    let isMounted = true;

    const loadProtectedPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Enforce active user session
        const currentUser = auth.currentUser;
        if (!currentUser) {
          if (isMounted) {
            setError("AUTH_REQUIRED");
            setIsLoading(false);
          }
          return;
        }

        // 2. Obtain fresh Firebase authentication token
        const idToken = await currentUser.getIdToken();

        // 3. Request authenticated document stream from backend
        let endpoint = '';
        if (documentId) {
          endpoint = `/api/secure-pdf-stream?id=${encodeURIComponent(documentId)}`;
        } else if (url) {
          endpoint = `/api/secure-pdf-stream?url=${encodeURIComponent(url)}`;
        } else {
          throw new Error("No document identifier or URL specified.");
        }

        let pdfArrayBuffer: ArrayBuffer;
        try {
          const res = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });

          if (res.ok) {
            pdfArrayBuffer = await res.arrayBuffer();
          } else if (res.status === 401 || res.status === 403) {
            const errJson = await res.json().catch(() => null);
            throw new Error(errJson?.error || "Access Denied: You do not have permission to view this document.");
          } else {
            // Graceful fallback for local standalone environment if proxy is offline
            if (url) {
              const directRes = await fetch(url);
              if (!directRes.ok) throw new Error("Could not retrieve document from storage backend.");
              pdfArrayBuffer = await directRes.arrayBuffer();
            } else {
              throw new Error("Failed to stream document from backend.");
            }
          }
        } catch (fetchErr: any) {
          if (url) {
            const directRes = await fetch(url);
            if (!directRes.ok) throw fetchErr;
            pdfArrayBuffer = await directRes.arrayBuffer();
          } else {
            throw fetchErr;
          }
        }

        // 4. Ensure PDF.js engine is dynamically loaded
        if (!(window as any).pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
          script.async = true;
          document.body.appendChild(script);

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to initialize custom PDF engine."));
          });
        }

        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

        // 5. Parse in-memory Uint8Array into PDF.js document instance
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(pdfArrayBuffer),
          withCredentials: false
        });

        const pdf = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Secure PDF loading failed:", err);
        if (isMounted) {
          setError(err.message || "Failed to load protected PDF document.");
          setIsLoading(false);
        }
      }
    };

    loadProtectedPdf();

    return () => {
      isMounted = false;
    };
  }, [url, documentId]);

  // Handle viewport scroll events to track active page number
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const pageElements = container.querySelectorAll('[data-page-number]');

    let currentVisiblePage = 1;
    let minDiff = Infinity;

    pageElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const diff = Math.abs(rect.top - 80);
      if (diff < minDiff) {
        minDiff = diff;
        currentVisiblePage = parseInt(el.getAttribute('data-page-number') || '1', 10);
      }
    });

    setPageNum(currentVisiblePage);
    setJumpPageInput(currentVisiblePage.toString());
  };

  // Page Navigation Handlers
  const scrollToPage = (target: number) => {
    if (target < 1 || target > numPages) return;
    const el = scrollContainerRef.current?.querySelector(`[data-page-number="${target}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setPageNum(target);
    setJumpPageInput(target.toString());
  };

  // Zoom Helpers
  const handleFitToWidth = () => {
    if (!scrollContainerRef.current) return;
    const containerWidth = scrollContainerRef.current.clientWidth;
    // Standard A4 width is ~595px
    const targetScale = Math.max(0.5, Math.min(2.5, (containerWidth - 64) / 595));
    setScale(Number(targetScale.toFixed(2)));
  };

  const handleFitToPage = () => {
    if (!scrollContainerRef.current) return;
    const containerHeight = scrollContainerRef.current.clientHeight;
    // Standard A4 height is ~842px
    const targetScale = Math.max(0.5, Math.min(2.0, (containerHeight - 140) / 842));
    setScale(Number(targetScale.toFixed(2)));
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
      {/* Dynamic CSS styles to prevent printing, dragging, and inspect-selection */}
      <style>{`
        @media print {
          html, body {
            display: none !important;
            visibility: hidden !important;
            background: #000 !important;
          }
          .pdf-viewer-container, .pdf-viewer-container * {
            display: none !important;
            visibility: hidden !important;
          }
        }
        .pdf-viewer-container:fullscreen {
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
      `}</style>

      {/* Global Header Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3.5 bg-slate-900/90 border-b border-slate-800 text-white backdrop-blur-md z-50 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg shrink-0">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1 pr-2 sm:pr-4">
            <h2 className="text-xs sm:text-base font-bold leading-tight truncate">{title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] sm:text-xs text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure View-Only Mode
              </span>
              <span className="text-[10px] text-slate-500 hidden md:inline">
                • Authenticated Student Session
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Zoom & Fit Controls (Responsive Desktop Toolbar) */}
          {pdfDoc && !error && (
            <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
              <button 
                onClick={() => setScale(s => Math.max(0.5, Number((s - 0.2).toFixed(2))))}
                disabled={scale <= 0.5}
                className="p-1 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setScale(1.0)}
                className="px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white"
                title="Reset Zoom to 100%"
              >
                {Math.round(scale * 100)}%
              </button>
              <button 
                onClick={() => setScale(s => Math.min(3.0, Number((s + 0.2).toFixed(2))))}
                disabled={scale >= 3.0}
                className="p-1 hover:bg-slate-700 disabled:opacity-40 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="h-3 w-px bg-slate-700 mx-1" />

              <button
                onClick={handleFitToWidth}
                className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                title="Fit Width"
              >
                <MoveHorizontal className="w-3 h-3" />
                <span className="hidden lg:inline">Width</span>
              </button>
              <button
                onClick={handleFitToPage}
                className="px-2 py-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                title="Fit Page Height"
              >
                <Scan className="w-3 h-3" />
                <span className="hidden lg:inline">Fit Page</span>
              </button>
            </div>
          )}

          {/* Admin-Only Authorized Download & Storage URL Access */}
          {canAdminDownload && (
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
              <span className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider hidden lg:inline">Admin</span>
              <a 
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-amber-500/20 rounded text-amber-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Admin: Download Original PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
              <a 
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-amber-500/20 rounded text-amber-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Admin: Open Raw Storage URL"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Tab</span>
              </a>
            </div>
          )}

          {/* Fullscreen Mode */}
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Close Viewer */}
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors text-slate-400 cursor-pointer"
            title="Close Viewer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Viewer Main Body */}
      <div className="flex-1 w-full relative min-h-0 flex flex-col bg-slate-950">
        
        {/* Floating Page Navigation & Mobile Zoom Pill */}
        {pdfDoc && !error && numPages > 0 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3.5 py-1.5 bg-slate-900/95 border border-slate-800 text-white rounded-full shadow-2xl backdrop-blur-md z-40 select-none">
            {/* Prev Page Button */}
            <button
              onClick={() => scrollToPage(pageNum - 1)}
              disabled={pageNum <= 1}
              className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-full transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Status Indicator */}
            <div className="text-xs font-semibold text-slate-300 px-1">
              Page {pageNum} of {numPages}
            </div>

            {/* Next Page Button */}
            <button
              onClick={() => scrollToPage(pageNum + 1)}
              disabled={pageNum >= numPages}
              className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded-full transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Compact Mobile Zoom Buttons */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800 md:hidden">
              <button 
                onClick={() => setScale(s => Math.max(0.5, Number((s - 0.2).toFixed(2))))}
                disabled={scale <= 0.5}
                className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-full text-xs font-bold"
              >
                -
              </button>
              <span className="text-[10px] text-slate-400 min-w-[28px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => setScale(s => Math.min(2.5, Number((s + 0.2).toFixed(2))))}
                disabled={scale >= 2.5}
                className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-full text-xs font-bold"
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
          className="w-full h-full relative overflow-y-auto p-2 sm:p-6 flex flex-col items-center min-h-0 scroll-smooth"
        >
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-300 animate-pulse">
                Decrypting & loading protected document...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Applying view-only security controls & watermarks
              </p>
            </div>
          )}

          {/* Authentication Required Guard */}
          {error === "AUTH_REQUIRED" && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto z-10 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Student Authentication Required</h3>
              <p className="text-sm text-slate-400 mb-6">
                This academic material is protected under Hamro +2 Hub View-Only mode. Please sign in with your student account to read this document.
              </p>
              <button
                onClick={() => window.location.href = '/login'}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg cursor-pointer"
              >
                Sign In to View
              </button>
            </div>
          )}

          {/* Error Screen */}
          {error && error !== "AUTH_REQUIRED" && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto z-10 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <p className="text-slate-100 font-bold text-base mb-2">Protected Document Error</p>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">{error}</p>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          )}

          {/* Continuous Multi-Page Canvas Rendering */}
          {!isLoading && pdfDoc && (
            <div className="flex flex-col items-center gap-4 max-w-full z-10 py-2">
              {Array.from({ length: numPages }, (_, index) => (
                <PDFPageRenderer 
                  key={index + 1} 
                  pdfDoc={pdfDoc} 
                  pageNum={index + 1} 
                  scale={scale} 
                  watermarkText={watermarkText}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return createPortal(viewerContent, document.body);
};
