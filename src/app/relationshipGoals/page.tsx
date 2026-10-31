'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function RelationshipGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');

  // Edit Modal
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchGoals = () => {
    setLoading(true);
    fetch('/relationshipGoalList', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        const list = data.data || [];
        setGoals(list);
        setFilteredGoals(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredGoals(goals);
    } else {
      const q = search.toLowerCase();
      setFilteredGoals(
        goals.filter(
          (g) =>
            g.title?.toLowerCase().includes(q) ||
            g.description?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, goals]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/addRelationshipGoal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: addTitle, description: addDesc }),
    });
    setAddTitle('');
    setAddDesc('');
    setShowAddModal(false);
    fetchGoals();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    await fetch('/updateRelationshipGoal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingGoal.id,
        title: editTitle,
        description: editDesc,
      }),
    });
    setEditingGoal(null);
    fetchGoals();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this relationship goal?')) {
      await fetch('/deleteRelationshipGoal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchGoals();
    }
  };

  return (
    <AdminLayout title="Relationship Goals">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h4>Relationship Goals</h4>
          <button
            className="btn btn-primary ml-auto"
            onClick={() => setShowAddModal(true)}
          >
            Add Relationship Goal
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
            <table className="table table-striped w-100" id="relationshipGoalTable">
              <thead>
                <tr>
                  <th>Info</th>
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
                ) : filteredGoals.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-4">
                      No relationship goals found.
                    </td>
                  </tr>
                ) : (
                  filteredGoals.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <strong>{g.title}</strong>
                        {g.description && <p className="mb-0 text-muted">{g.description}</p>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-info text-white mr-2"
                          onClick={() => {
                            setEditingGoal(g);
                            setEditTitle(g.title);
                            setEditDesc(g.description || '');
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(g.id)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          id="addRelationshipGoalModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Relationship Goal</h5>
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
      {editingGoal && (
        <div
          className="modal fade show d-block"
          id="editRelationshipGoalModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Relationship Goal</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setEditingGoal(null)}
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
