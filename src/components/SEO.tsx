import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export const SEO = ({ 
  title = 'Hamro +2 Hub - The Ultimate Platform for +2 Students in Nepal', 
  description = 'Access quality study materials, past year questions (PYQs), and contribute to help your peers succeed in their +2 journey.', 
  keywords = 'NEB, +2, class 11, class 12, notes, pyq, nepal, study materials, science, management',
  image = 'https://images.unsplash.com/photo-1543731068-7e0f5beff43a?q=80&w=2070&auto=format&fit=crop',
  url = 'https://hamroplus2hub.com'
}: SEOProps) => {
  const fullTitle = title === 'Hamro +2 Hub - The Ultimate Platform for +2 Students in Nepal' ? title : `${title} | Hamro +2 Hub`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
};
