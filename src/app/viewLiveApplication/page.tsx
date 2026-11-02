'use client';

import React, { useEffect, useState, Suspense } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useSearchParams, useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/image-helper';
import UserAvatar from '@/components/UserAvatar';

function ViewLiveApplicationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appId = searchParams.get('id');

  const [application, setApplication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const fetchDetails = () => {
    if (!appId) return;
    setLoading(true);
    fetch(`/fetchLiveApplicationDetails?id=${appId}`, { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.status && res.data) {
          setApplication(res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [appId]);

  const handleApprove = async () => {
    if (!application) return;
    if (confirm('Approve live streaming application?')) {
      await fetch('/approveApplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id }),
      });
      alert('Application approved!');
      router.push('/liveapplication');
    }
  };

  const handleReject = async () => {
    if (!application) return;
    if (confirm('Reject and delete application?')) {
      await fetch('/deleteLiveApplication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id }),
      });
      alert('Application rejected!');
      router.push('/liveapplication');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Live Application">
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!application) {
    return (
      <AdminLayout title="Live Application">
        <div className="card">
          <div className="card-body text-center py-5">
            <h4>Application not found</h4>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const user = application.user || {};
  const socialLinks = (application.social_links || '')
    .replace(/"/g, '')
    .split(',')
    .filter((l: string) => l.trim().length > 0);

  return (
    <AdminLayout title="Live Application">
      <div className="card">
        <div className="card-header d-flex align-items-center">
          <h4>
            {user.fullname || 'Live Streamer'}
            <span className="badge bg-success text-white badge-shadow ml-2">
              {user.gender === 1 ? 'Male' : 'Female'}
            </span>
          </h4>
        </div>
        <div className="card-body">
          <div className="form-row mb-3 d-flex flex-wrap">
            {user.images && user.images.length > 0 ? (
              user.images.map((img: any) => {
                return (
                  <UserAvatar
                    key={img.id}
                    className="mr-2 mb-2"
                    src={img.image}
                    size={130}
                    rounded={false}
                  />
                );
              })
            ) : (
              <div className="mr-3 mb-2 text-center">
                <UserAvatar
                  src={null}
                  name={user.fullname || user.username}
                  size={120}
                  rounded={false}
                />
                <div className="small text-muted mt-1">Empty avatar placeholder</div>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary my-3 text-white"
            id="view_video"
            onClick={() => setShowVideoModal(true)}
          >
            Video Intro
          </button>

          <div className="form-row">
            <div className="form-group col-md-4">
              <label>Full Name</label>
              <input className="form-control" value={user.fullname || ''} readOnly />
            </div>
            <div className="form-group col-md-4">
              <label>Identity</label>
              <input className="form-control" value={user.identity || user.username || ''} readOnly />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group col-md-12">
              <label>Languages</label>
              <input className="form-control" value={application.languages || 'English'} readOnly />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group col-md-12">
              <label htmlFor="product_description">About</label>
              <textarea className="form-control" rows={3} value={application.about_you || ''} readOnly />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group col-md-12">
              <label>Social Links</label>
              {socialLinks.length > 0 ? (
                socialLinks.map((link: string, idx: number) => (
                  <input key={idx} className="form-control mt-2" value={link} readOnly />
                ))
              ) : (
                <input className="form-control mt-2" value="No social links provided" readOnly />
              )}
            </div>
          </div>

          <div className="mt-3">
            <button className="btn btn-success mr-2" id="btn_approve" onClick={handleApprove}>
              Approve Application
            </button>
            <button className="btn btn-danger" id="btn_reject" onClick={handleReject}>
              Reject Application
            </button>
          </div>
        </div>
      </div>

      {/* Video Intro Modal */}
      {showVideoModal && (
        <div
          className="modal fade show d-block"
          id="video_modal"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Video Intro</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowVideoModal(false)}
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body text-center">
                <video
                  width="100%"
                  height="360"
                  controls
                  src={application.intro_video || 'https://www.w3schools.com/html/mov_bbb.mp4'}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function ViewLiveApplicationPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout title="Live Application">
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          </div>
        </AdminLayout>
      }
    >
      <ViewLiveApplicationContent />
    </Suspense>
  );
}

