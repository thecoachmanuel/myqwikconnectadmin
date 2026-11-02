'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import CountryStateCitySelect from '@/components/CountryStateCitySelect';
import { useRouter } from 'next/navigation';

export default function AddFakeUserPage() {
  const router = useRouter();
  const [fullname, setFullname] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [state, setState] = useState('Lagos');
  const [city, setCity] = useState('Ikeja');
  const [dob, setDob] = useState('2000-06-15');
  const [bio, setBio] = useState('Living life to the fullest.');
  const [about, setAbout] = useState('Passionate explorer and connector.');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('123456');
  const [gender, setGender] = useState('1');
  const [isFake, setIsFake] = useState('0');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('fullname', fullname);
    formData.append('country', country);
    formData.append('state', state);
    formData.append('city', city);
    formData.append('dob', dob);
    formData.append('bio', bio);
    formData.append('about', about);
    formData.append('identity', identity || `user_${Date.now()}@orange.com`);
    formData.append('username', `user_${Date.now()}`);
    formData.append('password', password);
    formData.append('gender', gender);
    formData.append('is_fake', isFake);

    selectedFiles.forEach((file) => {
      formData.append('image[]', file);
    });

    try {
      const res = await fetch('/addFakeUserFromAdmin', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status) {
        router.push('/users');
      } else {
        alert(data.message || 'Error creating user');
      }
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Add Fake User">
      <div className="card">
        <div className="card-header">
          <h4>Add Fake User</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="addFakeUser" id="addForm" autoComplete="off">
            {/* Image part */}
            <div id="photo_gallery2" className="w-100 mb-3 d-flex flex-wrap">
              {previews.map((src, index) => (
                <div key={index} className="position-relative mr-2 mb-2">
                  <img
                    src={src}
                    alt=""
                    width={130}
                    height={130}
                    className="rounded"
                    style={{ objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="btn btn-sm btn-danger position-absolute"
                    style={{ top: '5px', right: '5px', borderRadius: '50%', padding: '2px 6px' }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div id="imgInput" className="form-group">
              <label htmlFor="productimages" style={{ cursor: 'pointer' }}>
                <span className="btn btn-primary text-white">Add Image</span>
              </label>
              <input
                type="file"
                className="d-none"
                id="productimages"
                name="image"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </div>

            <div className="form-row mt-3">
              <div className="form-group col-md-3 col-sm-12">
                <label>Full Name</label>
                <input
                  id="fullname"
                  className="form-control"
                  name="fullname"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                />
              </div>
              <CountryStateCitySelect
                country={country}
                setCountry={setCountry}
                state={state}
                setState={setState}
                city={city}
                setCity={setCity}
                colSize="col-md-3 col-sm-12"
                required={true}
              />
            </div>

            <div className="form-row mt-3">
              <div className="form-group col-md-3 col-sm-12">
                <label>Date Of Birth</label>
                <input
                  type="date"
                  id="dob"
                  className="form-control"
                  name="dob"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>
              <div className="form-group col-md-3 col-sm-12">
                <label>Bio</label>
                <input
                  id="bio"
                  className="form-control"
                  name="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                />
              </div>
              <div className="form-group col-md-6 col-sm-12">
                <label>About</label>
                <input
                  id="about"
                  className="form-control"
                  name="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row mt-3">
              <div className="form-group col-md-4 col-sm-12">
                <label>Identity</label>
                <input
                  id="identity"
                  className="form-control"
                  name="identity"
                  value={identity}
                  placeholder="identity@domain.com"
                  onChange={(e) => setIdentity(e.target.value)}
                  required
                />
              </div>
              <div className="form-group col-md-4 col-sm-12">
                <label>Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group col-md-4 col-sm-12">
                <label>Gender</label>
                <select
                  id="gender"
                  className="form-control"
                  name="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                </select>
              </div>
              <div className="form-group col-md-4 col-sm-12">
                <label>Account Type</label>
                <select
                  id="is_fake"
                  className="form-control"
                  value={isFake}
                  onChange={(e) => setIsFake(e.target.value)}
                  required
                >
                  <option value="0">Real User (Can log in to App)</option>
                  <option value="1">Demo / Simulated User</option>
                </select>
              </div>
            </div>

            <div className="form-group mt-3">
              <input
                className="btn btn-primary mr-1"
                type="submit"
                value={loading ? 'Submitting...' : 'Submit'}
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
