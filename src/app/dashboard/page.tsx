'use client';

import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    liveStreamUsers: 0,
    blockedUsers: 0,
    liveApplications: 0,
    pendingRedeems: 0,
    completedRedeems: 0,
    diamondPacks: 0,
    gifts: 0,
    verifyRequests: 0,
    interests: 0,
    reports: 0,
    totalDiamondCollected: 0,
    commissionPercentage: 10,
    platformEarnings: 0,
    totalPayoutsPaid: 0,
    coinRate: 5.0,
    currency: '₦',
  });

  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYear = String(currentDate.getFullYear());

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    fetch('/fetchDashboardStats', { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (res.status && res.data) {
          setStats((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const loadChartData = (selectedMonth: string, selectedYear: string) => {
    const formData = new FormData();
    formData.append('month', selectedMonth);
    formData.append('year', selectedYear);

    fetch('/fetchChartData', { method: 'POST', body: formData })
      .then((r) => r.json())
      .then((response) => {
        if (!response?.data || !Array.isArray(response.data)) return;

        const userCountData: any[] = [];
        const postCountData: any[] = [];

        response.data.forEach((item: any) => {
          userCountData.push({ x: item.date, y: item.usersCount });
          postCountData.push({ x: item.date, y: item.postsCount });
        });

        if (chartRef.current) {
          chartRef.current.updateSeries([
            { name: 'New Users', data: userCountData },
            { name: 'New Posts', data: postCountData },
          ]);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    let isMounted = true;

    const initChart = () => {
      if (!isMounted) return;
      const chartElement = document.querySelector('#chart-dashboard');
      if (chartElement && (window as any).ApexCharts && !chartRef.current) {
        chartElement.innerHTML = '';
        const chart = new (window as any).ApexCharts(chartElement, {
          chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            animations: { enabled: false },
          },
          stroke: {
            width: 3,
            curve: 'smooth',
          },
          colors: ['#000000', '#FE1B03'],
          dataLabels: {
            enabled: false,
          },
          series: [
            { name: 'New Users', data: [] },
            { name: 'New Posts', data: [] },
          ],
        });
        chart.render();
        chartRef.current = chart;
        loadChartData(month, year);
      }
    };

    if ((window as any).ApexCharts) {
      initChart();
    } else {
      let script = document.getElementById('apexcharts-cdn') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'apexcharts-cdn';
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts';
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener('load', initChart);
    }

    return () => {
      isMounted = false;
      if (chartRef.current) {
        try {
          chartRef.current.destroy();
        } catch (e) {}
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      loadChartData(month, year);
    }
  }, [month, year]);

  return (
    <AdminLayout title="Dashboard">
      <style jsx global>{`
        .chartjs-render-monitor {
          -webkit-animation: chartjs-render-animation 0.001s;
          animation: chartjs-render-animation 0.001s;
        }
        *,
        ::after,
        ::before {
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
        }
        .mainbg {
          background-image: linear-gradient(#FF6F43, #FE1B03) !important;
        }
        .card-icon2 {
          width: 50px;
          height: 50px;
          line-height: 50px;
          font-size: 22px;
          margin: 5px 0px;
          box-shadow: 2px 2px 10px 0 #97979794;
          border-radius: 10px;
          background: #ff5622;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .maincolor {
          color: white !important;
        }
      `}</style>

      {/* Dashboard Top QwikConnect Brand Bar */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom flex-wrap gap-2">
        <div className="d-flex align-items-center">
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF6F43 0%, #FE1B03 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(254, 27, 3, 0.25)',
              marginRight: '14px',
            }}
          >
            Q
          </div>
          <div>
            <h3 className="mb-0 font-weight-bold" style={{ letterSpacing: '-0.5px' }}>
              <span
                style={{
                  background: 'linear-gradient(135deg, #FF6F43 0%, #FE1B03 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                }}
              >
                Qwik
              </span>
              <span style={{ color: '#111827', fontWeight: 800 }}>Connect</span>
              <span className="ms-2 badge bg-light text-dark font-12 font-weight-normal border">
                Admin Console
              </span>
            </h3>
            <small className="text-muted">Platform Overview &amp; Live Real-time Analytics</small>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header border-bottom d-flex align-items-center">
              <h4 className="header-title me-auto mb-0">Analytics</h4>
              <div className="d-flex align-content-around w-auto ms-auto">
                <select
                  className="picker me-1 form-control px-1"
                  name="month"
                  id="months"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={{ width: '130px' }}
                >
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <select
                  className="picker form-control px-1"
                  name="year"
                  id="years"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={{ width: '100px' }}
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <div id="chart-dashboard" className="apex-charts" style={{ minHeight: '350px', height: '350px' }} data-colors="#B754F9,#0acf97"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Financial & Diamond Metrics */}
      <div className="row">
        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-gem maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Total Diamonds Collected</h5>
                      <h3 className="mb-1 text-primary">{stats.totalDiamondCollected.toLocaleString()}</h3>
                      <small className="text-muted">From all streams &amp; gifts</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-hand-holding-usd maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Platform Earnings ({stats.commissionPercentage}%)</h5>
                      <h3 className="mb-1 text-success">{stats.currency}{stats.platformEarnings.toLocaleString()}</h3>
                      <small className="text-muted">Net stream &amp; gift commission</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-money-check-alt maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Completed Payouts</h5>
                      <h3 className="mb-1 text-warning">{stats.currency}{stats.totalPayoutsPaid.toLocaleString()}</h3>
                      <small className="text-muted">{stats.completedRedeems} redeems fulfilled</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-coins maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Diamond Coin Rate</h5>
                      <h3 className="mb-1">{stats.currency}{stats.coinRate}</h3>
                      <small className="text-muted">Per 1 diamond redeemed</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-user maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">All Users</h5>
                      <h3 className="mb-3 ">{stats.totalUsers}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-user maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Total Posts</h5>
                      <h3 className="mb-3 ">{stats.totalPosts}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-camera-retro maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Livestream Enabled Users</h5>
                      <h3 className="mb-3 ">{stats.liveStreamUsers}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-ban maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Blocked Users</h5>
                      <h3 className="mb-3 ">{stats.blockedUsers}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-camera-retro maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Live Applications</h5>
                      <h3 className="mb-3 ">{stats.liveApplications}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-user maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Pending Redeems</h5>
                      <h3 className="mb-3 ">{stats.pendingRedeems}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-camera-retro maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Completed Redeems</h5>
                      <h3 className="mb-3 ">{stats.completedRedeems}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-ban maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Diamond Packs</h5>
                      <h3 className="mb-3 ">{stats.diamondPacks}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-camera-retro maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Gifts</h5>
                      <h3 className="mb-3 ">{stats.gifts}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-user maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Verification Requests</h5>
                      <h3 className="mb-3 ">{stats.verifyRequests}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-ban maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Interests</h5>
                      <h3 className="mb-3 ">{stats.interests}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-lg-3 col-md-3 col-sm-12 col-xs-12">
          <div className="card">
            <div className="card-statistic-4">
              <div className="align-items-center justify-content-between">
                <div className="row ">
                  <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 pr-0 ">
                    <div className="card-icon2 mainbg">
                      <i className="fas fa-camera-retro maincolor"></i>
                    </div>
                    <div className="card-content">
                      <h5 className="font-15 mt-3">Reports</h5>
                      <h3 className="mb-3 ">{stats.reports}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
