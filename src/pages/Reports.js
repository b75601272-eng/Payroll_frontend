import React, { useState, useEffect, useRef } from 'react';
import { payrollAPI } from '../utils/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function loadGoogleCharts() {
  return new Promise((resolve) => {
    if (window.google && window.google.charts) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', { packages: ['corechart', 'bar', 'table'] });
      window.google.charts.setOnLoadCallback(resolve);
    };
    document.head.appendChild(script);
  });
}

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const barRef = useRef(null);
  const deptRef = useRef(null);
  const stackRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    payrollAPI.getReports({ year })
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => {
    if (!data || loading) return;
    loadGoogleCharts().then(() => {
      drawBarChart();
      drawDeptChart();
      drawStackedChart();
    });
  }, [data, loading]);

  function drawBarChart() {
    if (!barRef.current || !data?.monthly?.length) return;
    const table = new window.google.visualization.DataTable();
    table.addColumn('string', 'Month');
    table.addColumn('number', 'Net Salary');
    table.addColumn({type:'string', role:'style'});

    data.monthly.forEach(m => {
      table.addRow([MONTHS[m.month-1], parseFloat(m.total_net), 'color: #6366f1; stroke-color: #4f46e5; stroke-width: 1']);
    });

    new window.google.visualization.ColumnChart(barRef.current).draw(table, {
      backgroundColor: 'transparent',
      legend: { position: 'none' },
      hAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: 'transparent' } },
      vAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: '#334155' }, format: '₹#,###' },
      chartArea: { left: 70, top: 20, right: 20, bottom: 50, width: '100%', height: '75%' },
      tooltip: { textStyle: { color: '#1e293b' } },
      animation: { startup: true, duration: 800, easing: 'out' }
    });
  }

  function drawDeptChart() {
    if (!deptRef.current || !data?.deptSummary?.length) return;
    const table = new window.google.visualization.DataTable();
    table.addColumn('string', 'Department');
    table.addColumn('number', 'Employees');
    table.addColumn('number', 'Net Salary');

    data.deptSummary.forEach(d => {
      table.addRow([d.department || 'N/A', parseInt(d.employee_count), parseFloat(d.total_net)]);
    });

    new window.google.visualization.BarChart(deptRef.current).draw(table, {
      backgroundColor: 'transparent',
      colors: ['#10b981', '#6366f1'],
      legend: { position: 'bottom', textStyle: { color: '#94a3b8', fontSize: 12 } },
      hAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: '#334155' }, format: '#,###' },
      vAxis: { textStyle: { color: '#94a3b8' } },
      chartArea: { left: 100, top: 20, right: 20, bottom: 60, width: '100%', height: '75%' },
      tooltip: { textStyle: { color: '#1e293b' } }
    });
  }

  function drawStackedChart() {
    if (!stackRef.current || !data?.monthly?.length) return;
    const table = new window.google.visualization.DataTable();
    table.addColumn('string', 'Month');
    table.addColumn('number', 'PT');
    table.addColumn('number', 'SS');
    table.addColumn('number', 'Income Tax');

    // We only have total_deductions, so approximate split from actual records
    data.monthly.forEach(m => {
      const gross = parseFloat(m.total_gross);
      const pt = gross * 0.02;
      const ss = gross * 0.0175;
      const it = parseFloat(m.total_deductions) - pt - ss;
      table.addRow([MONTHS[m.month-1], pt, ss, Math.max(it,0)]);
    });

    new window.google.visualization.ColumnChart(stackRef.current).draw(table, {
      backgroundColor: 'transparent',
      colors: ['#f59e0b', '#3b82f6', '#ef4444'],
      isStacked: true,
      legend: { position: 'bottom', textStyle: { color: '#94a3b8', fontSize: 12 } },
      hAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: 'transparent' } },
      vAxis: { textStyle: { color: '#94a3b8' }, gridlines: { color: '#334155' }, format: '₹#,###' },
      chartArea: { left: 70, top: 20, right: 20, bottom: 60, width: '100%', height: '75%' },
      animation: { startup: true, duration: 800 }
    });
  }

  const totals = data?.totals || {};
  const years = [2023, 2024, 2025, 2026, 2027];

  return (
    <div>
      <div className="toolbar">
        <label style={{color:'var(--text3)',fontSize:13,fontWeight:600}}>Report Year:</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))} style={{width:120}}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Annual Summary */}
      <div className="stats-grid" style={{marginBottom:24}}>
        <div className="stat-card">
          <div className="stat-label">Employees Processed</div>
          <div className="stat-value">{totals.total_employees || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Annual Gross</div>
          <div className="stat-value" style={{fontSize:20,color:'var(--accent2)'}}>₹{Number(totals.annual_gross||0).toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Annual Deductions</div>
          <div className="stat-value" style={{fontSize:20,color:'var(--red)'}}>₹{Number(totals.annual_deductions||0).toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Annual Net Payout</div>
          <div className="stat-value" style={{fontSize:20,color:'var(--green)'}}>₹{Number(totals.annual_net||0).toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"/><span>Loading reports...</span></div>
      ) : (
        <>
          <div className="grid-2" style={{marginBottom:24}}>
            <div className="card">
              <div className="card-title">Monthly Net Salary Payout ({year})</div>
              {data?.monthly?.length ? (
                <div ref={barRef} style={{width:'100%',height:280}}/>
              ) : (
                <div className="empty-state"><p>No paid payroll data for {year}</p></div>
              )}
            </div>
            <div className="card">
              <div className="card-title">Department-wise Payroll</div>
              {data?.deptSummary?.length ? (
                <div ref={deptRef} style={{width:'100%',height:280}}/>
              ) : (
                <div className="empty-state"><p>No department data for {year}</p></div>
              )}
            </div>
          </div>

          <div className="card" style={{marginBottom:24}}>
            <div className="card-title">Monthly Tax Deduction Breakdown ({year})</div>
            {data?.monthly?.length ? (
              <div ref={stackRef} style={{width:'100%',height:300}}/>
            ) : (
              <div className="empty-state"><p>No tax data for {year}</p></div>
            )}
          </div>

          {/* Monthly table */}
          {data?.monthly?.length > 0 && (
            <div className="card">
              <div className="card-title">Monthly Payroll Summary Table</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Employees</th>
                      <th>Gross Salary</th>
                      <th>Deductions</th>
                      <th>Net Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly.map(m => (
                      <tr key={m.month}>
                        <td style={{fontWeight:600,color:'var(--text)'}}>{MONTHS[m.month-1]}</td>
                        <td>{m.employee_count}</td>
                        <td><span className="mono">₹{Number(m.total_gross).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></td>
                        <td><span className="mono" style={{color:'var(--red)'}}>₹{Number(m.total_deductions).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></td>
                        <td><span className="mono" style={{color:'var(--green)',fontWeight:700}}>₹{Number(m.total_net).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
