'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filteredNotifs, setFilteredNotifs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Send Notification Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchNotifs = () => {
    setLoading(true);
    fetch('/fetchAllNotification', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data || [];
        setNotifications(list);
        setFilteredNotifs(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredNotifs(notifications);
    } else {
      const q = search.toLowerCase();
      setFilteredNotifs(
        notifications.filter(
          (n) =>
            n.title?.toLowerCase().includes(q) ||
            n.message?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, notifications]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await fetch('/addNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message }),
    });
    setTitle('');
    setMessage('');
    setSending(false);
    setShowAddModal(false);
    fetchNotifs();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this notification?')) {
      await fetch('/deleteNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchNotifs();
    }
  };

  return (
    <AdminLayout title="Notifications">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h4>Notifications</h4>
          <button
            className="btn btn-primary ml-auto"
            onClick={() => setShowAddModal(true)}
          >
            Send notification
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
            <table className="table table-striped w-100" id="notificationTable">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
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
                ) : filteredNotifs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No notifications found.
                    </td>
                  </tr>
                ) : (
                  filteredNotifs.map((n) => (
                    <tr key={n.id}>
                      <td><strong>{n.title}</strong></td>
                      <td>{n.message}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(n.id)}
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

      {/* Send Notification Modal */}
      {showAddModal && (
        <div
          className="modal fade show d-block"
          id="addNotificationModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Send notification</h5>
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
                <form onSubmit={handleSendNotification} autoComplete="off">
                  <div className="form-group mb-3">
                    <label>Title</label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-3">
                    <label>Message</label>
                    <textarea
                      name="message"
                      className="form-control"
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-0">
                    <input
                      className="btn btn-primary mr-1"
                      type="submit"
                      value={sending ? 'Sending...' : 'Send'}
                      disabled={sending}
                    />
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
