'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
  title = 'Orange',
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [appName, setAppName] = useState('Orange');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    const hasSession = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('admin_session=') && c.split('=')[1]?.trim() !== '');
    if (!hasSession) {
      router.push('/');
    }

    fetch('/api/getSettingData')
      .then((res) => res.json())
      .then((res) => {
        if (res.data?.appdata?.app_name) {
          setAppName(res.data.appdata.app_name);
          document.title = res.data.appdata.app_name;
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        document.body.classList.add('sidebar-gone');
        document.body.classList.remove('sidebar-mini');
        document.body.classList.remove('sidebar-show');
        setMobileSidebarOpen(false);
      } else {
        document.body.classList.remove('sidebar-gone', 'sidebar-show');
        setMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('sidebar-gone', 'sidebar-show', 'sidebar-mini');
    };
  }, []);

  useEffect(() => {
    // Close mobile sidebar and dropdown on navigation
    if (window.innerWidth <= 1024) {
      document.body.classList.remove('sidebar-show');
      document.body.classList.add('sidebar-gone');
      setMobileSidebarOpen(false);
    }
    setDropdownOpen(false);
  }, [pathname]);

  const toggleSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.innerWidth <= 1024) {
      if (document.body.classList.contains('sidebar-show')) {
        document.body.classList.remove('sidebar-show');
        document.body.classList.add('sidebar-gone');
        setMobileSidebarOpen(false);
      } else {
        document.body.classList.remove('sidebar-gone');
        document.body.classList.add('sidebar-show');
        setMobileSidebarOpen(true);
      }
    } else {
      document.body.classList.toggle('sidebar-mini');
    }
  };

  const closeMobileSidebar = () => {
    document.body.classList.remove('sidebar-show');
    document.body.classList.add('sidebar-gone');
    setMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST' });
    } catch {}
    document.cookie = 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
    router.push('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/index', altPath: '/dashboard', icon: 'fa-tachometer-alt pt-1' },
    { label: 'Users', path: '/users', altPath: ['/addFakeUser', '/viewuser'], icon: 'fa-users' },
    { label: 'Posts', path: '/posts', icon: 'fa-image' },
    { label: 'Stories', path: '/viewStories', icon: 'fa-compact-disc' },
    { divider: true },
    { label: 'Onboarding', path: '/onboarding', icon: 'fa-handshake' },
    { label: 'Interests', path: '/interest', icon: 'fa-heart' },
    { label: 'Relationship Goals', path: '/relationshipGoals', icon: 'fa-bullseye' },
    { label: 'Religions', path: '/religions', icon: 'fa-cross' },
    { label: 'Languages', path: '/languages', icon: 'fa-language' },
    { divider: true },
    { label: 'Live Applications', path: '/liveapplication', altPath: '/viewLiveApplication', icon: 'fa-rss' },
    { label: 'Live History', path: '/livehistory', icon: 'fa-life-ring' },
    { label: 'Redeem Requests', path: '/redeemrequests', icon: 'fa-university' },
    { label: 'Subscriptions', path: '/package', icon: 'fa-cube' },
    { label: 'Diamond Packs', path: '/diamondpacks', icon: 'fa-box' },
    { label: 'Gifts', path: '/gifts', icon: 'fa-gift' },
    { label: 'Verification', path: '/verificationrequests', icon: 'fa-check-circle' },
    { label: 'Report', path: '/report', icon: 'fa-question' },
    { label: 'Notifications', path: '/notifications', icon: 'fa-bell' },
    { label: 'Setting', path: '/setting', icon: 'fa-cog pt-1' },
    { header: 'Pages' },
    { label: 'Privacy Policy', path: '/viewPrivacy', icon: 'fa-info' },
    { label: 'Terms Of Use', path: '/viewTerms', icon: 'fa-info' },
  ];

  return (
    <div id="app">
      <div className="main-wrapper main-wrapper-1">
        <div className="navbar-bg"></div>
        <nav className="navbar navbar-expand-lg main-navbar sticky">
          <div className="form-inline mr-auto">
            <ul className="navbar-nav mr-3">
              <li>
                <a
                  href="#"
                  data-toggle="sidebar"
                  onClick={toggleSidebar}
                  className="nav-link nav-link-lg collapse-btn"
                >
                  <i className="fas fa-bars"></i>
                </a>
              </li>
            </ul>
          </div>
          <ul className="navbar-nav navbar-right">
            <li className={`dropdown ${dropdownOpen ? 'show' : ''}`}>
              <a
                href="#"
                data-toggle="dropdown"
                onClick={(e) => {
                  e.preventDefault();
                  setDropdownOpen(!dropdownOpen);
                }}
                className="nav-link dropdown-toggle nav-link-lg nav-link-user"
              >
                <span className="d-sm-none d-lg-inline-block btn btn-light"> Logout </span>
              </a>
              <div
                className={`dropdown-menu dropdown-menu-right pullDown ${dropdownOpen ? 'show' : ''}`}
                style={{ display: dropdownOpen ? 'block' : 'none' }}
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  className="dropdown-item has-icon text-danger"
                >
                  <i className="fas fa-sign-out-alt"></i> Logout
                </a>
              </div>
            </li>
          </ul>
        </nav>

        <div className="main-sidebar sidebar-style-2">
          <aside id="sidebar-wrapper">
            <div className="sidebar-brand">
              <Link href="/index">
                <span className="logo-name">{appName}</span>
              </Link>
            </div>
            <ul className="sidebar-menu">
              {navItems.map((item, idx) => {
                if (item.divider) {
                  return <hr key={`divider-${idx}`} />;
                }
                if (item.header) {
                  return (
                    <li key={`header-${idx}`} className="menu-header">
                      {item.header}
                    </li>
                  );
                }

                let isActive = pathname === item.path;
                if (!isActive && item.altPath) {
                  if (Array.isArray(item.altPath)) {
                    isActive = item.altPath.includes(pathname);
                  } else {
                    isActive = pathname === item.altPath;
                  }
                }

                return (
                  <li
                    key={item.path}
                    className={`sideBarli ${isActive ? 'activeLi' : ''}`}
                  >
                    <Link href={item.path!} className="nav-link">
                      <i className={`fas ${item.icon}`}></i>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>

        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={closeMobileSidebar}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 885,
            }}
          />
        )}

        {/* Main Content */}
        <div className="main-content">
          <section className="section">{children}</section>
        </div>
      </div>
    </div>
  );
}
