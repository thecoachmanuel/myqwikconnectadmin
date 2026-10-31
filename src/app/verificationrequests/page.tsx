'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchVerifications = () => {
    setLoading(true);
    fetch('/fetchverificationRequests', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setRequests(list);
        setFilteredRequests(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredRequests(requests);
    } else {
      const q = search.toLowerCase();
      setFilteredRequests(
        requests.filter(
          (v) =>
            v.fullname?.toLowerCase().includes(q) ||
            v.user?.fullname?.toLowerCase().includes(q) ||
            v.user?.identity?.toLowerCase().includes(q) ||
            v.document_type?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, requests]);

  const handleApprove = async (id: number) => {
    if (confirm('Approve profile verification?')) {
      await fetch('/approveVerificationRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchVerifications();
    }
  };

  const handleReject = async (id: number) => {
    if (confirm('Reject verification request?')) {
      await fetch('/rejectVerificationRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchVerifications();
    }
  };

  return (
    <AdminLayout title="Verification Requests">
      <div className="card">
        <div className="card-header">
          <h4>Verification Requests</h4>
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
            <table className="table table-striped w-100" id="verificationRequestTable">
              <thead>
                <tr>
                  <th>User Image</th>
                  <th>Selfie</th>
                  <th>Document</th>
                  <th>Document Type</th>
                  <th>Full Name</th>
                  <th>Identity</th>
                  <th style={{ width: '200px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No verification requests found.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((v) => {
                    const avatar =
                      v.user?.images && v.user.images[0]?.image
                        ? v.user.images[0].image
                        : '/asset/img/user.png';
                    const avatarSrc = avatar.startsWith('http')
                      ? avatar
                      : avatar.startsWith('/')
                      ? avatar
                      : `/${avatar}`;

                    const selfieSrc = v.selfie
                      ? v.selfie.startsWith('http')
                        ? v.selfie
                        : v.selfie.startsWith('/')
                        ? v.selfie
                        : `/${v.selfie}`
                      : '/asset/img/user.png';

                    const docSrc = v.document
                      ? v.document.startsWith('http')
                        ? v.document
                        : v.document.startsWith('/')
                        ? v.document
                        : `/${v.document}`
                      : '/asset/img/user.png';

                    return (
                      <tr key={v.id}>
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
                        <td>
                          <img
                            src={selfieSrc}
                            alt="Selfie"
                            width={50}
                            height={50}
                            className="rounded"
                            style={{ objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setPreviewImage(selfieSrc)}
                          />
                        </td>
                        <td>
                          <img
                            src={docSrc}
                            alt="Document"
                            width={50}
                            height={50}
                            className="rounded"
                            style={{ objectFit: 'cover', cursor: 'pointer' }}
                            onClick={() => setPreviewImage(docSrc)}
                          />
                        </td>
                        <td>{v.document_type || 'ID Card'}</td>
                        <td>{v.fullname || v.user?.fullname || 'N/A'}</td>
                        <td>{v.user?.identity || v.user?.username || 'N/A'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => handleApprove(v.id)}
                            className="btn btn-sm btn-success mr-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(v.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Reject
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

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="modal fade show d-block"
          id="previewItem"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Image Preview</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setPreviewImage(null)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body text-center">
                <img
                  id="img-preview"
                  width="100%"
                  src={previewImage}
                  alt=""
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
