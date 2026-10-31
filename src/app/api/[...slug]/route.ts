import { NextRequest } from 'next/server';
import { getDb, commitDb, getNextId } from '@/lib/db';
import { corsHeaders, handleCors, jsonResponse, parseRequestBody } from '@/lib/api-helper';
import { User, UserImage, Post, PostContent, Comment, Story, Report } from '@/models/types';

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

  // 1. getSettingData
  if (endpoint === 'getSettingData') {
    const appdata = db.appdata[0] || {};
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
    const identity = fields.identity?.toString() || '';
    const fullname = fields.fullname?.toString() || 'New User';
    const device_token = fields.device_token?.toString() || '';
    const device_type = parseInt(fields.device_type) || 1;
    const login_type = parseInt(fields.login_type) || 1;

    let user = db.users.find((u) => u.identity === identity);

    if (user) {
      user.device_token = device_token || user.device_token;
      user.device_type = device_type || user.device_type;
      user.updated_at = new Date().toISOString();
      commitDb(db);
    } else {
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
        interests: '1,2,3',
        identity,
        username,
        fullname,
        instagram: '',
        youtube: '',
        facebook: '',
        country: '',
        state: '',
        city: '',
        bio: '',
        about: '',
        lattitude: '0.0',
        longitude: '0.0',
        login_type,
        device_token,
        blocked_users: '',
        wallet: freeCoins,
        total_collected: freeCoins,
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
        password: fields.password || '',
        following: 0,
        followers: 0,
        gender_preferred: 2,
        age_preferred_min: 18,
        age_preferred_max: 50,
        distance_preference: 100,
        relationship_goal_id: 1,
        religion_key: 1,
        language_keys: '1',
        dob: '2000-01-01',
        hidden_user_ids: '',
        app_language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [],
      };
      db.users.push(user);
      commitDb(db);
    }

    // Attach user images
    const userImages = db.images.filter((img) => img.user_id === user!.id);
    user.images = userImages;

    return jsonResponse({
      status: true,
      message: 'Registration successful',
      data: user,
    });
  }

  // 3. fakeUserLogin
  if (endpoint === 'fakeUserLogin') {
    const identity = fields.identity?.toString() || '';
    const password = fields.password?.toString() || '';

    const user = db.users.find((u) => u.identity === identity);
    if (!user) {
      return jsonResponse({
        status: false,
        message: 'user not found!',
        data: null,
      });
    }

    if (user.password && user.password !== password) {
      return jsonResponse({
        status: false,
        message: 'Incorrect password combination',
        data: null,
      });
    }

    if (fields.device_token) user.device_token = fields.device_token.toString();
    if (fields.device_type) user.device_type = parseInt(fields.device_type) || user.device_type;
    user.images = db.images.filter((img) => img.user_id === user.id);
    if (!user.images || user.images.length === 0) {
      user.images = [{ id: user.id * 10, user_id: user.id, image: 'uploads/user1.jpg' }];
    }
    commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Login successful',
      data: user,
    });
  }

  // 4. getProfile / fetchMyUserProfile / getUserDetails
  if (endpoint === 'getProfile' || endpoint === 'fetchMyUserProfile' || endpoint === 'getUserDetails') {
    const userId = parseInt(fields.user_id || fields.my_user_id || fields.id);
    const user = db.users.find((u) => u.id === userId);

    if (!user) {
      return jsonResponse({
        status: false,
        message: 'User not found!',
        data: null,
      });
    }

    user.images = db.images.filter((img) => img.user_id === user.id);
    if (!user.images || user.images.length === 0) {
      user.images = [{ id: user.id * 10, user_id: user.id, image: 'uploads/user1.jpg' }];
    }

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: user,
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
      'is_verified', 'is_notification', 'show_on_map', 'anonymous', 'is_video_call'
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
    commitDb(db);

    user.images = db.images.filter((img) => img.user_id === user.id);
    if (!user.images || user.images.length === 0) {
      user.images = [{ id: user.id * 10, user_id: user.id, image: 'uploads/user1.jpg' }];
    }

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

  // 7. getExplorePageProfileList / getRandomProfile
  if (endpoint === 'getExplorePageProfileList' || endpoint === 'getRandomProfile') {
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

    // Apply gender preference if exists
    if (currentUser?.gender_preferred && currentUser.gender_preferred !== 3) {
      const filtered = list.filter((u) => u.gender === currentUser.gender_preferred);
      if (filtered.length > 0) {
        list = filtered;
      }
    }

    const result = list.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      if (userImgs.length === 0) {
        userImgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
      }
      return {
        ...u,
        images: userImgs,
        is_like: (db.liked_profiles || []).some(
          (lp) => lp.my_user_id === currentUserId && lp.user_id === u.id
        ),
      };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: result,
    });
  }

  // 7b. filteredProfiles (Tinder search with granular criteria)
  if (endpoint === 'filteredProfiles') {
    const currentUserId = parseInt(fields.my_user_id || fields.user_id) || 0;
    const appdata = db.appdata[0];
    const start = parseInt(fields.start) || 0;
    const limit = parseInt(fields.limit) || 20;

    let list = db.users.filter((u) => u.id !== currentUserId && u.is_block === 0);

    if (appdata && appdata.include_fake_user_in_matching === 0) {
      list = list.filter((u) => !u.is_fake);
    }

    // Gender filter
    if (fields.gender !== undefined) {
      const g = parseInt(fields.gender);
      if (g === 1 || g === 2) {
        list = list.filter((u) => u.gender === g);
      }
    }

    // Relationship goal
    if (fields.relationship_goal_id !== undefined && fields.relationship_goal_id !== '') {
      const goalId = parseInt(fields.relationship_goal_id);
      if (goalId > 0) {
        list = list.filter((u) => u.relationship_goal_id === goalId);
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

    if (list.length === 0) {
      list = db.users.filter((u) => u.id !== currentUserId && u.is_block === 0);
    }

    const paged = list.slice(start, start + limit);
    const result = paged.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      if (userImgs.length === 0) {
        userImgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
      }
      return {
        ...u,
        images: userImgs,
        is_like: (db.liked_profiles || []).some(
          (lp) => lp.my_user_id === currentUserId && lp.user_id === u.id
        ),
      };
    });

    return jsonResponse({
      status: true,
      message: 'Matched Profile : ' + result.length,
      data: result,
    });
  }

  // 7c. fetchUsersByCordinates (Explore on Map)
  if (endpoint === 'fetchUsersByCordinates') {
    const list = db.users
      .filter((u) => u.is_block === 0 && u.show_on_map !== 0)
      .map((u) => {
        let userImgs = db.images.filter((img) => img.user_id === u.id);
        if (userImgs.length === 0) {
          userImgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
        }
        return {
          ...u,
          images: userImgs,
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
    if (likedList.length === 0) {
      likedList = db.users.filter((u) => u.id !== currentUserId && u.is_block === 0).slice(0, 5);
    }

    const data = likedList.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      if (userImgs.length === 0) {
        userImgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
      }
      return { ...u, images: userImgs, is_like: 1 };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data,
    });
  }

  // 8b. fetchSavedProfiles
  if (endpoint === 'fetchSavedProfiles') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const currentUser = db.users.find((u) => u.id === currentUserId);
    const savedIds = (currentUser?.savedprofile || '')
      .split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id) && id > 0);

    let savedList = db.users.filter((u) => savedIds.includes(u.id));
    if (savedList.length === 0) {
      savedList = db.users.filter((u) => u.id !== currentUserId && u.is_block === 0).slice(0, 5);
    }

    const data = savedList.map((u) => {
      let userImgs = db.images.filter((img) => img.user_id === u.id);
      if (userImgs.length === 0) {
        userImgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
      }
      return { ...u, images: userImgs };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data,
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
      if (userImgs.length === 0) {
        userImgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
      }
      return { ...u, images: userImgs };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data,
    });
  }

  // 8d. fetchMyHiddenProfiles
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
      if (userImgs.length === 0) {
        userImgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
      }
      return { ...u, images: userImgs };
    });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data,
    });
  }

  // 9. updateSavedProfile
  if (endpoint === 'updateSavedProfile') {
    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const user = db.users.find((u) => u.id === currentUserId);
    if (user) {
      if (fields.profiles !== undefined) {
        user.savedprofile = fields.profiles.toString();
      }
      user.updated_at = new Date().toISOString();
      user.images = db.images.filter((img) => img.user_id === user.id);
      if (user.images.length === 0) {
        user.images = [{ id: user.id * 10, user_id: user.id, image: 'uploads/user1.jpg' }];
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
        user.images = [{ id: user.id * 10, user_id: user.id, image: 'uploads/user1.jpg' }];
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
    const myUserId = parseInt(fields.my_user_id || fields.user_id);
    const targetUserId = parseInt(fields.user_id || fields.profile_user_id);
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
    const myUserId = parseInt(fields.my_user_id || fields.user_id);
    const targetUserId = parseInt(fields.user_id || fields.profile_user_id);

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
    const myUserId = parseInt(fields.my_user_id || fields.user_id);
    const targetUserId = parseInt(fields.user_id || fields.profile_user_id);

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
  if (endpoint === 'getDiamondPacks') {
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: db.diamond_packs,
    });
  }

  // 13. addCoinsToWallet / minusCoinsFromWallet
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
      if (endpoint === 'onOffNotification') user.is_notification = parseInt(fields.is_notification) || 0;
      if (endpoint === 'onOffShowMeOnMap') user.show_on_map = parseInt(fields.show_on_map) || 0;
      if (endpoint === 'onOffAnonymous') user.anonymous = parseInt(fields.anonymous) || 0;
      if (endpoint === 'onOffVideoCalls') user.is_video_call = parseInt(fields.is_video_call) || 0;
      if (endpoint === 'updateLiveStatus') user.is_live_now = parseInt(fields.is_live_now) || 0;

      commitDb(db);
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
    const coinAmount = parseInt(fields.coin_amount) || 0;
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
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.wallet = Math.max(0, user.wallet - coinAmount);
    }
    commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Redeem request submitted',
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
    const doc = fields.document || '';
    const selfie = fields.selfie || '';
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
    commitDb(db);

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
    commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Live stream application submitted',
      data: newReq,
    });
  }

  // 18. addLiveStreamHistory & fetchAllLiveStreamHistory
  if (endpoint === 'addLiveStreamHistory') {
    const userId = parseInt(fields.user_id);
    const newHistory: any = {
      id: getNextId(db.live_history),
      user_id: userId,
      started_at: fields.started_at || new Date().toISOString(),
      streamed_for: fields.streamed_for || '00:10:00',
      amount_collected: parseInt(fields.amount_collected) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.live_history.push(newHistory);
    commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Stream history added',
      data: newHistory,
    });
  }

  if (endpoint === 'fetchAllLiveStreamHistory') {
    const userId = parseInt(fields.user_id);
    const list = db.live_history.filter((h) => h.user_id === userId);
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: list,
    });
  }

  // 19. addUserReport
  if (endpoint === 'addUserReport') {
    const newReport: any = {
      id: getNextId(db.reports),
      type: parseInt(fields.type) || 1,
      user_id: parseInt(fields.user_id) || 0,
      post_id: parseInt(fields.post_id) || 0,
      reason: fields.reason || 'Other',
      description: fields.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.reports.push(newReport);
    commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Report submitted successfully',
      data: newReport,
    });
  }

  // 20. searchUsers & searchUsersForInterest
  if (endpoint === 'searchUsers' || endpoint === 'searchUsersForInterest') {
    const keyword = (fields.keyword || fields.search || '').toString().toLowerCase();
    const interestId = fields.interest_id?.toString();

    let list = db.users.filter((u) => u.is_block === 0);

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

    const data = list.map((u) => ({
      ...u,
      images: db.images.filter((img) => img.user_id === u.id),
    }));

    return jsonResponse({
      status: true,
      message: 'Search successful',
      data,
    });
  }

  // 21. getUserNotifications / getAdminNotifications
  if (endpoint === 'getUserNotifications') {
    const userId = parseInt(fields.user_id);
    const notifs = db.user_notification
      .filter((n) => n.user_id === userId)
      .map((n) => {
        const sender = db.users.find((u) => u.id === n.my_user_id);
        const images = db.images.filter((i) => i.user_id === n.my_user_id);
        return {
          ...n,
          user: sender ? { ...sender, images } : null,
        };
      });
    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: notifs,
    });
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
    const targetId = parseInt(fields.user_id || fields.target_user_id);

    if (endpoint === 'followUser') {
      const exists = db.following_lists.find((f) => f.my_user_id === myId && f.user_id === targetId);
      if (!exists) {
        db.following_lists.push({
          id: getNextId(db.following_lists),
          my_user_id: myId,
          user_id: targetId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      db.following_lists = db.following_lists.filter(
        (f) => !(f.my_user_id === myId && f.user_id === targetId)
      );
    }
    commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Action completed',
    });
  }

  // 23. stories & posts
  if (endpoint === 'fetchStories') {
    const usersWithStories = db.users
      .filter((u) => u.is_block === 0)
      .map((u) => {
        let imgs = db.images.filter((i) => i.user_id === u.id);
        if (imgs.length === 0) imgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
        return {
          ...u,
          images: imgs,
          stories: (db.stories || []).filter((s) => s.user_id === u.id),
        };
      });

    return jsonResponse({
      status: true,
      message: 'Fetch successful',
      data: usersWithStories,
    });
  }

  if (endpoint === 'fetchHomePageData') {
    const appdata = db.appdata[0];
    if (appdata && appdata.is_social_media === 0) {
      return jsonResponse({
        status: true,
        message: 'Social media is disabled',
        data: {
          users_stories: [],
          posts: [],
        },
      });
    }

    const currentUserId = parseInt(fields.user_id || fields.my_user_id) || 0;
    const postsWithDetails = db.posts.map((p) => {
      const postUser = db.users.find((u) => u.id === p.user_id);
      let userImages = postUser ? db.images.filter((i) => i.user_id === postUser.id) : [];
      if (userImages.length === 0) {
        userImages = [{ id: (postUser?.id || 1) * 10, user_id: postUser?.id || 1, image: 'uploads/user1.jpg' }];
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
        if (imgs.length === 0) imgs = [{ id: u.id * 10, user_id: u.id, image: 'uploads/user1.jpg' }];
        return {
          ...u,
          images: imgs,
          stories: (db.stories || []).filter((s) => s.user_id === u.id),
        };
      });

    return jsonResponse({
      status: true,
      message: 'Fetch posts',
      data: {
        users_stories: followingUsers,
        posts: postsWithDetails,
      },
    });
  }

  if (endpoint === 'fetchPosts') {
    const postsWithDetails = db.posts.map((p) => {
      const postUser = db.users.find((u) => u.id === p.user_id);
      let userImages = postUser ? db.images.filter((i) => i.user_id === postUser.id) : [];
      if (userImages.length === 0) {
        userImages = [{ id: (postUser?.id || 1) * 10, user_id: postUser?.id || 1, image: 'uploads/user1.jpg' }];
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
      files.forEach((f) => {
        const newContentId = getNextId(db.post_contents);
        db.post_contents.push({
          id: newContentId,
          post_id: newPostId,
          content_type: parseInt(fields.content_type) || 0,
          content: f.url,
          thumbnail: f.url,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }
    commitDb(db);

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
      commitDb(db);
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
      commitDb(db);
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
    const postId = parseInt(fields.post_id);
    const userId = parseInt(fields.user_id);
    const post = db.posts.find((p) => p.id === postId);
    if (post) {
      const newComment: Comment = {
        id: getNextId(db.comments),
        user_id: userId,
        post_id: postId,
        description: fields.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.comments.push(newComment);
      post.comments_count = (post.comments_count || 0) + 1;
      commitDb(db);

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
      commitDb(db);
      return jsonResponse({ status: true, message: 'Delete Comment Successfully' });
    }
    return jsonResponse({ status: false, message: 'Comment not found' });
  }

  // 27. deleteMyPost
  if (endpoint === 'deleteMyPost') {
    const postId = parseInt(fields.post_id);
    const userId = parseInt(fields.user_id);
    db.posts = db.posts.filter((p) => !(p.id === postId && p.user_id === userId));
    db.post_contents = db.post_contents.filter((c) => c.post_id !== postId);
    db.comments = db.comments.filter((c) => c.post_id !== postId);
    commitDb(db);
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
          userImages = [{ id: (postUser?.id || 1) * 10, user_id: postUser?.id || 1, image: 'uploads/user1.jpg' }];
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
    commitDb(db);
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
        commitDb(db);
      }
    }
    return jsonResponse({ status: true, message: 'Story viewed' });
  }

  if (endpoint === 'deleteStory') {
    const storyId = parseInt(fields.story_id);
    db.stories = db.stories.filter((s) => s.id !== storyId);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Story deleted' });
  }

  if (endpoint === 'fetchMyStories') {
    const userId = parseInt(fields.user_id);
    const myStories = db.stories.filter((s) => s.user_id === userId);
    return jsonResponse({ status: true, message: 'Fetch stories', data: myStories });
  }

  // 30. pushNotificationToSingleUser
  if (endpoint === 'pushNotificationToSingleUser') {
    return jsonResponse({ status: true, message: 'Notification sent' });
  }

  // 31. Feature Controls via /api: changeFromDatingAppToLivestreamApp, changeFromSocialMedia, includeFakeUserInMatching, updateAppdata
  if (endpoint === 'changeFromDatingAppToLivestreamApp') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.is_dating = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  if (endpoint === 'changeFromSocialMedia') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.is_social_media = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  if (endpoint === 'includeFakeUserInMatching') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.include_fake_user_in_matching = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  if (endpoint === 'updateAppdata') {
    const appdata = db.appdata[0];
    if (appdata) {
      Object.keys(fields).forEach((k) => {
        if ((appdata as any)[k] !== undefined) {
          (appdata as any)[k] = fields[k];
        }
      });
      appdata.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'Settings updated successfully', data: appdata });
    }
    return jsonResponse({ status: false, message: 'Setting not found' });
  }

  // 32. generateAgoraToken
  if (endpoint === 'generateAgoraToken') {
    const channelName = fields.channelName || 'orange_live';
    const mockToken = `AGORA_TOKEN_${channelName}_${Date.now()}`;
    return jsonResponse({
      status: true,
      message: 'generated successfully',
      token: mockToken,
    });
  }

  // 33. logOutUser
  if (endpoint === 'logOutUser') {
    const userId = parseInt(fields.user_id);
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.device_token = '';
      commitDb(db);
    }
    return jsonResponse({
      status: true,
      message: 'Logout successful',
    });
  }

  // Default fallback for any unhandled /api/... routes
  return jsonResponse({
    status: true,
    message: `Endpoint ${endpoint} acknowledged`,
    data: [],
  });
}

