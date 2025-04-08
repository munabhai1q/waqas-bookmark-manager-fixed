import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const bookmarkCategories = pgTable("bookmark_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  userId: integer("user_id").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBookmarkCategorySchema = createInsertSchema(bookmarkCategories).pick({
  name: true,
  userId: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  title: true,
  url: true,
  description: true,
  categoryId: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBookmarkCategory = z.infer<typeof insertBookmarkCategorySchema>;
export type BookmarkCategory = typeof bookmarkCategories.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
