'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function ViewAboutPage() {
  const [about, setAbout] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/viewAbout')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.about) setAbout(d.data.about);
      })
      .catch(() => { });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/updateAbout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about }),
      });
      alert('About Us content updated successfully!');
    } catch (err: any) {
      alert('Failed to update About Us: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="About Us">
      <div className="card mt-3">
        <div className="card-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <h4 className="mb-0">About QwikConnect</h4>
            <span className="badge bg-primary text-white ms-2">Options &amp; Legal Screen</span>
          </div>
        </div>
        <div className="card-body">
          <p className="text-muted mb-3">
            This content is displayed inside the user mobile and web applications under <strong>Options &gt; About QwikConnect</strong>. You can use standard HTML formatting (headings, paragraphs, lists) or plain text.
          </p>
          <form onSubmit={handleSave} className="form-group form-border" id="about" autoComplete="off">
            <div className="form-group mb-3">
              <label className="fw-bold mb-2">About Page Content (HTML or Text)</label>
              <textarea
                className="form-control"
                rows={16}
                required
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
            </div>
            <div className="form-group mb-0">
              <input
                className="btn btn-primary"
                type="submit"
                value={loading ? 'Saving Changes...' : 'Save Changes'}
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}

