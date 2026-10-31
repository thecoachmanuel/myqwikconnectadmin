const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const uri = process.env.MONGODB_URI || 'mongodb+srv://myqwikconnectadmin:qOL8X6UzbQo10NCB@cluster0.8r3acxq.mongodb.net/myqwikconnectadmin';

const allLanguages = [
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
];

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected!');
  const db = mongoose.connection.db;

  // 1. Update standalone languages collection
  await db.collection('languages').deleteMany({});
  await db.collection('languages').insertMany(allLanguages);
  console.log('Updated `languages` collection with', allLanguages.length, 'languages.');

  // 2. Update master document
  const master = await db.collection('app_data_state').findOne({ _id: 'master' });
  if (master && master.data) {
    const data = master.data;
    data.languages = allLanguages;
    if (data.appdata && data.appdata.length > 0) {
      data.appdata[0].include_fake_user_in_matching = 1;
    }
    // Also ensure existing users have string religion_key and valid lat/long
    if (Array.isArray(data.users)) {
      data.users.forEach(u => {
        if (typeof u.religion_key === 'number') {
          u.religion_key = String(u.religion_key);
        }
      });
    }

    await db.collection('app_data_state').updateOne(
      { _id: 'master' },
      { $set: { data: data, updatedAt: new Date() } }
    );
    console.log('Updated master document with all languages and include_fake_user_in_matching=1.');

    // Also update standalone appdata collection
    if (data.appdata && data.appdata.length > 0) {
      await db.collection('appdata').deleteMany({});
      await db.collection('appdata').insertMany(data.appdata);
      console.log('Updated `appdata` collection.');
    }
  }

  await mongoose.disconnect();
  console.log('MongoDB update complete!');
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
