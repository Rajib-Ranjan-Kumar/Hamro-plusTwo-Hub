import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SecurePDFViewer } from '../components/SecurePDFViewer';

export const ViewerPage = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');
  const id = searchParams.get('id');
  const title = searchParams.get('title') || 'Document';
  const allowDownload = searchParams.get('download') === 'true';

  useEffect(() => {
    document.title = title;
    return () => {
      document.title = 'Hamro +2 Hub - Document Viewer';
    };
  }, [title]);

  if (!url && !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>No document specified.</p>
      </div>
    );
  }

  return (
    <SecurePDFViewer 
      url={url || undefined} 
      documentId={id || undefined}
      title={title} 
      allowDownload={allowDownload}
      onClose={() => window.close()} 
    />
  );
};
