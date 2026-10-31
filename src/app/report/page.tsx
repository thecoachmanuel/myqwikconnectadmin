'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getImageUrl } from '@/lib/image-helper';

export default function ReportPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'user' | 'post'>('user');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    const endpoint = activeTab === 'user' ? '/fetchUsersReport' : '/postReportList';
    fetch(endpoint, { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        setReports(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const filteredReports = reports.filter((rep) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      rep.user?.fullname?.toLowerCase().includes(q) ||
      rep.user?.identity?.toLowerCase().includes(q) ||
      rep.reason?.toLowerCase().includes(q) ||
      rep.description?.toLowerCase().includes(q)
    );
  });

  const handleDismiss = async (id: number) => {
    if (confirm('Dismiss this report?')) {
      await fetch('/deleteReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchReports();
    }
  };

  const handleBlockUser = async (userId: number, reportId: number) => {
    if (confirm('Block this reported user?')) {
      await fetch('/blockUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      await fetch('/deleteReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId }),
      });
      fetchReports();
    }
  };

  const handleDeletePost = async (postId: number, reportId: number) => {
    if (confirm('Delete this reported post?')) {
      await fetch('/deletePostFromUserPostTable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
      });
      await fetch('/deleteReport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId }),
      });
      fetchReports();
    }
  };

  return (
    <AdminLayout title="Reports">
      <div className="card">
        <div className="card-header d-flex align-items-center flex-wrap">
          <h4>Reports</h4>
          <div className="ms-3 card-tab">
            <ul className="nav nav-tabs" id="myTab" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link pointer ${activeTab === 'user' ? 'active' : ''}`}
                  onClick={() => setActiveTab('user')}
                  type="button"
                >
                  User reports
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link pointer ${activeTab === 'post' ? 'active' : ''}`}
                  onClick={() => setActiveTab('post')}
                  type="button"
                >
                  Post reports
                </button>
              </li>
            </ul>
          </div>
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
            {activeTab === 'user' ? (
              <table className="table table-striped w-100" id="UsersTable">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Identity</th>
                    <th>Full Name</th>
                    <th>Reason</th>
                    <th>Description</th>
                    <th style={{ width: '200px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        No user reports found.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((rep) => {
                      const avatar =
                        rep.user?.images && rep.user.images[0]?.image
                          ? rep.user.images[0].image
                          : '/asset/img/user.png';
                      const avatarSrc = getImageUrl(avatar);

                      return (
                        <tr key={rep.id}>
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
                          <td>{rep.user?.identity || rep.user?.username || 'N/A'}</td>
                          <td>{rep.user?.fullname || `User #${rep.user_id}`}</td>
                          <td><span className="badge badge-warning text-dark">{rep.reason || 'Report'}</span></td>
                          <td>{rep.description || 'No description provided'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDismiss(rep.id)}
                              className="btn btn-sm btn-info text-white mr-2"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleBlockUser(rep.user_id, rep.id)}
                              className="btn btn-sm btn-danger"
                            >
                              Block User
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="table table-striped w-100" id="fetchPostReport">
                <thead>
                  <tr>
                    <th style={{ width: '200px' }}>Post</th>
                    <th style={{ width: '300px' }}>Reason</th>
                    <th>Description</th>
                    <th style={{ width: '350px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        No post reports found.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((rep) => (
                      <tr key={rep.id}>
                        <td>
                          <strong>Post #{rep.post_id || rep.id}</strong>
                        </td>
                        <td><span className="badge badge-warning text-dark">{rep.reason || 'Report'}</span></td>
                        <td>{rep.description || 'No description provided'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleDismiss(rep.id)}
                            className="btn btn-sm btn-info text-white mr-2"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleDeletePost(rep.post_id || rep.id, rep.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete Post
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
