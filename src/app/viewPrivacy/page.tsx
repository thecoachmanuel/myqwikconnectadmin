'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function ViewPrivacyPage() {
  const [privacy, setPrivacy] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/viewPrivacy')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.privacy) setPrivacy(d.data.privacy);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/updatePrivacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privacy }),
    });
    setLoading(false);
    alert('Privacy policy updated successfully!');
  };

  return (
    <AdminLayout title="Privacy Policy">
      <div className="card mt-3">
        <div className="card-header d-flex align-items-center">
          <h4>
            Privacy Policy{' '}
            <a
              target="_blank"
              className="btn btn-primary ml-2"
              href="/privacypolicy"
              rel="noreferrer"
            >
              Click Here
            </a>
          </h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave} className="form-group form-border" id="privacy" autoComplete="off">
            <div className="form-group mb-3">
              <label>Content</label>
              <textarea
                className="form-control"
                rows={14}
                required
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
              />
            </div>
            <div className="form-group mb-0">
              <input
                className="btn btn-primary mr-1"
                type="submit"
                value={loading ? 'Submitting...' : 'Submit'}
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
