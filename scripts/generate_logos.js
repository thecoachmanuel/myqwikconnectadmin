const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Paths
const orangeDir = path.resolve(__dirname, '../../Orange');
const assetsDir = path.join(orangeDir, 'assets');
const webDir = path.join(orangeDir, 'web');

// Colors
const COLOR_LIGHT_ORANGE = '#FF6F43';
const COLOR_THEME_RED = '#FE1B03';

/**
 * Creates the SVG for the standalone 'Q' logo mark.
 * The 'Q' is designed as a bold geometric ring with a dynamic connecting swoosh tail
 * symbolizing speed ('Qwik') and connection ('Connect').
 */
function createQLogoSvg(size, options = {}) {
  const {
    background = null, // 'white', 'gradient', or null (transparent)
    paddingRatio = 0.16, // padding inside bounding box
    rx = 0, // corner radius if background
  } = options;

  const pad = size * paddingRatio;
  const innerSize = size - 2 * pad;
  const center = size / 2;

  // The 'Q' geometry normalized in a 200x200 coordinate space
  // Outer circle: r=70 at (95, 95)
  // Inner circle: r=40 at (95, 95)
  // Tail: starts at (95, 95), swooshes out to (175, 175) with stroke-width ~30 and rounded cap
  const qSvg = `
    <g transform="translate(${pad}, ${pad}) scale(${innerSize / 200})">
      <!-- Glow effect for depth -->
      <filter id="qShadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#FE1B03" flood-opacity="0.32" />
      </filter>

      <!-- Gradient Definition -->
      <defs>
        <linearGradient id="qwikGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${COLOR_LIGHT_ORANGE}" />
          <stop offset="50%" stop-color="#FF4B1F" />
          <stop offset="100%" stop-color="${COLOR_THEME_RED}" />
        </linearGradient>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${COLOR_LIGHT_ORANGE}" />
          <stop offset="100%" stop-color="${COLOR_THEME_RED}" />
        </linearGradient>
      </defs>

      <!-- Q Mark: A unified path combining the geometric ring and energetic connecting tail -->
      <path
        d="M 95 24
           C 134.2 24 166 55.8 166 95
           C 166 110.8 161.4 125.5 153.5 137.8
           L 178.5 162.8
           C 183.8 168.1 183.8 176.7 178.5 182
           C 173.2 187.3 164.6 187.3 159.3 182
           L 136.2 158.9
           C 123.8 163.6 109.8 166 95 166
           C 55.8 166 24 134.2 24 95
           C 24 55.8 55.8 24 95 24 Z
           M 95 56
           C 73.5 56 56 73.5 56 95
           C 56 116.5 73.5 134 95 134
           C 116.5 134 134 116.5 134 95
           C 134 73.5 116.5 56 95 56 Z"
        fill="url(#qwikGrad)"
        fill-rule="evenodd"
        filter="url(#qShadow)"
      />

      <!-- Accent dynamic dot representing connection node -->
      <circle cx="170" cy="173" r="11" fill="url(#qwikGrad)" />
    </g>
  `;

  let bgElement = '';
  if (background === 'white') {
    bgElement = `<rect width="${size}" height="${size}" rx="${rx}" fill="#FFFFFF" />`;
  } else if (background === 'gradient') {
    bgElement = `<rect width="${size}" height="${size}" rx="${rx}" fill="url(#bgGrad)" />`;
  } else if (background === 'dark') {
    bgElement = `<rect width="${size}" height="${size}" rx="${rx}" fill="#121212" />`;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${COLOR_LIGHT_ORANGE}" />
          <stop offset="100%" stop-color="${COLOR_THEME_RED}" />
        </linearGradient>
      </defs>
      ${bgElement}
      ${qSvg}
    </svg>
  `;
}

/**
 * Creates the SVG for the horizontal Wordmark (get_started1_label & theme_label_white).
 * Width: 420, Height: 102.
 * Text-only: "Qwik" has orange gradient fill, "Connect" uses solid textColor.
 * No Q icon — the gradient on "Qwik" is the brand mark.
 */
function createWordmarkSvg(width, height, isWhite = false) {
  const connectColor = isWhite ? '#FFFFFF' : '#000000';
  // Use a single text element with tspan so there is ZERO gap between Qwik and Connect
  const textY = height / 2 + 18;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="qwikTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="${COLOR_LIGHT_ORANGE}" />
          <stop offset="50%"  stop-color="#FF4B1F" />
          <stop offset="100%" stop-color="${COLOR_THEME_RED}" />
        </linearGradient>
      </defs>

      <!--
        Single <text> element — tspan ensures zero kerning gap between Qwik and Connect.
        "Qwik" gets the orange gradient, "Connect" gets solid black (#000000).
      -->
      <text
        x="10"
        y="${textY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Gilroy', 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"
        font-size="52"
        font-weight="800"
        letter-spacing="-1.5"
      ><tspan fill="url(#qwikTextGrad)">Qwik</tspan><tspan fill="${connectColor}" font-weight="700">Connect</tspan></text>
    </svg>
  `;
}

async function generate() {
  console.log('Generating QwikConnect Logos...');

  // 1. Horizontal Wordmark: get_started1_label.png (dark text on transparent)
  // Width 480x100: text-only "Qwik"(gradient) + "Connect"(dark), no Q icon
  const wordmarkDarkSvg = createWordmarkSvg(480, 100, false);
  const wordmarkDarkBuf = await sharp(Buffer.from(wordmarkDarkSvg)).png().toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'images/get_started1_label.png'), wordmarkDarkBuf);
  console.log('✓ Created assets/images/get_started1_label.png');

  // 2. Horizontal Wordmark: theme_label_white.png (white text on transparent)
  const wordmarkWhiteSvg = createWordmarkSvg(480, 100, true);
  const wordmarkWhiteBuf = await sharp(Buffer.from(wordmarkWhiteSvg)).png().toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'images/theme_label_white.png'), wordmarkWhiteBuf);
  console.log('✓ Created assets/images/theme_label_white.png');

  // 3. App Icon: app_icon.png (512x512 on crisp white background with squircle radius)
  const appIconBuf = await sharp(Buffer.from(createWordmarkIconSvg(512, 115))).png().toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'icons/app_icon.png'), appIconBuf);
  console.log('✓ Created assets/icons/app_icon.png');

  // 4. Icon1: icon1.png (389x389)
  const icon1Buf = await sharp(Buffer.from(createWordmarkIconSvg(389, 80))).png().toBuffer();
  fs.writeFileSync(path.join(assetsDir, 'images/icon1.png'), icon1Buf);
  console.log('✓ Created assets/images/icon1.png');

  // 5-9. PWA icons & favicon: use exact brand logo (Qwik in Orange Gradient, Connect in solid Black) on crisp white background
  function createWordmarkIconSvg(size, rx = 0) {
    const fs2 = Math.round(size / 5.2);
    const cx = size / 2;
    const qwikW = fs2 * 2.52;
    const totalW = fs2 * 5.95;
    const startX = cx - totalW / 2;
    const textY = size / 2 + fs2 * 0.35;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="qwikGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stop-color="${COLOR_LIGHT_ORANGE}" />
            <stop offset="50%"  stop-color="#FF4B1F" />
            <stop offset="100%" stop-color="${COLOR_THEME_RED}" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${rx}" fill="#FFFFFF" />
        <!-- "Qwik" ultra-bold Orange Gradient -->
        <text
          x="${startX}"
          y="${textY}"
          font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Gilroy', 'Segoe UI', Roboto, sans-serif"
          font-size="${fs2}"
          font-weight="900"
          letter-spacing="-${Math.round(fs2 * 0.024)}"
          fill="url(#qwikGradIcon)"
        >Qwik</text>
        <!-- "Connect" bold solid Black (#000000), seamless -->
        <text
          x="${startX + qwikW}"
          y="${textY}"
          font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Gilroy', 'Segoe UI', Roboto, sans-serif"
          font-size="${fs2}"
          font-weight="700"
          letter-spacing="-${Math.round(fs2 * 0.024)}"
          fill="#000000"
        >Connect</text>
      </svg>`;
  }

  // 5. PWA 192x192
  const pwa192Buf = await sharp(Buffer.from(createWordmarkIconSvg(192, 28))).png().toBuffer();
  fs.writeFileSync(path.join(webDir, 'icons/Icon-192.png'), pwa192Buf);
  console.log('✓ Created web/icons/Icon-192.png');

  // 6. PWA 512x512
  const pwa512Buf = await sharp(Buffer.from(createWordmarkIconSvg(512, 76))).png().toBuffer();
  fs.writeFileSync(path.join(webDir, 'icons/Icon-512.png'), pwa512Buf);
  console.log('✓ Created web/icons/Icon-512.png');

  // 7. PWA Maskable 192x192 (no rx — full bleed for maskable safe zone)
  const pwaMask192Buf = await sharp(Buffer.from(createWordmarkIconSvg(192, 0))).png().toBuffer();
  fs.writeFileSync(path.join(webDir, 'icons/Icon-maskable-192.png'), pwaMask192Buf);
  console.log('✓ Created web/icons/Icon-maskable-192.png');

  // 8. PWA Maskable 512x512
  const pwaMask512Buf = await sharp(Buffer.from(createWordmarkIconSvg(512, 0))).png().toBuffer();
  fs.writeFileSync(path.join(webDir, 'icons/Icon-maskable-512.png'), pwaMask512Buf);
  console.log('✓ Created web/icons/Icon-maskable-512.png');

  // 9. Favicon 64x64 — wordmark on orange gradient, rounded
  const favBuf = await sharp(Buffer.from(createWordmarkIconSvg(64, 10))).png().toBuffer();
  fs.writeFileSync(path.join(webDir, 'favicon.png'), favBuf);
  console.log('✓ Created web/favicon.png');

  // 10. iOS App Icon (1024x1024)
  const iosIconPath = path.join(orangeDir, 'ios/Runner/Assets.xcassets/AppIcon.appiconset/orange.png');
  const ios1024Buf = await sharp(Buffer.from(createWordmarkIconSvg(1024, 0))).png().toBuffer();
  fs.writeFileSync(iosIconPath, ios1024Buf);
  console.log('✓ Created ios/Runner/Assets.xcassets/AppIcon.appiconset/orange.png');

  // 11. Android Mipmap Icons
  const androidResDir = path.join(orangeDir, 'android/app/src/main/res');
  const mipmapSizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };

  for (const [folder, s] of Object.entries(mipmapSizes)) {
    const targetDir = path.join(androidResDir, folder);
    if (fs.existsSync(targetDir)) {
      // Square launcher
      const svgSquare = createWordmarkIconSvg(s, Math.round(s * 0.22));
      const webpSquare = await sharp(Buffer.from(svgSquare)).webp().toBuffer();
      fs.writeFileSync(path.join(targetDir, 'ic_launcher.webp'), webpSquare);

      // Round launcher
      const svgRound = createWordmarkIconSvg(s, Math.round(s * 0.5));
      const webpRound = await sharp(Buffer.from(svgRound)).webp().toBuffer();
      fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.webp'), webpRound);

      console.log(`✓ Created Android ${folder} icons (${s}x${s})`);
    }
  }

  console.log('All QwikConnect logos successfully generated!');
}

generate().catch(console.error);
