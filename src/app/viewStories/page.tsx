'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function ViewStoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [filteredStories, setFilteredStories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingStory, setViewingStory] = useState<any | null>(null);

  const fetchStories = () => {
    setLoading(true);
    fetch('/allStoriesList', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setStories(list);
        setFilteredStories(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredStories(stories);
    } else {
      const q = search.toLowerCase();
      setFilteredStories(
        stories.filter(
          (s) =>
            s.user?.fullname?.toLowerCase().includes(q) ||
            s.user?.username?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, stories]);

  const handleDelete = async (id: number) => {
    if (confirm('Delete this story?')) {
      await fetch('/deleteStoryFromAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchStories();
    }
  };

  return (
    <AdminLayout title="All Stories">
      <div className="card">
        <div className="card-header">
          <div className="page-title w-100">
            <div className="d-flex align-items-center justify-content-between">
              <h4 className="mb-0 fw-normal d-flex align-items-center">All Stories</h4>
            </div>
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
            <table className="table table-striped w-100" id="allStoriesTable">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Content</th>
                  <th style={{ width: '150px' }}>Fullname</th>
                  <th style={{ width: '150px' }}>Time</th>
                  <th style={{ width: '250px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredStories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No stories found.
                    </td>
                  </tr>
                ) : (
                  filteredStories.map((s) => {
                    const src = s.content?.startsWith('http')
                      ? s.content
                      : s.content?.startsWith('/')
                      ? s.content
                      : `/${s.content}`;

                    return (
                      <tr key={s.id}>
                        <td>
                          {s.content ? (
                            <img
                              src={src}
                              alt=""
                              width={50}
                              height={50}
                              className="rounded"
                              style={{ objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => setViewingStory(s)}
                              onError={(e: any) => {
                                e.currentTarget.src = '/asset/img/user.png';
                              }}
                            />
                          ) : (
                            <span className="text-muted">No media</span>
                          )}
                        </td>
                        <td>{s.user?.fullname || `User #${s.user_id}`}</td>
                        <td>{s.created_at ? new Date(s.created_at).toLocaleString() : 'N/A'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-sm btn-info text-white mr-2"
                            onClick={() => setViewingStory(s)}
                          >
                            View Story
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(s.id)}
                          >
                            Delete
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

      {/* View Story Modal */}
      {viewingStory && (
        <div
          className="modal fade show d-block"
          id="viewStoryModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">View Story</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setViewingStory(null)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body text-center">
                <div className="form-group position-relative m-0">
                  <label className="form-label d-block text-left mb-2">Story Media</label>
                  <img
                    src={
                      viewingStory.content?.startsWith('http')
                        ? viewingStory.content
                        : viewingStory.content?.startsWith('/')
                        ? viewingStory.content
                        : `/${viewingStory.content}`
                    }
                    alt="Story"
                    className="img-fluid rounded"
                    style={{ maxHeight: '65vh', objectFit: 'contain' }}
                    onError={(e: any) => {
                      e.currentTarget.src = '/asset/img/user.png';
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingStory(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
