'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function ReligionsPage() {
  const [religions, setReligions] = useState<any[]>([]);
  const [filteredReligions, setFilteredReligions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState('');

  // Edit Modal
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchReligions = () => {
    setLoading(true);
    fetch('/religionList', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setReligions(list);
        setFilteredReligions(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReligions();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredReligions(religions);
    } else {
      const q = search.toLowerCase();
      setFilteredReligions(
        religions.filter((r) => r.title?.toLowerCase().includes(q))
      );
    }
  }, [search, religions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/addReligion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: addTitle }),
    });
    setAddTitle('');
    setShowAddModal(false);
    fetchReligions();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    await fetch('/updateReligion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingItem.id, title: editTitle }),
    });
    setEditingItem(null);
    fetchReligions();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete religion?')) {
      await fetch('/deleteReligion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchReligions();
    }
  };

  return (
    <AdminLayout title="Religions">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h4>Religions</h4>
          <button
            className="btn btn-primary ml-auto"
            onClick={() => setShowAddModal(true)}
          >
            Add Religion
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
            <table className="table table-striped w-100" id="religionTable">
              <thead>
                <tr>
                  <th>Title</th>
                  <th style={{ width: '200px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredReligions.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-4">
                      No religions found.
                    </td>
                  </tr>
                ) : (
                  filteredReligions.map((r) => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-info text-white mr-2"
                          onClick={() => {
                            setEditingItem(r);
                            setEditTitle(r.title);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Religion Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          id="addReligionModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Religion</h5>
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
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
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

      {/* Edit Religion Modal */}
      {editingItem && (
        <div
          className="modal fade show d-block"
          id="editReligionModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Religion</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setEditingItem(null)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEdit} autoComplete="off">
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
