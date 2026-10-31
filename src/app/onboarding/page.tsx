'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function OnboardingPage() {
  const [screens, setScreens] = useState<any[]>([]);
  const [filteredScreens, setFilteredScreens] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addFile, setAddFile] = useState<File | null>(null);

  // Edit Modal
  const [editingScreen, setEditingScreen] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  const fetchScreens = () => {
    setLoading(true);
    fetch('/onboardingList', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setScreens(list);
        setFilteredScreens(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchScreens();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredScreens(screens);
    } else {
      const q = search.toLowerCase();
      setFilteredScreens(
        screens.filter(
          (s) =>
            s.title?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, screens]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', addTitle);
    formData.append('description', addDesc);
    if (addFile) {
      formData.append('image', addFile);
    }
    await fetch('/addOnboarding', {
      method: 'POST',
      body: formData,
    });
    setAddTitle('');
    setAddDesc('');
    setAddFile(null);
    setShowAddModal(false);
    fetchScreens();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScreen) return;
    const formData = new FormData();
    formData.append('id', editingScreen.id.toString());
    formData.append('title', editTitle);
    formData.append('description', editDesc);
    if (editFile) {
      formData.append('image', editFile);
    }
    await fetch('/updateOnboardingScreen', {
      method: 'POST',
      body: formData,
    });
    setEditingScreen(null);
    setEditFile(null);
    fetchScreens();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete onboarding slide?')) {
      await fetch('/deleteOnboardingScreen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchScreens();
    }
  };

  return (
    <AdminLayout title="Onboarding">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h4>Onboarding</h4>
          <button
            className="btn btn-primary ml-auto"
            onClick={() => setShowAddModal(true)}
          >
            Add Onboarding
          </button>
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
            <table className="table table-striped w-100" id="onboardingTable">
              <thead>
                <tr>
                  <th style={{ width: '25px', textAlign: 'center' }}>Sortable</th>
                  <th>Position</th>
                  <th className="w-100">Onboarding</th>
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
                ) : filteredScreens.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4">
                      No onboarding screens found.
                    </td>
                  </tr>
                ) : (
                  filteredScreens.map((s, idx) => {
                    const src = s.image?.startsWith('http')
                      ? s.image
                      : s.image?.startsWith('/')
                      ? s.image
                      : `/${s.image}`;

                    return (
                      <tr key={s.id}>
                        <td style={{ textAlign: 'center' }}>
                          <i className="fas fa-arrows-alt text-muted"></i>
                        </td>
                        <td>{s.position || idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            {s.image && (
                              <img
                                src={src}
                                alt=""
                                width={60}
                                height={60}
                                className="rounded mr-3"
                                style={{ objectFit: 'cover' }}
                                onError={(e: any) => {
                                  e.currentTarget.src = '/asset/img/user.png';
                                }}
                              />
                            )}
                            <div>
                              <strong>{s.title}</strong>
                              {s.description && (
                                <p className="mb-0 text-muted small">{s.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-sm btn-info text-white mr-2"
                            onClick={() => {
                              setEditingScreen(s);
                              setEditTitle(s.title || '');
                              setEditDesc(s.description || '');
                            }}
                          >
                            Edit
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

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          id="addOnboardingModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Onboarding Screen</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAdd} autoComplete="off">
                  <div className="form-group mb-3">
                    <label>Image</label>
                    <input
                      type="file"
                      className="form-control"
                      required
                      accept="image/*"
                      onChange={(e) => setAddFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      required
                      value={addDesc}
                      onChange={(e) => setAddDesc(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-0 text-right">
                    <input className="btn btn-primary mr-1" type="submit" value="Save" />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingScreen && (
        <div
          className="modal fade show d-block"
          id="editOnboardingModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Onboarding Screen</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setEditingScreen(null)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEdit} autoComplete="off">
                  <div className="form-group mb-3">
                    <label>Image (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      required
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-0 text-right">
                    <input className="btn btn-primary mr-1" type="submit" value="Save" />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
