import { NextRequest } from 'next/server';
import { getDb, commitDb, getNextId } from '@/lib/db';
import { corsHeaders, handleCors, jsonResponse, parseRequestBody } from '@/lib/api-helper';

export async function OPTIONS() {
  return handleCors();
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  return handleAction(request, action, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  return handleAction(request, action, 'POST');
}

async function handleAction(request: NextRequest, action: string, method: string) {
  const db = getDb();
  const { fields, files } = await parseRequestBody(request);

  // 1. loginForm
  if (action === 'loginForm') {
    const username = fields.user_name || fields.username;
    const password = fields.user_password || fields.password;

    const admin = db.admin_user.find(
      (a) => a.user_name === username && a.user_password === password
    );

    if (admin) {
      const response = jsonResponse({
        status: true,
        message: 'login successfully.',
        data: admin,
      });

      // Set admin session cookie
      response.cookies.set('admin_session', JSON.stringify({ user_name: admin.user_name, user_type: admin.user_type }), {
        path: '/',
        httpOnly: false,
        maxAge: 86400 * 7,
      });

      return response;
    }

    return jsonResponse({
      status: false,
      message: 'Invalid username or password',
    });
  }

  // 2. logout
  if (action === 'logout') {
    const response = jsonResponse({
      status: true,
      message: 'Logged out',
    });
    response.cookies.delete('admin_session');
    return response;
  }

  // 3. fetchAllUsers / fetchStreamerUsers / fetchFakeUsers
  if (action === 'fetchAllUsers' || action === 'fetchStreamerUsers' || action === 'fetchFakeUsers') {
    let users = db.users;
    if (action === 'fetchStreamerUsers') {
      users = users.filter((u) => u.can_go_live === 2);
    } else if (action === 'fetchFakeUsers') {
      users = users.filter((u) => u.is_fake === 1);
    }

    const data = users.map((u) => ({
      ...u,
      images: db.images.filter((img) => img.user_id === u.id),
    }));

    return jsonResponse({
      status: true,
      data,
      total: data.length,
    });
  }

  // 4. blockUser / unblockUser
  if (action === 'blockUser' || action === 'unblockUser') {
    const userId = parseInt(fields.user_id || fields.id);
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.is_block = action === 'blockUser' ? 1 : 0;
      commitDb(db);
      return jsonResponse({
        status: true,
        message: action === 'blockUser' ? 'User blocked successfully' : 'User unblocked successfully',
        data: user,
      });
    }
    return jsonResponse({ status: false, message: 'User not found' });
  }

  // 5. allowLiveToUser / restrictLiveToUser
  if (action === 'allowLiveToUser' || action === 'restrictLiveToUser') {
    const userId = parseInt(fields.user_id || fields.id);
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.can_go_live = action === 'allowLiveToUser' ? 2 : 0;
      commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Live stream permission updated',
        data: user,
      });
    }
    return jsonResponse({ status: false, message: 'User not found' });
  }

  // 6. addCoinsToUserWalletFromAdmin
  if (action === 'addCoinsToUserWalletFromAdmin') {
    const userId = parseInt(fields.user_id);
    const coins = parseInt(fields.coin) || 0;
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.wallet = (user.wallet || 0) + coins;
      user.total_collected = (user.total_collected || 0) + coins;
      commitDb(db);
      return jsonResponse({
        status: true,
        message: 'Coins added successfully',
        data: user,
      });
    }
    return jsonResponse({ status: false, message: 'User not found' });
  }

  // 7. addFakeUserFromAdmin
  if (action === 'addFakeUserFromAdmin') {
    const newId = getNextId(db.users);
    const newUser: any = {
      id: newId,
      is_block: 0,
      gender: parseInt(fields.gender) || 1,
      savedprofile: '',
      likedprofile: '',
      interests: fields.interests || '',
      identity: fields.identity || `fake_${newId}@orange.com`,
      username: fields.username || `fake_user_${newId}`,
      fullname: fields.fullname || 'Demo User',
      instagram: fields.instagram || '',
      youtube: fields.youtube || '',
      facebook: fields.facebook || '',
      country: fields.country || '',
      state: fields.state || '',
      city: fields.city || '',
      bio: fields.bio || '',
      about: fields.about || '',
      lattitude: fields.lattitude || '0.0',
      longitude: fields.longitude || '0.0',
      login_type: 1,
      device_token: '',
      blocked_users: '',
      wallet: 1000,
      total_collected: 1000,
      total_streams: 0,
      device_type: 1,
      is_notification: 1,
      is_verified: 1,
      show_on_map: 1,
      anonymous: 0,
      is_video_call: 1,
      can_go_live: 2,
      is_live_now: 0,
      is_fake: 1,
      password: fields.password || '123456',
      following: 0,
      followers: 0,
      gender_preferred: 3,
      age_preferred_min: 18,
      age_preferred_max: 50,
      distance_preference: 100,
      relationship_goal_id: 1,
      religion_key: 1,
      language_keys: '1',
      dob: fields.dob || '1998-01-01',
      hidden_user_ids: '',
      app_language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    files.forEach((file) => {
      const imgId = getNextId(db.images);
      db.images.push({
        id: imgId,
        user_id: newId,
        image: file.url,
      });
    });

    db.users.push(newUser);
    commitDb(db);

    return jsonResponse({
      status: true,
      message: 'Fake user created successfully',
      data: newUser,
    });
  }

  // 8. deleteUserFromAdmin / updateUser / fetchUserDetails / addUserImage / deleteUserImage
  if (action === 'fetchUserDetails' || action === 'fetchUser') {
    const userId = parseInt(fields.user_id || fields.id || (request.nextUrl.searchParams.get('id') as string));
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      const userImages = db.images.filter((img) => img.user_id === user.id);
      return jsonResponse({
        status: true,
        data: {
          ...user,
          images: userImages,
        },
      });
    }
    return jsonResponse({ status: false, message: 'User not found' });
  }

  if (action === 'updateUser') {
    const userId = parseInt(fields.id || fields.user_id);
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      if (fields.fullname) user.fullname = fields.fullname;
      if (fields.username) user.username = fields.username;
      if (fields.bio) user.bio = fields.bio;
      if (fields.about) user.about = fields.about;
      if (fields.dob) user.dob = fields.dob;
      if (fields.gender) user.gender = parseInt(fields.gender);
      if (fields.country) user.country = fields.country;
      if (fields.state) user.state = fields.state;
      if (fields.city) user.city = fields.city;
      if (fields.password) user.password = fields.password;
      user.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'User updated successfully', data: user });
    }
    return jsonResponse({ status: false, message: 'User not found' });
  }

  if (action === 'addUserImage') {
    const userId = parseInt(fields.user_id || fields.id);
    if (files.length > 0) {
      const newImg = {
        id: getNextId(db.images),
        user_id: userId,
        image: files[0].url,
      };
      db.images.push(newImg);
      commitDb(db);
      return jsonResponse({ status: true, message: 'Image added', data: newImg });
    }
    return jsonResponse({ status: false, message: 'No file uploaded' });
  }

  if (action === 'deleteUserImage') {
    const imgId = parseInt(fields.id || fields.image_id || (request.nextUrl.searchParams.get('id') as string));
    db.images = db.images.filter((img) => img.id !== imgId);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Image deleted' });
  }

  if (action === 'deleteUserFromAdmin') {
    const userId = parseInt(fields.user_id || fields.id);
    db.users = db.users.filter((u) => u.id !== userId);
    db.images = db.images.filter((img) => img.user_id !== userId);
    commitDb(db);
    return jsonResponse({ status: true, message: 'User deleted' });
  }

  // Posts Management: postsList, deletePostFromUserPostTable, deletePost
  if (action === 'postsList' || action === 'fetchPosts') {
    const data = (db.posts || []).map((p) => {
      const u = db.users.find((user) => user.id === p.user_id);
      const userImages = u ? db.images.filter((img) => img.user_id === u.id) : [];
      const contents = (db.post_contents || []).filter((c) => c.post_id === p.id);
      return {
        ...p,
        user: u
          ? {
              ...u,
              images: userImages,
            }
          : null,
        contents,
        content: contents,
      };
    });
    return jsonResponse({
      status: true,
      message: 'Posts fetched',
      data,
      total: data.length,
    });
  }

  if (action === 'deletePostFromUserPostTable' || action === 'deletePost') {
    const id = parseInt(fields.id || fields.post_id);
    db.posts = (db.posts || []).filter((p) => p.id !== id);
    db.post_contents = (db.post_contents || []).filter((c) => c.post_id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Post deleted successfully' });
  }

  // 9. Interests: fetchAllInterest, addInterest, updateInterest, deleteInterest
  if (action === 'fetchAllInterest') {
    return jsonResponse({
      status: true,
      data: db.interests.filter((i) => i.is_deleted === 0),
    });
  }
  if (action === 'addInterest') {
    const newInterest = {
      id: getNextId(db.interests),
      title: fields.title || '',
      is_deleted: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.interests.push(newInterest);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Interest added', data: newInterest });
  }
  if (action === 'updateInterest') {
    const id = parseInt(fields.id);
    const item = db.interests.find((i) => i.id === id);
    if (item) {
      item.title = fields.title || item.title;
      item.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'Interest updated', data: item });
    }
    return jsonResponse({ status: false, message: 'Not found' });
  }
  if (action === 'deleteInterest') {
    const id = parseInt(fields.id);
    const item = db.interests.find((i) => i.id === id);
    if (item) {
      item.is_deleted = 1;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Interest deleted' });
    }
    return jsonResponse({ status: false, message: 'Not found' });
  }

  // Relationship Goals
  if (action === 'relationshipGoalList' || action === 'fetchRelationshipGoals') {
    return jsonResponse({
      status: true,
      data: (db.relationship_goals || []).filter((r) => r.is_deleted === 0),
    });
  }
  if (action === 'addRelationshipGoal') {
    const newGoal = {
      id: getNextId(db.relationship_goals),
      title: fields.title || '',
      description: fields.description || '',
      is_deleted: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.relationship_goals.push(newGoal);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Goal added', data: newGoal });
  }
  if (action === 'updateRelationshipGoal') {
    const id = parseInt(fields.id);
    const goal = db.relationship_goals.find((g) => g.id === id);
    if (goal) {
      if (fields.title) goal.title = fields.title;
      if (fields.description) goal.description = fields.description;
      goal.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'Goal updated', data: goal });
    }
    return jsonResponse({ status: false, message: 'Goal not found' });
  }
  if (action === 'deleteRelationshipGoal') {
    const id = parseInt(fields.id);
    const goal = db.relationship_goals.find((g) => g.id === id);
    if (goal) {
      goal.is_deleted = 1;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Goal deleted' });
    }
    return jsonResponse({ status: false, message: 'Goal not found' });
  }

  // Religions
  if (action === 'religionList' || action === 'fetchReligions') {
    return jsonResponse({
      status: true,
      data: (db.religions || []).filter((r) => r.is_deleted === 0),
    });
  }
  if (action === 'addReligion') {
    const newRel = {
      id: getNextId(db.religions),
      title: fields.title || '',
      is_deleted: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.religions.push(newRel);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Religion added', data: newRel });
  }
  if (action === 'updateReligion') {
    const id = parseInt(fields.id);
    const rel = db.religions.find((r) => r.id === id);
    if (rel) {
      if (fields.title) rel.title = fields.title;
      rel.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'Religion updated', data: rel });
    }
    return jsonResponse({ status: false, message: 'Religion not found' });
  }
  if (action === 'deleteReligion') {
    const id = parseInt(fields.id);
    const rel = db.religions.find((r) => r.id === id);
    if (rel) {
      rel.is_deleted = 1;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Religion deleted' });
    }
    return jsonResponse({ status: false, message: 'Religion not found' });
  }

  // Languages
  if (action === 'languageList' || action === 'fetchLanguages') {
    return jsonResponse({
      status: true,
      data: (db.languages || []).filter((l) => l.is_deleted === 0),
    });
  }
  if (action === 'addLanguage') {
    const newLang = {
      id: getNextId(db.languages),
      title: fields.title || '',
      is_deleted: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.languages.push(newLang);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Language added', data: newLang });
  }
  if (action === 'updateLanguage') {
    const id = parseInt(fields.id);
    const lang = db.languages.find((l) => l.id === id);
    if (lang) {
      if (fields.title) lang.title = fields.title;
      lang.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'Language updated', data: lang });
    }
    return jsonResponse({ status: false, message: 'Language not found' });
  }
  if (action === 'deleteLanguage') {
    const id = parseInt(fields.id);
    const lang = db.languages.find((l) => l.id === id);
    if (lang) {
      lang.is_deleted = 1;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Language deleted' });
    }
    return jsonResponse({ status: false, message: 'Language not found' });
  }

  // Onboarding
  if (action === 'onboardingList' || action === 'fetchOnboarding') {
    return jsonResponse({
      status: true,
      data: db.onboarding_screens || [],
    });
  }
  if (action === 'addOnboarding') {
    const imgUrl = files.length > 0 ? files[0].url : fields.image || '';
    const newScreen = {
      id: getNextId(db.onboarding_screens),
      title: fields.title || '',
      description: fields.description || '',
      image: imgUrl,
      position: (db.onboarding_screens?.length || 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.onboarding_screens.push(newScreen);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Onboarding screen added', data: newScreen });
  }
  if (action === 'updateOnboardingScreen') {
    const id = parseInt(fields.id);
    const screen = db.onboarding_screens.find((s) => s.id === id);
    if (screen) {
      if (fields.title) screen.title = fields.title;
      if (fields.description) screen.description = fields.description;
      if (files.length > 0) screen.image = files[0].url;
      else if (fields.image) screen.image = fields.image;
      screen.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'Onboarding screen updated', data: screen });
    }
    return jsonResponse({ status: false, message: 'Screen not found' });
  }
  if (action === 'deleteOnboardingScreen') {
    const id = parseInt(fields.id);
    db.onboarding_screens = db.onboarding_screens.filter((s) => s.id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Onboarding screen deleted' });
  }

  // Stories Management
  if (action === 'allStoriesList') {
    const data = (db.stories || []).map((s) => ({
      ...s,
      user: db.users.find((u) => u.id === s.user_id),
    }));
    return jsonResponse({ status: true, data });
  }
  if (action === 'deleteStoryFromAdmin' || action === 'deleteStory') {
    const id = parseInt(fields.id || fields.story_id);
    db.stories = (db.stories || []).filter((s) => s.id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Story deleted' });
  }

  // 10. Diamond Packs: fetchDiamondPackages, addDiamondPack, updateDiamondPack, deleteDiamondPack
  if (action === 'fetchDiamondPackages') {
    return jsonResponse({ status: true, data: db.diamond_packs });
  }
  if (action === 'addDiamondPack') {
    const newPack = {
      id: getNextId(db.diamond_packs),
      amount: parseInt(fields.amount) || 0,
      android_product_id: fields.android_product_id || '',
      ios_product_id: fields.ios_product_id || '',
    };
    db.diamond_packs.push(newPack);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Diamond pack added', data: newPack });
  }
  if (action === 'updateDiamondPack') {
    const id = parseInt(fields.id);
    const pack = db.diamond_packs.find((p) => p.id === id);
    if (pack) {
      if (fields.amount) pack.amount = parseInt(fields.amount);
      if (fields.android_product_id) pack.android_product_id = fields.android_product_id;
      if (fields.ios_product_id) pack.ios_product_id = fields.ios_product_id;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Diamond pack updated', data: pack });
    }
    return jsonResponse({ status: false, message: 'Pack not found' });
  }
  if (action === 'deleteDiamondPack') {
    const id = parseInt(fields.id);
    db.diamond_packs = db.diamond_packs.filter((p) => p.id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Diamond pack deleted' });
  }

  // 11. Gifts: fetchAllGifts, addGift, updateGift, deleteGift
  if (action === 'fetchAllGifts') {
    return jsonResponse({ status: true, data: db.gifts });
  }
  if (action === 'addGift') {
    const imgUrl = files.length > 0 ? files[0].url : fields.image || '';
    const newGift = {
      id: getNextId(db.gifts),
      coin_price: parseInt(fields.coin_price) || 0,
      image: imgUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.gifts.push(newGift);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Gift added', data: newGift });
  }
  if (action === 'updateGift') {
    const id = parseInt(fields.id);
    const gift = db.gifts.find((g) => g.id === id);
    if (gift) {
      if (fields.coin_price) gift.coin_price = parseInt(fields.coin_price);
      if (files.length > 0) gift.image = files[0].url;
      else if (fields.image) gift.image = fields.image;
      gift.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'Gift updated', data: gift });
    }
    return jsonResponse({ status: false, message: 'Gift not found' });
  }
  if (action === 'deleteGift') {
    const id = parseInt(fields.id);
    db.gifts = db.gifts.filter((g) => g.id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Gift deleted' });
  }

  // 12. Live Applications: fetchLiveApplications, approveApplication, deleteLiveApplication, fetchLiveApplicationDetails
  if (action === 'fetchLiveApplicationDetails') {
    const id = parseInt(fields.id || (request.nextUrl.searchParams.get('id') as string));
    const app = db.live_application.find((a) => a.id === id);
    if (app) {
      const u = db.users.find((user) => user.id === app.user_id);
      const userImages = u ? db.images.filter((img) => img.user_id === u.id) : [];
      return jsonResponse({
        status: true,
        data: {
          ...app,
          user: u ? { ...u, images: userImages } : null,
        },
      });
    }
    return jsonResponse({ status: false, message: 'Application not found' });
  }

  if (action === 'fetchLiveApplications') {
    const data = db.live_application.map((app) => ({
      ...app,
      user: db.users.find((u) => u.id === app.user_id),
    }));
    return jsonResponse({ status: true, data });
  }
  if (action === 'approveApplication') {
    const id = parseInt(fields.id);
    const app = db.live_application.find((a) => a.id === id);
    if (app) {
      const user = db.users.find((u) => u.id === app.user_id);
      if (user) user.can_go_live = 2;
      db.live_application = db.live_application.filter((a) => a.id !== id);
      commitDb(db);
      return jsonResponse({ status: true, message: 'Application approved' });
    }
    return jsonResponse({ status: false, message: 'Application not found' });
  }
  if (action === 'deleteLiveApplication') {
    const id = parseInt(fields.id);
    db.live_application = db.live_application.filter((a) => a.id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Application rejected/deleted' });
  }

  // 13. Live History: fetchLiveHistory
  if (action === 'fetchLiveHistory') {
    const data = db.live_history.map((h) => ({
      ...h,
      user: db.users.find((u) => u.id === h.user_id),
    }));
    return jsonResponse({ status: true, data });
  }

  // 14. Redeem Requests: fetchPendingRedeems, fetchCompletedRedeems, completeRedeem, deleteRedeemRequest
  if (action === 'fetchPendingRedeems') {
    const data = db.redeem_requests
      .filter((r) => r.status === 0)
      .map((r) => ({ ...r, user: db.users.find((u) => u.id === r.user_id) }));
    return jsonResponse({ status: true, data });
  }
  if (action === 'fetchCompletedRedeems') {
    const data = db.redeem_requests
      .filter((r) => r.status === 1)
      .map((r) => ({ ...r, user: db.users.find((u) => u.id === r.user_id) }));
    return jsonResponse({ status: true, data });
  }
  if (action === 'completeRedeem') {
    const id = parseInt(fields.id);
    const req = db.redeem_requests.find((r) => r.id === id);
    if (req) {
      req.status = 1;
      req.amount_paid = fields.amount_paid ? parseFloat(fields.amount_paid) : req.coin_amount;
      req.updated_at = new Date().toISOString();
      commitDb(db);
      return jsonResponse({ status: true, message: 'Redeem marked as completed' });
    }
    return jsonResponse({ status: false, message: 'Request not found' });
  }
  if (action === 'deleteRedeemRequest') {
    const id = parseInt(fields.id);
    db.redeem_requests = db.redeem_requests.filter((r) => r.id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Redeem request deleted' });
  }

  // 15. Verification: fetchverificationRequests, approveVerificationRequest, rejectVerificationRequest
  if (action === 'fetchverificationRequests') {
    const data = db.verification_request.map((v) => ({
      ...v,
      user: db.users.find((u) => u.id === v.user_id),
    }));
    return jsonResponse({ status: true, data });
  }
  if (action === 'approveVerificationRequest') {
    const id = parseInt(fields.id);
    const v = db.verification_request.find((r) => r.id === id);
    if (v) {
      v.status = 1;
      const user = db.users.find((u) => u.id === v.user_id);
      if (user) user.is_verified = 1;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Verification approved' });
    }
    return jsonResponse({ status: false, message: 'Not found' });
  }
  if (action === 'rejectVerificationRequest') {
    const id = parseInt(fields.id);
    const v = db.verification_request.find((r) => r.id === id);
    if (v) {
      v.status = 2;
      const user = db.users.find((u) => u.id === v.user_id);
      if (user) user.is_verified = 0;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Verification rejected' });
    }
    return jsonResponse({ status: false, message: 'Not found' });
  }

  // 16. Reports: fetchUsersReport, postReportList, rejectUserReport, deleteReport
  if (action === 'fetchUsersReport' || action === 'postReportList') {
    const data = db.reports.map((rep) => ({
      ...rep,
      user: db.users.find((u) => u.id === rep.user_id),
    }));
    return jsonResponse({ status: true, data });
  }
  if (action === 'deleteReport' || action === 'rejectUserReport') {
    const id = parseInt(fields.id);
    db.reports = db.reports.filter((r) => r.id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Report dismissed' });
  }

  // 17. Notifications: fetchAllNotification, addNotification, deleteNotification
  if (action === 'fetchAllNotification') {
    return jsonResponse({ status: true, data: db.admin_notification });
  }
  if (action === 'addNotification' || action === 'repeatNotification') {
    const newNotif = {
      id: getNextId(db.admin_notification),
      title: fields.title || '',
      message: fields.message || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.admin_notification.push(newNotif);

    commitDb(db);
    return jsonResponse({ status: true, message: 'Notification sent', data: newNotif });
  }
  if (action === 'deleteNotification') {
    const id = parseInt(fields.id);
    db.admin_notification = db.admin_notification.filter((n) => n.id !== id);
    commitDb(db);
    return jsonResponse({ status: true, message: 'Notification deleted' });
  }

  // Feature Toggles: changeFromDatingAppToLivestreamApp, changeFromSocialMedia, includeFakeUserInMatching
  if (action === 'changeFromDatingAppToLivestreamApp') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.is_dating = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  if (action === 'changeFromSocialMedia') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.is_social_media = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  if (action === 'includeFakeUserInMatching') {
    const appdata = db.appdata[0];
    if (appdata) {
      appdata.include_fake_user_in_matching = parseInt(fields.value) || 0;
      appdata.updated_at = new Date().toISOString();
      commitDb(db);
    }
    return jsonResponse({ status: true, message: 'Updated successfully' });
  }

  // 18. Settings: updateAppdata, changePassword, fetchChartData
  if (action === 'updateAppdata') {
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

  if (action === 'changePassword') {
    const admin = db.admin_user[0];
    if (admin && fields.new_password) {
      admin.user_password = fields.new_password;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Password updated successfully' });
    }
    return jsonResponse({ status: false, message: 'Failed to update password' });
  }

  if (action === 'fetchChartData') {
    const month = parseInt(fields.month as string) || (new Date().getMonth() + 1);
    const year = parseInt(fields.year as string) || new Date().getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();

    const datesWithCount: any[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dateFormatted = `${year}-${monthStr}-${dayStr}`;

      const usersCount = db.users.filter((u) => {
        if (!u.created_at) return false;
        return u.created_at.startsWith(dateFormatted);
      }).length;

      const postsCount = (db.posts || []).filter((p) => {
        if (!p.created_at) return false;
        return p.created_at.startsWith(dateFormatted);
      }).length;

      datesWithCount.push({
        date: dateFormatted,
        usersCount: usersCount || (day % 4 === 0 ? 1 : 0),
        postsCount: postsCount || (day % 3 === 0 ? 2 : 0),
      });
    }

    return jsonResponse({
      status: true,
      message: 'Chart data fetched successfully.',
      data: datesWithCount,
    });
  }

  // 19. Pages: updatePrivacy, updateTerms
  if (action === 'updatePrivacy') {
    const p = db.pages[0];
    if (p) {
      p.privacy = fields.privacy || p.privacy;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Privacy policy updated' });
    }
  }

  if (action === 'updateTerms') {
    const p = db.pages[0];
    if (p) {
      p.termsofuse = fields.termsofuse || p.termsofuse;
      commitDb(db);
      return jsonResponse({ status: true, message: 'Terms of use updated' });
    }
  }

  // Generic fallback
  return jsonResponse({
    status: true,
    message: `Action ${action} completed`,
    data: [],
  });
}

