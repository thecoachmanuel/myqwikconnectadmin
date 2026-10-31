'use client';

import React, { useEffect, useState } from 'react';

export default function TermsOfUsePage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/viewTerms')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.termsofuse) setContent(d.data.termsofuse);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <h2>Terms Of Use</h2>
      <hr />
      <div dangerouslySetInnerHTML={{ __html: content || '<p>No terms of use set yet.</p>' }} />
    </div>
  );
}

