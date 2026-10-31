import React from 'react';
import type { Metadata } from 'next';
import { getDb } from '@/lib/db';
import { getImageUrl } from '@/lib/image-helper';

interface Props {
  params: Promise<{ slug: string }>;
}

function decodeSlug(slug: string): string {
  try {
    let clean = slug.trim().replace(/=+$/, '');
    while (clean.length % 4 !== 0) clean += '=';
    return Buffer.from(clean, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeSlug(slug);
  const db = await getDb();

  let title = 'Orange - Dating & Livestream';
  let description = 'Connect, share and discover with Orange';
  let imageUrl = '/asset/img/favicon.png';

  if (decoded.startsWith('post_')) {
    const postId = parseInt(decoded.replace('post_', ''));
    const post = (db.posts || []).find((p) => p.id === postId) as any;
    if (post) {
      const desc = post.description || post.desc || '';
      title = desc ? (desc.length > 50 ? desc.substring(0, 50) + '...' : desc) : 'Orange Post';
      description = desc || 'Check out this post on Orange';
      const postContent = typeof post.content === 'string' ? post.content : (Array.isArray(post.content) && post.content[0]?.content ? post.content[0].content : '');
      if (postContent && (postContent.startsWith('http') || postContent.startsWith('uploads/'))) {
        imageUrl = getImageUrl(postContent);
      }
    }
  } else if (decoded.startsWith('user_')) {
    const userId = parseInt(decoded.replace('user_', ''));
    const user = (db.users || []).find((u) => u.id === userId);
    if (user) {
      title = `${user.fullname || 'User'} on Orange`;
      description = user.bio || `Connect with ${user.fullname || 'this user'} on Orange`;
      const img = (user.images && user.images[0]?.image) || '/asset/img/user.png';
      imageUrl = getImageUrl(img);
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeSlug(slug);
  const db = await getDb();
  const appdata = (db.appdata[0] || {}) as any;

  let title = 'Orange Post';
  let description = 'View on Orange';
  let imageUrl = '/asset/img/favicon.png';
  let isVideo = false;

  if (decoded.startsWith('post_')) {
    const postId = parseInt(decoded.replace('post_', ''));
    const post = (db.posts || []).find((p) => p.id === postId) as any;
    if (post) {
      const desc = post.description || post.desc || '';
      title = desc || 'Post';
      description = `Post by ${post.user?.fullname || 'Orange User'}`;
      const postContent = typeof post.content === 'string' ? post.content : (Array.isArray(post.content) && post.content[0]?.content ? post.content[0].content : '');
      if (postContent) {
        imageUrl = getImageUrl(postContent);
        if (postContent.endsWith('.mp4') || postContent.endsWith('.mov')) {
          isVideo = true;
        }
      }
    }
  } else if (decoded.startsWith('user_')) {
    const userId = parseInt(decoded.replace('user_', ''));
    const user = (db.users || []).find((u) => u.id === userId);
    if (user) {
      title = user.fullname || 'Orange User';
      description = user.bio || `${user.age ? user.age + ' years old' : ''} ${(user as any).live || user.city || ''}`;
      const img = (user.images && user.images[0]?.image) || '/asset/img/user.png';
      imageUrl = getImageUrl(img);
    }
  }

  const deepLink = `orange://s/${slug}`;
  const playStoreLink = appdata.play_store_download_link || '#';
  const appStoreLink = appdata.app_store_download_link || '#';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#0d0d0d', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Blurred background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(35px) brightness(0.35)',
          transform: 'scale(1.1)',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', width: '100%', backgroundColor: 'rgba(20, 20, 20, 0.85)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
          {/* Content Preview */}
          <div style={{ width: '100%', height: '320px', borderRadius: '18px', overflow: 'hidden', marginBottom: '20px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isVideo ? (
              <video src={imageUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#fff' }}>{title}</h2>
          <p style={{ fontSize: '14px', color: '#aaa', margin: '0 0 24px 0' }}>{description}</p>

          {/* Open in App Button */}
          <a
            href={deepLink}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 20px',
              backgroundColor: '#FE1B03',
              color: '#fff',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '16px',
              textDecoration: 'none',
              marginBottom: '14px',
              boxShadow: '0 4px 15px rgba(254, 27, 3, 0.4)',
            }}
          >
            Open in Orange App
          </a>

          {/* Store Download Links */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {playStoreLink !== '#' && (
              <a href={playStoreLink} target="_blank" rel="noreferrer" style={{ color: '#ccc', fontSize: '13px', textDecoration: 'underline' }}>
                Google Play
              </a>
            )}
            {appStoreLink !== '#' && (
              <a href={appStoreLink} target="_blank" rel="noreferrer" style={{ color: '#ccc', fontSize: '13px', textDecoration: 'underline' }}>
                App Store
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
