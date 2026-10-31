export interface AdminUser {
  id: number;
  user_name: string;
  user_password: string;
  user_type: number;
  created_at: string;
  updated_at: string;
}

export interface AppData {
  id: number;
  app_name: string;
  currency: string;
  new_user_free_coins: number;
  min_threshold: number;
  coin_rate: string;
  min_user_live: number;
  max_minute_live: number;
  message_price: number;
  reverse_swipe_price: number;
  live_watching_price: number;
  admob_int_ios: string;
  admob_banner_ios: string;
  admob_int: string;
  admob_banner: string;
  is_dating: number;
  is_social_media: number;
  post_description_limit: number;
  post_upload_image_limit: number;
  include_fake_user_in_matching: number;
  stream_and_gift_commission: number;
  play_store_download_link: string;
  app_store_download_link: string;
  uri_scheme: string;
  created_at: string;
  updated_at: string;
}

export interface UserImage {
  id: number;
  user_id: number;
  image: string;
}

export interface User {
  id: number;
  is_block: number;
  gender: number;
  savedprofile: string;
  likedprofile: string;
  interests: string;
  identity: string;
  username: string;
  fullname: string;
  instagram: string;
  youtube: string;
  facebook: string;
  country: string;
  state: string;
  city: string;
  bio: string;
  about: string;
  lattitude: string;
  latitude?: string;
  longitude: string;
  login_type: number;
  device_token: string;
  blocked_users: string;
  wallet: number;
  total_collected: number;
  total_streams: number;
  device_type: number;
  is_notification: number;
  is_verified: number;
  show_on_map: number;
  anonymous: number;
  is_video_call: number;
  can_go_live: number;
  is_live_now: number;
  is_fake: number;
  password?: string;
  following: number;
  followers: number;
  gender_preferred: number;
  age_preferred_min: number;
  age_preferred_max: number;
  distance_preference: number;
  relationship_goal_id: number;
  religion_key: number;
  language_keys: string;
  dob: string;
  age?: number;
  hidden_user_ids: string;
  app_language: string;
  created_at: string;
  updated_at: string;
  images?: UserImage[];
}

export interface Interest {
  id: number;
  title: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export interface DiamondPack {
  id: number;
  amount: number;
  android_product_id: string;
  ios_product_id: string;
}

export interface Gift {
  id: number;
  coin_price: number;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface LiveApplication {
  id: number;
  user_id: number;
  about_you: string;
  languages: string;
  intro_video: string;
  social_links: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface LiveHistory {
  id: number;
  user_id: number;
  started_at: string;
  streamed_for: string;
  amount_collected: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface RedeemRequest {
  id: number;
  user_id: number;
  request_id: string;
  coin_amount: number;
  payment_gateway: string;
  account_details: string;
  amount_paid: number;
  status: number; // 0 = pending, 1 = completed
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface VerificationRequest {
  id: number;
  user_id: number;
  document: string;
  document_type: string;
  selfie: string;
  fullname: string;
  status: number; // 0 = pending, 1 = approved, 2 = rejected
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Report {
  id: number;
  type: number; // 1 = user report, 2 = post report
  user_id: number;
  post_id: number;
  reason: string;
  description: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Post {
  id: number;
  user_id: number;
  description: string;
  interest_ids: string;
  comments_count: number;
  likes_count: number;
  is_like?: number;
  hashtags: string;
  created_at: string;
  updated_at: string;
  user?: User;
  content?: PostContent[];
}

export interface PostContent {
  id: number;
  post_id: number;
  content_type: number; // 0 = image, 1 = video
  content: string;
  thumbnail: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  user_id: number;
  post_id: number;
  description: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Story {
  id: number;
  user_id: number;
  type: number;
  duration: number;
  content: string;
  view_by_user_ids: string;
  created_at: string;
  updated_at?: string;
  user?: User;
}

export interface OnboardingScreen {
  id: number;
  position: number;
  image: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RelationshipGoal {
  id: number;
  title: string;
  description: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export interface Religion {
  id: number;
  title: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export interface Language {
  id: number;
  title: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: number;
  price: number;
  title: string;
  months: number;
  playid: string;
  appid: string;
  description: string;
}

export interface PageContent {
  id: number;
  privacy: string;
  termsofuse: string;
  created_at: string;
  updated_at: string;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: number;
  my_user_id: number;
  user_id: number;
  item_id: number;
  type: number;
  created_at: string;
  updated_at: string;
}

