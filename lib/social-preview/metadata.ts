import type { Metadata } from 'next';

interface SocialContentMetadataOptions {
  imageAlt: string;
  name: string;
  path: string;
}

export function createSocialContentMetadata({
  imageAlt,
  name,
  path,
}: SocialContentMetadataOptions): Metadata {
  const imageUrl = `${path}/image`;

  return {
    title: name,
    description: null,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'fr_FR',
      siteName: 'PMC Plan',
      url: path,
      title: name,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: imageAlt,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      images: [imageUrl],
    },
  };
}
