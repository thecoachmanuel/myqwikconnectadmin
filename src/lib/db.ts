import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dns from 'dns';
import dbJson from '../../data/db.json';
import { ABOUT_CONTENT, PRIVACY_CONTENT, TERMS_CONTENT, isLegacyBrandContent } from './legalContent';

// Ensure DNS resolution works reliably for MongoDB Atlas SRV connection strings
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}
import {
  AdminUser, AppData, User, UserImage, Interest, DiamondPack, Gift,
  LiveApplication, LiveHistory, RedeemRequest, VerificationRequest,
  Report, Post, PostContent, Comment, Story, OnboardingScreen,
  RelationshipGoal, Religion, Language, Package, PageContent,
  AdminNotification, UserNotification
} from '../models/types';

interface DatabaseData {
  admin_user: AdminUser[];
  appdata: AppData[];
  users: User[];
  images: UserImage[];
  interests: Interest[];
  package: Package[];
  diamond_packs: DiamondPack[];
  gifts: Gift[];
  live_application: LiveApplication[];
  live_history: LiveHistory[];
  redeem_requests: RedeemRequest[];
  verification_request: VerificationRequest[];
  reports: Report[];
  posts: Post[];
  post_contents: PostContent[];
  comments: Comment[];
  stories: Story[];
  onboarding_screens: OnboardingScreen[];
  relationship_goals: RelationshipGoal[];
  religions: Religion[];
  languages: Language[];
  pages: PageContent[];
  admin_notification: AdminNotification[];
  user_notification: UserNotification[];
  following_lists: { id: number; my_user_id: number; user_id: number; created_at: string; updated_at: string }[];
  liked_profiles: { id: number; my_user_id: number; user_id: number; created_at: string; updated_at: string }[];
  likes?: { id: number; post_id: number; user_id: number; created_at?: string }[];
}

const defaultData: DatabaseData = dbJson as unknown as DatabaseData;


const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

/**
 * Version of the QwikConnect About/Privacy/Terms copy stored in the database.
 * Bumping this triggers a one-off, non-destructive refresh of ONLY those page
 * fields (user accounts, posts and everything else are left untouched).
 */
const CONTENT_BRAND_VERSION = 2;

/**
 * Overwrites the legal / about page copy with the canonical QwikConnect
 * write-ups, keeping `pages[0]` and `appdata[0]` in sync.
 */
function applyBrandContent(data: DatabaseData): void {
  if (!Array.isArray(data.pages) || data.pages.length === 0) {
    data.pages = [{ id: 1, privacy: '', termsofuse: '', about: '' } as any];
  } else {
    data.pages = data.pages.map((p) => ({ ...p }));
  }
  const page = data.pages[0] as any;
  page.privacy = PRIVACY_CONTENT;
  page.termsofuse = TERMS_CONTENT;
  page.about = ABOUT_CONTENT;
  page.updated_at = new Date().toISOString();

  if (!Array.isArray(data.appdata) || data.appdata.length === 0) {
    data.appdata = [{} as any];
  } else {
    data.appdata = data.appdata.map((a) => ({ ...a }));
  }
  const appdata = data.appdata[0] as any;
  appdata.privacypolicy = PRIVACY_CONTENT;
  appdata.termsofuse = TERMS_CONTENT;
  appdata.about = ABOUT_CONTENT;
}

/**
 * Safer variant used for the local file fallback: only replaces page fields
 * that still carry the old template branding, so admin edits are preserved.
 */
function applyBrandContentIfLegacy(data: DatabaseData): void {
  if (Array.isArray(data.pages) && data.pages.length > 0) {
    data.pages = data.pages.map((p) => ({ ...p }));
    const page = data.pages[0] as any;
    if (isLegacyBrandContent(page.privacy)) page.privacy = PRIVACY_CONTENT;
    if (isLegacyBrandContent(page.termsofuse)) page.termsofuse = TERMS_CONTENT;
    if (isLegacyBrandContent(page.about)) page.about = ABOUT_CONTENT;
  }
  if (Array.isArray(data.appdata) && data.appdata.length > 0) {
    data.appdata = data.appdata.map((a) => ({ ...a }));
    const appdata = data.appdata[0] as any;
    if (isLegacyBrandContent(appdata.privacypolicy)) appdata.privacypolicy = PRIVACY_CONTENT;
    if (isLegacyBrandContent(appdata.termsofuse)) appdata.termsofuse = TERMS_CONTENT;
    if (isLegacyBrandContent(appdata.about)) appdata.about = ABOUT_CONTENT;
  }
}

function ensureDataFile(): DatabaseData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const fresh: DatabaseData = { ...defaultData };
      applyBrandContentIfLegacy(fresh);
      fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), 'utf8');
      return fresh;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const merged: DatabaseData = { ...defaultData, ...parsed };
    applyBrandContentIfLegacy(merged);
    return merged;
  } catch {
    return defaultData;
  }
}

function saveData(data: DatabaseData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Read-only filesystem on serverless environments (e.g. Vercel) is safely handled
  }
}

// Global cached database connection & memory state
let dbCache: DatabaseData | null = null;
let lastMongoSync = 0;

interface MongoGlobalCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalCache: MongoGlobalCache = ((global as any).mongooseCached =
  (global as any).mongooseCached || { conn: null, promise: null });

let mongoDisabledUntil = 0;

export async function connectMongoDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (Date.now() < mongoDisabledUntil) return null;

  if (globalCache.conn && mongoose.connection.readyState === 1) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const dbName = process.env.MONGODB_DB_NAME || 'myqwikconnectadmin';
    globalCache.promise = mongoose
      .connect(uri, {
        dbName,
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
      })
      .then((m) => {
        console.log(`[MongoDB] Connected successfully to database '${m.connection.db?.databaseName || dbName}'`);
        return m;
      })
      .catch((err) => {
        globalCache.promise = null;
        mongoDisabledUntil = Date.now() + 60000;
        console.error('[MongoDB] Connection error (backoff 60s):', err.message);
        return null as any;
      });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

// Synchronous fallback accessor for in-memory / local state
export function getDbSync(): DatabaseData {
  if (!dbCache) {
    dbCache = ensureDataFile();
  }
  return dbCache;
}

// Async Database accessor: fetches from MongoDB Atlas if available with automatic seeding and caching
export async function getDb(): Promise<DatabaseData> {
  // If MongoDB URI is configured, ensure connection and sync state
  if (process.env.MONGODB_URI) {
    try {
      const conn = await connectMongoDB();
      if (conn && mongoose.connection.db) {
        const db = mongoose.connection.db;
        const now = Date.now();

        const CURRENT_SEED_VERSION = 4;
        // Refresh cache from MongoDB if empty or older than 2 seconds (for fresh multi-instance sync)
        if (!dbCache || now - lastMongoSync > 2000) {
          const stateDoc = await db.collection('app_data_state').findOne({ _id: 'master' as any });

          if (stateDoc && stateDoc.data && stateDoc.seed_version === CURRENT_SEED_VERSION) {
            dbCache = { ...defaultData, ...stateDoc.data };
            lastMongoSync = now;

            // One-off refresh of the About / Privacy / Terms copy so the app
            // stops showing the old template branding. Only these fields are
            // touched, and only until the admin saves their own version.
            if ((stateDoc as any).content_brand_version !== CONTENT_BRAND_VERSION) {
              applyBrandContent(dbCache);
              await db.collection('app_data_state').updateOne(
                { _id: 'master' as any },
                {
                  $set: {
                    data: dbCache,
                    seed_version: CURRENT_SEED_VERSION,
                    content_brand_version: CONTENT_BRAND_VERSION,
                    updatedAt: new Date(),
                  },
                }
              );
              for (const col of ['pages', 'appdata']) {
                const items = (dbCache as any)?.[col];
                if (Array.isArray(items)) {
                  try {
                    await db.collection(col).deleteMany({});
                    if (items.length > 0) await db.collection(col).insertMany(items);
                  } catch {}
                }
              }
              console.log(`[MongoDB] Refreshed About/Privacy/Terms copy to brand version ${CONTENT_BRAND_VERSION}.`);
            }
          } else {
            // First time setup or migration to seed_version 4 (Nigerian localization & Naira currency)
            const freshData = defaultData;
            const existingUsers = stateDoc?.data?.users || [];
            // Preserve real user accounts (id > 4)
            const nonSeedUsers = existingUsers.filter((u: any) => u.id > 4);
            const mergedUsers = [...freshData.users, ...nonSeedUsers];

            const updatedData: DatabaseData = {
              ...freshData,
              users: mergedUsers,
              appdata: [{
                ...freshData.appdata[0],
                ...(stateDoc?.data?.appdata?.[0] || {}),
                currency: '₦',
                coin_rate: '5.00',
              }],
            };
            applyBrandContent(updatedData);

            await db.collection('app_data_state').updateOne(
              { _id: 'master' as any },
              { $set: { data: updatedData, seed_version: CURRENT_SEED_VERSION, content_brand_version: CONTENT_BRAND_VERSION, updatedAt: new Date() } },
              { upsert: true }
            );

            // Also seed key collections for direct Atlas management
            const syncCols = [
              'users', 'images', 'gifts', 'posts', 'stories', 'admin_user', 'appdata',
              'interests', 'package', 'diamond_packs', 'reports',
              'verification_request', 'live_application', 'live_history',
              'redeem_requests', 'onboarding_screens', 'pages', 'languages',
              'relationship_goals', 'religions'
            ];
            for (const col of syncCols) {
              const items = (updatedData as any)[col];
              if (Array.isArray(items) && items.length > 0) {
                try {
                  await db.collection(col).deleteMany({});
                  await db.collection(col).insertMany(items);
                } catch {}
              }
            }

            dbCache = updatedData;
            lastMongoSync = now;
            console.log(`[MongoDB] Upgraded database to seed_version ${CURRENT_SEED_VERSION} with Nigerian seed data.`);
          }
        }
      }
    } catch (err: any) {
      console.warn('[MongoDB] Sync fallback to local state:', err.message);
    }
  }

  if (!dbCache) {
    dbCache = ensureDataFile();
  }
  return dbCache;
}

// Commit changes: Persists to in-memory cache, local JSON file, and MongoDB Atlas in real time
export async function commitDb(updated?: DatabaseData): Promise<void> {
  if (updated) {
    dbCache = updated;
  }
  if (!dbCache) return;

  // 1. Save to local data file (if writable)
  saveData(dbCache);

  // 2. Persist to MongoDB Atlas if connection is active
  if (process.env.MONGODB_URI) {
    try {
      const conn = await connectMongoDB();
      if (conn && mongoose.connection.db) {
        const db = mongoose.connection.db;
        lastMongoSync = Date.now();

        // Atomic update of master state document
        await db.collection('app_data_state').updateOne(
          { _id: 'master' as any },
          { $set: { data: dbCache, seed_version: 4, updatedAt: new Date() } },
          { upsert: true }
        );

        // Mirror key collections to MongoDB for direct MongoDB queries & management
        const syncCols = [
          'users', 'images', 'gifts', 'posts', 'stories', 'admin_user', 'appdata',
          'interests', 'package', 'diamond_packs', 'reports',
          'verification_request', 'live_application', 'live_history',
          'redeem_requests', 'languages', 'religions', 'relationship_goals',
          'pages', 'liked_profiles', 'following_lists'
        ];

        await Promise.all(
          syncCols.map(async (col) => {
            const list = (dbCache as any)?.[col];
            if (Array.isArray(list)) {
              try {
                await db.collection(col).deleteMany({});
                if (list.length > 0) {
                  await db.collection(col).insertMany(list);
                }
              } catch {}
            }
          })
        );
      }
    } catch (err: any) {
      console.warn('[MongoDB] Commit persistence notice:', err.message);
    }
  }
}

// Helper to generate next auto-increment integer ID for a collection
export function getNextId<T extends { id: number }>(items: T[]): number {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id || 0)) + 1;
}

