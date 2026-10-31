'use client';

import React, { useEffect, useState, Suspense } from 'react';
import AdminLayout from '@/components/AdminLayout';
import CountryStateCitySelect from '@/components/CountryStateCitySelect';
import { useSearchParams, useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/image-helper';

function ViewUserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('id');

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [about, setAbout] = useState('');
  const [gender, setGender] = useState('1');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const fetchUser = () => {
    if (!userId) return;
    setLoading(true);
    fetch(`/fetchUserDetails?id=${userId}`, { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.status && res.data) {
          const u = res.data;
          setUser(u);
          setFullname(u.fullname || '');
          setUsername(u.username || '');
          setBio(u.bio || '');
          setAbout(u.about || '');
          setGender(String(u.gender || 1));
          setDob(u.dob || '');
          setCountry(u.country || '');
          setState(u.state || '');
          setCity(u.city || '');
          setPassword(u.password || '');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleBlockToggle = async () => {
    if (!user) return;
    const action = user.is_block === 1 ? '/unblockUser' : '/blockUser';
    await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });
    fetchUser();
  };

  const handleLiveToggle = async () => {
    if (!user) return;
    const action = user.can_go_live === 2 ? '/restrictLiveToUser' : '/allowLiveToUser';
    await fetch(action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });
    fetchUser();
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    if (confirm('Are you sure you want to delete this user?')) {
      await fetch('/deleteUserFromAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      router.push('/users');
    }
  };

  const handleRemoveImage = async (imgId: number) => {
    if (confirm('Delete this image?')) {
      await fetch(`/deleteUserImage?id=${imgId}`, { method: 'POST' });
      fetchUser();
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageFile || !user) return;
    const formData = new FormData();
    formData.append('user_id', String(user.id));
    formData.append('image', newImageFile);

    await fetch('/addUserImage', {
      method: 'POST',
      body: formData,
    });
    setShowAddImageModal(false);
    setNewImageFile(null);
    fetchUser();
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await fetch('/updateUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        fullname,
        username,
        bio,
        about,
        gender: parseInt(gender),
        dob,
        country,
        state,
        city,
        password,
      }),
    });
    alert('User updated successfully');
    fetchUser();
  };

  if (loading) {
    return (
      <AdminLayout title="View User">
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="View User">
        <div className="card">
          <div className="card-body text-center py-5">
            <h4>User not found</h4>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={user.fullname || 'View User'}>
      <div className="card">
        <div className="card-header d-flex align-items-center flex-wrap">
          <h4>
            {user.fullname}
            {user.can_go_live === 2 && (
              <span className="ml-2 badge bg-success text-white fw-normal px-3">Can Go Live</span>
            )}
            {user.is_fake === 1 ? (
              <span className="ml-2 badge bg-dark text-white fw-normal px-3">Fake User</span>
            ) : (
              <span className="ml-2 badge bg-success text-white fw-normal px-3">Real User</span>
            )}
            {user.gender === 1 ? (
              <span className="ml-2 badge bg-primary text-white fw-normal px-3">Male</span>
            ) : (
              <span className="ml-2 badge bg-primary text-white fw-normal px-3">Female</span>
            )}
          </h4>

          <div className="d-flex ml-auto flex-wrap gap-2">
            <button
              onClick={handleBlockToggle}
              className={`btn btn-sm ${user.is_block === 1 ? 'btn-success' : 'btn-danger'} mr-2`}
            >
              {user.is_block === 1 ? 'Unblock' : 'Block'}
            </button>
            <button
              onClick={handleLiveToggle}
              className={`btn btn-sm ${user.can_go_live === 2 ? 'btn-danger' : 'btn-success'} mr-2`}
            >
              {user.can_go_live === 2 ? 'Restrict Live' : 'Allow Live'}
            </button>
            <button onClick={handleDeleteUser} className="btn btn-sm btn-danger">
              <i className="fas fa-trash mr-1"></i> Delete User
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="form-row d-flex flex-wrap mb-3">
            {user.images && user.images.length > 0 ? (
              user.images.map((img: any) => {
                const src = getImageUrl(img.image);
                return (
                  <div key={img.id} className="position-relative mr-3 mb-2">
                    <img
                      src={src}
                      alt=""
                      width={130}
                      height={130}
                      className="rounded"
                      style={{ objectFit: 'cover' }}
                      onError={(e: any) => {
                        e.currentTarget.src = '/asset/img/user.png';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="btn btn-sm btn-danger position-absolute"
                      style={{ top: '5px', right: '5px', borderRadius: '50%', padding: '2px 6px' }}
                    >
                      &times;
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-muted">No images uploaded.</p>
            )}
          </div>

          <div>
            <button onClick={() => setShowAddImageModal(true)} className="btn btn-primary">
              Add Image
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="bg-light border d-flex align-items-center justify-content-around rounded-pill overflow-hidden py-2 mb-3">
                <div className="text-center w-50 border-right">
                  <label className="m-0 font-weight-bold">Following:</label> {user.following || 0}
                </div>
                <div className="text-center w-50">
                  <label className="m-0 font-weight-bold">Followers:</label> {user.followers || 0}
                </div>
              </div>
              <div className="text-center py-3 border rounded">
                <h6 className="text-muted mb-1">Coin Wallet</h6>
                <h3 className="text-primary font-weight-bold mb-0">{user.wallet || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4>Profile Details</h4>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdateUser} id="userUpdate" autoComplete="off">
                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Full Name</label>
                    <input
                      className="form-control"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Username</label>
                    <input
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group col-md-6">
                    <label>Date Of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                  <div className="form-group col-md-6">
                    <label>Gender</label>
                    <select
                      className="form-control"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="1">Male</option>
                      <option value="2">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <CountryStateCitySelect
                    country={country}
                    setCountry={setCountry}
                    state={state}
                    setState={setState}
                    city={city}
                    setCity={setCity}
                    colSize="col-md-4 col-sm-12"
                    required={false}
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <input
                    className="form-control"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>About</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="form-group mb-0">
                  <input type="submit" className="btn btn-primary" value="Save Changes" />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Add Image Modal */}
      {showAddImageModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add User Image</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowAddImageModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleAddImage}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Select Image</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      required
                      onChange={(e) => setNewImageFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddImageModal(false)}
                  >
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Upload
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

export default function ViewUserPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout title="View User">
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <ViewUserContent />
    </Suspense>
  );
}

