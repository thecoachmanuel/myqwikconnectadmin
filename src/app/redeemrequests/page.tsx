'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getImageUrl } from '@/lib/image-helper';

export default function RedeemRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);

  // Complete modal
  const [completingReq, setCompletingReq] = useState<any | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const fetchRequests = () => {
    setLoading(true);
    const endpoint = activeTab === 'pending' ? '/fetchPendingRedeems' : '/fetchCompletedRedeems';
    fetch(endpoint, { method: 'POST' })
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
    fetchRequests();
  }, [activeTab]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredRequests(requests);
    } else {
      const q = search.toLowerCase();
      setFilteredRequests(
        requests.filter(
          (r) =>
            r.user?.fullname?.toLowerCase().includes(q) ||
            r.user?.username?.toLowerCase().includes(q) ||
            r.request_id?.toLowerCase().includes(q) ||
            r.payment_gateway?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, requests]);

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingReq) return;
    await fetch('/completeRedeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: completingReq.id, amount_paid: amountPaid }),
    });
    setCompletingReq(null);
    fetchRequests();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this redeem request?')) {
      await fetch('/deleteRedeemRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchRequests();
    }
  };

  return (
    <AdminLayout title="Redeem Requests">
      <div className="card">
        <div className="card-header d-flex align-items-center flex-wrap">
          <h4>Redeem Requests</h4>
          <div className="ms-3 card-tab">
            <ul className="nav nav-tabs" id="myTab" role="tablist">
              <li role="presentation" className="nav-item">
                <a
                  className={`nav-link pointer ${activeTab === 'pending' ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('pending');
                  }}
                >
                  Pending Requests
                </a>
              </li>
              <li role="presentation" className="nav-item">
                <a
                  className={`nav-link pointer ${activeTab === 'completed' ? 'active' : ''}`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('completed');
                  }}
                >
                  Completed Requests
                </a>
              </li>
            </ul>
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
            <table className="table table-striped w-100" id={activeTab === 'pending' ? 'table-pending' : 'table-completed'}>
              <thead>
                <tr>
                  <th>User Image</th>
                  <th>User</th>
                  <th>Request ID</th>
                  <th>Coin Amount</th>
                  <th>Payable Amount</th>
                  <th>Payment Gateway</th>
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
                      No {activeTab} redeem requests.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => {
                    const avatar =
                      r.user?.images && r.user.images[0]?.image
                        ? r.user.images[0].image
                        : '/asset/img/user.png';
                    const avatarSrc = getImageUrl(avatar);

                    return (
                      <tr key={r.id}>
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
                          <div><strong>{r.user?.fullname || `User #${r.user_id}`}</strong></div>
                          <small className="text-muted">@{r.user?.username || 'N/A'}</small>
                        </td>
                        <td>{r.request_id || `#REQ-${r.id}`}</td>
                        <td>{r.coin_amount || 0}</td>
                        <td>${r.amount_paid || r.coin_amount || 0}</td>
                        <td>{r.payment_gateway || 'PayPal'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {activeTab === 'pending' ? (
                            <>
                              <button
                                className="btn btn-sm btn-success mr-2"
                                onClick={() => {
                                  setCompletingReq(r);
                                  setAmountPaid(r.coin_amount || 100);
                                }}
                              >
                                Complete
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(r.id)}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="badge badge-success">Completed</span>
                          )}
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

      {/* Complete Redeem Modal */}
      {completingReq && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Complete Payout for {completingReq.user?.fullname}</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setCompletingReq(null)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <form onSubmit={handleCompleteSubmit}>
                <div className="modal-body">
                  <div className="form-group mb-3">
                    <label>Amount Paid ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCompletingReq(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Mark as Paid
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
