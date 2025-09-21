'use client';

import { remark } from 'remark';
import remarkHtml from 'remark-html';
import { useEffect, useState } from 'react';

interface AnnouncementDisplayProps {
  content: string;
  className?: string;
}

export function AnnouncementDisplay({ content, className = '' }: AnnouncementDisplayProps) {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const processMarkdown = async () => {
      try {
        const result = await remark()
          .use(remarkHtml)
          .process(content);
        setHtmlContent(result.toString());
      } catch (error) {
        console.error('Error processing markdown:', error);
        setHtmlContent('');
      }
    };

    if (content?.trim()) {
      processMarkdown();
    } else {
      setHtmlContent('');
    }
  }, [content]);

  if (!htmlContent) {
    return null;
  }

  return (
    <div
      className={`announcements-container ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        /* Custom CSS for multi-column layout of top-level list items */
      }}
    />
  );
}

// CSS styles to be added to global CSS
export const announcementStyles = `
.announcements-container ul {
  @apply list-none p-0 m-0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.announcements-container > ul > li {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-4;
  break-inside: avoid;
}

.announcements-container > ul > li::before {
  content: '📅';
  margin-right: 0.5rem;
}

.announcements-container ul li ul {
  @apply mt-2 ml-4 list-disc;
  display: block;
  grid-template-columns: none;
}

.announcements-container ul li ul li {
  @apply bg-transparent border-0 p-0 mb-1;
}

.announcements-container ul li ul li::before {
  content: none;
}

.announcements-container a {
  @apply text-blue-600 hover:text-blue-800 underline;
}

.announcements-container p {
  @apply mb-2;
}

.announcements-container strong {
  @apply font-semibold;
}

.announcements-container em {
  @apply italic;
}

@media (max-width: 768px) {
  .announcements-container ul {
    grid-template-columns: 1fr;
  }
}
`;