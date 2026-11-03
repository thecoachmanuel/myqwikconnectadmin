import { NextRequest } from 'next/server';
import { getDb, commitDb, getNextId } from '@/lib/db';
import { corsHeaders, handleCors, jsonResponse, parseRequestBody, deleteFromCloudinary } from '@/lib/api-helper';
import { User, UserImage, Post, PostContent, Comment, Story, Report } from '@/models/types';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

export async function OPTIONS() {
  return handleCors();
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const endpoint = slug.join('/');
  return handleRequest(request, endpoint, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const endpoint = slug.join('/');
  return handleRequest(request, endpoint, 'POST');
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function handleRequest(request: NextRequest, endpoint: string, method: string) {
  const db = await getDb();
  const { fields, files } = await parseRequestBody(request);

  // Combine query parameters if GET
  if (method === 'GET') {
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((val, key) => {
      if (!fields[key]) fields[key] = val;
    });
  }

  if (endpoint === 'adminSyncSeedData' || endpoint === 'refreshSeedData') {
    const { getDbSync } = await import('@/lib/db');
    const freshData = getDbSync();
    await commitDb(freshData);
    return jsonResponse({
      status: true,
      message: 'Database re-seeded successfully',
      data: freshData.appdata[0],
    });
  }

  // 1. getSettingData
  if (endpoint === 'getSettingData') {
    const appdata = {
      ...(db.appdata[0] || {}),
      privacypolicy: db.pages[0]?.privacy || (db.appdata[0] as any)?.privacypolicy || '',
      termsofuse: db.pages[0]?.termsofuse || (db.appdata[0] as any)?.termsofuse || '',
      web_mobile_view: (db.appdata[0] as any)?.web_mobile_view !== undefined ? (db.appdata[0] as any).web_mobile_view : 1,
      feed_video_enabled: (db.appdata[0] as any)?.feed_video_enabled ?? 0,
      chat_video_enabled: (db.appdata[0] as any)?.chat_video_enabled ?? 0,
    };
    const gifts = db.gifts || [];
    const interests = (db.interests || []).filter((i) => i.is_deleted === 0);
    const relationship_goals = (db.relationship_goals || []).filter((r) => r.is_deleted === 0);
    const religions = (db.religions || []).filter((r) => r.is_deleted === 0);
    const language = (db.languages || []).filter((l) => l.is_deleted === 0);
    const onboarding_screen = db.onboarding_screens || [];

    return jsonResponse({
      status: true,
      message: 'fetchSuccessful',
      data: {
        appdata,
        gifts,
        interests,
        relationship_goals,
        religions,
        language,
        onboarding_screen,
      },
    });
  }

  // 2. register
  if (endpoint === 'register') {
    const identity = fields.identity?.toString().trim() || '';
    const fullname = fields.fullname?.toString().trim() || 'New User';
    const device_token = fields.device_token?.toString() || '';
    const device_type = parseInt(fields.device_type) || 1;
    const login_type = parseInt(fields.login_type) || 1;
    const firebase_uid = fields.firebase_uid?.toString() || '';
    const password = fields.password?.toString().trim() || '';

    let user = db.users.find((u) => u.identity?.toLowerCase() === identity.toLowerCase());
    let isNew = false;

    if (user) {
      user.device_token = device_token || user.device_token;
      user.device_type = device_type || user.device_type;
      if (firebase_uid) user.firebase_uid = firebase_uid;
      if (password && !user.password) user.password = password;
      user.updated_at = new Date().toISOString();
      await commitDb(db);
    } else {
      isNew = true;
      const appdata = db.appdata[0];
      const freeCoins = appdata?.new_user_free_coins || 250;
      const newId = getNextId(db.users);
      const username = `user_${newId}_${Math.random().toString(36).substring(2, 6)}`;

      user = {
        id: newId,
        is_block: 0,
        gender: 1,
        savedprofile: '',
        likedprofile: '',
        interests: '',
        identity,
        username,
        fullname,
        instagram: '',
        youtube: '',
        facebook: '',
        country: fields.country?.toString() || 'Nigeria',
        state: fields.state?.toString() || '',
        city: fields.city?.toString() || '',
        bio: '',
        about: '',
        lattitude: '6.5244',
        longitude: '3.3792',
        login_type,
        device_token,
        blocked_users: '',
        wallet: freeCoins,
        total_collected: 0,
        total_streams: 0,
        device_type,
        is_notification: 1,
        is_verified: 0,
        show_on_map: 1,
        anonymous: 0,
        is_video_call: 1,
        can_go_live: 0,
        is_live_now: 0,
        is_fake: 0,
        password: password,
        following: 0,
        followers: 0,
        gender_preferred: 2,
        age_preferred_min: 18,
        age_preferred_max: 50,
        distance_preference: 100,
        relationship_goal_id: 0,
        religion_key: 0,
        language_keys: '',
        dob: '2000-01-01',
        hidden_user_ids: '',
        app_language: 'en',
        firebase_uid,
        is_profile_complete: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [],
      };
      db.users.push(user);
      await commitDb(db);
    }

    // Attach user images
    const userImages = db.images.filter((img) => img.user_id === user!.id);
    user.images = userImages;

    return jsonResponse({
      status: true,
      message: isNew ? 'Registration successful' : 'Login successful',
      is_new: isNew,
      data: user,
    });
  }

  // 3. fakeUserLogin / login
  if (endpoint === 'fakeUserLogin' || endpoint === 'login') {
    const identity = (fields.identity?.toString() || fields.email?.toString() || '').trim();
    const password = (fields.password?.toString() || '').trim();

    const user = db.users.find((u) => u.identity?.toLowerCase() === identity.toLowerCase());
    if (!user) {
      return jsonResponse({
        status: false,
        message: 'User not found. Please check your email or sign up.',
        data: null,
      });
    }

    if (user.password && password && user.password !== password) {
      return jsonResponse({
        status: false,
        message: 'Incorrect password combination',
        data: null,
      });
    }

    if (fields.device_token) user.device_token = fields.device_token.toString();
    if (fields.device_type) user.device_type = parseInt(fields.device_type) || user.device_type;
    user.images = db.images.filter((img) => img.user_id === user.id);
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Login successful',
      data: user,
    });
  }

  // 4. getProfile / fetchMyUserProfile / getUserDetails
  if (endpoint === 'getProfile' || endpoint === 'fetchMyUserProfile' || endpoint === 'getUserDetails') {
    const targetUserId = parseInt(fields.user_id || fields.id) || 0;
    const myUserId = parseInt(fields.my_user_id) || (endpoint === 'fetchMyUserProfile' ? targetUserId : 0);
    const userId = targetUserId > 0 ? targetUserId : myUserId;
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      return jsonResponse({
        status: false,
        message: 'User not found!',
        data: null,
      });
    }

    const userImgs = db.images.filter((img) => img.user_id === user.id);
    const userStories = (db.stories || []).filter((s) => s.user_id === user.id);

    // Compute followingStatus matching PHP:
    // 0: neither follows, 1: target follows me, 2: I follow target, 3: mutual follow
    let followingStatus = 0;
    if (myUserId > 0 && myUserId !== user.id) {
      const targetFollowsMe = (db.following_lists || []).some(
        (f) => f.my_user_id === user.id && f.user_id === myUserId
      );
      const iFollowTarget = (db.following_lists || []).some(
        (f) => f.my_user_id === myUserId && f.user_id === user.id
      );

      if (targetFollowsMe && iFollowTarget) {
        followingStatus = 3;
      } else if (iFollowTarget) {
        followingStatus = 2;
      } else if (targetFollowsMe) {
        followingStatus = 1;
      }
    }

    // Compute is_like matching PHP (boolean)
    let isLike = false;
    let isSaved = false;
    if (myUserId > 0) {
      const myUser = db.users.find((u) => u.id === myUserId);
      const csvLikes = (myUser?.likedprofile || '').split(',').map((s) => s.trim());
      const csvSaved = (myUser?.savedprofile || '').split(',').map((s) => s.trim());
      isLike =
        csvLikes.includes(user.id.toString()) ||
        (db.liked_profiles || []).some(
          (lp) => lp.my_user_id === myUserId && lp.user_id === user.id
        );
      isSaved = csvSaved.includes(user.id.toString());
    }

    const userData = {
      ...user,
      religion_key: String(user.religion_key || ''),
      images: userImgs,
      stories: userStories,
      followingStatus: followingStatus,
      is_like: isLike,
      is_saved: isSaved,
    };

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: userData,
    });
  }

  // 5. updateProfile
  if (endpoint === 'updateProfile') {
    const userId = parseInt(fields.user_id);
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      return jsonResponse({
        status: false,
        message: 'User not found',
      });
    }

    // Delete removed images
    if (fields.deleteimageids) {
      const deleteIds = Array.isArray(fields.deleteimageids)
        ? fields.deleteimageids.map((id: any) => parseInt(id))
        : fields.deleteimageids.toString().split(',').map((id: string) => parseInt(id.trim()));
      db.images = db.images.filter((img) => !deleteIds.includes(img.id));
    }

    // Process fields
    const allowed = [
      'fullname', 'username', 'gender', 'bio', 'about', 'country', 'state', 'city',
      'lattitude', 'longitude', 'instagram', 'youtube', 'facebook', 'interests',
      'gender_preferred', 'age_preferred_min', 'age_preferred_max', 'distance_preference',
      'relationship_goal_id', 'religion_key', 'language_keys', 'dob', 'app_language',
      'is_verified', 'is_notification', 'show_on_map', 'anonymous', 'is_video_call', 'is_profile_complete'
    ];

    allowed.forEach((field) => {
      if (fields[field] !== undefined) {
        (user as any)[field] = fields[field];
      }
    });

    // Upload new images
    files.forEach((file) => {
      const newImgId = getNextId(db.images);
      const imgObj: UserImage = {
        id: newImgId,
        user_id: user.id,
        image: file.url,
      };
      db.images.push(imgObj);
    });

    user.updated_at = new Date().toISOString();
    await commitDb(db);

    user.images = db.images.filter((img) => img.user_id === user.id);
    user.images = user.images || [];

    return jsonResponse({
      status: true,
      message: 'Update successful',
      data: user,
    });
  }

  // 6. storeFileGivePath
  if (endpoint === 'storeFileGivePath') {
    if (files.length > 0) {
      return jsonResponse({
        status: true,
        message: 'File stored successfully',
        path: files[0].url,
        data: files[0].url,
      });
    }
    return jsonResponse({
      status: false,
      message: 'No file uploaded',
    });
  }

  // 7a. getRandomProfile (returns single UserData object for random matching)
  if (endpoint === 'getRandomProfile') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const reqGender = parseInt(fields.gender) || 3;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const appdata = db.appdata[0];

    const blockedIds = (currentUser?.blocked_users || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);
    const hiddenIds = (currentUser?.hidden_user_ids || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    let list = db.users.filter(
      (u) =>
        u.id !== currentUserId &&
        u.is_block === 0 &&
        !blockedIds.includes(u.id) &&
        !hiddenIds.includes(u.id)
    );

    if (appdata && appdata.include_fake_user_in_matching === 0) {
      list = list.filter((u) => !u.is_fake);
    }

    // Exclude anonymous users
    list = list.filter((u) => u.anonymous !== 1);

    if (reqGender === 1 || reqGender === 2) {
      list = list.filter((u) => Number(u.gender) === reqGender);
    }

    if (list.length === 0) {
      return jsonResponse({
        status: false,
        message: 'No profiles found matching selected gender',
        data: null,
      });
    }

    const picked = list[Math.floor(Math.random() * list.length)];
    let userImgs = db.images.filter((img) => img.user_id === picked.id);
    userImgs = userImgs || [];

    const myUser = db.users.find((u) => u.id === currentUserId);
    const csvLikes = (myUser?.likedprofile || '').split(',').map((s) => s.trim());
    const csvSaved = (myUser?.savedprofile || '').split(',').map((s) => s.trim());

    const randomUserData = {
      ...picked,
      religion_key: String(picked.religion_key || ''),
      images: userImgs,
      is_like:
        csvLikes.includes(picked.id.toString()) ||
        (db.liked_profiles || []).some(
          (lp) => lp.my_user_id === currentUserId && lp.user_id === picked.id
        ),
      is_saved: csvSaved.includes(picked.id.toString()),
    };

    return jsonResponse({
      status: true,
      message: 'data found successfully!',
      data: randomUserData,
    });
  }

  // 7b. getExplorePageProfileList (returns array of UserData for explore swipe deck)
  if (endpoint === 'getExplorePageProfileList') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const appdata = db.appdata[0];

    const blockedIds = (currentUser?.blocked_users || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);
    const hiddenIds = (currentUser?.hidden_user_ids || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    let list = db.users.filter(
      (u) =>
        u.id !== currentUserId &&
        u.is_block === 0 &&
        !blockedIds.includes(u.id) &&
        !hiddenIds.includes(u.id)
    );

    // Admin Feature Control: Include Fake User In Matching
    if (appdata && appdata.include_fake_user_in_matching === 0) {
      list = list.filter((u) => !u.is_fake);
    }

    // Exclude anonymous users
    list = list.filter((u) => u.anonymous !== 1);

    // Exclude users who turned on Anonymous mode
    list = list.filter((u) => u.anonymous !== 1);

    // Apply gender preference if exists (1 = Male, 2 = Female, 3 = Both)
    if (currentUser?.gender_preferred && Number(currentUser.gender_preferred) !== 3) {
      const preferred = Number(currentUser.gender_preferred);
      const filtered = list.filter((u) => Number(u.gender) === preferred);
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    // Apply age preference if set
    if (currentUser?.age_preferred_min && currentUser?.age_preferred_max) {
      const minAge = Number(currentUser.age_preferred_min);
      const maxAge = Number(currentUser.age_preferred_max);
      const ageFiltered = list.filter((u) => {
        let age = parseInt(String(u.age || '0'));
        if (!age && u.dob) {
          const birthYear = new Date(u.dob).getFullYear();
          if (!isNaN(birthYear)) age = new Date().getFullYear() - birthYear;
        }
        if (!age) return true;
        return age >= minAge && age <= maxAge;
      });
      if (ageFiltered.length > 0) {
        list = ageFiltered;
      }
    }

    // Apply distance preference if coordinates available (fallback to all if < 3 nearby)
    if (currentUser?.distance_preference && currentUser.distance_preference > 0) {
      const userLat = parseFloat(currentUser.lattitude || currentUser.latitude || '0');
      const userLon = parseFloat(currentUser.longitude || '0');
      if (!isNaN(userLat) && !isNaN(userLon) && userLat !== 0 && userLon !== 0) {
        const distFiltered = list.filter((u) => {
          const uLat = parseFloat(u.lattitude || u.latitude || '0');
          const uLon = parseFloat(u.longitude || '0');
          if (isNaN(uLat) || isNaN(uLon) || (uLat === 0 && uLon === 0)) return true;
          return getDistanceKm(userLat, userLon, uLat, uLon) <= currentUser.distance_preference!;
        });
        if (distFiltered.length >= 3) {
          list = distFiltered;
        }
      }
    }

    // Extract current user attributes for personalization
    const myInterests = String(currentUser?.interests || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const myGoals = String(currentUser?.relationship_goal_id || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const myCity = (currentUser?.city || '').trim().toLowerCase();
    const myState = (currentUser?.state || '').trim().toLowerCase();
    const myCountry = (currentUser?.country || '').trim().toLowerCase();
    const myRel = String(currentUser?.religion_key || '').trim().toLowerCase();
    const userLat = parseFloat(currentUser?.lattitude || currentUser?.latitude || '0');
    const userLon = parseFloat(currentUser?.longitude || '0');
    const hasUserCoords = !isNaN(userLat) && !isNaN(userLon) && (userLat !== 0 || userLon !== 0);

    // Compute personalized match score for each candidate profile (Top Dating App Model)
    const scoredList = list.map((u) => {
      let score = 0;

      // 1. Secret Admirer / Inbound Likes Boost (Tinder/Bumble Instant Match Logic)
      const hasLikedMe = (db.liked_profiles || []).some(
        (lp) => lp.my_user_id === u.id && lp.user_id === currentUserId
      );
      if (hasLikedMe) {
        score += 80;
      }

      // 2. Activity Recency & Live Presence
      if (u.is_live_now === 1) {
        score += 65;
      }
      const lastActive = u.updated_at ? new Date(u.updated_at).getTime() : 0;
      const hoursActiveAgo = lastActive > 0 ? (Date.now() - lastActive) / (1000 * 60 * 60) : 1000;
      if (hoursActiveAgo < 24) {
        score += 45;
      } else if (hoursActiveAgo < 72) {
        score += 25;
      }

      // 3. New User Discovery Boost (Discovery for newcomers in last 3 days)
      const joinedTime = u.created_at ? new Date(u.created_at).getTime() : 0;
      const hoursSinceJoined = joinedTime > 0 ? (Date.now() - joinedTime) / (1000 * 60 * 60) : 1000;
      if (hoursSinceJoined < 72) {
        score += 35;
      }

      // 4. Gender preference (+40)
      if (currentUser?.gender_preferred && Number(currentUser.gender_preferred) !== 3) {
        if (Number(u.gender) === Number(currentUser.gender_preferred)) {
          score += 40;
        }
      }

      // 5. Shared interests (+25 points per shared interest)
      const theirInterests = String(u.interests || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const sharedInterests = theirInterests.filter((i) => myInterests.includes(i));
      score += sharedInterests.length * 25;

      // 6. Shared relationship goals (+40 points)
      const theirGoals = String(u.relationship_goal_id || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const goalMatched = theirGoals.some((g) => myGoals.includes(g));
      if (goalMatched) score += 40;

      // 7. Religion match (+15 points)
      if (myRel && String(u.religion_key || '').trim().toLowerCase() === myRel) {
        score += 15;
      }

      // 8. Proximity & Location match
      const uCity = (u.city || '').trim().toLowerCase();
      const uState = (u.state || '').trim().toLowerCase();
      const uCountry = (u.country || '').trim().toLowerCase();

      if (hasUserCoords) {
        const uLat = parseFloat(u.lattitude || u.latitude || '0');
        const uLon = parseFloat(u.longitude || '0');
        if (!isNaN(uLat) && !isNaN(uLon) && (uLat !== 0 || uLon !== 0)) {
          const dist = getDistanceKm(userLat, userLon, uLat, uLon);
          if (dist <= 15) score += 45;
          else if (dist <= 40) score += 30;
          else if (dist <= 100) score += 15;
        }
      } else {
        if (myCity && uCity && myCity === uCity) score += 40;
        else if (myState && uState && myState === uState) score += 25;
        else if (myCountry && uCountry && myCountry === uCountry) score += 15;
      }

      // 9. Profile completeness & authenticity bonus
      if (u.is_verified === 1 || u.is_verified === 2 || u.is_verified === 3) score += 25;
      if (u.about && u.about.trim().length > 20) score += 15;
      const imgCount = db.images.filter((img) => img.user_id === u.id).length;
      if (imgCount >= 2) score += 20;

      // 10. Dynamic explore shuffle jitter (+/- 8 points) so each refresh offers fresh variety while keeping relevance
      const jitter = (Math.random() - 0.5) * 16;
      score += jitter;

      return { user: u, score };
    });

    // Sort descending by calculated personalization score
    scoredList.sort((a, b) => b.score - a.score);
    const sortedList = scoredList.map((item) => item.user);

    const result = sortedList.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      userImgs = userImgs || [];
      return {
        ...u,
        religion_key: String(u.religion_key || ''),
        images: userImgs,
        is_like: (db.liked_profiles || []).some(
          (lp) => lp.my_user_id === currentUserId && lp.user_id === u.id
        ),
      };
    });

    return jsonResponse({
      status: true,
      message: 'Data found successfully!',
      data: result,
    });
  }

  // 7b. filteredProfiles (Tinder search with granular criteria)
  if (endpoint === 'filteredProfiles') {
    const currentUserId = parseInt(fields.my_user_id || fields.user_id) || 0;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const appdata = db.appdata[0];
    const start = parseInt(fields.start) || 0;
    const limit = parseInt(fields.limit) || 20;

    const blockedIds = (currentUser?.blocked_users || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);
    const hiddenIds = (currentUser?.hidden_user_ids || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    let list = db.users.filter(
      (u) =>
        u.id !== currentUserId &&
        u.is_block === 0 &&
        !blockedIds.includes(u.id) &&
        !hiddenIds.includes(u.id)
    );

    if (appdata && appdata.include_fake_user_in_matching === 0) {
      list = list.filter((u) => !u.is_fake);
    }

    // Exclude anonymous users
    list = list.filter((u) => u.anonymous !== 1);

    // Gender filter (1 = male, 2 = female, 3 = both)
    if (fields.gender !== undefined && fields.gender !== '') {
      const g = parseInt(fields.gender);
      if (g === 1 || g === 2) {
        list = list.filter((u) => Number(u.gender) === g);
      }
    }

    // Age filter
    const minAge = parseInt(fields.age_preferred_min || fields.min_age || '0');
    const maxAge = parseInt(fields.age_preferred_max || fields.max_age || '100');
    if (minAge > 0 || maxAge < 100) {
      list = list.filter((u) => {
        let age = parseInt((u as any).age?.toString() || '0');
        if (!age && u.dob) {
          const birthYear = new Date(u.dob).getFullYear();
          if (!isNaN(birthYear)) {
            age = new Date().getFullYear() - birthYear;
          }
        }
        if (!age) return true;
        return age >= minAge && age <= maxAge;
      });
    }

    // Relationship goal (supports single ID or comma-separated multiple IDs)
    if (fields.relationship_goal_id !== undefined && fields.relationship_goal_id !== '') {
      const queryGoalIds = fields.relationship_goal_id
        .toString()
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      if (queryGoalIds.length > 0) {
        list = list.filter((u) => {
          const uGoalIds = (u.relationship_goal_id ?? '')
            .toString()
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
          return queryGoalIds.some((g: string) => uGoalIds.includes(g));
        });
      }
    }

    // Religion
    if (fields.religion_key !== undefined && fields.religion_key !== '') {
      const relKey = fields.religion_key.toString().toLowerCase().trim();
      const filtered = list.filter((u) => (u.religion_key || '').toString().toLowerCase().trim() === relKey);
      if (filtered.length > 0) list = filtered;
    }

    // Languages
    if (fields.language_keys !== undefined && fields.language_keys !== '') {
      const langList = fields.language_keys.toString().split(',').map((s: string) => s.trim().toLowerCase());
      const filtered = list.filter((u) => {
        const uLangs = (u.language_keys || '').toString().split(',').map((s) => s.trim().toLowerCase());
        return langList.some((l: string) => uLangs.includes(l));
      });
      if (filtered.length > 0) list = filtered;
    }

    // Interests
    if (fields.interests !== undefined && fields.interests !== '') {
      const interestList = fields.interests.toString().split(',').map((s: string) => s.trim());
      const filtered = list.filter((u) => {
        const uInterests = (u.interests || '').split(',').map((s) => s.trim());
        return interestList.some((i: string) => uInterests.includes(i));
      });
      if (filtered.length > 0) list = filtered;
    }

    const csvLikes = (currentUser?.likedprofile || '').split(',').map((s) => s.trim());
    const csvSaved = (currentUser?.savedprofile || '').split(',').map((s) => s.trim());

    const paged = list.slice(start, start + limit);
    const result = paged.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      userImgs = userImgs || [];
      return {
        ...u,
        religion_key: String(u.religion_key || ''),
        images: userImgs,
        is_like:
          csvLikes.includes(u.id.toString()) ||
          (db.liked_profiles || []).some(
            (lp) => lp.my_user_id === currentUserId && lp.user_id === u.id
          ),
        is_saved: csvSaved.includes(u.id.toString()),
      };
    });

    return jsonResponse({
      status: true,
      message: 'Matched Profile : ' + result.length,
      data: result,
    });
  }

  // 7c. fetchUsersByCordinates / fetchUsersByCoordinates (Explore on Map)
  if (endpoint === 'fetchUsersByCordinates' || endpoint === 'fetchUsersByCoordinates') {
    const lat = parseFloat(fields.lat || fields.latitude);
    const lon = parseFloat(fields.long || fields.longitude);
    const km = parseFloat(fields.km) || 500;
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;

    let users = db.users.filter((u) => u.is_block === 0 && u.show_on_map !== 0 && u.anonymous !== 1 && u.id !== currentUserId);

    if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
      users = users.filter((u) => {
        const uLat = parseFloat(u.lattitude || u.latitude || '0');
        const uLon = parseFloat(u.longitude || '0');
        if (isNaN(uLat) || isNaN(uLon) || (uLat === 0 && uLon === 0)) return false;
        return getDistanceKm(lat, lon, uLat, uLon) <= km;
      });

      // Sort users by proximity (closest first)
      users.sort((a, b) => {
        const aLat = parseFloat(a.lattitude || a.latitude || '0');
        const aLon = parseFloat(a.longitude || '0');
        const bLat = parseFloat(b.lattitude || b.latitude || '0');
        const bLon = parseFloat(b.longitude || '0');
        return getDistanceKm(lat, lon, aLat, aLon) - getDistanceKm(lat, lon, bLat, bLon);
      });
    }

    const list = users.map((u, idx) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      userImgs = userImgs || [];
      const rawLat = parseFloat(u.lattitude || u.latitude || '0');
      const rawLon = parseFloat(u.longitude || '0');
      const assignedLat = rawLat !== 0 ? rawLat.toString() : '6.5244';
      const assignedLon = rawLon !== 0 ? rawLon.toString() : '3.3792';
      const distance = (!isNaN(lat) && !isNaN(lon) && rawLat !== 0 && rawLon !== 0)
        ? Math.round(getDistanceKm(lat, lon, rawLat, rawLon) * 10) / 10
        : undefined;

      return {
        ...u,
        latitude: assignedLat,
        lattitude: assignedLat,
        longitude: assignedLon,
        religion_key: String(u.religion_key || ''),
        images: userImgs,
        distance_km: distance,
      };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: list,
    });
  }

  // 8. yourMatchings / fetchLikedProfiles
  if (endpoint === 'yourMatchings' || endpoint === 'fetchLikedProfiles') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const likedIds = (currentUser?.likedprofile || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const fromLikedProfiles = (db.liked_profiles || [])
      .filter((lp) => lp.my_user_id === currentUserId)
      .map((lp) => lp.user_id);

    const allLikedIds = Array.from(new Set([...likedIds, ...fromLikedProfiles]));
    let likedList = db.users.filter((u) => allLikedIds.includes(u.id));

    const data = likedList.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      userImgs = userImgs || [];
      return { ...u, images: userImgs, is_like: 1 };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data,
    });
  }

  // 8e. updateHiddenProfile
  if (endpoint === 'updateHiddenProfile' || endpoint === 'hideUserProfile') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const targetUserId = parseInt(fields.hidden_user_id || fields.target_user_id || fields.profile_id) || 0;
    const user = db.users.find((u) => u.id === currentUserId);

    if (!user) {
      return jsonResponse({ status: false, message: 'User not found' }, 404);
    }

    let hiddenList = (user.hidden_user_ids || '')
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const isHidden = hiddenList.includes(targetUserId);
    if (isHidden) {
      hiddenList = hiddenList.filter((id) => id !== targetUserId);
    } else if (targetUserId > 0) {
      hiddenList.push(targetUserId);
    }

    user.hidden_user_ids = hiddenList.join(',');
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: isHidden ? 'Profile unhidden successfully' : 'Profile hidden successfully and will not be shown again',
      is_hidden: !isHidden,
      data: user,
    });
  }

  // 8b. fetchSavedProfiles
  if (endpoint === 'fetchSavedProfiles') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const savedIds = (currentUser?.savedprofile || (currentUser as any)?.saved_profile || '')
      .split(',')
      .map((id: string) => parseInt(id.trim()))
      .filter((id: number) => !isNaN(id) && id > 0);

    let savedList = db.users.filter((u) => savedIds.includes(u.id));

    const data = savedList.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      userImgs = userImgs || [];
      return { ...u, images: userImgs };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data,
    });
  }

  // 8e. updateHiddenProfile
  if (endpoint === 'updateHiddenProfile' || endpoint === 'hideUserProfile') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const targetUserId = parseInt(fields.hidden_user_id || fields.target_user_id || fields.profile_id) || 0;
    const user = db.users.find((u) => u.id === currentUserId);

    if (!user) {
      return jsonResponse({ status: false, message: 'User not found' }, 404);
    }

    let hiddenList = (user.hidden_user_ids || '')
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const isHidden = hiddenList.includes(targetUserId);
    if (isHidden) {
      hiddenList = hiddenList.filter((id) => id !== targetUserId);
    } else if (targetUserId > 0) {
      hiddenList.push(targetUserId);
    }

    user.hidden_user_ids = hiddenList.join(',');
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: isHidden ? 'Profile unhidden successfully' : 'Profile hidden successfully and will not be shown again',
      is_hidden: !isHidden,
      data: user,
    });
  }

  // 8c. fetchBlockedProfiles
  if (endpoint === 'fetchBlockedProfiles') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const blockedIds = (currentUser?.blocked_users || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const blockedList = db.users.filter((u) => blockedIds.includes(u.id));
    const data = blockedList.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      userImgs = userImgs || [];
      return { ...u, images: userImgs };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data,
    });
  }

  // 8e. updateHiddenProfile
  if (endpoint === 'updateHiddenProfile' || endpoint === 'hideUserProfile') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const targetUserId = parseInt(fields.hidden_user_id || fields.target_user_id || fields.profile_id) || 0;
    const user = db.users.find((u) => u.id === currentUserId);

    if (!user) {
      return jsonResponse({ status: false, message: 'User not found' }, 404);
    }

    let hiddenList = (user.hidden_user_ids || '')
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const isHidden = hiddenList.includes(targetUserId);
    if (isHidden) {
      hiddenList = hiddenList.filter((id) => id !== targetUserId);
    } else if (targetUserId > 0) {
      hiddenList.push(targetUserId);
    }

    user.hidden_user_ids = hiddenList.join(',');
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: isHidden ? 'Profile unhidden successfully' : 'Profile hidden successfully and will not be shown again',
      is_hidden: !isHidden,
      data: user,
    });
  }

  // 8d. fetchMyHiddenProfiles
  
  // 8e. updateHiddenProfile
  if (endpoint === 'updateHiddenProfile' || endpoint === 'hideUserProfile') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const targetUserId = parseInt(fields.hidden_user_id || fields.target_user_id || fields.profile_id) || 0;
    const user = db.users.find((u) => u.id === currentUserId);

    if (!user) {
      return jsonResponse({ status: false, message: 'User not found' }, 404);
    }

    let hiddenList = (user.hidden_user_ids || '')
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const isHidden = hiddenList.includes(targetUserId);
    if (isHidden) {
      hiddenList = hiddenList.filter((id) => id !== targetUserId);
    } else if (targetUserId > 0) {
      hiddenList.push(targetUserId);
    }

    user.hidden_user_ids = hiddenList.join(',');
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: isHidden ? 'Profile unhidden successfully' : 'Profile hidden successfully and will not be shown again',
      is_hidden: !isHidden,
      data: user,
    });
  }

  if (endpoint === 'fetchMyHiddenProfiles') {
    const currentUserId = parseInt(fields.my_user_id || fields.user_id) || 0;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const hiddenIds = (currentUser?.hidden_user_ids || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const start = parseInt(fields.start) || 0;
    const limit = parseInt(fields.limit) || 20;

    const hiddenList = db.users.filter((u) => hiddenIds.includes(u.id)).slice(start, start + limit);
    const data = hiddenList.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      userImgs = userImgs || [];
      return { ...u, images: userImgs };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data,
    });
  }

  // 8e. updateHiddenProfile
  if (endpoint === 'updateHiddenProfile' || endpoint === 'hideUserProfile') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const targetUserId = parseInt(fields.hidden_user_id || fields.target_user_id || fields.profile_id) || 0;
    const user = db.users.find((u) => u.id === currentUserId);

    if (!user) {
      return jsonResponse({ status: false, message: 'User not found' }, 404);
    }

    let hiddenList = (user.hidden_user_ids || '')
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    const isHidden = hiddenList.includes(targetUserId);
    if (isHidden) {
      hiddenList = hiddenList.filter((id) => id !== targetUserId);
    } else if (targetUserId > 0) {
      hiddenList.push(targetUserId);
    }

    user.hidden_user_ids = hiddenList.join(',');
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: isHidden ? 'Profile unhidden successfully' : 'Profile hidden successfully and will not be shown again',
      is_hidden: !isHidden,
      data: user,
    });
  }

  // 9. updateSavedProfile
  if (endpoint === 'updateSavedProfile') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const user = db.users.find((u) => u.id === currentUserId);
    if (user) {
      if (fields.profiles !== undefined) {
        user.savedprofile = fields.profiles.toString();
        (user as any).saved_profile = fields.profiles.toString();
      }
      user.updated_at = new Date().toISOString();
      user.images = db.images.filter((img) => img.user_id === user.id);
      if (user.images.length === 0) {
        user.images = user.images || [];
      }
      await commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Saved profile updated successfully',
        data: user,
      });
    }
    return jsonResponse({ status: false, message: 'User not found' });
  }

  // 9b. updateUserBlockList
  if (endpoint === 'updateUserBlockList') {
    const userId = parseInt(fields.user_id);
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      if (fields.blocked_users !== undefined) {
        user.blocked_users = fields.blocked_users.toString();
      }
      user.updated_at = new Date().toISOString();
      user.images = db.images.filter((img) => img.user_id === user.id);
      if (user.images.length === 0) {
        user.images = user.images || [];
      }
      await commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Block list updated successfully',
        data: user,
      });
    }
    return jsonResponse({ status: false, message: 'User not found' });
  }

  // 9c. updateLikedProfile
  if (endpoint === 'updateLikedProfile') {
    let myUserId = 0;
    let targetUserId = 0;
    if (fields.my_user_id) {
      myUserId = parseInt(fields.my_user_id);
      targetUserId = parseInt(fields.user_id || fields.profile_user_id || fields.target_user_id || fields.profile_id || 0);
    } else if (fields.profile_user_id || fields.target_user_id || fields.profile_id) {
      myUserId = parseInt(fields.user_id || 0);
      targetUserId = parseInt(fields.profile_user_id || fields.target_user_id || fields.profile_id || 0);
    } else {
      myUserId = parseInt(fields.user_id || 0);
      targetUserId = 0;
    }
    const user = db.users.find((u) => u.id === myUserId);

    let isLike = false;
    const existingIndex = (db.liked_profiles || []).findIndex(
      (lp) => lp.my_user_id === myUserId && lp.user_id === targetUserId
    );

    if (existingIndex >= 0) {
      db.liked_profiles.splice(existingIndex, 1);
      isLike = false;
      if (user && user.likedprofile) {
        user.likedprofile = user.likedprofile
          .split(',')
          .filter((id) => id.trim() !== targetUserId.toString())
          .join(',');
      }
    } else {
      db.liked_profiles.push({
        id: getNextId(db.liked_profiles),
        my_user_id: myUserId,
        user_id: targetUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      isLike = true;
      if (user) {
        const ids = (user.likedprofile || '').split(',').filter(Boolean);
        if (!ids.includes(targetUserId.toString())) {
          ids.push(targetUserId.toString());
          user.likedprofile = ids.join(',');
        }
      }
    }

    await commitDb(db);
    return jsonResponse({
      status: true,
      message: isLike ? 'Profile liked successfully' : 'Profile unliked successfully',
      data: { is_like: isLike },
    });
  }

  // 9d. likedProfile
  if (endpoint === 'likedProfile') {
    let myUserId = 0;
    let targetUserId = 0;
    if (fields.my_user_id) {
      myUserId = parseInt(fields.my_user_id);
      targetUserId = parseInt(fields.user_id || fields.profile_user_id || fields.target_user_id || fields.profile_id || 0);
    } else if (fields.profile_user_id || fields.target_user_id || fields.profile_id) {
      myUserId = parseInt(fields.user_id || 0);
      targetUserId = parseInt(fields.profile_user_id || fields.target_user_id || fields.profile_id || 0);
    } else {
      myUserId = parseInt(fields.user_id || 0);
      targetUserId = 0;
    }

    if (myUserId && targetUserId) {
      const exists = (db.liked_profiles || []).find(
        (lp) => lp.my_user_id === myUserId && lp.user_id === targetUserId
      );
      if (!exists) {
        db.liked_profiles.push({
          id: getNextId(db.liked_profiles),
          my_user_id: myUserId,
          user_id: targetUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      const myUser = db.users.find((u) => u.id === myUserId);
      if (myUser) {
        const ids = (myUser.likedprofile || '').split(',').filter(Boolean);
        if (!ids.includes(targetUserId.toString())) {
          ids.push(targetUserId.toString());
          myUser.likedprofile = ids.join(',');
        }
      }
      await commitDb(db);
    }

    const isMatch = (db.liked_profiles || []).some(
      (lp) => lp.my_user_id === targetUserId && lp.user_id === myUserId
    );

    return jsonResponse({
      status: true,
      message: 'Action successful',
      data: { is_match: isMatch },
    });
  }

  // 9e. dislikedProfile
  if (endpoint === 'dislikedProfile') {
    let myUserId = 0;
    let targetUserId = 0;
    if (fields.my_user_id) {
      myUserId = parseInt(fields.my_user_id);
      targetUserId = parseInt(fields.user_id || fields.profile_user_id || fields.target_user_id || fields.profile_id || 0);
    } else if (fields.profile_user_id || fields.target_user_id || fields.profile_id) {
      myUserId = parseInt(fields.user_id || 0);
      targetUserId = parseInt(fields.profile_user_id || fields.target_user_id || fields.profile_id || 0);
    } else {
      myUserId = parseInt(fields.user_id || 0);
      targetUserId = 0;
    }

    if (myUserId && targetUserId) {
      const idx = (db.liked_profiles || []).findIndex(
        (lp) => lp.my_user_id === myUserId && lp.user_id === targetUserId
      );
      if (idx >= 0) {
        db.liked_profiles.splice(idx, 1);
      }
      const myUser = db.users.find((u) => u.id === myUserId);
      if (myUser && myUser.likedprofile) {
        myUser.likedprofile = myUser.likedprofile
          .split(',')
          .filter((id) => id.trim() !== targetUserId.toString())
          .join(',');
      }
      await commitDb(db);
    }

    return jsonResponse({
      status: true,
      message: 'Action successful',
      data: { is_match: false },
    });
  }

  // 9f. deleteMyAccount
  if (endpoint === 'deleteMyAccount') {
    const userId = parseInt(fields.user_id);
    const index = db.users.findIndex((u) => u.id === userId);
    if (index >= 0) {
      db.users.splice(index, 1);
      db.images = db.images.filter((i) => i.user_id !== userId);
      db.posts = db.posts.filter((p) => p.user_id !== userId);
      db.stories = db.stories.filter((s) => s.user_id !== userId);
      await commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Account deleted successfully',
      });
    }
    return jsonResponse({ status: false, message: 'User not found' });
  }

  // 10. getInterests
  if (endpoint === 'getInterests') {
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: db.interests.filter((i) => i.is_deleted === 0),
    });
  }

  // 11. getPackage
  if (endpoint === 'getPackage') {
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: db.package,
    });
  }

  // 12. getDiamondPacks
  


  // 12c. getAdminBadgeCounts
  if (endpoint === 'getAdminBadgeCounts') {
    const pendingVerification = (db.verification_request || []).filter((v) => v.status === 0).length;
    const pendingLive = (db.live_application || []).filter((l) => l.status === 0).length;
    const pendingRedeem = (db.redeem_requests || []).filter((r) => r.status === 0).length;
    const pendingReports = (db.reports || []).filter((r) => r.status === 0 || !r.status).length;
    const totalPending = pendingVerification + pendingLive + pendingRedeem + pendingReports;

    return jsonResponse({
      status: true,
      data: {
        pendingVerification,
        pendingLive,
        pendingRedeem,
        pendingReports,
        totalPending,
      },
    });
  }

  if (endpoint === 'getDiamondPacks') {
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: db.diamond_packs,
    });
  }

  // 12a. paystack/initialize
  if (endpoint === 'paystack/initialize' || endpoint === 'paystackInitialize') {
    const email = fields.email?.toString() || 'user@orangeapp.com';
    const amountNaira = parseFloat(fields.amount) || 1500;
    const amountKobo = Math.round(amountNaira * 100);
    const userId = parseInt(fields.user_id) || 0;
    const planId = fields.plan_id?.toString() || '';
    const type = fields.type?.toString() || 'diamond';
    const diamonds = parseInt(fields.diamonds) || 0;
    const months = parseInt(fields.months) || 1;

    let secretKey = (
      db.appdata[0]?.paystack_secret_key ||
      process.env.PAYSTACK_SECRET_KEY ||
      ''
    )
      .toString()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/^Bearer\s+/i, '')
      .replace(/^["'`]|["'`]$/g, '')
      .trim();

    let publicKey = (
      db.appdata[0]?.paystack_public_key ||
      process.env.PAYSTACK_PUBLIC_KEY ||
      ''
    )
      .toString()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/^["'`]|["'`]$/g, '')
      .trim();

    // Auto-swap if accidentally swapped in admin panel
    if (secretKey.startsWith('pk_') && publicKey.startsWith('sk_')) {
      const temp = secretKey;
      secretKey = publicKey;
      publicKey = temp;
    } else if (!secretKey.startsWith('sk_') && publicKey.startsWith('sk_')) {
      secretKey = publicKey;
    }

    const isSandboxMode = db.appdata[0]?.paystack_sandbox_mode === 1;
    const isDummy =
      isSandboxMode ||
      !secretKey ||
      secretKey === '' ||
      secretKey.includes('test_orange_paystack') ||
      secretKey.includes('dummy') ||
      secretKey.includes('sandbox') ||
      secretKey.length < 25;

    if (isDummy) {
      const sandboxRef = `ORANGE_SANDBOX_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return jsonResponse({
        status: true,
        message: 'Paystack checkout sandbox initialized',
        data: {
          authorization_url: 'https://checkout.paystack.com',
          reference: sandboxRef,
          access_code: 'sandbox_access_code',
        },
      });
    }

    // If secret key still starts with pk_
    if (secretKey.startsWith('pk_')) {
      return jsonResponse({
        status: false,
        message: "Invalid Paystack Key Configuration: You entered a Public Key ('pk_...') in the Secret Key field. Paystack requires your Secret Key ('sk_live_...' or 'sk_test_...') in Admin Dashboard > Setting > Paystack.",
      });
    }

    const reference = `ORANGE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          amount: amountKobo,
          reference,
          metadata: {
            user_id: userId,
            plan_id: planId,
            type,
            diamonds,
            months,
          },
        }),
      });
      const paystackData = await paystackRes.json();
      if (paystackData && paystackData.status && paystackData.data?.authorization_url) {
        return jsonResponse({
          status: true,
          message: 'Paystack transaction initialized',
          data: paystackData.data,
        });
      } else {
        const rawMsg = paystackData?.message || '';
        let errorMsg = rawMsg || 'Paystack initialization failed. Please verify your Paystack keys in admin settings.';
        if (
          rawMsg.toLowerCase().includes('key') ||
          rawMsg.toLowerCase().includes('unauthorized') ||
          paystackRes.status === 401
        ) {
          console.warn(`[Paystack Init] Key was rejected by Paystack (${rawMsg}). Automatically falling back to sandbox mode.`);
          const fallbackRef = `ORANGE_SANDBOX_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          return jsonResponse({
            status: true,
            message: 'Paystack sandbox simulation initialized (fallback)',
            data: {
              authorization_url: 'https://checkout.paystack.com',
              reference: fallbackRef,
              access_code: 'sandbox_fallback_code',
            },
          });
        }
        return jsonResponse({
          status: false,
          message: errorMsg,
        });
      }
    } catch (err: any) {
      console.error('Paystack initialization error:', err);
      const fallbackRef = `ORANGE_SANDBOX_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return jsonResponse({
        status: true,
        message: 'Paystack sandbox simulation initialized (offline fallback)',
        data: {
          authorization_url: 'https://checkout.paystack.com',
          reference: fallbackRef,
          access_code: 'sandbox_fallback_code',
        },
      });
    }
  }

  // 12b. paystack/verify
  if (endpoint === 'paystack/verify' || endpoint === 'paystackVerify') {
    const reference = fields.reference?.toString() || '';
    const userId = parseInt(fields.user_id) || 0;
    const type = fields.type?.toString() || 'diamond';
    const diamonds = parseInt(fields.diamonds) || 0;
    const months = parseInt(fields.months) || 1;

    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return jsonResponse({ status: false, message: 'User not found' }, 404);
    }

    let secretKey = (
      db.appdata[0]?.paystack_secret_key ||
      process.env.PAYSTACK_SECRET_KEY ||
      ''
    ).trim().replace(/^[\"']|[\"']$/g, '');
    let publicKey = (
      db.appdata[0]?.paystack_public_key ||
      process.env.PAYSTACK_PUBLIC_KEY ||
      ''
    ).trim().replace(/^[\"']|[\"']$/g, '');

    if (secretKey.startsWith('pk_') && publicKey.startsWith('sk_')) {
      secretKey = publicKey;
    } else if (!secretKey.startsWith('sk_') && publicKey.startsWith('sk_')) {
      secretKey = publicKey;
    }

    const isSandboxMode = db.appdata[0]?.paystack_sandbox_mode === 1;
    const isDummy = isSandboxMode || !secretKey || secretKey === '' || secretKey.includes('test_orange_paystack') || secretKey.length < 25;
    const isSandboxRef = reference.startsWith('ORANGE_SANDBOX_');

    if (isDummy && !isSandboxRef) {
      return jsonResponse({
        status: false,
        message: 'Payment verification failed: Paystack secret key is not configured in Admin Settings.',
      });
    }

    if (!reference || reference.trim() === '') {
      return jsonResponse({
        status: false,
        message: 'Payment verification failed: Reference is required.',
      });
    }

    // Prevent duplicate crediting via processed reference list
    if (!(db as any).processed_paystack_references) {
      (db as any).processed_paystack_references = [];
    }
    if ((db as any).processed_paystack_references.includes(reference)) {
      return jsonResponse({
        status: false,
        message: 'This payment transaction has already been credited.',
      });
    }

    let verified = false;
    if (isSandboxRef || isDummy) {
      verified = true;
    } else {
      try {
        const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
          headers: {
            Authorization: `Bearer ${secretKey.trim()}`,
          },
        });
        const paystackData = await paystackRes.json();
        if (paystackData?.status === true && paystackData?.data?.status === 'success') {
          verified = true;
        } else {
          return jsonResponse({
            status: false,
            message: paystackData?.data?.gateway_response || paystackData?.message || 'Payment has not been completed on Paystack.',
          });
        }
      } catch (err: any) {
        console.error('Paystack verification error:', err);
        return jsonResponse({
          status: false,
          message: 'Paystack verification network error: ' + err.message,
        });
      }
    }

    if (!verified) {
      return jsonResponse({
        status: false,
        message: 'Payment verification failed: transaction was not completed.',
      });
    }

    // Mark reference as consumed
    (db as any).processed_paystack_references.push(reference);

    if (type === 'diamond') {
      const addedCoins = diamonds > 0 ? diamonds : 100;
      user.wallet = (user.wallet || 0) + addedCoins;
    } else if (type === 'subscription') {
      user.is_verified = 3;
      user.is_pro = 1;
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + (months * 30));
      user.pro_expire_date = expireDate.toISOString();
    }

    await commitDb(db);

    user.images = db.images.filter((img) => img.user_id === user.id) || [];
    return jsonResponse({
      status: true,
      message: type === 'diamond' ? `Successfully added ${diamonds} diamonds to your wallet!` : 'VIP Subscription activated successfully!',
      data: user,
    });
  }

  // 13. addCoinsToWallet / minusCoinsFromWallet
  
  // 13b. sendLiveStreamGift (credits host wallet and total_collected)
  if (endpoint === 'sendLiveStreamGift') {
    const senderId = parseInt(fields.my_user_id || fields.user_id) || 0;
    const hostId = parseInt(fields.host_id || fields.target_user_id) || 0;
    const coinPrice = parseInt(fields.coin_price || fields.coins || fields.amount) || 0;

    const sender = db.users.find((u) => u.id === senderId);
    const host = db.users.find((u) => u.id === hostId);

    if (sender && sender.wallet < coinPrice) {
      return jsonResponse({ status: false, message: 'Insufficient diamonds' });
    }

    if (sender) {
      sender.wallet = Math.max(0, (sender.wallet || 0) - coinPrice);
    }
    if (host) {
      const commission = db.appdata[0]?.stream_and_gift_commission || 10;
      const hostEarned = Math.round(coinPrice * (1 - commission / 100));
      host.wallet = (host.wallet || 0) + hostEarned;
      host.total_collected = (host.total_collected || 0) + hostEarned;

      db.user_notification.push({
        id: getNextId(db.user_notification),
        user_id: hostId,
        my_user_id: senderId,
        title: 'New Gift Received',
        message: (sender?.fullname || 'A fan') + ' sent you a gift (' + hostEarned + ' diamonds)!',
        item_id: 0,
        type: 5,
        updated_at: new Date().toISOString(),
        is_read: 0,
        created_at: new Date().toISOString(),
      });
    }

    await commitDb(db);
    return jsonResponse({
      status: true,
      message: 'Gift sent successfully',
      data: sender,
    });
  }

  if (endpoint === 'addCoinsToWallet' || endpoint === 'minusCoinsFromWallet') {
    const userId = parseInt(fields.user_id);
    const coins = parseInt(fields.coins || fields.amount) || 0;
    const user = db.users.find((u) => u.id === userId);

    if (user) {
      if (endpoint === 'addCoinsToWallet') {
        user.wallet = (user.wallet || 0) + coins;
        user.total_collected = (user.total_collected || 0) + coins;
      } else {
        // Fake users won't be charged for messages, reverse swipe, or live stream watch
        if (!user.is_fake) {
          user.wallet = Math.max(0, (user.wallet || 0) - coins);
        }
      }
      user.updated_at = new Date().toISOString();
      await commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Coins updated successfully',
        wallet: user.wallet,
        total_collected: user.total_collected,
        data: user,
      });
    }

    return jsonResponse({
      status: false,
      message: 'User not found',
    });
  }

  // 14. onOffNotification / onOffShowMeOnMap / onOffAnonymous / onOffVideoCalls / updateLiveStatus
  if (
    endpoint === 'onOffNotification' ||
    endpoint === 'onOffShowMeOnMap' ||
    endpoint === 'onOffAnonymous' ||
    endpoint === 'onOffVideoCalls' ||
    endpoint === 'updateLiveStatus'
  ) {
    const userId = parseInt(fields.user_id);
    const user = db.users.find((u) => u.id === userId);

    if (user) {
      const stateVal = fields.state !== undefined
        ? parseInt(fields.state)
        : parseInt(fields.anonymous ?? fields.show_on_map ?? fields.is_notification ?? fields.is_video_call ?? fields.is_live_now);
      const finalState = isNaN(stateVal) ? 0 : stateVal;

      if (endpoint === 'onOffNotification') user.is_notification = finalState;
      if (endpoint === 'onOffShowMeOnMap') user.show_on_map = finalState;
      if (endpoint === 'onOffAnonymous') user.anonymous = finalState;
      if (endpoint === 'onOffVideoCalls') user.is_video_call = finalState;
      if (endpoint === 'updateLiveStatus') user.is_live_now = finalState;

      let userImgs = db.images.filter((img) => img.user_id === user.id);
      userImgs = userImgs || [];
      user.images = userImgs;

      await commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Status updated',
        data: user,
      });
    }

    return jsonResponse({
      status: false,
      message: 'User not found',
    });
  }

  // 15. placeRedeemRequest & fetchMyRedeemRequests
  if (endpoint === 'placeRedeemRequest') {
    const userId = parseInt(fields.user_id);
    const user = db.users.find((u) => u.id === userId);
    const coinAmount = parseInt(fields.coin_amount) || (user?.wallet ?? 0);
    const minThreshold = db.appdata[0]?.min_threshold || 5000;
    const earnedDiamonds = user?.total_collected || 0;

    if (earnedDiamonds < coinAmount) {
      return jsonResponse({
        status: false,
        message: 'Cannot withdraw free registration diamonds. Only diamonds earned from live streaming and gifts can be withdrawn (You have ' + earnedDiamonds + ' earned diamonds).',
      });
    }

    if (earnedDiamonds < minThreshold) {
      return jsonResponse({
        status: false,
        message: 'Minimum withdrawal threshold is ' + minThreshold + ' diamonds.',
      });
    }
    const paymentGateway = fields.payment_gateway?.toString() || 'PayPal';
    const accountDetails = fields.account_details?.toString() || '';

    const newReq: any = {
      id: getNextId(db.redeem_requests),
      user_id: userId,
      request_id: `RED_${Date.now()}`,
      coin_amount: coinAmount,
      payment_gateway: paymentGateway,
      account_details: accountDetails,
      amount_paid: 0,
      status: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.redeem_requests.push(newReq);

    // deduct from user wallet
    if (user) {
      user.wallet = Math.max(0, (user.wallet || 0) - coinAmount);
    }
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Redeem Request placed successfully!',
      data: newReq,
    });
  }

  if (endpoint === 'fetchMyRedeemRequests') {
    const userId = parseInt(fields.user_id);
    const list = db.redeem_requests.filter((r) => r.user_id === userId);
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: list,
    });
  }

  // 16. applyForVerification
  if (endpoint === 'applyForVerification') {
    const userId = parseInt(fields.user_id);
    const docFile = files.find((f) => f.fieldname === 'document' || f.fieldname === 'doc_image');
    const doc = docFile ? docFile.url : (fields.document || '');
    const selfieFile = files.find((f) => f.fieldname === 'selfie' || f.fieldname === 'photo');
    const selfie = selfieFile ? selfieFile.url : (fields.selfie || '');
    const fullname = fields.fullname || '';

    const newReq: any = {
      id: getNextId(db.verification_request),
      user_id: userId,
      document: doc,
      document_type: fields.document_type || 'ID Card',
      selfie,
      fullname,
      status: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.verification_request.push(newReq);
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.is_verified = 1;
    }
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Verification application submitted',
      data: newReq,
    });
  }

  // 17. applyForLive
  if (endpoint === 'applyForLive') {
    const userId = parseInt(fields.user_id);
    const newReq: any = {
      id: getNextId(db.live_application),
      user_id: userId,
      about_you: fields.about_you || '',
      languages: fields.languages || '',
      intro_video: fields.intro_video || '',
      social_links: fields.social_links || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.live_application.push(newReq);
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Live stream application submitted',
      data: newReq,
    });
  }

  // 18. addLiveStreamHistory & fetchAllLiveStreamHistory
  if (endpoint === 'addLiveStreamHistory') {
    const userId = parseInt(fields.user_id);
    const user = (db.users || []).find((u) => Number(u.id) === userId);
    const amount = parseFloat(fields.amount_collected) || 0;
    if (user) {
      user.total_streams = (user.total_streams || 0) + 1;
      user.total_collected = (user.total_collected || 0) + amount;
      user.wallet = (user.wallet || 0) + amount;
    }

    let startedAt = fields.started_at;
    if (!startedAt) {
      startedAt = new Date().toISOString();
    } else if (/^\d{1,2}:\d{2}/.test(startedAt.trim())) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const parsed = new Date(`${todayStr} ${startedAt}`);
        if (!isNaN(parsed.getTime())) {
          startedAt = parsed.toISOString();
        }
      } catch (_) {}
    }

    const newHistory: any = {
      id: getNextId(db.live_history || []),
      user_id: userId,
      fullname: user?.fullname || (user as any)?.name || `User #${userId}`,
      username: user?.username || 'user',
      started_at: startedAt,
      streamed_for: fields.streamed_for || '00:10:00',
      amount_collected: amount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!db.live_history) db.live_history = [];
    db.live_history.push(newHistory);
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Stream history added',
      data: newHistory,
    });
  }

  if (endpoint === 'fetchAllLiveStreamHistory') {
    const userId = parseInt(fields.user_id);
    const list = (db.live_history || []).filter((h) => Number(h.user_id) === userId);
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: list,
    });
  }

  if (endpoint === 'fetchLiveHistory') {
    const list = db.live_history || (db as any).live_histories || [];
    const data = list.map((h: any) => {
      const u = (db.users || []).find((user) => Number(user.id) === Number(h.user_id));
      const images = u
        ? (u.images && u.images.length
            ? u.images
            : (db.images || []).filter((img) => Number(img.user_id) === Number(u.id)))
        : [];
      const fullname =
        u?.fullname ||
        (u as any)?.name ||
        h.fullname ||
        (h.user_id ? `User #${h.user_id}` : 'Anonymous Streamer');
      const username =
        u?.username ||
        (u as any)?.user_name ||
        h.username ||
        'N/A';

      return {
        ...h,
        fullname,
        username,
        user: u
          ? {
              ...u,
              fullname,
              username,
              images,
            }
          : {
              id: h.user_id,
              fullname,
              username,
              images: [],
            },
      };
    });

    data.sort((a: any, b: any) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    return jsonResponse({ status: true, data });
  }

  // 19. addUserReport & reportPost & getPackage
  if (endpoint === 'addUserReport') {
    // Notify admin on report
    db.admin_notification.push({
      id: getNextId(db.admin_notification),
      title: 'New User Report',
      message: 'User #' + fields.user_id + ' was reported for ' + (fields.reason || 'inappropriate conduct'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    if (!db.reports) db.reports = [];
    const newReport: any = {
      id: getNextId(db.reports),
      type: 1, // 1: User / Profile report
      user_id: parseInt(fields.user_id) || 0,
      reported_by: parseInt(fields.reported_by || fields.my_user_id || fields.reporter_id) || null,
      reason: fields.reason || 'Other',
      description: fields.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.reports.push(newReport);
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Report submitted successfully',
      data: newReport,
    });
  }

  if (endpoint === 'reportPost') {
    if (!db.reports) db.reports = [];
    const postId = parseInt(fields.post_id || fields.id) || 0;
    const newReport: any = {
      id: getNextId(db.reports),
      type: 0, // 0: Post report
      post_id: postId,
      reported_by: parseInt(fields.reported_by || fields.my_user_id || fields.reporter_id) || null,
      reason: fields.reason || 'Other',
      description: fields.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.reports.push(newReport);
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Report submitted successfully',
      data: newReport,
    });
  }

  if (endpoint === 'getPackage') {
    return jsonResponse({
      status: true,
      message: 'fetchSuccessful',
      data: db.package || [],
    });
  }

  // 20. searchUsers & searchUsersForInterest
  if (endpoint === 'searchUsers' || endpoint === 'searchUsersForInterest') {
    const keyword = (fields.keyword || fields.search || '').toString().toLowerCase();
    const interestId = fields.interest_id?.toString();
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const csvLikes = (currentUser?.likedprofile || '').split(',').map((s) => s.trim());
    const csvSaved = (currentUser?.savedprofile || '').split(',').map((s) => s.trim());

    let list = db.users.filter((u) => u.is_block === 0);
    // Exclude current searching user so they don't see themselves in search
    if (currentUserId) {
      list = list.filter((u) => u.id !== currentUserId);
    }
    // Exclude anonymous users
    list = list.filter((u) => u.anonymous !== 1);

    if (keyword) {
      list = list.filter(
        (u) =>
          u.fullname.toLowerCase().includes(keyword) ||
          u.username.toLowerCase().includes(keyword) ||
          u.bio.toLowerCase().includes(keyword)
      );
    }

    if (interestId) {
      list = list.filter((u) => u.interests && u.interests.split(',').includes(interestId));
    }

    const data = list.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      userImgs = userImgs || [];
      return {
        ...u,
        religion_key: String(u.religion_key || ''),
        images: userImgs,
        is_like:
          csvLikes.includes(u.id.toString()) ||
          (db.liked_profiles || []).some(
            (lp) => lp.my_user_id === currentUserId && lp.user_id === u.id
          ),
        is_saved: csvSaved.includes(u.id.toString()),
      };
    });

    return jsonResponse({
      status: true,
      message: 'Search successful',
      data,
    });
  }

  // 21. getUserNotifications / getAdminNotifications / markNotificationAsRead
  if (endpoint === 'getUserNotifications') {
    const userId = parseInt(fields.user_id);
    const userNotifs = (db.user_notification || [])
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    // Deduplicate notifications
    const seenIds = new Set();
    const uniqueNotifs: typeof userNotifs = [];
    for (const n of userNotifs) {
      if (!seenIds.has(n.id)) {
        seenIds.add(n.id);
        uniqueNotifs.push(n);
      }
    }

    const notifs = uniqueNotifs.map((n) => {
      const sender = db.users.find((u) => u.id === n.my_user_id);
      const images = db.images.filter((i) => i.user_id === n.my_user_id);
      return {
        ...n,
        is_read: n.is_read !== undefined ? n.is_read : 0,
        user: sender ? { ...sender, images } : null,
      };
    });
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: notifs,
    });
  }

  if (endpoint === 'markNotificationAsRead' || endpoint === 'readNotification') {
    const userId = parseInt(fields.user_id || fields.my_user_id) || 0;
    if (userId > 0 && db.user_notification) {
      db.user_notification.forEach((n) => {
        if (n.user_id === userId) {
          n.is_read = 1;
          n.updated_at = new Date().toISOString();
        }
      });
      await commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Notifications marked as read' });
  }

  if (endpoint === 'getAdminNotifications') {
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: db.admin_notification,
    });
  }

  // 22. followUser / unfollowUser / fetchFollowingList / fetchFollowersList
  if (endpoint === 'followUser' || endpoint === 'unfollowUser') {
    const myId = parseInt(fields.my_user_id || fields.user_id);
    const targetId = parseInt(fields.target_user_id || (fields.my_user_id ? fields.user_id : '0'));
    const userA = db.users.find((u) => u.id === myId);
    const userB = db.users.find((u) => u.id === targetId);

    if (endpoint === 'followUser') {
      const exists = db.following_lists.find((f) => f.my_user_id === myId && f.user_id === targetId);
      if (!exists) {
        if (userA) userA.following = (userA.following || 0) + 1;
        if (userB) userB.followers = (userB.followers || 0) + 1;
        if (userB && !db.user_notification.some((n) => n.user_id === targetId && n.my_user_id === myId && n.type === 1)) {
          db.user_notification.push({
            id: getNextId(db.user_notification),
            user_id: targetId,
            my_user_id: myId,
            title: 'New Follower',
            message: (userA?.fullname || 'Someone') + ' started following you!',
            item_id: targetId,
            type: 1,
            updated_at: new Date().toISOString(),
            is_read: 0,
            created_at: new Date().toISOString(),
          });
        }
        db.following_lists.push({
          id: getNextId(db.following_lists),
          my_user_id: myId,
          user_id: targetId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      if (userA) userA.following = Math.max(0, (userA.following || 1) - 1);
      if (userB) userB.followers = Math.max(0, (userB.followers || 1) - 1);
      db.following_lists = db.following_lists.filter(
        (f) => !(f.my_user_id === myId && f.user_id === targetId)
      );
    }
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Action completed',
    });
  }

  if (endpoint === 'fetchFollowingList' || endpoint === 'fetchFollowersList') {
    const targetUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const start = parseInt(fields.start) || 0;
    const limit = parseInt(fields.limit) || 20;

    const allRelations = db.following_lists || [];
    let matchedUserIds: number[] = [];

    if (endpoint === 'fetchFollowingList') {
      matchedUserIds = allRelations
        .filter((f) => f.my_user_id === targetUserId)
        .map((f) => f.user_id);
    } else {
      matchedUserIds = allRelations
        .filter((f) => f.user_id === targetUserId)
        .map((f) => f.my_user_id);
    }

    const paginatedIds = matchedUserIds.slice(start, start + limit);
    const resultUsers = paginatedIds
      .map((id) => {
        const u = db.users.find((user) => user.id === id);
        if (!u) return null;
        const userImgs = db.images.filter((img) => img.user_id === u.id);
        const userStories = (db.stories || []).filter((s) => s.user_id === u.id);
        return {
          ...u,
          images: userImgs,
          stories: userStories,
        };
      })
      .filter(Boolean);

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: resultUsers,
    });
  }

  // Helper: Prune stories older than 24 hours
  const pruneExpiredStories = (database: typeof db): boolean => {
    if (!database.stories || !Array.isArray(database.stories)) return false;
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const initialLength = database.stories.length;
    database.stories = database.stories.filter((s: Story) => {
      if (!s.created_at) return true;
      const storyTime = new Date(s.created_at).getTime();
      return !isNaN(storyTime) && storyTime >= cutoff;
    });
    return database.stories.length !== initialLength;
  };

  // 23. stories & posts
  if (endpoint === 'fetchStories') {
    if (pruneExpiredStories(db)) await commitDb(db);
    const usersWithStories = db.users
      .filter((u) => u.is_block === 0)
      .map((u) => {
        let imgs = db.images.filter((i) => i.user_id === u.id);
        imgs = imgs || [];
        return {
          ...u,
          images: imgs,
          stories: (db.stories || []).filter((s) => s.user_id === u.id),
        };
      })
      .filter((u) => (u.stories || []).length > 0);

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: usersWithStories,
    });
  }

  if (endpoint === 'fetchHomePageData') {
    if (pruneExpiredStories(db)) await commitDb(db);
    const appdata = db.appdata[0];
    if (appdata && appdata.is_social_media === 0) {
      return jsonResponse({
        status: true,
        message: 'Social media is disabled',
        data: {
          users_stories: [],
          posts: [],
          has_more: false,
          total_count: 0,
        },
      });
    }

    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    // Pagination params (Facebook-style batch loading)
    const PAGE_SIZE = 10;
    const requestedPage = Math.max(1, parseInt(fields.page || '1') || 1);
    const offset = (requestedPage - 1) * PAGE_SIZE;

    const postsWithDetails = db.posts.map((p) => {
      const postUser = db.users.find((u) => u.id === p.user_id);
      let userImages = postUser ? db.images.filter((i) => i.user_id === postUser.id) : [];
      if (userImages.length === 0) {
        userImages = [];
      }
      return {
        ...p,
        is_like: p.is_like || 0,
        user: postUser
          ? {
            ...postUser,
            images: userImages,
            stories: (db.stories || []).filter((s) => s.user_id === postUser.id),
          }
          : null,
        content: db.post_contents.filter((c) => c.post_id === p.id),
      };
    });

    const followingUsers = db.users
      .filter((u) => u.is_block === 0)
      .map((u) => {
        let imgs = db.images.filter((i) => i.user_id === u.id);
        imgs = imgs || [];
        return {
          ...u,
          images: imgs,
          stories: (db.stories || []).filter((s) => s.user_id === u.id),
        };
      })
      .filter((u) => (u.stories || []).length > 0);

    const currentUser = db.users.find((u) => u.id === currentUserId);
    const myInterests = String(currentUser?.interests || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const followingIds = new Set(
      (db.following_lists || [])
        .filter((f) => f.my_user_id === currentUserId)
        .map((f) => f.user_id)
    );

    // Algorithmic Feed Ranking (Production Instagram / Facebook Feed Model)
    const scoredPosts = postsWithDetails.map((p) => {
      let score = 0;

      const postTime = p.created_at ? new Date(p.created_at).getTime() : 0;
      const hoursAgo = postTime > 0 ? Math.max(0, (Date.now() - postTime) / (1000 * 60 * 60)) : 100;

      // 1. Fresh Post Exploration / Discovery Boost (FB/IG EdgeRank Freshness Boost)
      if (hoursAgo < 1) {
        score += 160;
      } else if (hoursAgo < 3) {
        score += 120;
      } else if (hoursAgo < 8) {
        score += 70;
      } else if (hoursAgo < 24) {
        score += 35;
      } else if (hoursAgo < 72) {
        score += 15;
      }

      // 2. Creator Affinity & Social Graph
      const isCreatorFollowed = followingIds.has(p.user_id);
      const isSelf = p.user_id === currentUserId;
      if (isSelf) {
        score += 150;
      } else if (isCreatorFollowed) {
        score += 85;
      }

      // 3. Content Interest & Topical Relevance
      const postInterests = String(p.interest_ids || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const sharedInterests = postInterests.filter((i) => myInterests.includes(i));
      score += sharedInterests.length * 30;

      // Hashtag / Keyword matching
      const postHashtags = String(p.hashtags || '').toLowerCase();
      const postDesc = String(p.description || '').toLowerCase();
      for (const interest of myInterests) {
        if (interest.length > 2 && (postHashtags.includes(interest) || postDesc.includes(interest))) {
          score += 20;
          break;
        }
      }

      // 4. Engagement Velocity & Gravity Decay
      const likes = p.likes_count || 0;
      const comments = p.comments_count || 0;
      const rawEngagement = likes * 2.5 + comments * 5.0;
      const gravityDecay = Math.pow(1 + hoursAgo / 8, 1.6);
      const decayedEngagement = rawEngagement / gravityDecay;
      score += decayedEngagement;

      // 5. Media Richness Signal
      const contentItems = p.content || [];
      if (contentItems.some((c: any) => c.content_type === 1)) {
        score += 25;
      } else if (contentItems.length > 1) {
        score += 15;
      }

      // 6. Dynamic jitter for variety on pull-to-refresh
      const jitter = (Math.random() - 0.5) * 12;
      score += jitter;

      return { post: p, score };
    });

    // Sort by ranking score
    scoredPosts.sort((a, b) => b.score - a.score);

    // 7. Author Diversity Interleaving
    const interleavedPosts: any[] = [];
    const remainingPosts = [...scoredPosts];
    let lastAuthorId: number | null = null;

    while (remainingPosts.length > 0) {
      let pickIndex = remainingPosts.findIndex((sp) => sp.post.user_id !== lastAuthorId);
      if (pickIndex === -1) pickIndex = 0;
      const [picked] = remainingPosts.splice(pickIndex, 1);
      interleavedPosts.push(picked.post);
      lastAuthorId = picked.post.user_id;
    }

    // Apply pagination slice
    const totalCount = interleavedPosts.length;
    const paginatedPosts = interleavedPosts.slice(offset, offset + PAGE_SIZE);
    const hasMore = offset + PAGE_SIZE < totalCount;

    return jsonResponse({
      status: true,
      message: 'Fetch posts',
      data: {
        users_stories: requestedPage === 1 ? followingUsers : [], // stories only on first page
        posts: paginatedPosts,
        has_more: hasMore,
        total_count: totalCount,
        current_page: requestedPage,
      },
    });
  }

  if (endpoint === 'fetchPosts') {
    const postsWithDetails = db.posts.map((p) => {
      const postUser = db.users.find((u) => u.id === p.user_id);
      let userImages = postUser ? db.images.filter((i) => i.user_id === postUser.id) : [];
      if (userImages.length === 0) {
        userImages = [];
      }
      return {
        ...p,
        user: postUser
          ? {
            ...postUser,
            images: userImages,
          }
          : null,
        content: db.post_contents.filter((c) => c.post_id === p.id),
      };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: postsWithDetails,
    });
  }

  // 24. addPost
  if (endpoint === 'addPost') {
    const userId = parseInt(fields.user_id);
    const newPostId = getNextId(db.posts);
    const newPost: Post = {
      id: newPostId,
      user_id: userId,
      description: fields.description || '',
      interest_ids: fields.interest_ids || '',
      hashtags: fields.hashtags || '',
      comments_count: 0,
      likes_count: 0,
      is_like: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.posts.unshift(newPost);

    // Save uploaded media files
    if (files && files.length > 0) {
      const contentType = parseInt(fields.content_type) || 0;
      if (contentType === 1) {
        // Video post: find video file and thumbnail file
        const videoFile =
          files.find((f) =>
            f.fieldname.includes('content') ||
            f.filename.endsWith('.mp4') ||
            f.filename.endsWith('.mov') ||
            f.filename.endsWith('.webm') ||
            f.filename.endsWith('.m4v') ||
            f.filename.endsWith('.3gp') ||
            f.filename.endsWith('.avi') ||
            f.url.includes('video')
          ) || files[0];

        const thumbFile =
          files.find((f) =>
            f.fieldname.includes('thumbnail') ||
            (f !== videoFile &&
              (f.filename.endsWith('.jpg') ||
                f.filename.endsWith('.png') ||
                f.filename.endsWith('.webp') ||
                f.filename.endsWith('.jpeg')))
          ) || videoFile;

        const newContentId = getNextId(db.post_contents);
        db.post_contents.push({
          id: newContentId,
          post_id: newPostId,
          content_type: 1,
          content: videoFile.url,
          thumbnail: thumbFile.url,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } else {
        files.forEach((f) => {
          const newContentId = getNextId(db.post_contents);
          db.post_contents.push({
            id: newContentId,
            post_id: newPostId,
            content_type: contentType,
            content: f.url,
            thumbnail: f.url,
            view_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }
    }
    await commitDb(db);

    const postUser = db.users.find((u) => u.id === userId);
    const fullPost = {
      ...newPost,
      user: postUser,
      content: db.post_contents.filter((c) => c.post_id === newPostId),
    };

    return jsonResponse({
      status: true,
      message: 'Post Uploaded',
      data: fullPost,
    });
  }

  // 25. likePost & dislikePost
  if (endpoint === 'likePost') {
    const postId = parseInt(fields.post_id);
    const post = db.posts.find((p) => p.id === postId);
    if (post) {
      post.likes_count = (post.likes_count || 0) + 1;
      post.is_like = 1;
      await commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Post Liked',
        data: post,
      });
    }
    return jsonResponse({ status: false, message: 'Post Not Found' });
  }

  if (endpoint === 'dislikePost') {
    const postId = parseInt(fields.post_id);
    const post = db.posts.find((p) => p.id === postId);
    if (post) {
      post.likes_count = Math.max(0, (post.likes_count || 0) - 1);
      post.is_like = 0;
      await commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Post Dislike',
        data: post,
      });
    }
    return jsonResponse({ status: false, message: 'Post Not Found' });
  }

  // 26. addComment & fetchComments & deleteComment
  if (endpoint === 'addComment') {
    const desc = (fields.description || '').trim();
    if (!desc) {
      return jsonResponse({ status: false, message: 'Comment cannot be empty' });
    }
    const postId = parseInt(fields.post_id);
    const userId = parseInt(fields.user_id);
    const post = db.posts.find((p) => p.id === postId);
    if (post) {
      const newComment: Comment = {
        id: getNextId(db.comments),
        user_id: userId,
        post_id: postId,
        description: desc,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.comments.push(newComment);
      post.comments_count = (post.comments_count || 0) + 1;

      // Add user notification if commenter is not post owner
      if (post.user_id && post.user_id !== userId) {
        db.user_notification.push({
          id: getNextId(db.user_notification),
          my_user_id: userId,
          user_id: post.user_id,
          item_id: newComment.id,
          type: 2, // notificationTypeComment
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await commitDb(db);

      const user = db.users.find((u) => u.id === userId);
      return jsonResponse({
        status: true,
        message: 'Comment Placed',
        data: {
          ...newComment,
          user,
        },
      });
    }
    return jsonResponse({ status: false, message: 'Post Not Found' });
  }

  if (endpoint === 'fetchComments') {
    const postId = parseInt(fields.post_id);
    const comments = db.comments
      .filter((c) => c.post_id === postId)
      .map((c) => ({
        ...c,
        user: db.users.find((u) => u.id === c.user_id),
      }));

    return jsonResponse({
      status: true,
      message: 'Fetch Comments',
      data: comments,
    });
  }

  if (endpoint === 'deleteComment') {
    const commentId = parseInt(fields.comment_id);
    const comment = db.comments.find((c) => c.id === commentId);
    if (comment) {
      const post = db.posts.find((p) => p.id === comment.post_id);
      if (post) {
        post.comments_count = Math.max(0, (post.comments_count || 0) - 1);
      }
      db.comments = db.comments.filter((c) => c.id !== commentId);
      await commitDb(db);
      return jsonResponse({ status: true, message: 'Delete Comment Successfully' });
    }
    return jsonResponse({ status: false, message: 'Comment not found' });
  }

  // 27. deleteMyPost
  if (endpoint === 'deleteMyPost') {
    const postId = parseInt(fields.post_id);
    const userId = parseInt(fields.user_id);
    const contentsToDelete = (db.post_contents || []).filter((c) => c.post_id === postId);
    for (const c of contentsToDelete) {
      if (c.content) {
        deleteFromCloudinary(c.content).catch(() => {});
      }
      if (c.thumbnail) {
        deleteFromCloudinary(c.thumbnail).catch(() => {});
      }
    }
    db.posts = db.posts.filter((p) => !(p.id === postId && p.user_id === userId));
    db.post_contents = db.post_contents.filter((c) => c.post_id !== postId);
    db.comments = db.comments.filter((c) => c.post_id !== postId);
    await commitDb(db);
    return jsonResponse({ status: true, message: 'Post Delete Successfully' });
  }

  // 28. fetchPostByUser & fetchPostByPostId & increasePostViewCount
  if (endpoint === 'fetchPostByUser') {
    const userId = parseInt(fields.user_id);
    const posts = db.posts
      .filter((p) => p.user_id === userId)
      .map((p) => ({
        ...p,
        content: db.post_contents.filter((c) => c.post_id === p.id),
        user: db.users.find((u) => u.id === userId),
      }));
    return jsonResponse({ status: true, message: 'Fetch posts successfully', data: posts });
  }

  if (endpoint === 'fetchPostByPostId') {
    const postId = parseInt(fields.post_id);
    const post = db.posts.find((p) => p.id === postId);
    if (post) {
      const full = {
        ...post,
        content: db.post_contents.filter((c) => c.post_id === post.id),
        user: db.users.find((u) => u.id === post.user_id),
      };
      return jsonResponse({ status: true, message: 'Fetch post successfully', data: full });
    }
    return jsonResponse({ status: false, message: 'Post not found' });
  }

  if (endpoint === 'increasePostViewCount') {
    const postId = parseInt(fields.post_id);
    const content = db.post_contents.find((c) => c.post_id === postId);
    if (content) {
      content.view_count = (content.view_count || 0) + 1;
      await commitDb(db);
      return jsonResponse({ status: true, message: 'Add post view count', data: content });
    }
    return jsonResponse({ status: true, message: 'Add post view count' });
  }

  // 28b. reportPost
  if (endpoint === 'reportPost') {
    const postId = parseInt(fields.post_id);
    const reason = fields.reason || 'Inappropriate content';
    const description = fields.description || '';
    const newReport: Report = {
      id: getNextId(db.reports),
      type: 2,
      user_id: parseInt(fields.user_id) || 1,
      post_id: postId,
      reason,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.reports.push(newReport);
    await commitDb(db);
    return jsonResponse({
      status: true,
      message: 'Post reported successfully',
    });
  }

  // 28c. fetchPostsByHashtag
  if (endpoint === 'fetchPostsByHashtag') {
    const hashtag = (fields.hashtag || '').toString().toLowerCase().replace('#', '').trim();
    const start = parseInt(fields.start) || 0;
    const limit = parseInt(fields.limit) || 20;

    const matchedPosts = db.posts
      .filter((p) => {
        const postTags = (p.hashtags || '').toLowerCase();
        return postTags.includes(hashtag);
      })
      .slice(start, start + limit)
      .map((p) => {
        const postUser = db.users.find((u) => u.id === p.user_id);
        let userImages = postUser ? db.images.filter((i) => i.user_id === postUser.id) : [];
        if (userImages.length === 0) {
          userImages = [];
        }
        return {
          ...p,
          is_like: p.is_like || 0,
          user: postUser ? { ...postUser, images: userImages } : null,
          content: db.post_contents.filter((c) => c.post_id === p.id),
        };
      });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: matchedPosts,
    });
  }

  // 29. Stories: createStory, viewStory, deleteStory, fetchMyStories
  if (endpoint === 'createStory') {
    pruneExpiredStories(db);
    const userId = parseInt(fields.user_id);
    const contentUrl = files.length > 0 ? files[0].url : (fields.content || '');
    const newStory: Story = {
      id: getNextId(db.stories),
      user_id: userId,
      type: parseInt(fields.type) || 0,
      duration: parseInt(fields.duration) || 5,
      content: contentUrl,
      view_by_user_ids: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.stories.push(newStory);
    await commitDb(db);
    return jsonResponse({ status: true, message: 'Story created', data: newStory });
  }

  if (endpoint === 'viewStory') {
    const storyId = parseInt(fields.story_id);
    const userId = fields.user_id?.toString() || '';
    const story = db.stories.find((s) => s.id === storyId);
    if (story && userId) {
      const viewers = (story.view_by_user_ids || '').split(',').filter(Boolean);
      if (!viewers.includes(userId)) {
        viewers.push(userId);
        story.view_by_user_ids = viewers.join(',');
        await commitDb(db);
      }
    }
    return jsonResponse({ status: true, message: 'Story viewed' });
  }

  if (endpoint === 'deleteStory') {
    const storyId = parseInt(fields.story_id);
    db.stories = db.stories.filter((s) => s.id !== storyId);
    await commitDb(db);
    return jsonResponse({ status: true, message: 'Story deleted' });
  }

  if (endpoint === 'fetchMyStories') {
    if (pruneExpiredStories(db)) await commitDb(db);
    const userId = parseInt(fields.user_id);
    const myStories = db.stories.filter((s) => s.user_id === userId);
    return jsonResponse({ status: true, message: 'Fetch stories', data: myStories });
  }

  // 30. pushNotificationToSingleUser
  if (endpoint === 'pushNotificationToSingleUser') {
    try {
      const msg = fields.message || fields;
      const token = msg.token || fields.token;
      const title = msg.notification?.title || msg.data?.title || fields.title || '';
      const body = msg.notification?.body || msg.data?.body || fields.body || '';
      const senderId = parseInt(fields.my_user_id || fields.sender_id || msg.my_user_id || msg.sender_id) || 0;
      const targetUserId = parseInt(fields.target_user_id || fields.user_id || msg.target_user_id || msg.user_id) || 0;

      let targetUser = targetUserId > 0 ? db.users.find((u) => u.id === targetUserId) : null;
      if (!targetUser && token) {
        targetUser = db.users.find((u) => u.device_token === token);
      }

      let senderUser = senderId > 0 ? db.users.find((u) => u.id === senderId) : null;
      if (!senderUser && title) {
        senderUser = db.users.find((u) => u.fullname?.toLowerCase() === title.toLowerCase());
      }

      if (targetUser && targetUser.is_notification !== 0 && senderUser && senderUser.id !== targetUser.id) {
        db.user_notification = db.user_notification || [];
        const existing = db.user_notification.find(
          (n) => n.user_id === targetUser!.id && n.my_user_id === senderUser!.id && n.type === 4 && n.is_read === 0
        );

        if (existing) {
          existing.message = body || 'Sent you a new message';
          existing.updated_at = new Date().toISOString();
        } else {
          db.user_notification.push({
            id: getNextId(db.user_notification),
            my_user_id: senderUser.id,
            user_id: targetUser.id,
            item_id: senderUser.id,
            title: senderUser.fullname || 'New Message',
            message: body || 'Sent you a new message',
            type: 4,
            is_read: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        await commitDb(db);
      }
    } catch (_) { }
    return jsonResponse({ status: true, message: 'Notification sent' });
  }

  // 31. Feature Controls via /api: changeFromDatingAppToLivestreamApp, changeFromSocialMedia, includeFakeUserInMatching, updateAppdata
  if (endpoint === 'changeFromDatingAppToLivestreamApp') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.is_dating = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      await commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  if (endpoint === 'changeFromSocialMedia') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.is_social_media = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      await commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  if (endpoint === 'includeFakeUserInMatching') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.include_fake_user_in_matching = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      await commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  if (endpoint === 'updateAppdata') {
    let appdata = db.appdata[0];
    if (!appdata) {
      appdata = { id: 1 } as any;
      db.appdata = [appdata];
    }
    Object.keys(fields).forEach((k) => {
      if (k !== 'id') {
        const val = fields[k];
        if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)) && k !== 'app_name' && k !== 'currency' && !k.includes('key') && !k.includes('token') && !k.includes('link') && !k.includes('id') && !k.includes('admob')) {
          (appdata as any)[k] = Number(val);
        } else {
          (appdata as any)[k] = typeof val === 'string' ? val.trim() : val;
        }
      }
    });
    // Auto-swap Paystack keys if swapped
    if (typeof appdata.paystack_secret_key === 'string' && appdata.paystack_secret_key.startsWith('pk_') &&
        typeof appdata.paystack_public_key === 'string' && appdata.paystack_public_key.startsWith('sk_')) {
      const temp = appdata.paystack_secret_key;
      appdata.paystack_secret_key = appdata.paystack_public_key;
      appdata.paystack_public_key = temp;
    }
    appdata.updated_at = new Date().toISOString();
    await commitDb(db);
    return jsonResponse({ status: true, message: 'Settings updated successfully', data: appdata });
  }

  // 32. generateAgoraToken
  if (endpoint === 'generateAgoraToken') {
    const channelName = fields.channelName || fields.channel_name || 'orange_live';
    const uid = fields.uid ? parseInt(fields.uid) : 0;
    const appId = process.env.AGORA_APP_ID || 'b07fffcaca5c4c67a4f00bd2924d7c52';
    const appCertificate = process.env.AGORA_APP_CERT || process.env.AGORA_APP_CERTIFICATE || '';

    if (appId && appCertificate) {
      try {
        const role = RtcRole.PUBLISHER;
        const expirationTimeInSeconds = 7200;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
          appId,
          appCertificate,
          channelName,
          uid,
          role,
          privilegeExpiredTs,
          privilegeExpiredTs
        );

        return jsonResponse({
          status: true,
          message: 'generated successfully',
          token,
          app_id: appId,
        });
      } catch (err: any) {
        console.error('Agora token build error:', err);
      }
    }

    // In Agora App ID mode (without App Certificate), token must be empty string ("")
    // Passing a dummy string causes Agora RTC SDK to reject connection with token error
    return jsonResponse({
      status: true,
      message: 'generated successfully',
      token: '',
      app_id: appId,
    });
  }

  // 33. logOutUser
  if (endpoint === 'logOutUser') {
    const userId = parseInt(fields.user_id);
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.device_token = '';
      await commitDb(db);
    }
    return jsonResponse({
      status: true,
      message: 'Logout successful',
    });
  }

  // 34. Legal Pages (viewPrivacy, viewTerms, updatePrivacy, updateTerms)
  if (endpoint === 'viewPrivacy' || endpoint === 'privacypolicy') {
    const p = db.pages?.[0] || { id: 1, privacy: '', termsofuse: '' };
    const content = p.privacy || (db.appdata[0] as any)?.privacypolicy || '';
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: {
        privacy: content,
        privacypolicy: content,
      },
    });
  }

  if (endpoint === 'viewTerms' || endpoint === 'termsOfUse' || endpoint === 'termsofuse') {
    const p = db.pages?.[0] || { id: 1, privacy: '', termsofuse: '' };
    const content = p.termsofuse || (db.appdata[0] as any)?.termsofuse || '';
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: {
        termsofuse: content,
        terms: content,
      },
    });
  }

  if (endpoint === 'updatePrivacy') {
    let p = db.pages?.[0];
    if (!p) {
      p = { id: 1, privacy: '', termsofuse: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      db.pages = [p];
    }
    p.privacy = fields.privacy !== undefined ? fields.privacy : p.privacy;
    p.updated_at = new Date().toISOString();
    if (db.appdata[0]) (db.appdata[0] as any).privacypolicy = p.privacy;
    await commitDb(db);
    return jsonResponse({ status: true, message: 'Privacy policy updated', data: p });
  }

  if (endpoint === 'updateTerms') {
    let p = db.pages?.[0];
    if (!p) {
      p = { id: 1, privacy: '', termsofuse: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      db.pages = [p];
    }
    p.termsofuse = fields.termsofuse !== undefined ? fields.termsofuse : p.termsofuse;
    p.updated_at = new Date().toISOString();
    if (db.appdata[0]) (db.appdata[0] as any).termsofuse = p.termsofuse;
    await commitDb(db);
    return jsonResponse({ status: true, message: 'Terms of use updated', data: p });
  }

  // 35. getRandomProfile
  if (endpoint === 'getRandomProfile') {
    const userId = parseInt(fields.user_id) || 0;
    const reqGender = parseInt(fields.gender) || 3;
    const user = db.users.find((u) => u.id === userId);
    const blocked = (user?.blocked_users || '').split(',').map((s) => parseInt(s.trim())).filter(Boolean);
    const hidden = (user?.hidden_user_ids || '').split(',').map((s) => parseInt(s.trim())).filter(Boolean);
    blocked.push(userId);

    let candidates = db.users.filter((u) => {
      if (u.is_block === 1) return false;
      if (u.anonymous === 1) return false;
      if (blocked.includes(u.id)) return false;
      if (hidden.includes(u.id)) return false;
      if (reqGender === 1 && Number(u.gender) !== 1) return false;
      if (reqGender === 2 && Number(u.gender) !== 2) return false;
      return true;
    });

    if (candidates.length === 0) {
      return jsonResponse({
        status: false,
        message: 'User not found!',
        data: null,
      });
    }

    const randomUser = candidates[Math.floor(Math.random() * candidates.length)];
    let imgs = db.images.filter((img) => img.user_id === randomUser.id);
    if (imgs.length === 0) {
      imgs = imgs || [];
    }

    return jsonResponse({
      status: true,
      message: 'Random profile fetched',
      data: {
        ...randomUser,
        images: imgs,
      },
    });
  }

  // 36. deleteMyAccount
  if (endpoint === 'deleteMyAccount') {
    const userId = parseInt(fields.user_id) || 0;
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return jsonResponse({ status: false, message: 'User not found' });
    }

    db.users.splice(userIndex, 1);
    db.images = db.images.filter((img) => img.user_id !== userId);
    db.posts = db.posts.filter((p) => p.user_id !== userId);
    db.stories = (db.stories || []).filter((s) => s.user_id !== userId);
    db.user_notification = (db.user_notification || []).filter(
      (n) => n.user_id !== userId && n.my_user_id !== userId
    );
    db.redeem_requests = (db.redeem_requests || []).filter((r) => r.user_id !== userId);
    db.live_application = (db.live_application || []).filter((a) => a.user_id !== userId);
    db.live_history = (db.live_history || []).filter((h) => h.user_id !== userId);
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Account Deleted Successfully',
    });
  }



  // 38. applyForLive
  if (endpoint === 'applyForLive') {
    const userId = parseInt(fields.user_id);
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return jsonResponse({ status: false, message: 'User does not exist' });
    }
    if (user.can_go_live === 2) {
      return jsonResponse({ status: false, message: 'User is already eligible for livestreaming' });
    }
    user.can_go_live = 1; // Pending
    const videoUrl = files.length > 0 ? files[0].url : (fields.intro_video || '');
    const newApp: any = {
      id: getNextId(db.live_application || []),
      user_id: userId,
      about_you: fields.about_you || '',
      languages: fields.languages || '',
      intro_video: videoUrl,
      social_links: fields.social_links || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (!db.live_application) db.live_application = [];
    db.live_application = db.live_application.filter((a) => a.user_id !== userId);
    db.live_application.push(newApp);
    await commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Application submitted successfully',
    });
  }

  // 39. testPaystackKey: Validates Paystack secret key from Admin Settings
  if (endpoint === 'testPaystackKey') {
    let secretKey = (
      fields.secret_key ||
      fields.paystack_secret_key ||
      db.appdata[0]?.paystack_secret_key ||
      ''
    )
      .toString()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/^Bearer\s+/i, '')
      .replace(/^["'`]|["'`]$/g, '')
      .trim();

    const isSandboxMode = fields.paystack_sandbox_mode === 1 || fields.paystack_sandbox_mode === '1' || db.appdata[0]?.paystack_sandbox_mode === 1;

    const isPlaceholder =
      !secretKey ||
      secretKey.includes('test_orange_paystack') ||
      secretKey.includes('sandbox') ||
      secretKey.includes('dummy') ||
      secretKey.length < 25;

    if (isSandboxMode || isPlaceholder) {
      return jsonResponse({
        status: true,
        message: '✓ Paystack Sandbox / Demo Mode Active: App payments and VIP subscriptions will work in simulated mode without charging real cards. (When ready for real payments, paste your real secret key from dashboard.paystack.com).',
      });
    }

    if (secretKey.startsWith('pk_')) {
      return jsonResponse({
        status: false,
        message: "You entered a Public Key (starts with 'pk_'). Paystack requires your Secret Key (starts with 'sk_live_' or 'sk_test_').",
      });
    }

    try {
      const res = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@orangeapp.com',
          amount: 10000,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        const mode = secretKey.startsWith('sk_live_') ? 'LIVE Mode' : 'TEST Mode';
        return jsonResponse({
          status: true,
          message: `✓ Paystack Secret Key is VALID and ACTIVE! (${mode} connected successfully)`,
        });
      } else {
        return jsonResponse({
          status: false,
          message: `✗ Paystack rejected this key: ${data.message || 'Invalid key'}. Please check dashboard.paystack.com > Settings > API Keys & Webhooks. Tip: Enable "Paystack Sandbox Mode" below to test payments right away.`,
        });
      }
    } catch (err: any) {
      return jsonResponse({
        status: false,
        message: `Could not connect to Paystack: ${err.message}`,
      });
    }
  }

  // Default fallback for any unhandled /api/... routes
  return jsonResponse({
    status: true,
    message: `Endpoint ${endpoint} acknowledged`,
    data: [],
  });
}

