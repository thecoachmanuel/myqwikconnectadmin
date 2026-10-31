import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dns from 'dns';

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
}

const defaultData: DatabaseData = {
  admin_user: [
    {
      id: 1,
      user_name: 'admin',
      user_password: 'admin@123!@#',
      user_type: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      user_name: 'tester',
      user_password: 'tester@123',
      user_type: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  appdata: [
    {
      id: 1,
      app_name: 'Orange',
      currency: '$',
      new_user_free_coins: 250,
      min_threshold: 5000,
      coin_rate: '0.006',
      min_user_live: 55,
      max_minute_live: 50,
      message_price: 5,
      reverse_swipe_price: 6,
      live_watching_price: 5,
      admob_int_ios: 'ca-app-pub-3940256099942544/4411468910-',
      admob_banner_ios: 'ca-app-pub-3940256099942544/2435281174',
      admob_int: 'ca-app-pub-3940256099942544/1033173712-',
      admob_banner: 'ca-app-pub-3940256099942544/6300978111-',
      is_dating: 1,
      is_social_media: 1,
      post_description_limit: 200,
      post_upload_image_limit: 4,
      include_fake_user_in_matching: 1,
      stream_and_gift_commission: 10,
      play_store_download_link: '',
      app_store_download_link: '',
      uri_scheme: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  users: [
    {
      id: 1,
      is_block: 0,
      gender: 1,
      savedprofile: '',
      likedprofile: '2,3',
      interests: '1,2,3',
      identity: 'test@orange.com',
      username: 'alex_wright',
      fullname: 'Alexander Wright',
      instagram: 'alexwright',
      youtube: '',
      facebook: '',
      country: 'United States',
      state: 'California',
      city: 'Los Angeles',
      bio: 'Ready to connect and discover wonderful souls.',
      about: 'Passionate about travel, photography, and good music.',
      lattitude: '34.0522',
      longitude: '-118.2437',
      login_type: 1,
      device_token: 'web_token_demo',
      blocked_users: '',
      wallet: 500,
      total_collected: 500,
      total_streams: 0,
      device_type: 1,
      is_notification: 1,
      is_verified: 2,
      show_on_map: 1,
      anonymous: 0,
      is_video_call: 1,
      can_go_live: 2,
      is_live_now: 0,
      is_fake: 0,
      password: '123456',
      following: 12,
      followers: 48,
      gender_preferred: 2,
      age_preferred_min: 18,
      age_preferred_max: 35,
      distance_preference: 50,
      relationship_goal_id: 1,
      religion_key: 1,
      language_keys: '1',
      dob: '1998-05-15',
      hidden_user_ids: '',
      app_language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [{ id: 1, user_id: 1, image: 'uploads/user1.jpg' }],
    },
    {
      id: 2,
      is_block: 0,
      gender: 2,
      savedprofile: '',
      likedprofile: '1',
      interests: '2,3,4',
      identity: 'sophia@orange.com',
      username: 'sophia_rose',
      fullname: 'Sophia Rose',
      instagram: 'sophiarose',
      youtube: '',
      facebook: '',
      country: 'United States',
      state: 'New York',
      city: 'New York',
      bio: 'Lover of sunsets, latte art, and live acoustic sessions ☕✨',
      about: 'Graphic designer who loves spontaneous road trips.',
      lattitude: '40.7128',
      longitude: '-74.0060',
      login_type: 1,
      device_token: 'web_token_sophia',
      blocked_users: '',
      wallet: 800,
      total_collected: 800,
      total_streams: 4,
      device_type: 1,
      is_notification: 1,
      is_verified: 2,
      show_on_map: 1,
      anonymous: 0,
      is_video_call: 1,
      can_go_live: 2,
      is_live_now: 1,
      is_fake: 0,
      password: '123456',
      following: 25,
      followers: 120,
      gender_preferred: 1,
      age_preferred_min: 21,
      age_preferred_max: 38,
      distance_preference: 100,
      relationship_goal_id: 1,
      religion_key: 1,
      language_keys: '1',
      dob: '1999-08-22',
      hidden_user_ids: '',
      app_language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [{ id: 2, user_id: 2, image: 'uploads/user2.jpg' }],
    },
    {
      id: 3,
      is_block: 0,
      gender: 2,
      savedprofile: '',
      likedprofile: '',
      interests: '1,3,6',
      identity: 'emma@orange.com',
      username: 'emma_w',
      fullname: 'Emma Watson',
      instagram: 'emmaw',
      youtube: '',
      facebook: '',
      country: 'United States',
      state: 'California',
      city: 'San Francisco',
      bio: 'Music producer, beach wanderer, foodie.',
      about: 'Let us explore the world together!',
      lattitude: '37.7749',
      longitude: '-122.4194',
      login_type: 1,
      device_token: 'web_token_emma',
      blocked_users: '',
      wallet: 320,
      total_collected: 320,
      total_streams: 1,
      device_type: 1,
      is_notification: 1,
      is_verified: 1,
      show_on_map: 1,
      anonymous: 0,
      is_video_call: 1,
      can_go_live: 1,
      is_live_now: 0,
      is_fake: 1,
      password: '123456',
      following: 15,
      followers: 67,
      gender_preferred: 1,
      age_preferred_min: 20,
      age_preferred_max: 45,
      distance_preference: 50,
      relationship_goal_id: 1,
      religion_key: 1,
      language_keys: '1',
      dob: '1997-04-12',
      hidden_user_ids: '',
      app_language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [{ id: 3, user_id: 3, image: 'uploads/user3.jpg' }],
    },
    {
      id: 4,
      is_block: 0,
      gender: 2,
      savedprofile: '',
      likedprofile: '',
      interests: '2,5,7',
      identity: 'mia@orange.com',
      username: 'mia_bell',
      fullname: 'Mia Isabella',
      instagram: 'miabella',
      youtube: '',
      facebook: '',
      country: 'United States',
      state: 'Washington',
      city: 'Seattle',
      bio: 'Digital artist and bookworm. Let us make art.',
      about: 'Coffee first, then conversations.',
      lattitude: '47.6062',
      longitude: '-122.3321',
      login_type: 1,
      device_token: 'web_token_mia',
      blocked_users: '',
      wallet: 450,
      total_collected: 450,
      total_streams: 5,
      device_type: 1,
      is_notification: 1,
      is_verified: 2,
      show_on_map: 1,
      anonymous: 0,
      is_video_call: 1,
      can_go_live: 2,
      is_live_now: 0,
      is_fake: 1,
      password: '123456',
      following: 28,
      followers: 94,
      gender_preferred: 1,
      age_preferred_min: 18,
      age_preferred_max: 40,
      distance_preference: 80,
      relationship_goal_id: 1,
      religion_key: 1,
      language_keys: '1',
      dob: '2000-11-03',
      hidden_user_ids: '',
      app_language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      images: [{ id: 4, user_id: 4, image: 'uploads/user4.jpg' }],
    },
  ],
  images: [
    { id: 1, user_id: 1, image: 'uploads/user1.jpg' },
    { id: 2, user_id: 2, image: 'uploads/user2.jpg' },
    { id: 3, user_id: 3, image: 'uploads/user3.jpg' },
    { id: 4, user_id: 4, image: 'uploads/user4.jpg' },
  ],
  interests: [
    { id: 1, title: 'Photography', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, title: 'Music & Concerts', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, title: 'Travel & Explore', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, title: 'Cooking & Food', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, title: 'Fitness & Gym', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 6, title: 'Movies & Cinema', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 7, title: 'Art & Design', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 8, title: 'Gaming', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  relationship_goals: [
    { id: 1, title: 'Long-term relationship', description: 'Looking for lasting love', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, title: 'Casual dating', description: 'Keeping it fun and relaxed', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, title: 'New friends', description: 'Meeting cool people', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, title: 'Still figuring it out', description: 'Open to possibilities', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  religions: [
    { id: 1, title: 'Spiritual', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, title: 'Christian', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, title: 'Muslim', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, title: 'Hindu', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, title: 'Buddhist', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 6, title: 'Atheist / Agnostic', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  languages: [
    { id: 1, title: 'English', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, title: 'Spanish', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, title: 'French', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, title: 'German', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, title: 'Arabic', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 6, title: 'Hindi', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 7, title: 'Portuguese', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 8, title: 'Russian', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 9, title: 'Japanese', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 10, title: 'Korean', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 11, title: 'Simplified Chinese', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 12, title: 'Italian', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 13, title: 'Dutch', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 14, title: 'Danish', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 15, title: 'Greek', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 16, title: 'Indonesian', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 17, title: 'Norwegian Bokmal', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 18, title: 'Polish', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 19, title: 'Thai', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 20, title: 'Turkish', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 21, title: 'Vietnamese', is_deleted: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  diamond_packs: [
    { id: 1, amount: 100, android_product_id: 'com.orange.diamond100', ios_product_id: 'com.orange.diamond100' },
    { id: 2, amount: 500, android_product_id: 'com.orange.diamond500', ios_product_id: 'com.orange.diamond500' },
    { id: 3, amount: 1200, android_product_id: 'com.orange.diamond1200', ios_product_id: 'com.orange.diamond1200' },
  ],
  gifts: [
    { id: 1, coin_price: 10, image: 'uploads/gift1.png', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, coin_price: 50, image: 'uploads/gift2.png', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, coin_price: 100, image: 'uploads/gift3.png', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  package: [
    { id: 1, price: 9.99, title: '1 Month Premium', months: 1, playid: 'pkg_1m', appid: 'pkg_1m', description: 'Unlimited swiping and priority matching' },
    { id: 2, price: 24.99, title: '3 Months Premium', months: 3, playid: 'pkg_3m', appid: 'pkg_3m', description: 'Save 20% on full access' },
  ],
  live_application: [],
  live_history: [],
  redeem_requests: [],
  verification_request: [],
  reports: [],
  posts: [
    {
      id: 1,
      user_id: 2,
      description: 'Enjoying a lovely sunny afternoon in the city! ☀️✨',
      interest_ids: '1,2',
      hashtags: '#sunny #vibes #citylife',
      likes_count: 24,
      comments_count: 3,
      is_like: 0,
      created_at: '2026-10-30 14:20:00',
      updated_at: '2026-10-30 14:20:00',
    },
    {
      id: 2,
      user_id: 3,
      description: 'Golden hour vibes 🌅 Never gets old!',
      interest_ids: '3,4',
      hashtags: '#sunset #goldenhour #chill',
      likes_count: 42,
      comments_count: 7,
      is_like: 1,
      created_at: '2026-10-31 09:15:00',
      updated_at: '2026-10-31 09:15:00',
    },
    {
      id: 3,
      user_id: 4,
      description: 'Weekend coffee run ☕ Hope everyone is having a peaceful day.',
      interest_ids: '2,5',
      hashtags: '#coffee #weekend #peace',
      likes_count: 18,
      comments_count: 2,
      is_like: 0,
      created_at: '2026-10-31 10:00:00',
      updated_at: '2026-10-31 10:00:00',
    },
  ],
  post_contents: [
    {
      id: 1,
      post_id: 1,
      content_type: 0,
      content: 'uploads/user2.jpg',
      thumbnail: 'uploads/user2.jpg',
      view_count: 120,
      created_at: '2026-10-30 14:20:00',
      updated_at: '2026-10-30 14:20:00',
    },
    {
      id: 2,
      post_id: 2,
      content_type: 0,
      content: 'uploads/user3.jpg',
      thumbnail: 'uploads/user3.jpg',
      view_count: 310,
      created_at: '2026-10-31 09:15:00',
      updated_at: '2026-10-31 09:15:00',
    },
    {
      id: 3,
      post_id: 3,
      content_type: 0,
      content: 'uploads/user4.jpg',
      thumbnail: 'uploads/user4.jpg',
      view_count: 95,
      created_at: '2026-10-31 10:00:00',
      updated_at: '2026-10-31 10:00:00',
    },
  ],
  comments: [],
  stories: [
    {
      id: 1,
      user_id: 2,
      content: 'uploads/user2.jpg',
      type: 0,
      duration: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_by_user_ids: '',
    },
    {
      id: 2,
      user_id: 3,
      content: 'uploads/user3.jpg',
      type: 0,
      duration: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_by_user_ids: '',
    },
  ],
  onboarding_screens: [],
  pages: [
    {
      id: 1,
      privacy: '<h3>Privacy Policy</h3><p>We respect your privacy and protect your personal data in accordance with our terms.</p>',
      termsofuse: '<h3>Terms of Use</h3><p>By using the Orange Dating application, you agree to treat everyone with respect and follow community guidelines.</p>',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  admin_notification: [],
  user_notification: [],
  following_lists: [],
  liked_profiles: [
    { id: 1, my_user_id: 1, user_id: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, my_user_id: 2, user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataFile(): DatabaseData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
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

export async function connectMongoDB(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (globalCache.conn && mongoose.connection.readyState === 1) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    const dbName = process.env.MONGODB_DB_NAME || 'myqwikconnectadmin';
    globalCache.promise = mongoose
      .connect(uri, {
        dbName,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      })
      .then((m) => {
        console.log(`[MongoDB] Connected successfully to database '${m.connection.db?.databaseName || dbName}'`);
        return m;
      })
      .catch((err) => {
        globalCache.promise = null;
        console.error('[MongoDB] Connection error:', err.message);
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

        // Refresh cache from MongoDB if empty or older than 2 seconds (for fresh multi-instance sync)
        if (!dbCache || now - lastMongoSync > 2000) {
          const stateDoc = await db.collection('app_data_state').findOne({ _id: 'master' as any });

          if (stateDoc && stateDoc.data) {
            dbCache = { ...defaultData, ...stateDoc.data };
            lastMongoSync = now;
          } else {
            // First time setup on MongoDB: auto-seed from local data or defaults
            const initial = dbCache || ensureDataFile();
            await db.collection('app_data_state').updateOne(
              { _id: 'master' as any },
              { $set: { data: initial, updatedAt: new Date() } },
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
              const items = (initial as any)[col];
              if (Array.isArray(items) && items.length > 0) {
                try {
                  await db.collection(col).deleteMany({});
                  await db.collection(col).insertMany(items);
                } catch {}
              }
            }

            dbCache = initial;
            lastMongoSync = now;
            console.log('[MongoDB] Auto-seeded database with initial data.');
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
          { $set: { data: dbCache, updatedAt: new Date() } },
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

