import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface LoadingContextType {
  isLoading: boolean;
  progress: number;
  statusText: string;
  startLoading: (initialProgress?: number, text?: string) => void;
  setProgress: (percent: number, text?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  progress: 0,
  statusText: '',
  startLoading: () => {},
  setProgress: () => {},
  stopLoading: () => {},
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgressState] = useState(0);
  const [statusText, setStatusText] = useState('');
  const location = useLocation();
  const timerRef = useRef<any>(null);
  const hideTimerRef = useRef<any>(null);

  const startLoading = (initialProgress: number = 20, text: string = '') => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsLoading(true);
    setProgressState(Math.max(5, initialProgress));
    setStatusText(text);

    // Gently increment progress if no manual updates arrive
    timerRef.current = setInterval(() => {
      setProgressState(prev => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        const step = Math.max(1, (90 - prev) * 0.1);
        return prev + step;
      });
    }, 200);
  };

  const setProgress = (percent: number, text?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsLoading(true);
    setProgressState(Math.min(100, Math.max(0, percent)));
    if (text !== undefined) setStatusText(text);

    if (percent >= 100) {
      stopLoading();
    }
  };

  const stopLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgressState(100);

    hideTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      setProgressState(0);
      setStatusText('');
    }, 300);
  };

  // Automatically trigger loading bar on route navigation
  useEffect(() => {
    startLoading(30);
    const finishNav = setTimeout(() => {
      stopLoading();
    }, 250);

    return () => clearTimeout(finishNav);
  }, [location.pathname, location.search]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        progress,
        statusText,
        startLoading,
        setProgress,
        stopLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
