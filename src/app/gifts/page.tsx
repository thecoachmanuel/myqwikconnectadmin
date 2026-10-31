'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getImageUrl } from '@/lib/image-helper';

export default function GiftsPage() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [filteredGifts, setFilteredGifts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Gift Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPrice, setAddPrice] = useState(10);
  const [addFile, setAddFile] = useState<File | null>(null);

  // Edit Gift Modal
  const [editingGift, setEditingGift] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState(10);
  const [editFile, setEditFile] = useState<File | null>(null);

  const fetchGifts = () => {
    setLoading(true);
    fetch('/fetchAllGifts', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setGifts(list);
        setFilteredGifts(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredGifts(gifts);
    } else {
      setFilteredGifts(
        gifts.filter((g) => g.coin_price?.toString().includes(search.trim()))
      );
    }
  }, [search, gifts]);

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('coin_price', addPrice.toString());
    if (addFile) {
      formData.append('image', addFile);
    }
    await fetch('/addGift', {
      method: 'POST',
      body: formData,
    });
    setShowAddModal(false);
    setAddPrice(10);
    setAddFile(null);
    fetchGifts();
  };

  const handleEditGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGift) return;
    const formData = new FormData();
    formData.append('id', editingGift.id.toString());
    formData.append('coin_price', editPrice.toString());
    if (editFile) {
      formData.append('image', editFile);
    }
    await fetch('/updateGift', {
      method: 'POST',
      body: formData,
    });
    setEditingGift(null);
    setEditFile(null);
    fetchGifts();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this gift?')) {
      await fetch('/deleteGift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchGifts();
    }
  };

  return (
    <AdminLayout title="Gifts">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h4>Gifts</h4>
          <button
            className="btn btn-primary ml-auto"
            onClick={() => setShowAddModal(true)}
          >
            Add Gift
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
            <table className="table table-striped w-100" id="giftTable">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Price</th>
                  <th style={{ width: '200px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredGifts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No gifts found.
                    </td>
                  </tr>
                ) : (
                  filteredGifts.map((g) => {
                    const src = getImageUrl(g.image);
                    return (
                      <tr key={g.id}>
                        <td>
                          <img
                            src={src}
                            alt=""
                            width={50}
                            height={50}
                            className="rounded"
                            style={{ objectFit: 'contain' }}
                            onError={(e: any) => {
                              e.currentTarget.src = '/asset/img/user.png';
                            }}
                          />
                        </td>
                        <td>{g.coin_price} Coins</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-sm btn-info text-white mr-2"
                            onClick={() => {
                              setEditingGift(g);
                              setEditPrice(g.coin_price);
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Gift Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          id="addGift"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Gift</h5>
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
                <form onSubmit={handleAddGift} autoComplete="off">
                  <div className="form-group mb-3">
                    <label htmlFor="gift_image" className="form-label">
                      Image
                    </label>
                    <input
                      id="gift_image"
                      className="form-control"
                      type="file"
                      accept="image/png, image/gif, image/jpeg"
                      name="image"
                      required
                      onChange={(e) => setAddFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Price (Coins)</label>
                    <input
                      type="number"
                      name="coin_price"
                      className="form-control"
                      required
                      value={addPrice}
                      onChange={(e) => setAddPrice(parseInt(e.target.value) || 0)}
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

      {/* Edit Gift Modal */}
      {editingGift && (
        <div
          className="modal fade show d-block"
          id="editGift"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Gift</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setEditingGift(null)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleEditGift} autoComplete="off">
                  <div className="text-center mb-3">
                    <img
                      height={120}
                      width={120}
                      className="rounded"
                      src={getImageUrl(editingGift.image)}
                      alt=""
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label htmlFor="edit_gift_image" className="form-label">
                      Image (Optional)
                    </label>
                    <input
                      id="edit_gift_image"
                      className="form-control"
                      type="file"
                      accept="image/png, image/gif, image/jpeg"
                      name="image"
                      onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Price (Coins)</label>
                    <input
                      id="edit_coin_price"
                      type="number"
                      name="coin_price"
                      className="form-control"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseInt(e.target.value) || 0)}
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
