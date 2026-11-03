'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getImageUrl } from '@/lib/image-helper';
import UserAvatar from '@/components/UserAvatar';

export default function LiveHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const formatStartedAt = (val?: string) => {
    if (!val) return 'N/A';
    // If it's already a formatted time like "3:45 PM" or "15:45", return it directly
    if (/^\d{1,2}:\d{2}(\s*(AM|PM|am|pm))?$/i.test(val.trim())) {
      return val.trim();
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return val;
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    fetch('/fetchLiveHistory', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setHistory(list);
        setFilteredHistory(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredHistory(history);
    } else {
      const q = search.toLowerCase();
      setFilteredHistory(
        history.filter((h) => {
          const fullname = h.user?.fullname || h.fullname || h.user?.name || '';
          const username = h.user?.username || h.username || '';
          return (
            fullname.toLowerCase().includes(q) ||
            username.toLowerCase().includes(q) ||
            String(h.user_id).includes(q)
          );
        })
      );
    }
  }, [search, history]);

  return (
    <AdminLayout title="Live History">
      <div className="card">
        <div className="card-header">
          <h4>Live History</h4>
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
            <table className="table table-striped w-100" id="table-22">
              <thead>
                <tr>
                  <th>User Image</th>
                  <th>User</th>
                  <th>Started At</th>
                  <th>Streamed For</th>
                  <th>Coins Collected</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No live history found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h) => {
                    const avatar =
                      (h.user?.images && h.user.images[0]?.image) ||
                      h.user?.image ||
                      h.image ||
                      '/asset/img/user.png';
                    const fullname =
                      h.user?.fullname ||
                      h.fullname ||
                      (h.user as any)?.name ||
                      (h.user_id ? `User #${h.user_id}` : 'Anonymous Streamer');
                    const username =
                      h.user?.username ||
                      h.username ||
                      (h.user as any)?.user_name ||
                      'N/A';

                    return (
                      <tr key={h.id}>
                        <td>
                          <UserAvatar
                            src={avatar}
                            name={fullname}
                            size={45}
                          />
                        </td>
                        <td>
                          <div><strong>{fullname}</strong></div>
                          <small className="text-muted">@{username}</small>
                        </td>
                        <td>{formatStartedAt(h.started_at)}</td>
                        <td>{h.streamed_for || '00:10:00'}</td>
                        <td>{h.amount_collected || 0}</td>
                        <td>{h.created_at ? new Date(h.created_at).toLocaleDateString() : 'N/A'}</td>
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
