import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookmarkSchema, insertBookmarkCategorySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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
  
  // Delete a category
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
      
      await storage.deleteCategory(categoryId);
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
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

  app.use('/api', apiRouter);
  
  const httpServer = createServer(app);
  return httpServer;
}
