import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SecurePDFViewer } from '../components/SecurePDFViewer';

export const ViewerPage = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'Document';
  const allowDownload = searchParams.get('download') === 'true';

  useEffect(() => {
    document.title = title;
    return () => {
      document.title = 'BCA Notes Nepal';
    };
  }, [title]);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>No document URL provided.</p>
      </div>
    );
  }

  return (
    <SecurePDFViewer 
      url={url} 
      title={title} 
      allowDownload={allowDownload}
      onClose={() => window.close()} 
    />
  );
};
