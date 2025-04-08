import { useState, useEffect } from 'react';
import { apiRequest } from './queryClient';
import { Bookmark, BookmarkCategory, NewBookmark, NewCategory } from './types';

// Custom hook to check if screen is mobile
export function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// Custom hook to test if a URL can be embedded in an iframe
export function useTestEmbedding(url: string) {
  const [canEmbed, setCanEmbed] = useState(true);

  useEffect(() => {
    // Skip empty URLs
    if (!url) return;
    
    // This is a simulated check. 
    // In a real-world scenario, you'd need a server-side proxy to check for X-Frame-Options
    // or use a more sophisticated approach.
    
    // For demo purposes, we'll block certain known sites that disallow framing
    const nonEmbeddableSites = [
      'chat.openai.com',
      'linkedin.com',
      'facebook.com',
      'twitter.com'
    ];
    
    const isNonEmbeddable = nonEmbeddableSites.some(site => url.includes(site));
    setCanEmbed(!isNonEmbeddable);
  }, [url]);

  return { canEmbed };
}

// Custom hook to add a new bookmark
export async function addNewBookmark(bookmark: NewBookmark): Promise<Bookmark> {
  const response = await apiRequest('POST', '/api/bookmarks', bookmark);
  return await response.json();
}

// Custom hook to add a new category
export async function addNewCategory(category: NewCategory): Promise<BookmarkCategory> {
  const response = await apiRequest('POST', '/api/categories', category);
  return await response.json();
}

// Custom hook to delete a bookmark
export async function deleteBookmark(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/bookmarks/${id}`);
}

// Custom hook to delete a category
export async function deleteCategory(id: number): Promise<void> {
  await apiRequest('DELETE', `/api/categories/${id}`);
}
