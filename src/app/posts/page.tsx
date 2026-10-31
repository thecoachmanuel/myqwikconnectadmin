'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getImageUrl } from '@/lib/image-helper';

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewingPost, setViewingPost] = useState<any | null>(null);

  const fetchPosts = () => {
    setLoading(true);
    fetch('/postsList', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setPosts(list);
        setFilteredPosts(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPosts(posts);
    } else {
      const q = search.toLowerCase();
      setFilteredPosts(
        posts.filter(
          (p) =>
            p.user?.username?.toLowerCase().includes(q) ||
            p.user?.fullname?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, posts]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      await fetch('/deletePostFromUserPostTable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchPosts();
    }
  };

  return (
    <AdminLayout title="Posts">
      <div className="card">
        <div className="card-header">
          <h4>Posts</h4>
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
            <table className="table table-striped w-100" id="postsTable">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Content</th>
                  <th>User name</th>
                  <th>Full name</th>
                  <th>Comments</th>
                  <th>Likes</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right', width: '200px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No posts found.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((p) => {
                    const firstContent =
                      p.contents && p.contents[0]?.content
                        ? p.contents[0].content
                        : p.content && p.content[0]?.content
                        ? p.content[0].content
                        : '/asset/img/user.png';
                    const contentSrc = getImageUrl(firstContent);

                    return (
                      <tr key={p.id}>
                        <td>
                          <img
                            src={contentSrc}
                            alt=""
                            width={60}
                            height={60}
                            className="rounded"
                            style={{ objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setViewingPost(p)}
                            onError={(e: any) => {
                              e.currentTarget.src = '/asset/img/user.png';
                            }}
                          />
                        </td>
                        <td>{p.user?.username || 'N/A'}</td>
                        <td>{p.user?.fullname || 'N/A'}</td>
                        <td>{p.comments_count || 0}</td>
                        <td>{p.likes_count || 0}</td>
                        <td>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setViewingPost(p)}
                            className="btn btn-sm btn-info text-white mr-2"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="btn btn-sm btn-danger"
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

      {/* View Post Modal */}
      {viewingPost && (
        <div
          className="modal fade show d-block"
          id="viewPostModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">View Post</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setViewingPost(null)}
                  aria-label="Close"
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="font-weight-bold">Post Description</label>
                  <p className="mb-0 text-muted">{viewingPost.description || 'No description'}</p>
                </div>
                <hr />
                <div className="form-group">
                  <label className="font-weight-bold mb-2">Post Content</label>
                  <div className="d-flex flex-wrap gap-2">
                    {((viewingPost.contents || viewingPost.content) || []).map((c: any, idx: number) => {
                      const src = getImageUrl(c.content);
                      return (
                        <img
                          key={idx}
                          src={src}
                          alt=""
                          width={140}
                          height={140}
                          className="rounded mr-2 mb-2"
                          style={{ objectFit: 'cover' }}
                          onError={(e: any) => {
                            e.currentTarget.src = '/asset/img/user.png';
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingPost(null)}
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
