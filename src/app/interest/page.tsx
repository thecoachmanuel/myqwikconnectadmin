'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function InterestPage() {
  const [interests, setInterests] = useState<any[]>([]);
  const [filteredInterests, setFilteredInterests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Interest Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Edit Interest Modal
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const fetchInterests = () => {
    setLoading(true);
    fetch('/fetchAllInterest', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        const list = data.data || [];
        setInterests(list);
        setFilteredInterests(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchInterests();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredInterests(interests);
    } else {
      const q = search.toLowerCase();
      setFilteredInterests(
        interests.filter((i) => i.title?.toLowerCase().includes(q))
      );
    }
  }, [search, interests]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/addInterest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle('');
    setShowAddModal(false);
    fetchInterests();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    await fetch('/updateInterest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingItem.id, title: editTitle }),
    });
    setEditingItem(null);
    fetchInterests();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this interest?')) {
      await fetch('/deleteInterest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchInterests();
    }
  };

  return (
    <AdminLayout title="Interests">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h4>Interests</h4>
          <button
            className="btn btn-primary ml-auto"
            onClick={() => setShowAddModal(true)}
          >
            Add Interest
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
            <table className="table table-striped w-100" id="interestTable">
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
                ) : filteredInterests.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-4">
                      No interests found.
                    </td>
                  </tr>
                ) : (
                  filteredInterests.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-info text-white mr-2"
                          onClick={() => {
                            setEditingItem(item);
                            setEditTitle(item.title);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.id)}
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

      {/* Add Interest Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          id="addInterest"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Interest</h5>
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
                <form onSubmit={handleAdd} id="addForm" autoComplete="off">
                  <div className="form-group mb-3">
                    <label>Title</label>
                    <input
                      type="text"
                      id="cat_title"
                      name="title"
                      className="form-control"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <input className="btn btn-primary mr-1" type="submit" value="Save" />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Interest Modal */}
      {editingItem && (
        <div
          className="modal fade show d-block"
          id="editInterest"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Interest</h5>
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
                <form onSubmit={handleUpdate} autoComplete="off">
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
                  <div className="form-group mb-0">
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
