'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function DiamondPacksPage() {
  const [packs, setPacks] = useState<any[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Pack Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState(100);
  const [addPrice, setAddPrice] = useState(1500);
  const [addPlaystore, setAddPlaystore] = useState('');
  const [addAppstore, setAddAppstore] = useState('');

  // Edit Pack Modal
  const [editingPack, setEditingPack] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState(100);
  const [editPrice, setEditPrice] = useState(1500);
  const [editPlaystore, setEditPlaystore] = useState('');
  const [editAppstore, setEditAppstore] = useState('');

  const fetchPacks = () => {
    setLoading(true);
    fetch('/fetchDiamondPackages', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setPacks(list);
        setFilteredPacks(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPacks();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredPacks(packs);
    } else {
      const q = search.toLowerCase();
      setFilteredPacks(
        packs.filter(
          (p) =>
            p.amount?.toString().includes(q) ||
            p.android_product_id?.toLowerCase().includes(q) ||
            p.ios_product_id?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, packs]);

  const handleAddPack = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/addDiamondPack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: addAmount,
        price: addPrice,
        android_product_id: addPlaystore,
        ios_product_id: addAppstore,
      }),
    });
    setShowAddModal(false);
    setAddAmount(100);
    setAddPrice(1500);
    setAddPlaystore('');
    setAddAppstore('');
    fetchPacks();
  };

  const handleEditPack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPack) return;
    await fetch('/updateDiamondPack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingPack.id,
        amount: editAmount,
        price: editPrice,
        android_product_id: editPlaystore,
        ios_product_id: editAppstore,
      }),
    });
    setEditingPack(null);
    fetchPacks();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this diamond pack?')) {
      await fetch('/deleteDiamondPack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchPacks();
    }
  };

  return (
    <AdminLayout title="Diamond Packs">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h4>Diamond Packs</h4>
          <button
            className="btn btn-primary ml-auto"
            onClick={() => setShowAddModal(true)}
          >
            Add Pack
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
            <table className="table table-striped w-100" id="diamondTable">
              <thead>
                <tr>
                  <th>Diamond Amount</th>
                  <th>Price (₦)</th>
                  <th>Playstoreid</th>
                  <th>Appstoreid</th>
                  <th style={{ width: '200px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredPacks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      No diamond packs found.
                    </td>
                  </tr>
                ) : (
                  filteredPacks.map((p) => (
                    <tr key={p.id}>
                      <td className="font-weight-600">
                        <i className="fas fa-gem text-primary mr-2"></i>
                        {p.amount} Diamonds
                      </td>
                      <td>
                        <span className="badge badge-success text-white">
                          ₦{(p.price || p.amount * 15).toLocaleString()}
                        </span>
                      </td>
                      <td><code>{p.android_product_id}</code></td>
                      <td><code>{p.ios_product_id}</code></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-info text-white mr-2"
                          onClick={() => {
                            setEditingPack(p);
                            setEditAmount(p.amount);
                            setEditPrice(p.price || p.amount * 15);
                            setEditPlaystore(p.android_product_id || '');
                            setEditAppstore(p.ios_product_id || '');
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(p.id)}
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

      {/* Add Diamond Pack Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          id="addDiamondPack"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Pack</h5>
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
                <form onSubmit={handleAddPack} autoComplete="off">
                  <div className="form-group mb-3">
                    <label>Diamond Amount</label>
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      required
                      value={addAmount}
                      onChange={(e) => setAddAmount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Price (₦)</label>
                    <input
                      type="number"
                      name="price"
                      className="form-control"
                      required
                      value={addPrice}
                      onChange={(e) => setAddPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Playstoreid</label>
                    <input
                      type="text"
                      name="android_product_id"
                      className="form-control"
                      required
                      placeholder="e.g. com.orange.diamond100"
                      value={addPlaystore}
                      onChange={(e) => setAddPlaystore(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Appstoreid</label>
                    <input
                      type="text"
                      name="ios_product_id"
                      className="form-control"
                      required
                      placeholder="e.g. com.orange.diamond100"
                      value={addAppstore}
                      onChange={(e) => setAddAppstore(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <input className="btn btn-primary mr-1" type="submit" value="Add Pack" />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Diamond Pack Modal */}
      {editingPack && (
        <div
          className="modal fade show d-block"
          id="editDiamondPack"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Package</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setEditingPack(null)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditPack} autoComplete="off">
                  <div className="form-group mb-3">
                    <label>Diamond Amount</label>
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Price (₦)</label>
                    <input
                      type="number"
                      name="price"
                      className="form-control"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Playstoreid</label>
                    <input
                      type="text"
                      name="android_product_id"
                      className="form-control"
                      required
                      value={editPlaystore}
                      onChange={(e) => setEditPlaystore(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Appstoreid</label>
                    <input
                      type="text"
                      name="ios_product_id"
                      className="form-control"
                      required
                      value={editAppstore}
                      onChange={(e) => setEditAppstore(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <input type="submit" className="btn btn-primary" value="Save" />
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
