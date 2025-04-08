import { 
  users, type User, type InsertUser,
  bookmarkCategories, type BookmarkCategory, type InsertBookmarkCategory,
  bookmarks, type Bookmark, type InsertBookmark,
  sections, type Section, type InsertSection,
  achievements, type Achievement, type InsertAchievement,
  userAchievements, type UserAchievement
} from "@shared/schema";
import session from "express-session";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Bookmark Category methods
  getCategories(userId: number): Promise<BookmarkCategory[]>;
  getCategoryById(id: number): Promise<BookmarkCategory | undefined>;
  createCategory(category: InsertBookmarkCategory): Promise<BookmarkCategory>;
  updateCategory(id: number, category: Partial<InsertBookmarkCategory>): Promise<BookmarkCategory | undefined>;
  deleteCategory(id: number): Promise<void>;
  
  // Bookmark methods
  getBookmarks(userId: number): Promise<Bookmark[]>;
  getBookmarksByCategory(categoryId: number): Promise<Bookmark[]>;
  getBookmarksBySection(sectionId: number): Promise<Bookmark[]>;
  getBookmarkById(id: number): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  updateBookmark(id: number, bookmark: Partial<InsertBookmark>): Promise<Bookmark | undefined>;
  incrementBookmarkVisit(id: number): Promise<void>;
  deleteBookmark(id: number): Promise<void>;
  
  // Section methods
  getSections(userId: number): Promise<Section[]>;
  getSectionById(id: number): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, section: Partial<InsertSection>): Promise<Section | undefined>;
  deleteSection(id: number): Promise<void>;
  
  // Achievement methods
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: number): Promise<(UserAchievement & {achievement: Achievement})[]>;
  checkUserAchievements(userId: number): Promise<UserAchievement[]>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

import { db, checkAndUpdateAchievements } from './db';
import connectPgSimple from 'connect-pg-simple';
import createMemoryStore from 'memorystore';
import postgres from 'postgres';
import { eq, and, sql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Initialize session store
    if (process.env.DATABASE_URL) {
      // Use PostgreSQL session store when DB is available
      const PgSession = connectPgSimple(session);
      this.sessionStore = new PgSession({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
        createTableIfMissing: true,
      });
    } else {
      // Fallback to memory store
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      });
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Bookmark Category methods
  async getCategories(userId: number): Promise<BookmarkCategory[]> {
    return db
      .select()
      .from(bookmarkCategories)
      .where(eq(bookmarkCategories.userId, userId))
      .orderBy(bookmarkCategories.position);
  }
  
  async getCategoryById(id: number): Promise<BookmarkCategory | undefined> {
    const [category] = await db
      .select()
      .from(bookmarkCategories)
      .where(eq(bookmarkCategories.id, id));
    return category;
  }
  
  async createCategory(category: InsertBookmarkCategory): Promise<BookmarkCategory> {
    const [newCategory] = await db
      .insert(bookmarkCategories)
      .values(category)
      .returning();
    return newCategory;
  }
  
  async updateCategory(id: number, categoryData: Partial<InsertBookmarkCategory>): Promise<BookmarkCategory | undefined> {
    const [updatedCategory] = await db
      .update(bookmarkCategories)
      .set(categoryData)
      .where(eq(bookmarkCategories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<void> {
    // First delete all bookmarks in this category
    await db
      .delete(bookmarks)
      .where(eq(bookmarks.categoryId, id));
    
    // Then delete the category
    await db
      .delete(bookmarkCategories)
      .where(eq(bookmarkCategories.id, id));
  }
  
  // Bookmark methods
  async getBookmarks(userId: number): Promise<Bookmark[]> {
    return db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
  }
  
  async getBookmarksByCategory(categoryId: number): Promise<Bookmark[]> {
    return db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.categoryId, categoryId));
  }
  
  async getBookmarksBySection(sectionId: number): Promise<Bookmark[]> {
    return db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.sectionId, sectionId));
  }
  
  async getBookmarkById(id: number): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, id));
    return bookmark;
  }
  
  async createBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    const [newBookmark] = await db
      .insert(bookmarks)
      .values(bookmark)
      .returning();
    return newBookmark;
  }
  
  async updateBookmark(id: number, bookmarkData: Partial<InsertBookmark>): Promise<Bookmark | undefined> {
    const [updatedBookmark] = await db
      .update(bookmarks)
      .set(bookmarkData)
      .where(eq(bookmarks.id, id))
      .returning();
    return updatedBookmark;
  }
  
  async incrementBookmarkVisit(id: number): Promise<void> {
    await db
      .update(bookmarks)
      .set({ 
        visitCount: sql`${bookmarks.visitCount} + 1`,
        lastVisited: new Date()
      })
      .where(eq(bookmarks.id, id));
    
    // Check for achievements
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.id, id));
    
    if (bookmark) {
      await checkAndUpdateAchievements(bookmark.userId);
    }
  }
  
  async deleteBookmark(id: number): Promise<void> {
    await db
      .delete(bookmarks)
      .where(eq(bookmarks.id, id));
  }
  
  // Section methods
  async getSections(userId: number): Promise<Section[]> {
    return db
      .select()
      .from(sections)
      .where(eq(sections.userId, userId))
      .orderBy(sections.position);
  }
  
  async getSectionById(id: number): Promise<Section | undefined> {
    const [section] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, id));
    return section;
  }
  
  async createSection(section: InsertSection): Promise<Section> {
    const [newSection] = await db
      .insert(sections)
      .values(section)
      .returning();
    return newSection;
  }
  
  async updateSection(id: number, sectionData: Partial<InsertSection>): Promise<Section | undefined> {
    const [updatedSection] = await db
      .update(sections)
      .set(sectionData)
      .where(eq(sections.id, id))
      .returning();
    return updatedSection;
  }
  
  async deleteSection(id: number): Promise<void> {
    // Update bookmarks to remove section reference
    await db
      .update(bookmarks)
      .set({ sectionId: null })
      .where(eq(bookmarks.sectionId, id));
    
    // Delete the section
    await db
      .delete(sections)
      .where(eq(sections.id, id));
  }
  
  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements);
  }
  
  async getUserAchievements(userId: number): Promise<(UserAchievement & {achievement: Achievement})[]> {
    const results = await db
      .select({
        userAchievement: userAchievements,
        achievement: achievements
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
    
    return results.map(r => ({
      ...r.userAchievement,
      achievement: r.achievement
    }));
  }
  
  async checkUserAchievements(userId: number): Promise<UserAchievement[]> {
    // Use the helper function from db.ts
    await checkAndUpdateAchievements(userId);
    
    // Return all user achievements
    return db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }
}

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();
