import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Placeholder for Google Analytics or other tracking
    // e.g., window.gtag('config', 'GA_MEASUREMENT_ID', { page_path: location.pathname });
    console.log(`[Analytics] Page view: ${location.pathname}`);
  }, [location]);

  return null;
};
