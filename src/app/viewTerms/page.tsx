'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function ViewTermsPage() {
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/viewTerms')
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.termsofuse) setTerms(d.data.termsofuse);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/updateTerms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termsofuse: terms }),
    });
    setLoading(false);
    alert('Terms of use updated successfully!');
  };

  return (
    <AdminLayout title="Terms Of Use">
      <div className="card mt-3">
        <div className="card-header d-flex align-items-center">
          <h4>
            Terms Of Use{' '}
            <a
              target="_blank"
              className="btn btn-primary ml-2"
              href="/termsOfUse"
              rel="noreferrer"
            >
              Click Here
            </a>
          </h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave} className="form-group form-border" id="terms" autoComplete="off">
            <div className="form-group mb-3">
              <label>Content</label>
              <textarea
                className="form-control"
                rows={14}
                required
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
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
