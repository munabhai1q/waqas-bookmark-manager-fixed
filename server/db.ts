import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { eq, and, sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { log } from './vite';

// Database connection for queries
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Set up connection for migrations
const migrationClient = postgres(connectionString, { max: 1 });

// Set up connection for queries
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Automatically run migrations on startup
export async function runMigrations() {
  try {
    log('Running database migrations...', 'database');
    const start = Date.now();
    
    // Using raw drizzle to run the migrations
    await migrate(drizzle(migrationClient), { migrationsFolder: './migrations' });
    
    const duration = Date.now() - start;
    log(`Migrations completed in ${duration}ms`, 'database');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

// Helper function to check achievement progress
export async function checkAndUpdateAchievements(userId: number) {
  try {
    // Get all achievements
    const allAchievements = await db.select().from(schema.achievements);
    
    // For each achievement, check user's progress
    for (const achievement of allAchievements) {
      let progress = 0;
      
      // Calculate progress based on achievement type
      switch (achievement.type) {
        case 'bookmark_count':
          const bookmarkCount = await db
            .select({ count: sql`count(*)` })
            .from(schema.bookmarks)
            .where(eq(schema.bookmarks.userId, userId));
          progress = Number(bookmarkCount[0].count);
          break;
          
        case 'category_count':
          const categoryCount = await db
            .select({ count: sql`count(*)` })
            .from(schema.bookmarkCategories)
            .where(eq(schema.bookmarkCategories.userId, userId));
          progress = Number(categoryCount[0].count);
          break;
          
        case 'visit_count':
          const visitCount = await db
            .select({ sum: sql`sum(${schema.bookmarks.visitCount})` })
            .from(schema.bookmarks)
            .where(eq(schema.bookmarks.userId, userId));
          progress = Number(visitCount[0].sum || 0);
          break;
      }
      
      // Get existing user achievement or create new one
      const [existingAchievement] = await db
        .select()
        .from(schema.userAchievements)
        .where(and(
          eq(schema.userAchievements.userId, userId),
          eq(schema.userAchievements.achievementId, achievement.id)
        ));
      
      if (existingAchievement) {
        // Update progress
        const currentProgress = existingAchievement.progress || 0;
        if (progress > currentProgress) {
          await db
            .update(schema.userAchievements)
            .set({ progress })
            .where(eq(schema.userAchievements.id, existingAchievement.id));
        }
      } else {
        // Create new user achievement
        await db.insert(schema.userAchievements).values({
          userId,
          achievementId: achievement.id,
          progress,
          unlockedAt: progress >= achievement.threshold ? new Date() : null,
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return false;
  }
}