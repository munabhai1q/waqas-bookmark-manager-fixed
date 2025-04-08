import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookmarkSchema, insertBookmarkCategorySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import axios from 'axios';

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Get all categories for a user
  apiRouter.get('/categories', async (req: Request, res: Response) => {
    try {
      // In a real app, userId would come from the authenticated session
      const userId = 1; // Using demo user
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });
  
  // Create a new category
  apiRouter.post('/categories', async (req: Request, res: Response) => {
    try {
      // In a real app, userId would come from the authenticated session
      const userId = 1; // Using demo user
      
      const data = insertBookmarkCategorySchema.parse({
        ...req.body,
        userId
      });
      
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: 'Failed to create category' });
      }
    }
  });
  
  // Delete a category and all its bookmarks
  apiRouter.delete('/categories/:id', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      const category = await storage.getCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // In a real app, check if the category belongs to the authenticated user
      
      // First get all bookmarks in this category
      const bookmarksInCategory = await storage.getBookmarksByCategory(categoryId);
      
      // Delete each bookmark
      for (const bookmark of bookmarksInCategory) {
        await storage.deleteBookmark(bookmark.id);
      }
      
      // Then delete the category
      await storage.deleteCategory(categoryId);
      res.status(200).json({ 
        message: 'Category and its bookmarks deleted successfully',
        deletedBookmarksCount: bookmarksInCategory.length
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });
  
  // Get all bookmarks for a user
  apiRouter.get('/bookmarks', async (req: Request, res: Response) => {
    try {
      // In a real app, userId would come from the authenticated session
      const userId = 1; // Using demo user
      const bookmarks = await storage.getBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bookmarks' });
    }
  });
  
  // Get bookmarks by category
  apiRouter.get('/bookmarks/category/:categoryId', async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
      
      const bookmarks = await storage.getBookmarksByCategory(categoryId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch bookmarks' });
    }
  });
  
  // Create a new bookmark
  apiRouter.post('/bookmarks', async (req: Request, res: Response) => {
    try {
      // In a real app, userId would come from the authenticated session
      const userId = 1; // Using demo user
      
      const data = insertBookmarkSchema.parse({
        ...req.body,
        userId
      });
      
      const bookmark = await storage.createBookmark(data);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: 'Failed to create bookmark' });
      }
    }
  });
  
  // Update a bookmark
  apiRouter.patch('/bookmarks/:id', async (req: Request, res: Response) => {
    try {
      const bookmarkId = parseInt(req.params.id);
      if (isNaN(bookmarkId)) {
        return res.status(400).json({ message: 'Invalid bookmark ID' });
      }
      
      const bookmark = await storage.getBookmarkById(bookmarkId);
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      
      // In a real app, check if the bookmark belongs to the authenticated user
      
      const updatedBookmark = await storage.updateBookmark(bookmarkId, req.body);
      res.json(updatedBookmark);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update bookmark' });
    }
  });
  
  // Delete a bookmark
  apiRouter.delete('/bookmarks/:id', async (req: Request, res: Response) => {
    try {
      const bookmarkId = parseInt(req.params.id);
      if (isNaN(bookmarkId)) {
        return res.status(400).json({ message: 'Invalid bookmark ID' });
      }
      
      const bookmark = await storage.getBookmarkById(bookmarkId);
      if (!bookmark) {
        return res.status(404).json({ message: 'Bookmark not found' });
      }
      
      // In a real app, check if the bookmark belongs to the authenticated user
      
      await storage.deleteBookmark(bookmarkId);
      res.status(200).json({ message: 'Bookmark deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete bookmark' });
    }
  });

  // Proxy endpoint for website content
  // This helps bypass X-Frame-Options restrictions by fetching content through our server
  apiRouter.get('/proxy', async (req: Request, res: Response) => {
    try {
      const targetUrl = req.query.url as string;
      
      if (!targetUrl) {
        return res.status(400).json({ message: 'URL parameter is required' });
      }
      
      console.log(`Proxying request to: ${targetUrl}`);
      
      // Ensure URL has a protocol
      let processedUrl = targetUrl;
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = 'https://' + processedUrl;
      }
      
      console.log(`Proxying to processed URL: ${processedUrl}`);
      
      const response = await axios.get(processedUrl, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });
      
      // Set response headers to allow embedding
      res.setHeader('Content-Type', response.headers['content-type'] || 'text/html');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *");
      res.removeHeader('X-Frame-Options');
      
      // Send the response
      res.send(response.data);
    } catch (error: any) {
      console.error('Proxy error:', error);
      res.status(500).json({ message: 'Failed to proxy content', error: error?.message || String(error) });
    }
  });

  app.use('/api', apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
