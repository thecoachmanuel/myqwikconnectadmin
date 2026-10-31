const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const termsHtml = `
<div class="terms-container" style="line-height: 1.7; color: #333;">
  <p><em>Last Updated: October 31, 2026</em></p>

  <h3>1. Acceptance of Terms</h3>
  <p>Welcome to <strong>Orange Dating & Live Stream</strong> ("App", "we", "us", or "our"). By creating an account, downloading, accessing, or using our mobile application, website, or associated services, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service ("Terms"). If you do not agree to all terms and conditions, you must immediately discontinue use of the App.</p>

  <h3>2. Eligibility & Age Requirement</h3>
  <p>You must be at least <strong>18 years of age</strong> (or the age of legal majority in your jurisdiction) to create an account and use this platform. By registering, you warrant that you are legally competent to enter into this agreement and that you have never been convicted of any felony or sexual offense.</p>

  <h3>3. Account Security & Verification</h3>
  <p>You are solely responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately of any unauthorized access to your account. Our platform may provide identity verification features ("Blue Tick Verification"). Supplying fraudulent documentation or impersonating others will result in immediate and permanent account termination.</p>

  <h3>4. Community Guidelines & Prohibited Conduct</h3>
  <p>Our community thrives on respect, authenticity, and kindness. You agree not to engage in:</p>
  <ul>
    <li>Harassment, bullying, stalking, hate speech, or defamation of any user.</li>
    <li>Uploading or transmitting nudity, sexually explicit material, violence, or content exploiting minors.</li>
    <li>Sending unsolicited commercial communications, spam, scams, or solicitation of funds.</li>
    <li>Using automated scripts, bots, scrapers, or reverse engineering our applications.</li>
    <li>Posting empty, abusive, or deceptive messages or comments.</li>
  </ul>

  <h3>5. Live Streaming & Social Media Features</h3>
  <p>Users who broadcast live streams or publish posts and stories agree to adhere strictly to our safety standards. Real-time video broadcasts are actively monitored. Violations of community rules during live broadcasts will result in instantaneous stream termination and account suspension.</p>

  <h3>6. Coins, Virtual Gifts, and In-App Purchases</h3>
  <p>The App offers virtual coins and diamonds for purchase. Coins can be used to unlock premium features such as reverse swiping, sending messages, or tipping broadcasters during live streams. All coin purchases are final, non-refundable, and have no monetary value outside the App. Broadcasters with valid redemption requests must fulfill all account verification and minimum threshold requirements.</p>

  <h3>7. Location Features & Privacy Controls</h3>
  <p>The App offers proximity-based matchmaking and interactive map discovery. You retain full control over your visibility settings, including options to toggle "Show Me on Map" and "Go Anonymous" mode at any time via your account settings.</p>

  <h3>8. 24-Hour Stories & Ephemeral Content</h3>
  <p>Stories uploaded by users are designed to be temporary and are automatically pruned and deleted after 24 hours. However, you acknowledge that other users may capture screenshots or recordings of such content.</p>

  <h3>9. Termination & Account Deletion</h3>
  <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for any violation of these Terms or behavior that compromises the safety of our users. You may terminate your account at any time via the Settings menu.</p>

  <h3>10. Disclaimer of Warranties & Limitation of Liability</h3>
  <p>The App is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. We do not guarantee the background, character, or intentions of any user. Under no circumstances shall the platform or its operators be liable for indirect, punitive, or consequential damages resulting from your use of the platform.</p>

  <h3>11. Contact Us</h3>
  <p>For questions or assistance regarding these Terms of Service, please reach out via the in-app support center or email us at <strong>support@orangeapp.com</strong>.</p>
</div>
`;

const privacyHtml = `
<div class="privacy-container" style="line-height: 1.7; color: #333;">
  <p><em>Last Updated: October 31, 2026</em></p>

  <h3>1. Introduction</h3>
  <p>Your privacy is of paramount importance to us. This Privacy Policy describes how <strong>Orange Dating & Live Stream</strong> collects, uses, stores, and discloses your personal information when you use our mobile and web applications.</p>

  <h3>2. Information We Collect</h3>
  <ul>
    <li><strong>Account Information:</strong> Name, username, email address, phone number, date of birth, gender, relationship preferences, bio, and profile photos.</li>
    <li><strong>Location Data:</strong> With your explicit consent, we process geographic coordinates (latitude and longitude) to provide nearby matches, distance calculations, and interactive map features.</li>
    <li><strong>Content & Communications:</strong> Messages, photos, and videos sent in realtime chat, comments on posts, stories, and live stream transmissions.</li>
    <li><strong>Verification Data:</strong> Government ID and selfie photographs submitted exclusively for verification badge reviews.</li>
    <li><strong>Usage & Device Information:</strong> Device identifier, IP address, operating system, and push notification tokens.</li>
  </ul>

  <h3>3. How We Use Your Information</h3>
  <p>We utilize collected information to:</p>
  <ul>
    <li>Provide, maintain, and optimize matching and live stream services.</li>
    <li>Facilitate realtime messaging, notifications, and audio/video calling.</li>
    <li>Enable proximity filtering and map discovery based on your preferences.</li>
    <li>Verify profile authenticity and detect fraud, spam, or abusive behavior.</li>
    <li>Process virtual currency transactions and coin redemptions.</li>
  </ul>

  <h3>4. Privacy Controls & Ephemeral Media</h3>
  <p>You maintain control over your public presence:</p>
  <ul>
    <li><strong>Show Me on Map:</strong> You can toggle map visibility on or off at any time.</li>
    <li><strong>Go Anonymous:</strong> When enabled, your profile is hidden from explore swipes and public searches.</li>
    <li><strong>24-Hour Stories:</strong> Stories automatically expire and are purged from database storage after 24 hours.</li>
  </ul>

  <h3>5. Information Sharing & Third Parties</h3>
  <p>We do not sell your personal data. We only share information with trusted third-party providers (such as Google Firebase for cloud messaging/chat infrastructure and Agora for real-time video streaming) necessary for operating the App, or as required by law.</p>

  <h3>6. Data Retention & Security</h3>
  <p>We implement robust technical and organizational measures to protect personal data against unauthorized access, loss, or alteration. Inactive user data and expired media are periodically pruned.</p>

  <h3>7. Your Rights</h3>
  <p>Depending on your jurisdiction, you have the right to access, rectify, download, or delete your personal data. You can exercise these rights directly within the App settings or by contacting our Data Protection Officer.</p>

  <h3>8. Children's Privacy</h3>
  <p>Our services are strictly restricted to individuals aged 18 and older. We do not knowingly collect personal data from minors.</p>

  <h3>9. Contact Information</h3>
  <p>If you have any questions or concerns regarding this Privacy Policy, please contact our privacy team at <strong>privacy@orangeapp.com</strong>.</p>
</div>
`;

if (!db.pages || db.pages.length === 0) {
  db.pages = [{ id: 1, termsofuse: termsHtml, privacy: privacyHtml, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
} else {
  db.pages[0].termsofuse = termsHtml;
  db.pages[0].privacy = privacyHtml;
  db.pages[0].updated_at = new Date().toISOString();
}

if (db.appdata && db.appdata.length > 0) {
  db.appdata[0].termsofuse = termsHtml;
  db.appdata[0].privacypolicy = privacyHtml;
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated Terms of Use and Privacy Policy in db.json!');
