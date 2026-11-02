'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image-helper';
import UserAvatar from '@/components/UserAvatar';

export default function LiveApplicationPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [filteredApps, setFilteredApps] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchApps = () => {
    setLoading(true);
    fetch('/fetchLiveApplications', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setApps(list);
        setFilteredApps(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredApps(apps);
    } else {
      const q = search.toLowerCase();
      setFilteredApps(
        apps.filter(
          (a) =>
            a.user?.fullname?.toLowerCase().includes(q) ||
            a.user?.username?.toLowerCase().includes(q) ||
            a.languages?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, apps]);

  const handleDelete = async (id: number) => {
    if (confirm('Reject and delete application?')) {
      await fetch('/deleteLiveApplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchApps();
    }
  };

  return (
    <AdminLayout title="Live Applications">
      <div className="card">
        <div className="card-header">
          <h4>Live Applications</h4>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-12 d-flex justify-content-end">
              <div className="dataTables_filter">
                <label>
                  Search:
                  <input
                    type="search"
                    className="form-control form-control-sm ml-2"
                    placeholder=""
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped w-100" id="liveApplicationTable">
              <thead>
                <tr>
                  <th>User Image</th>
                  <th>User</th>
                  <th>Languages</th>
                  <th style={{ width: '200px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No live stream applications.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const avatar =
                      app.user?.images && app.user.images[0]?.image
                        ? app.user.images[0].image
                        : '/asset/img/user.png';
                    const avatarSrc = getImageUrl(avatar);

                    return (
                      <tr key={app.id}>
                        <td>
                          <UserAvatar
                            src={app.user?.images && app.user.images[0]?.image}
                            name={app.user?.fullname}
                            size={45}
                          />
                        </td>
                        <td>
                          <div><strong>{app.user?.fullname || `User #${app.user_id}`}</strong></div>
                          <small className="text-muted">@{app.user?.username || 'N/A'}</small>
                        </td>
                        <td>{app.languages || 'English'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            href={`/viewLiveApplication?id=${app.id}`}
                            className="btn btn-sm btn-info text-white mr-2"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
