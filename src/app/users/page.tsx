'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image-helper';
import UserAvatar from '@/components/UserAvatar';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'real' | 'streamer' | 'fake'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Coins Modal
  const [coinModalUser, setCoinModalUser] = useState<any | null>(null);
  const [coinsToAdd, setCoinsToAdd] = useState<number | string>('');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newFullname, setNewFullname] = useState('');
  const [newIdentity, setNewIdentity] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newGender, setNewGender] = useState('1');
  const [newCountry, setNewCountry] = useState('Nigeria');
  const [newState, setNewState] = useState('Lagos');
  const [newCity, setNewCity] = useState('Ikeja');
  const [newWallet, setNewWallet] = useState('250');
  const [newIsFake, setNewIsFake] = useState('0');
  const [newBio, setNewBio] = useState('Hello! I am new here.');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    let endpoint = '/fetchAllUsers';
    if (activeTab === 'streamer') endpoint = '/fetchStreamerUsers';
    if (activeTab === 'fake') endpoint = '/fetchFakeUsers';
    if (activeTab === 'real') endpoint = '/fetchRealUsers';

    fetch(endpoint, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        let list = data.data || [];
        if (activeTab === 'real') {
          list = list.filter((u: any) => u.is_fake !== 1);
        }
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

  const handleDeleteUser = async (user: any) => {
    if (confirm(`Are you sure you want to permanently delete user "${user.fullname || user.identity}"?`)) {
      await fetch('/deleteUserFromAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      fetchUsers();
    }
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdentity.trim()) {
      alert('Please enter an email or username identity.');
      return;
    }
    setCreatingUser(true);

    const formData = new FormData();
    formData.append('fullname', newFullname.trim() || 'New User');
    formData.append('identity', newIdentity.trim());
    formData.append('username', newIdentity.includes('@') ? newIdentity.split('@')[0] : newIdentity.trim());
    formData.append('password', newPassword.trim() || '123456');
    formData.append('gender', newGender);
    formData.append('country', newCountry);
    formData.append('state', newState);
    formData.append('city', newCity);
    formData.append('wallet', newWallet);
    formData.append('is_fake', newIsFake);
    formData.append('bio', newBio);
    formData.append('can_go_live', '2');
    formData.append('is_verified', '1');

    if (newImageFile) {
      formData.append('image[]', newImageFile);
    }

    try {
      const res = await fetch('/adminCreateUser', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status) {
        alert(
          newIsFake === '0'
            ? 'Real user account created successfully! The user can now log into the web and mobile app with these credentials.'
            : 'Demo user created successfully!'
        );
        setShowCreateModal(false);
        // Reset form
        setNewFullname('');
        setNewIdentity('');
        setNewPassword('123456');
        setNewImageFile(null);
        fetchUsers();
      } else {
        alert(data.message || 'Error creating user');
      }
    } catch (err: any) {
      alert('Failed to create user: ' + err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const formatRegisteredDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <AdminLayout title="Users">
      <div className="card">
        <div className="card-header">
          <div className="d-flex align-items-center flex-wrap">
            <h4 className="mb-0 mr-3">Users</h4>
            <div className="ms-2 card-tab">
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
                    All Users ({users.length})
                  </a>
                </li>
                <li role="presentation" className="nav-item">
                  <a
                    className={`nav-link pointer ${activeTab === 'real' ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('real');
                    }}
                  >
                    <span className="badge badge-success mr-1">New</span> Real Users
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
                    Demo Users
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="ml-auto d-flex align-items-center flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary mr-2"
              onClick={() => setShowCreateModal(true)}
            >
              + Create New User
            </button>
            <Link href="/addFakeUser" id="add-fake-user" className="btn btn-outline-secondary">
              Add Demo Profile
            </Link>
          </div>
        </div>

        <div className="card-body">
          {/* DataTables search filter */}
          <div className="row mb-3">
            <div className="col-12 d-flex justify-content-between align-items-center flex-wrap">
              <div className="text-muted small">
                Showing {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} (newest registrations first)
              </div>
              <div className="dataTables_filter">
                <label className="d-flex align-items-center mb-0">
                  <span className="mr-2">Search:</span>
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Search name, email, identity..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-hover w-100" id="UsersTable">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Identity / Email</th>
                  <th>Full Name</th>
                  <th>Type</th>
                  <th>Registered</th>
                  <th>Wallet</th>
                  <th>Live Stream</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const avatar =
                      u.images && u.images[0]?.image
                        ? u.images[0].image
                        : '/asset/img/user.png';
                    const avatarSrc = getImageUrl(avatar);
                    const isReal = u.is_fake !== 1;

                    return (
                      <tr key={u.id}>
                        <td>
                          <UserAvatar
                            src={u.images && u.images[0]?.image}
                            name={u.fullname || u.username}
                            size={42}
                          />
                        </td>
                        <td>
                          <div className="font-weight-bold">{u.identity || u.username}</div>
                          <small className="text-muted">ID: #{u.id}</small>
                        </td>
                        <td>
                          <div>{u.fullname}</div>
                          <small className="text-muted">
                            {u.gender === 1 ? 'Male' : u.gender === 2 ? 'Female' : 'Other'} • {u.country || 'Nigeria'}
                          </small>
                        </td>
                        <td>
                          {isReal ? (
                            <span className="badge badge-success text-white">Real User</span>
                          ) : (
                            <span className="badge badge-secondary">Demo</span>
                          )}
                        </td>
                        <td>
                          <small>{formatRegisteredDate(u.created_at)}</small>
                        </td>
                        <td>
                          <span className="badge badge-warning text-dark mr-1">{u.wallet || 0}</span>
                          <button
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            onClick={() => setCoinModalUser(u)}
                            title="Adjust / Add Coins"
                          >
                            +
                          </button>
                        </td>
                        <td>
                          <span
                            className={`badge ${u.can_go_live === 2 ? 'badge-success' : 'badge-secondary'} pointer`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleLiveToggle(u)}
                            title="Click to toggle live streaming"
                          >
                            {u.can_go_live === 2 ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${u.is_block === 1 ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => handleBlockToggle(u)}
                            title={u.is_block === 1 ? 'Click to unblock' : 'Click to block'}
                          >
                            {u.is_block === 1 ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Link
                              href={`/viewuser?id=${u.id}`}
                              className="btn btn-sm btn-info text-white mr-1"
                              title="View and Edit Profile"
                            >
                              View
                            </Link>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteUser(u)}
                              title="Delete User"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* Create New User Modal */}
      {showCreateModal && (
        <div
          className="modal fade show d-block"
          id="createUserModal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold">Create New User</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreateUser} autoComplete="off">
                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label htmlFor="createUserFullname">Full Name *</label>
                      <input
                        required
                        type="text"
                        className="form-control"
                        id="createUserFullname"
                        placeholder="e.g. Samuel Adeyemi"
                        value={newFullname}
                        onChange={(e) => setNewFullname(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label htmlFor="createUserIdentity">Email / Identity *</label>
                      <input
                        required
                        type="email"
                        className="form-control"
                        id="createUserIdentity"
                        placeholder="e.g. samuel@gmail.com"
                        value={newIdentity}
                        onChange={(e) => setNewIdentity(e.target.value)}
                      />
                      <small className="form-text text-muted">
                        User will use this email to log into the mobile & web app.
                      </small>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label htmlFor="createUserPassword">Password *</label>
                      <input
                        required
                        type="text"
                        className="form-control"
                        id="createUserPassword"
                        placeholder="Enter password (e.g. 123456)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label htmlFor="createUserType">Account Type</label>
                      <select
                        id="createUserType"
                        className="form-control"
                        value={newIsFake}
                        onChange={(e) => setNewIsFake(e.target.value)}
                      >
                        <option value="0">Real User (Can log into Web & Mobile App)</option>
                        <option value="1">Demo / Simulated User</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 form-group">
                      <label htmlFor="createUserGender">Gender</label>
                      <select
                        id="createUserGender"
                        className="form-control"
                        value={newGender}
                        onChange={(e) => setNewGender(e.target.value)}
                      >
                        <option value="1">Male</option>
                        <option value="2">Female</option>
                      </select>
                    </div>
                    <div className="col-md-4 form-group">
                      <label htmlFor="createUserCountry">Country</label>
                      <input
                        type="text"
                        className="form-control"
                        id="createUserCountry"
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4 form-group">
                      <label htmlFor="createUserCity">City / State</label>
                      <input
                        type="text"
                        className="form-control"
                        id="createUserCity"
                        placeholder="Lagos, Ikeja"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 form-group">
                      <label htmlFor="createUserWallet">Initial Wallet Coins</label>
                      <input
                        type="number"
                        className="form-control"
                        id="createUserWallet"
                        value={newWallet}
                        onChange={(e) => setNewWallet(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 form-group">
                      <label htmlFor="createUserImage">Profile Photo (Optional)</label>
                      <input
                        type="file"
                        className="form-control-file"
                        id="createUserImage"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNewImageFile(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="createUserBio">Bio</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      id="createUserBio"
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                    />
                  </div>

                  <div className="modal-footer px-0 pb-0">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowCreateModal(false)}
                      disabled={creatingUser}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={creatingUser}>
                      {creatingUser ? 'Creating User...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add coins Modal */}
      {coinModalUser && (
        <div
          className="modal fade show d-block"
          id="addCoinsModal"
          tabIndex={-1}
          role="dialog"
          aria-labelledby="exampleModalLabel"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold">
                  Adjust Coins: {coinModalUser.fullname || coinModalUser.identity}
                </h5>
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
                    <label className="text-muted">Current Wallet Balance:</label>
                    <div className="h4 text-warning font-weight-bold mb-3">{coinModalUser.wallet || 0} Coins</div>
                    <label htmlFor="coins">Coins to Add (or enter negative number to deduct):</label>
                    <input
                      required
                      type="number"
                      className="form-control"
                      id="coins"
                      name="coins"
                      placeholder="e.g. 500 or -100"
                      value={coinsToAdd}
                      onChange={(e) => setCoinsToAdd(e.target.value)}
                    />
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setCoinModalUser(null)}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
                      Save Balance
                    </button>
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
