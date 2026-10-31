'use client';

import React, { useEffect, useState } from 'react';

export default function PrivacyPolicyPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/viewPrivacy')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.privacy) setContent(d.data.privacy);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h2>Privacy Policy</h2>
      <hr />
      <div dangerouslySetInnerHTML={{ __html: content || '<p>No privacy policy set yet.</p>' }} />
    </div>
  );
}

