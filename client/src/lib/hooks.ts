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

// Hook for using local storage
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Custom hook to test if a URL can be embedded in an iframe
export function useTestEmbedding(url: string) {
  const [canEmbed, setCanEmbed] = useState(true);

  useEffect(() => {
    // Skip empty URLs
    if (!url) return;
    
    try {
      // Check if the URL is a temp-mail service which has special handling requirements
      if (url) {
        const domainCheck = new URL(url);
        const domain = domainCheck.hostname.toLowerCase();
        
        // These sites require special handling - we'll show the "open in new tab" option
        if (domain.includes('temp-mail.org') || domain.includes('tempmail')) {
          console.log('Temp mail service detected, setting canEmbed to false');
          setCanEmbed(false);
          return;
        }
      }
    } catch (e) {
      console.error('URL parsing error:', e);
    }
    
    // For all other sites, we'll allow embedding
    // This still keeps the check in place in case we decide to block certain sites in the future
    const nonEmbeddableSites: string[] = [
      // No other sites are blocked
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
