'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function PackagePage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addPrice, setAddPrice] = useState('9.99');
  const [addMonths, setAddMonths] = useState(1);
  const [addPlayid, setAddPlayid] = useState('');
  const [addAppid, setAddAppid] = useState('');

  // Edit Modal State
  const [editingPack, setEditingPack] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editMonths, setEditMonths] = useState(1);
  const [editPlayid, setEditPlayid] = useState('');
  const [editAppid, setEditAppid] = useState('');

  const fetchPackages = () => {
    setLoading(true);
    fetch('/fetchAllPackage', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setPackages(list);
        setFilteredPackages(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPackages(packages);
    } else {
      const q = search.toLowerCase();
      setFilteredPackages(
        packages.filter(
          (p) =>
            p.title?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.playid?.toLowerCase().includes(q) ||
            p.appid?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, packages]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/addPackage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: addTitle,
        description: addDesc,
        price: addPrice,
        months: addMonths,
        playid: addPlayid,
        appid: addAppid,
      }),
    });
    setShowAddModal(false);
    setAddTitle('');
    setAddDesc('');
    setAddPrice('9.99');
    setAddMonths(1);
    setAddPlayid('');
    setAddAppid('');
    fetchPackages();
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPack) return;
    await fetch('/updatePackage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingPack.id,
        title: editTitle,
        description: editDesc,
        price: editPrice,
        months: editMonths,
        playid: editPlayid,
        appid: editAppid,
      }),
    });
    setEditingPack(null);
    fetchPackages();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this subscription package?')) {
      await fetch('/deletePackage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchPackages();
    }
  };

  const openEditModal = (p: any) => {
    setEditingPack(p);
    setEditTitle(p.title || '');
    setEditDesc(p.description || '');
    setEditPrice(p.price?.toString() || '');
    setEditMonths(p.months || 1);
    setEditPlayid(p.playid || '');
    setEditAppid(p.appid || '');
  };

  return (
    <AdminLayout title="Subscriptions">
      {/* Add Subscription Modal */}
      {showAddModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold">Add Subscription Package</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowAddModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleAddSubmit} autoComplete="off">
                <div className="modal-body">
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 1 Month Premium"
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Description</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Unlimited swiping & pro matching"
                      value={addDesc}
                      onChange={(e) => setAddDesc(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="9.99"
                      value={addPrice}
                      onChange={(e) => setAddPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Months</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      placeholder="1"
                      value={addMonths}
                      onChange={(e) => setAddMonths(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Play Store Product ID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. pkg_1m"
                      value={addPlayid}
                      onChange={(e) => setAddPlayid(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">App Store Product ID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. com.app.orange.1m"
                      value={addAppid}
                      onChange={(e) => setAddAppid(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Subscription
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingPack && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold">Edit Subscription Package</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setEditingPack(null)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleEditSubmit} autoComplete="off">
                <div className="modal-body">
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Description</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Months</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={editMonths}
                      onChange={(e) => setEditMonths(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">Play Store Product ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editPlayid}
                      onChange={(e) => setEditPlayid(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label className="font-weight-600">App Store Product ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editAppid}
                      onChange={(e) => setEditAppid(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingPack(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="m-0">Subscriptions</h4>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <i className="fas fa-plus mr-1"></i> Add Subscription
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
                    placeholder="Search package..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped w-100">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Months</th>
                  <th>Playstore ID</th>
                  <th>Appstore ID</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No subscription packages found.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map((pack) => (
                    <tr key={pack.id}>
                      <td className="font-weight-600">{pack.title}</td>
                      <td>{pack.description}</td>
                      <td>
                        <span className="badge badge-success text-white">
                          ${pack.price}
                        </span>
                      </td>
                      <td>{pack.months} month{pack.months > 1 ? 's' : ''}</td>
                      <td><code>{pack.playid || 'N/A'}</code></td>
                      <td><code>{pack.appid || 'N/A'}</code></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openEditModal(pack)}
                          className="btn btn-sm btn-primary mr-2"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(pack.id)}
                          className="btn btn-sm btn-danger"
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
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
    </AdminLayout>
  );
}

