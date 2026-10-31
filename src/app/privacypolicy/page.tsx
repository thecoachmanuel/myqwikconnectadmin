import React from 'react';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PrivacyPolicyPage() {
  const db = await getDb();
  const page = db.pages[0];
  const content = page?.privacy || (db.appdata[0] as any)?.privacypolicy || '';

  return (
    <div style={{ maxWidth: '850px', margin: '40px auto', padding: '0 24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#2d3748', lineHeight: '1.7' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1a202c' }}>Privacy Policy</h1>
      <p style={{ color: '#718096', fontSize: '14px', marginBottom: '24px' }}>Last updated: October 2026</p>
      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '32px' }} />
      <div dangerouslySetInnerHTML={{ __html: content || '<p>No privacy policy set yet.</p>' }} />
    </div>
  );
}
