import { 
  users, type User, type InsertUser,
  bookmarkCategories, type BookmarkCategory, type InsertBookmarkCategory,
  bookmarks, type Bookmark, type InsertBookmark 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bookmark Category methods
  getCategories(userId: number): Promise<BookmarkCategory[]>;
  getCategoryById(id: number): Promise<BookmarkCategory | undefined>;
  createCategory(category: InsertBookmarkCategory): Promise<BookmarkCategory>;
  deleteCategory(id: number): Promise<void>;
  
  // Bookmark methods
  getBookmarks(userId: number): Promise<Bookmark[]>;
  getBookmarksByCategory(categoryId: number): Promise<Bookmark[]>;
  getBookmarkById(id: number): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: number, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  deleteBookmark(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bookmarkCategories: Map<number, BookmarkCategory>;
  private bookmarks: Map<number, Bookmark>;
  private userId: number;
  private categoryId: number;
  private bookmarkId: number;

  constructor() {
    this.users = new Map();
    this.bookmarkCategories = new Map();
    this.bookmarks = new Map();
    this.userId = 1;
    this.categoryId = 1;
    this.bookmarkId = 1;
    
    // Add sample user
    const sampleUser: User = {
      id: this.userId,
      username: "demo",
      password: "password" // In a real app, this would be hashed
    };
    this.users.set(sampleUser.id, sampleUser);
    
    // Add sample categories
    const categories = [
      { id: this.categoryId++, name: "AI Tools", userId: 1 },
      { id: this.categoryId++, name: "Productivity", userId: 1 },
      { id: this.categoryId++, name: "Social Media", userId: 1 },
      { id: this.categoryId++, name: "Design Tools", userId: 1 }
    ];
    
    categories.forEach(category => {
      this.bookmarkCategories.set(category.id, category);
    });
    
    // Add sample bookmarks
    const sampleBookmarks = [
      { id: this.bookmarkId++, title: "ElevenLabs", url: "https://elevenlabs.io/app/home", description: "AI voice synthesis", categoryId: 1, userId: 1 },
      { id: this.bookmarkId++, title: "ChatGPT", url: "https://chat.openai.com", description: "AI chat platform", categoryId: 1, userId: 1 },
      { id: this.bookmarkId++, title: "Google Bard", url: "https://bard.google.com", description: "Google's AI assistant", categoryId: 1, userId: 1 },
      { id: this.bookmarkId++, title: "Notion", url: "https://notion.so", description: "All-in-one workspace", categoryId: 2, userId: 1 },
      { id: this.bookmarkId++, title: "Trello", url: "https://trello.com", description: "Task management", categoryId: 2, userId: 1 }
    ];
    
    sampleBookmarks.forEach(bookmark => {
      this.bookmarks.set(bookmark.id, bookmark);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Bookmark Category methods
  async getCategories(userId: number): Promise<BookmarkCategory[]> {
    return Array.from(this.bookmarkCategories.values()).filter(
      (category) => category.userId === userId
    );
  }
  
  async getCategoryById(id: number): Promise<BookmarkCategory | undefined> {
    return this.bookmarkCategories.get(id);
  }
  
  async createCategory(category: InsertBookmarkCategory): Promise<BookmarkCategory> {
    const id = this.categoryId++;
    const newCategory: BookmarkCategory = { ...category, id };
    this.bookmarkCategories.set(id, newCategory);
    return newCategory;
  }
  
  async deleteCategory(id: number): Promise<void> {
    this.bookmarkCategories.delete(id);
    
    // Delete all bookmarks in this category
    for (const [bookmarkId, bookmark] of this.bookmarks.entries()) {
      if (bookmark.categoryId === id) {
        this.bookmarks.delete(bookmarkId);
      }
    }
  }
  
  // Bookmark methods
  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(
      (bookmark) => bookmark.userId === userId
    );
  }
  
  async getBookmarksByCategory(categoryId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values()).filter(
      (bookmark) => bookmark.categoryId === categoryId
    );
  }
  
  async getBookmarkById(id: number): Promise<Bookmark | undefined> {
    return this.bookmarks.get(id);
  }
  
  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const id = this.bookmarkId++;
    const newBookmark: Bookmark = { ...bookmark, id };
    this.bookmarks.set(id, newBookmark);
    return newBookmark;
  }
  
  async updateBookmark(id: number, bookmarkUpdate: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const existingBookmark = this.bookmarks.get(id);
    if (!existingBookmark) return undefined;
    
    const updatedBookmark: Bookmark = { ...existingBookmark, ...bookmarkUpdate };
    this.bookmarks.set(id, updatedBookmark);
    return updatedBookmark;
  }
  
  async deleteBookmark(id: number): Promise<void> {
    this.bookmarks.delete(id);
  }
}

export const storage = new MemStorage();
