import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../utils/api';
import { Users, CreditCard, Building2, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Google Charts integration
function loadGoogleCharts() {
  return new Promise((resolve) => {
    if (window.google && window.google.charts) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', { packages: ['corechart', 'bar'] });
      window.google.charts.setOnLoadCallback(resolve);
    };
    document.head.appendChild(script);
  });
}

function MonthlyChart({ monthly }) {
  const chartRef = React.useRef(null);

  useEffect(() => {
    if (!monthly?.length || !chartRef.current) return;
    loadGoogleCharts().then(() => {
      const data = new window.google.visualization.DataTable();
      data.addColumn('string', 'Month');
      data.addColumn('number', 'Gross Salary');
      data.addColumn('number', 'Net Salary');
      data.addColumn('number', 'Deductions');

      const rows = monthly.map(m => [
        MONTHS[m.month - 1],
        parseFloat(m.total_gross),
        parseFloat(m.total_net),
        parseFloat(m.total_deductions)
      ]);
      data.addRows(rows);

      const options = {
        backgroundColor: 'transparent',
        colors: ['#6366f1', '#10b981', '#f59e0b'],
        legend: { position: 'bottom', textStyle: { color: '#94a3b8', fontSize: 12 } },
        hAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: '#334155' } },
        vAxis: {
          textStyle: { color: '#94a3b8' },
          gridlines: { color: '#334155' },
          format: '₹#,###'
        },
        chartArea: { left: 70, top: 20, right: 20, bottom: 60, width: '100%', height: '80%' },
        curveType: 'function',
        lineWidth: 3,
        pointSize: 5,
        tooltip: { textStyle: { color: '#1e293b' } }
      };

      const chart = new window.google.visualization.LineChart(chartRef.current);
      chart.draw(data, options);
    });
  }, [monthly]);

  if (!monthly?.length) return <div className="empty-state"><p>No payroll data for this year</p></div>;
  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />;
}

function DeptChart({ deptSummary }) {
  const chartRef = React.useRef(null);

  useEffect(() => {
    if (!deptSummary?.length || !chartRef.current) return;
    loadGoogleCharts().then(() => {
      const data = new window.google.visualization.DataTable();
      data.addColumn('string', 'Department');
      data.addColumn('number', 'Total Net Salary');

      deptSummary.forEach(d => {
        data.addRow([d.department || 'N/A', parseFloat(d.total_net)]);
      });

      const options = {
        backgroundColor: 'transparent',
        colors: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
        legend: { position: 'bottom', textStyle: { color: '#94a3b8', fontSize: 12 } },
        pieHole: 0.45,
        chartArea: { left: 20, top: 20, right: 20, bottom: 60, width: '100%', height: '80%' },
        tooltip: { textStyle: { color: '#1e293b' } }
      };

      const chart = new window.google.visualization.PieChart(chartRef.current);
      chart.draw(data, options);
    });
  }, [deptSummary]);

  if (!deptSummary?.length) return <div className="empty-state"><p>No department data yet</p></div>;
  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/><span>Loading dashboard...</span></div>;

  const emp = data?.employees || {};
  const month = data?.currentMonthPayroll || {};
  const recent = data?.recentPayroll || [];
  const monthName = MONTHS[(data?.currentMonth || 1) - 1];

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(99,102,241,0.15)'}}>
            <Users size={20} color="#6366f1" />
          </div>
          <div>
            <div className="stat-value">{emp.total || 0}</div>
            <div className="stat-label">Total Employees</div>
            <div className="stat-sub">{emp.active || 0} active · {emp.inactive || 0} inactive</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(16,185,129,0.15)'}}>
            <CreditCard size={20} color="#10b981" />
          </div>
          <div>
            <div className="stat-value">₹{Number(month.total_net || 0).toLocaleString('en-IN')}</div>
            <div className="stat-label">{monthName} Net Payout</div>
            <div className="stat-sub">{month.processed || 0} records generated</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(245,158,11,0.15)'}}>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div>
            <div className="stat-value">{month.pending || 0}</div>
            <div className="stat-label">Pending Payments</div>
            <div className="stat-sub">{monthName} {data?.currentYear}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(59,130,246,0.15)'}}>
            <Building2 size={20} color="#3b82f6" />
          </div>
          <div>
            <div className="stat-value">{data?.departments || 0}</div>
            <div className="stat-label">Departments</div>
            <div className="stat-sub">Active departments</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title"><TrendingUp size={16} color="#6366f1" />Monthly Payroll Trend ({data?.currentYear})</div>
          <MonthlyChart monthly={data?.monthly} />
        </div>
        <div className="card">
          <div className="card-title"><Building2 size={16} color="#10b981" />Payroll by Department</div>
          <DeptChart deptSummary={data?.deptSummary} />
        </div>
      </div>

      {/* Recent Payroll */}
      <div className="card mt-24">
        <div className="card-title"><CheckCircle size={16} color="#f59e0b" />Recent Payroll Activity</div>
        {recent.length === 0 ? (
          <div className="empty-state"><p>No payroll records yet. Generate payroll to see activity.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Period</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td><span className="mono">{r.emp_code}</span></td>
                    <td>{MONTHS[r.month-1]} {r.year}</td>
                    <td><span className="mono">₹{Number(r.net_salary).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></td>
                    <td>
                      <span className={`badge badge-${r.payment_status==='paid'?'green':r.payment_status==='pending'?'yellow':'red'}`}>
                        {r.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
