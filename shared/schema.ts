import { pgTable, text, serial, integer, timestamp, json, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  theme: text("theme").default("dark"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  settings: json("settings"),
});

export const bookmarkCategories = pgTable("bookmark_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  color: text("color").default("#6366f1"),
  icon: text("icon"),
  position: integer("position").default(0),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull(),
  userId: integer("user_id").notNull(),
  position: json("position").default({}),
  customSettings: json("custom_settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  lastVisited: timestamp("last_visited"),
  visitCount: integer("visit_count").default(0),
  sectionId: integer("section_id"),
});

// Achievements system
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  type: text("type").notNull(), // bookmark_count, visit_count, category_count, etc.
  threshold: integer("threshold").notNull(), // Value needed to unlock
  reward: text("reward"),
  color: text("color").default("#6366f1"),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(0),
}, (table) => {
  return {
    userAchievementUnique: uniqueIndex("user_achievement_unique_idx").on(table.userId, table.achievementId),
  };
});

// Custom sections
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  position: integer("position").default(0),
  icon: text("icon"),
  color: text("color").default("#6366f1"),
  isDefault: boolean("is_default").default(false),
  settings: json("settings").default({}),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  theme: true,
});

export const insertBookmarkCategorySchema = createInsertSchema(bookmarkCategories).pick({
  name: true,
  userId: true,
  color: true,
  icon: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  title: true,
  url: true,
  description: true,
  categoryId: true,
  userId: true,
  sectionId: true,
  position: true,
  customSettings: true,
});

export const insertSectionSchema = createInsertSchema(sections).pick({
  name: true,
  userId: true,
  icon: true,
  color: true,
  isDefault: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  name: true,
  description: true,
  icon: true,
  type: true,
  threshold: true,
  reward: true,
  color: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBookmarkCategory = z.infer<typeof insertBookmarkCategorySchema>;
export type BookmarkCategory = typeof bookmarkCategories.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type UserAchievement = typeof userAchievements.$inferSelect;

// Storage types for bookmark settings
export type BookmarkPosition = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type BookmarkCustomSettings = {
  backgroundColor?: string;
  borderColors?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  scale?: number;
  zIndex?: number;
};
