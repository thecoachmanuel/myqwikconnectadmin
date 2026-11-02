'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getImageUrl } from '@/lib/image-helper';
import UserAvatar from '@/components/UserAvatar';

export default function RedeemRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);

  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
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
                  <th>Account Number / Details</th>
                  <th style={{ width: '200px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
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
                    const payable = r.payable_amount !== undefined ? `${r.currency || '₦'}${r.payable_amount}` : `₦${r.amount_paid || r.coin_amount || 0}`;

                    return (
                      <tr key={r.id}>
                        <td>
                          <UserAvatar
                            src={r.user?.images && r.user.images[0]?.image}
                            name={r.user?.fullname}
                            size={45}
                          />
                        </td>
                        <td>
                          <div><strong>{r.user?.fullname || `User #${r.user_id}`}</strong></div>
                          <small className="text-muted">@{r.user?.username || 'N/A'}</small>
                        </td>
                        <td>{r.request_id || `#REQ-${r.id}`}</td>
                        <td><span className="badge badge-light border font-weight-bold">{r.coin_amount || 0}</span></td>
                        <td><strong>{payable}</strong></td>
                        <td><span className="badge badge-info">{r.payment_gateway || 'PayPal'}</span></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="font-weight-bold mr-2 text-dark" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.account_details || 'N/A'}
                            </span>
                            {r.account_details && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-secondary py-0 px-2"
                                title="Copy account number"
                                onClick={() => copyToClipboard(r.account_details, r.id)}
                              >
                                {copiedId === r.id ? 'Copied!' : 'Copy'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {activeTab === 'pending' ? (
                            <>
                              <button
                                className="btn btn-sm btn-success mr-2"
                                onClick={() => {
                                  setCompletingReq(r);
                                  setAmountPaid(r.payable_amount || r.amount_paid || 10);
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
                <h5>Complete Payout for {completingReq.user?.fullname || `User #${completingReq.user_id}`}</h5>
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
                  <div className="alert alert-light border mb-3">
                    <div className="mb-2"><strong>Request ID:</strong> {completingReq.request_id}</div>
                    <div className="mb-2"><strong>Payment Gateway:</strong> <span className="badge badge-info">{completingReq.payment_gateway || 'PayPal'}</span></div>
                    <div className="mb-2">
                      <strong>Account Number / Details:</strong>
                      <div className="p-2 mt-1 bg-white border rounded d-flex justify-content-between align-items-center">
                        <code style={{ fontSize: '15px', color: '#e83e8c' }}>{completingReq.account_details || 'N/A'}</code>
                        {completingReq.account_details && (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary py-1 px-3 ml-2"
                            onClick={() => copyToClipboard(completingReq.account_details, completingReq.id)}
                          >
                            {copiedId === completingReq.id ? 'Copied!' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2"><strong>Coin Amount:</strong> {completingReq.coin_amount} diamonds</div>
                  </div>

                  <div className="form-group mb-3">
                    <label>Amount Paid ({completingReq.currency || '$'})</label>
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
                    Mark as Paid & Complete
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
