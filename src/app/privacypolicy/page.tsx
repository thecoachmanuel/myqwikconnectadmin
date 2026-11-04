import React from 'react';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PrivacyPolicyPage() {
  const db = await getDb();
  const page = db.pages[0];
  const appName = db.appdata[0]?.app_name || 'QwikConnect';
  const content = page?.privacy || (db.appdata[0] as any)?.privacypolicy || '';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Brand Hero Header */}
      <header style={{
        background: 'linear-gradient(135deg, #FF6F43 0%, #FE1B03 100%)',
        color: '#FFFFFF',
        padding: '50px 24px 70px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 8px 30px rgba(254, 27, 3, 0.25)',
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '6px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            marginBottom: '16px',
            backdropFilter: 'blur(8px)',
          }}>
            🛡️ OFFICIAL LEGAL DOCUMENT
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            margin: '0 0 12px',
          }}>
            Privacy Policy
          </h1>
          <p style={{
            fontSize: '16px',
            opacity: '0.92',
            maxWidth: '580px',
            margin: '0 auto 20px',
            lineHeight: '1.6',
          }}>
            How {appName} collects, safeguards, and protects your personal data, privacy preferences, and account security.
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
            opacity: '0.85',
          }}>
            <span>📅 Effective: October 2026</span>
            <span>•</span>
            <span>🔒 NDPR & GDPR Aligned</span>
          </div>
        </div>
      </header>

      {/* Main Body Container */}
      <main style={{ maxWidth: '880px', margin: '-40px auto 60px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        {/* Navigation Quick Bar */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '14px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #EDF2F7',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📄</span>
            <span style={{ fontWeight: '700', color: '#1A202C', fontSize: '15px' }}>{appName} Legal Center</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href="/privacypolicy"
              style={{
                color: '#FE1B03',
                fontWeight: '700',
                fontSize: '14px',
                textDecoration: 'none',
                borderBottom: '2px solid #FE1B03',
                paddingBottom: '2px',
              }}
            >
              Privacy Policy
            </a>
            <span style={{ color: '#CBD5E0' }}>|</span>
            <a
              href="/termsOfUse"
              style={{
                color: '#718096',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Terms of Use
            </a>
          </div>
        </div>

        {/* Content Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '40px 48px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
          border: '1px solid #EDF2F7',
          color: '#2D3748',
          fontSize: '15px',
          lineHeight: '1.8',
        }}>
          {content ? (
            <div
              className="legal-content"
              style={{
                color: '#2D3748',
                lineHeight: '1.85',
                whiteSpace: content.includes('<') ? 'normal' : 'pre-wrap',
              }}
              dangerouslySetInnerHTML={{
                __html: content.includes('<')
                  ? content
                  : content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>'),
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#718096' }}>
              <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Privacy Policy is being updated.</p>
              <p style={{ fontSize: '14px' }}>Please check back shortly or configure the policy from the Admin Panel.</p>
            </div>
          )}

          {/* Bottom Security Assurance */}
          <div style={{
            marginTop: '48px',
            paddingTop: '28px',
            borderTop: '1px solid #EDF2F7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '13px',
            color: '#718096',
          }}>
            <div>
              <strong>Questions or Privacy Concerns?</strong> Contact our Data Protection Officer at{' '}
              <a href="mailto:privacy@qwikconnect.ng" style={{ color: '#FE1B03', textDecoration: 'none', fontWeight: '600' }}>
                privacy@qwikconnect.ng
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#38A169', fontWeight: '700' }}>●</span> 256-Bit SSL Encrypted
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
