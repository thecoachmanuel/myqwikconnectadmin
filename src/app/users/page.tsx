'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'streamer' | 'fake'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Coins Modal
  const [coinModalUser, setCoinModalUser] = useState<any | null>(null);
  const [coinsToAdd, setCoinsToAdd] = useState<number | string>('');

  const fetchUsers = () => {
    setLoading(true);
    let endpoint = '/fetchAllUsers';
    if (activeTab === 'streamer') endpoint = '/fetchStreamerUsers';
    if (activeTab === 'fake') endpoint = '/fetchFakeUsers';

    fetch(endpoint, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        const list = data.data || [];
        setUsers(list);
        setFilteredUsers(list);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);
    } else {
      const q = search.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.fullname?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q) ||
            u.identity?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, users]);

  const handleBlockToggle = async (user: any) => {
    const action = user.is_block === 1 ? '/unblockUser' : '/blockUser';
    await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });
    fetchUsers();
  };

  const handleLiveToggle = async (user: any) => {
    const action = user.can_go_live === 2 ? '/restrictLiveToUser' : '/allowLiveToUser';
    await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });
    fetchUsers();
  };

  const handleAddCoins = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coinModalUser) return;
    await fetch('/addCoinsToUserWalletFromAdmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: coinModalUser.id, coin: Number(coinsToAdd) || 0 }),
    });
    setCoinModalUser(null);
    setCoinsToAdd('');
    fetchUsers();
  };

  return (
    <AdminLayout title="Users">
      <div className="card">
        <div className="card-header">
          <div className="d-flex align-items-center flex-wrap">
            <h4>Users</h4>
            <div className="ms-3 card-tab">
              <ul className="nav nav-tabs" id="myTab" role="tablist">
                <li role="presentation" className="nav-item">
                  <a
                    className={`nav-link pointer ${activeTab === 'all' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('all');
                    }}
                  >
                    All Users
                  </a>
                </li>
                <li role="presentation" className="nav-item">
                  <a
                    className={`nav-link pointer ${activeTab === 'streamer' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('streamer');
                    }}
                  >
                    Streamers
                  </a>
                </li>
                <li role="presentation" className="nav-item">
                  <a
                    className={`nav-link pointer ${activeTab === 'fake' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('fake');
                    }}
                  >
                    Fake Users
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <Link href="/addFakeUser" id="add-fake-user" className="ml-auto btn btn-primary">
            Add fake user
          </Link>
        </div>

        <div className="card-body">
          {/* DataTables search filter */}
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
            <table className="table table-striped w-100" id="UsersTable">
              <thead>
                <tr>
                  <th>User Image</th>
                  <th>Identity</th>
                  <th>Full Name</th>
                  <th>Wallet</th>
                  <th>Live eligible</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>BlockUser</th>
                  <th>ViewDetails</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const avatar =
                      u.images && u.images[0]?.image
                        ? u.images[0].image
                        : '/asset/img/user.png';
                    const avatarSrc = avatar.startsWith('http')
                      ? avatar
                      : avatar.startsWith('/')
                      ? avatar
                      : `/${avatar}`;

                    return (
                      <tr key={u.id}>
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
                        <td>{u.identity || u.username}</td>
                        <td>{u.fullname}</td>
                        <td>
                          <span className="badge badge-warning text-dark mr-1">{u.wallet || 0}</span>
                          <button
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            onClick={() => setCoinModalUser(u)}
                            title="Add Coins"
                          >
                            +
                          </button>
                        </td>
                        <td>
                          <span
                            className={`badge ${u.can_go_live === 2 ? 'badge-success' : 'badge-secondary'} pointer`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleLiveToggle(u)}
                          >
                            {u.can_go_live === 2 ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </td>
                        <td>{u.age || 25}</td>
                        <td>{u.gender === 1 ? 'Male' : u.gender === 2 ? 'Female' : 'Other'}</td>
                        <td>
                          <button
                            className={`btn btn-sm ${u.is_block === 1 ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => handleBlockToggle(u)}
                          >
                            {u.is_block === 1 ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                        <td>
                          <Link href={`/viewuser?id=${u.id}`} className="btn btn-sm btn-info text-white">
                            View
                          </Link>
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

      {/* Add coins Modal */}
      {coinModalUser && (
        <div
          className="modal fade show d-block"
          id="addCoinsModal"
          tabIndex={-1}
          role="dialog"
          aria-labelledby="exampleModalLabel"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Coins</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setCoinModalUser(null)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleAddCoins} className="add_category" id="addCoinsForm" autoComplete="off">
                  <input type="hidden" name="id" id="userId" value={coinModalUser.id} />
                  <div className="form-group">
                    <label htmlFor="coins">Coins</label>
                    <input
                      required
                      type="number"
                      className="form-control"
                      id="coins"
                      name="coins"
                      placeholder="Enter Coin Amount"
                      value={coinsToAdd}
                      onChange={(e) => setCoinsToAdd(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <input className="btn btn-primary mr-1" type="submit" value="Submit" />
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
