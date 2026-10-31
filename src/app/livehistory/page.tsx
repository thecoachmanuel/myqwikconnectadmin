'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getImageUrl } from '@/lib/image-helper';

export default function LiveHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
        history.filter(
          (h) =>
            h.user?.fullname?.toLowerCase().includes(q) ||
            h.user?.username?.toLowerCase().includes(q)
        )
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
                      h.user?.images && h.user.images[0]?.image
                        ? h.user.images[0].image
                        : '/asset/img/user.png';
                    const avatarSrc = getImageUrl(avatar);

                    return (
                      <tr key={h.id}>
                        <td>
                          <img
                            src={avatarSrc}
                            alt=""
                            width={45}
                            height={45}
                            className="rounded-circle"
                            style={{ objectFit: 'cover' }}
                            onError={(e: any) => {
                              e.currentTarget.src = '/asset/img/user.png';
                            }}
                          />
                        </td>
                        <td>
                          <div><strong>{h.user?.fullname || `User #${h.user_id}`}</strong></div>
                          <small className="text-muted">@{h.user?.username || 'N/A'}</small>
                        </td>
                        <td>{h.started_at ? new Date(h.started_at).toLocaleTimeString() : 'N/A'}</td>
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
