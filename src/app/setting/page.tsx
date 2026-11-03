'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function SettingPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [appdata, setAppdata] = useState<any>({
    app_name: 'Orange',
    currency: '$',
    min_threshold: 5000,
    coin_rate: '0.006',
    min_user_live: 55,
    max_minute_live: 50,
    message_price: 5,
    reverse_swipe_price: 6,
    live_watching_price: 5,
    new_user_free_coins: 250,
    is_dating: 1,
    is_social_media: 1,
    include_fake_user_in_matching: 0,
    web_mobile_view: 1,
    stream_and_gift_commission: 10,
    post_description_limit: '500',
    post_upload_image_limit: '10',
    admob_banner: '',
    admob_int: '',
    admob_banner_ios: '',
    admob_int_ios: '',
    uri_scheme: 'orange',
    play_store_download_link: '',
    app_store_download_link: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingPaystack, setTestingPaystack] = useState(false);
  const [paystackTestResult, setPaystackTestResult] = useState<{ status: boolean; message: string } | null>(null);

  const handleTestPaystack = async () => {
    setTestingPaystack(true);
    setPaystackTestResult(null);
    try {
      const res = await fetch('/testPaystackKey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret_key: appdata.paystack_secret_key,
          paystack_sandbox_mode: appdata.paystack_sandbox_mode,
        }),
      });
      const data = await res.json();
      setPaystackTestResult(data);
    } catch (err: any) {
      setPaystackTestResult({ status: false, message: 'Could not connect: ' + err.message });
    } finally {
      setTestingPaystack(false);
    }
  };

  const handleEnableSandboxAndSave = async () => {
    const updated = { ...appdata, paystack_sandbox_mode: 1 };
    setAppdata(updated);
    setLoading(true);
    try {
      const res = await fetch('/api/updateSettingData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.status) {
        setPaystackTestResult({
          status: true,
          message: '✓ Paystack Sandbox / Demo Mode Active: App payments and VIP subscriptions will work in simulated mode without charging real cards.',
        });
      } else {
        alert(data.message || 'Error saving settings');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/getSettingData')
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.appdata) {
          setAppdata(data.data.appdata);
        }
      });
  }, []);

  const handleSaveAppdata = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/updateAppdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appdata),
      });
      const data = await res.json();
      if (data.status) {
        alert('Settings saved successfully!');
      } else {
        alert(data.message || 'Error saving settings');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/changePassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_password: userPassword, new_password: newPassword }),
    });
    const data = await res.json();
    if (data.status) {
      alert('Password updated successfully!');
      setUserPassword('');
      setNewPassword('');
    } else {
      alert(data.message || 'Failed to update password');
    }
  };

  return (
    <AdminLayout title="Setting">
      <div className="row">
        {/* Left Vertical Nav Tabs */}
        <div className="col-lg-2 mb-2 mb-sm-0">
          <div className="card">
            <div className="card-body p-2">
              <div className="nav flex-column nav-pills" id="v-pills-tab" role="tablist">
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'general' ? 'active' : ''}`}
                  onClick={() => setActiveTab('general')}
                  href="#"
                >
                  General Settings
                </a>
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'live' ? 'active' : ''}`}
                  onClick={() => setActiveTab('live')}
                  href="#"
                >
                  Live Streaming
                </a>
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'pricing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pricing')}
                  href="#"
                >
                  Pricing
                </a>
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'features' ? 'active' : ''}`}
                  onClick={() => setActiveTab('features')}
                  href="#"
                >
                  Feature Toggles
                </a>
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'commission' ? 'active' : ''}`}
                  onClick={() => setActiveTab('commission')}
                  href="#"
                >
                  Commission
                </a>
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'post' ? 'active' : ''}`}
                  onClick={() => setActiveTab('post')}
                  href="#"
                >
                  Post Setting
                </a>
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'admob' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admob')}
                  href="#"
                >
                  Admob
                </a>
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'deeplink' ? 'active' : ''}`}
                  onClick={() => setActiveTab('deeplink')}
                  href="#"
                >
                  Deep Linking
                </a>
                <a
                  className={`main-nav-link fw-normal nav-link pointer ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                  href="#"
                >
                  Change Password
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tab Content */}
        <div className="col-lg-10">
          <div className="tab-content" id="v-pills-tabContent">
            {/* General Settings */}
            {activeTab === 'general' && (
              <form onSubmit={handleSaveAppdata}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">General Settings</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-row">
                      <div className="form-group col-md-3 m-0">
                        <label>App Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="app_name"
                          value={appdata.app_name || ''}
                          onChange={(e) => setAppdata({ ...appdata, app_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group col-md-3 m-0">
                        <label>Currency</label>
                        <input
                          type="text"
                          className="form-control"
                          name="currency"
                          value={appdata.currency || '₦'}
                          onChange={(e) => setAppdata({ ...appdata, currency: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group col-md-3 m-0">
                        <label>Minimum Threshold</label>
                        <input
                          type="text"
                          className="form-control"
                          name="min_threshold"
                          value={appdata.min_threshold || ''}
                          onChange={(e) => setAppdata({ ...appdata, min_threshold: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group col-md-3 m-0">
                        <label>Coin Rate</label>
                        <input
                          type="number"
                          step="0.000001"
                          className="form-control"
                          name="coin_rate"
                          value={appdata.coin_rate || ''}
                          onChange={(e) => setAppdata({ ...appdata, coin_rate: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row mt-3">
                      <div className="col-12"><hr/><h6 className="text-primary font-weight-bold">Paystack Payment Gateway (Naira Real Payment)</h6></div>
                      <div className="form-group col-md-6">
                        <label>Paystack Public Key</label>
                        <input
                          type="text"
                          className="form-control"
                          name="paystack_public_key"
                          placeholder="pk_test_... or pk_live_..."
                          value={appdata.paystack_public_key || ''}
                          onChange={(e) => setAppdata({ ...appdata, paystack_public_key: e.target.value.trim() })}
                        />
                        <small className="form-text text-muted">Must start with <code>pk_live_</code> or <code>pk_test_</code></small>
                      </div>
                      <div className="form-group col-md-6">
                        <label>Paystack Secret Key</label>
                        <input
                          type="text"
                          className="form-control"
                          name="paystack_secret_key"
                          placeholder="sk_test_... or sk_live_..."
                          value={appdata.paystack_secret_key || ''}
                          onChange={(e) => setAppdata({ ...appdata, paystack_secret_key: e.target.value.trim() })}
                        />
                        <small className="form-text text-muted">Must start with <code>sk_live_</code> or <code>sk_test_</code> (Required for VIP subscriptions & Diamond purchases)</small>
                      </div>
                      <div className="col-12 mt-1 mb-2">
                        <div className="custom-control custom-switch">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id="paystackSandboxSwitch"
                            checked={appdata.paystack_sandbox_mode === 1 || appdata.paystack_sandbox_mode === true}
                            onChange={(e) => setAppdata({ ...appdata, paystack_sandbox_mode: e.target.checked ? 1 : 0 })}
                          />
                          <label className="custom-control-label font-weight-bold text-dark" htmlFor="paystackSandboxSwitch">
                            Paystack Sandbox / Demo Mode (Simulate payments instantly without real credentials)
                          </label>
                        </div>
                        <small className="form-text text-muted">
                          When enabled, VIP subscriptions and diamond purchases in the Orange app can be tested immediately in demo mode. Disable this switch when using your live Paystack credentials.
                        </small>
                      </div>
                      <div className="col-12 mt-2">
                        <button
                          type="button"
                          className="btn btn-outline-info btn-sm mr-2"
                          onClick={handleTestPaystack}
                          disabled={testingPaystack}
                        >
                          <i className={`fas ${testingPaystack ? 'fa-spinner fa-spin' : 'fa-check-circle'} mr-1`}></i>
                          {testingPaystack ? 'Testing with Paystack...' : 'Test Paystack Keys'}
                        </button>
                        {paystackTestResult && (
                          <div className="mt-2 d-flex flex-wrap align-items-center">
                            <span
                              className={`badge p-2 ${
                                paystackTestResult.status ? 'badge-success' : 'badge-danger'
                              }`}
                              style={{ whiteSpace: 'normal', textAlign: 'left', display: 'inline-block', maxWidth: '750px' }}
                            >
                              {paystackTestResult.message}
                            </span>
                            {!paystackTestResult.status && (
                              <button
                                type="button"
                                className="btn btn-warning btn-sm ml-2 mt-1 font-weight-bold shadow-sm"
                                onClick={handleEnableSandboxAndSave}
                                disabled={loading}
                              >
                                <i className="fas fa-magic mr-1"></i>
                                Enable Sandbox Mode & Save Now
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-row mt-3">
                      <div className="col-12"><hr/><h6 className="text-primary font-weight-bold">Google Maps API (Map Screen & Discovery)</h6></div>
                      <div className="form-group col-md-12">
                        <label>Google Maps API Key (Web, Android & iOS)</label>
                        <input
                          type="text"
                          className="form-control"
                          name="google_map_key"
                          placeholder="AIzaSy..."
                          value={appdata.google_map_key || ''}
                          onChange={(e) => setAppdata({ ...appdata, google_map_key: e.target.value.trim() })}
                        />
                        <small className="form-text text-muted">
                          Used to render Google Maps in the Orange app. Enable "Maps JavaScript API", "Maps SDK for Android", and "Maps SDK for iOS" in Google Cloud Console.
                        </small>
                      </div>
                    </div>

                    <div className="form-row mt-2">
                      <div className="col-12"><hr/><h6 className="text-primary font-weight-bold">Cloudinary Media Storage (Feed & Chat Media)</h6></div>
                      <div className="form-group col-md-4">
                        <label>Cloud Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="cloudinary_cloud_name"
                          placeholder="your-cloud-name"
                          value={appdata.cloudinary_cloud_name || ''}
                          onChange={(e) => setAppdata({ ...appdata, cloudinary_cloud_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label>API Key</label>
                        <input
                          type="text"
                          className="form-control"
                          name="cloudinary_api_key"
                          placeholder="Cloudinary API Key"
                          value={appdata.cloudinary_api_key || ''}
                          onChange={(e) => setAppdata({ ...appdata, cloudinary_api_key: e.target.value })}
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label>API Secret</label>
                        <input
                          type="password"
                          className="form-control"
                          name="cloudinary_api_secret"
                          placeholder="Cloudinary API Secret"
                          value={appdata.cloudinary_api_secret || ''}
                          onChange={(e) => setAppdata({ ...appdata, cloudinary_api_secret: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Live Streaming Settings */}
            {activeTab === 'live' && (
              <form onSubmit={handleSaveAppdata}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Live Streaming Settings</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-row">
                      <div className="form-group col-md-6 m-0">
                        <label>Minimum users needed</label>
                        <input
                          type="text"
                          className="form-control"
                          name="min_user_live"
                          value={appdata.min_user_live || ''}
                          onChange={(e) => setAppdata({ ...appdata, min_user_live: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group col-md-6 m-0">
                        <label>Maximum minutes for live</label>
                        <input
                          type="text"
                          className="form-control"
                          name="max_minute_live"
                          value={appdata.max_minute_live || ''}
                          onChange={(e) => setAppdata({ ...appdata, max_minute_live: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Pricing Settings */}
            {activeTab === 'pricing' && (
              <form onSubmit={handleSaveAppdata}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Pricing Settings</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-row">
                      <div className="form-group col-md-4">
                        <label>Message Price</label>
                        <input
                          type="number"
                          className="form-control"
                          name="message_price"
                          value={appdata.message_price || 0}
                          onChange={(e) =>
                            setAppdata({ ...appdata, message_price: parseInt(e.target.value) || 0 })
                          }
                          required
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label>Reverse Swipe Price</label>
                        <input
                          type="number"
                          className="form-control"
                          name="reverse_swipe_price"
                          value={appdata.reverse_swipe_price || 0}
                          onChange={(e) =>
                            setAppdata({
                              ...appdata,
                              reverse_swipe_price: parseInt(e.target.value) || 0,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label>Live Watching Price</label>
                        <input
                          type="number"
                          className="form-control"
                          name="live_watching_price"
                          value={appdata.live_watching_price || 0}
                          onChange={(e) =>
                            setAppdata({
                              ...appdata,
                              live_watching_price: parseInt(e.target.value) || 0,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group col-md-4">
                        <label>New User Free Coins</label>
                        <input
                          type="number"
                          className="form-control"
                          name="new_user_free_coins"
                          value={appdata.new_user_free_coins || 0}
                          onChange={(e) =>
                            setAppdata({
                              ...appdata,
                              new_user_free_coins: parseInt(e.target.value) || 0,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Feature Toggles */}
            {activeTab === 'features' && (
              <form onSubmit={handleSaveAppdata}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Feature Toggles</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-row">
                      <div className="form-group col-md-4 m-0">
                        <label className="d-block">Dating or livestream</label>
                        <label className="switch ml-1">
                          <input
                            type="checkbox"
                            name="is_dating"
                            checked={appdata.is_dating === 1}
                            onChange={(e) => {
                              const val = e.target.checked ? 1 : 0;
                              setAppdata({ ...appdata, is_dating: val });
                              fetch(`/changeFromDatingAppToLivestreamApp/${val}`).catch(() => {});
                            }}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                      <div className="form-group col-md-4 m-0">
                        <label className="d-block">Social Media</label>
                        <label className="switch ml-1">
                          <input
                            type="checkbox"
                            name="is_social_media"
                            checked={appdata.is_social_media === 1}
                            onChange={(e) => {
                              const val = e.target.checked ? 1 : 0;
                              setAppdata({ ...appdata, is_social_media: val });
                              fetch(`/changeFromSocialMedia/${val}`).catch(() => {});
                            }}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                      <div className="form-group col-md-4 m-0">
                        <label className="d-block">Include Fake User In Matching</label>
                        <label className="switch ml-1">
                          <input
                            type="checkbox"
                            name="include_fake_user_in_matching"
                            checked={appdata.include_fake_user_in_matching === 1}
                            onChange={(e) => {
                              const val = e.target.checked ? 1 : 0;
                              setAppdata({
                                ...appdata,
                                include_fake_user_in_matching: val,
                              });
                              fetch(`/includeFakeUserInMatching/${val}`).catch(() => {});
                            }}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                      <div className="form-group col-md-4 m-0">
                        <label className="d-block">Desktop Web Mobile Frame View</label>
                        <label className="switch ml-1">
                          <input
                            type="checkbox"
                            name="web_mobile_view"
                            checked={appdata.web_mobile_view !== 0}
                            onChange={(e) => {
                              const val = e.target.checked ? 1 : 0;
                              setAppdata({
                                ...appdata,
                                web_mobile_view: val,
                              });
                              fetch('/updateAppdata', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ web_mobile_view: val }),
                              }).catch(() => {});
                            }}
                          />
                          <span className="slider round"></span>
                        </label>
                        <small className="form-text text-muted d-block mt-1">
                          Show mobile app viewport on desktop browsers (PWA style). Toggle off to stretch across full desktop view.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Commission Settings */}
            {activeTab === 'commission' && (
              <form onSubmit={handleSaveAppdata}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Commission Settings</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-group">
                      <label className="m-0">Stream &amp; Gift Commission (%)</label>
                      <p className="small text-muted m-0">
                        The % of commission will be deducted from total collection while livestreaming by streamer, before crediting to their account.
                      </p>
                      <p className="small text-muted m-0">
                        Eg. If commission is 10%, then 10% of total collection will be deducted from streamer&apos;s account and remaining 90% will be credited to their account.
                      </p>
                      <input
                        type="number"
                        className="form-control w-auto mt-2"
                        name="stream_and_gift_commission"
                        value={appdata.stream_and_gift_commission || 10}
                        onChange={(e) =>
                          setAppdata({
                            ...appdata,
                            stream_and_gift_commission: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Post Settings */}
            {activeTab === 'post' && (
              <form onSubmit={handleSaveAppdata}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Post Settings</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-row">
                      <div className="form-group col-md-3">
                        <label>Post Description Limit</label>
                        <input
                          type="text"
                          className="form-control"
                          name="post_description_limit"
                          value={appdata.post_description_limit || '500'}
                          onChange={(e) =>
                            setAppdata({ ...appdata, post_description_limit: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group col-md-3">
                        <label>Post Upload Image Limit</label>
                        <input
                          type="text"
                          className="form-control"
                          name="post_upload_image_limit"
                          value={appdata.post_upload_image_limit || '10'}
                          onChange={(e) =>
                            setAppdata({ ...appdata, post_upload_image_limit: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Admob Settings */}
            {activeTab === 'admob' && (
              <form onSubmit={handleSaveAppdata}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Admob Ad Units</h5>
                  </div>
                  <div className="card-body">
                    <div className="form-row mb-3">
                      <div className="form-group col-md-6">
                        <label>Admob Banner Ad Unit : Android</label>
                        <input
                          type="text"
                          className="form-control"
                          name="admob_banner"
                          value={appdata.admob_banner || ''}
                          onChange={(e) => setAppdata({ ...appdata, admob_banner: e.target.value })}
                        />
                      </div>
                      <div className="form-group col-md-6">
                        <label>Admob Interstitial Ad Unit : Android</label>
                        <input
                          type="text"
                          className="form-control"
                          name="admob_int"
                          value={appdata.admob_int || ''}
                          onChange={(e) => setAppdata({ ...appdata, admob_int: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group col-md-6">
                        <label>Admob Banner Ad Unit : iOS</label>
                        <input
                          type="text"
                          className="form-control"
                          name="admob_banner_ios"
                          value={appdata.admob_banner_ios || ''}
                          onChange={(e) => setAppdata({ ...appdata, admob_banner_ios: e.target.value })}
                        />
                      </div>
                      <div className="form-group col-md-6">
                        <label>Admob Interstitial Ad Unit : iOS</label>
                        <input
                          type="text"
                          className="form-control"
                          name="admob_int_ios"
                          value={appdata.admob_int_ios || ''}
                          onChange={(e) => setAppdata({ ...appdata, admob_int_ios: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Deep Linking */}
            {activeTab === 'deeplink' && (
              <form onSubmit={handleSaveAppdata}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Deep Linking</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">URI Scheme</label>
                        <input
                          type="text"
                          className="form-control"
                          value={appdata.uri_scheme || 'orange'}
                          onChange={(e) => setAppdata({ ...appdata, uri_scheme: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Play Store Download Link</label>
                        <input
                          type="text"
                          className="form-control"
                          value={appdata.play_store_download_link || ''}
                          onChange={(e) =>
                            setAppdata({ ...appdata, play_store_download_link: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">App Store Download Link</label>
                        <input
                          type="text"
                          className="form-control"
                          value={appdata.app_store_download_link || ''}
                          onChange={(e) =>
                            setAppdata({ ...appdata, app_store_download_link: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Change Password */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword}>
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Change Password</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-lg-6 col-md-6 col-sm-12">
                        <div className="form-group mb-3">
                          <label className="form-label">Current Password</label>
                          <input
                            type="password"
                            className="form-control"
                            required
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-lg-6 col-md-6 col-sm-12">
                        <div className="form-group mb-3">
                          <label className="form-label">New Password</label>
                          <input
                            type="password"
                            className="form-control"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <button className="btn btn-primary" type="submit">
                    Change Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
