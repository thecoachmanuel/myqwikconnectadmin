const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const uri = process.env.MONGODB_URI || 'mongodb+srv://myqwikconnectadmin:qOL8X6UzbQo10NCB@cluster0.8r3acxq.mongodb.net/myqwikconnectadmin';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected successfully!');
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log('Collections in database:');
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  - ${c.name}: ${count} documents`);
  }

  const master = await db.collection('app_data_state').findOne({ _id: 'master' });
  if (master && master.data) {
    console.log('Master doc has keys:', Object.keys(master.data));
    console.log('Master users count:', (master.data.users || []).length);
    console.log('Master languages count:', (master.data.languages || []).length);
    if (master.data.users) {
      console.log('Users in master:', master.data.users.map(u => ({ id: u.id, username: u.username, fullname: u.fullname })));
    }
    if (master.data.languages) {
      console.log('Languages in master:', master.data.languages.map(l => l.title));
    }
  } else {
    console.log('No master document found!');
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
