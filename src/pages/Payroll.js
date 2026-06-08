import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { payrollAPI, employeeAPI } from '../utils/api';
import { Zap, Download, Check, Search, Filter } from 'lucide-react';

const MONTHS = [
  {v:1,l:'January'},{v:2,l:'February'},{v:3,l:'March'},{v:4,l:'April'},
  {v:5,l:'May'},{v:6,l:'June'},{v:7,l:'July'},{v:8,l:'August'},
  {v:9,l:'September'},{v:10,l:'October'},{v:11,l:'November'},{v:12,l:'December'}
];

function GenerateModal({ onClose, onDone }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await payrollAPI.generate({ month, year });
      setResult(res);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Generate Payroll</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        {!result ? (
          <>
            <div style={{padding:'16px',background:'rgba(99,102,241,0.05)',borderRadius:10,marginBottom:20,fontSize:13,color:'var(--text2)',border:'1px solid rgba(99,102,241,0.15)'}}>
              This will calculate salary, allowances, and tax deductions for all active employees for the selected month.
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Month</label>
                <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))}>
                  {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={generate} disabled={generating}>
                <Zap size={14}/>{generating ? 'Generating...' : 'Generate Payroll'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{padding:'20px',background:'rgba(16,185,129,0.05)',borderRadius:10,border:'1px solid rgba(16,185,129,0.2)'}}>
              <div style={{fontSize:15,fontWeight:700,color:'var(--green)',marginBottom:12}}>{result.message}</div>
              {result.generated?.length > 0 && (
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:12,color:'var(--text3)',marginBottom:6}}>PROCESSED:</div>
                  {result.generated.map((n,i) => (
                    <div key={i} style={{fontSize:13,color:'var(--text2)',display:'flex',gap:6,alignItems:'center'}}>
                      <Check size={13} color="var(--green)"/>{n}
                    </div>
                  ))}
                </div>
              )}
              {result.skipped?.length > 0 && (
                <div>
                  <div style={{fontSize:12,color:'var(--text3)',marginBottom:6}}>SKIPPED (already exists):</div>
                  {result.skipped.map((n,i) => (
                    <div key={i} style={{fontSize:13,color:'var(--text3)'}}>{n}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => { onDone(); onClose(); }}>View Payroll</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PayStatusModal({ record, onClose, onSaved }) {
  const [status, setStatus] = useState(record.payment_status);
  const [date, setDate] = useState(record.payment_date || new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await payrollAPI.updateStatus(record.id, { payment_status: status, payment_date: date });
      toast.success('Payment status updated');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Update Payment Status</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{marginBottom:16,padding:14,background:'var(--bg)',borderRadius:10}}>
          <div style={{fontSize:15,fontWeight:600,color:'var(--text)'}}>{record.employee_name}</div>
          <div style={{fontSize:13,color:'var(--text3)'}}>{MONTHS.find(m=>m.v===record.month)?.l} {record.year} · ₹{Number(record.net_salary).toLocaleString('en-IN',{minimumFractionDigits:2})}</div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Payment Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Update Status'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Payroll() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const now = new Date();
  const [filters, setFilters] = useState({
    month: now.getMonth() + 1, year: now.getFullYear(), status: ''
  });

  const fetchRecords = () => {
    setLoading(true);
    const params = {};
    if (filters.month) params.month = filters.month;
    if (filters.year) params.year = filters.year;
    if (filters.status) params.status = filters.status;
    payrollAPI.getAll(params)
      .then(res => setRecords(res.data || []))
      .catch(() => toast.error('Failed to load payroll'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRecords(); }, [filters]);

  const downloadSlip = (id) => {
    window.open(payrollAPI.getSlipUrl(id), '_blank');
  };

  const totalGross = records.reduce((s, r) => s + parseFloat(r.gross_salary || 0), 0);
  const totalNet = records.reduce((s, r) => s + parseFloat(r.net_salary || 0), 0);
  const totalDed = records.reduce((s, r) => s + parseFloat(r.total_deductions || 0), 0);

  return (
    <div>
      <div className="toolbar">
        <select value={filters.month} onChange={e => setFilters(f=>({...f,month:e.target.value}))} style={{width:140}}>
          <option value="">All Months</option>
          {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <select value={filters.year} onChange={e => setFilters(f=>({...f,year:e.target.value}))} style={{width:110}}>
          {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f=>({...f,status:e.target.value}))} style={{width:130}}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        <div style={{flex:1}}/>
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <Zap size={15}/>Generate Payroll
        </button>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{marginBottom:20}}>
        <div className="stat-card">
          <div style={{fontSize:12,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Total Records</div>
          <div style={{fontSize:24,fontWeight:700,fontFamily:'DM Mono'}}>{records.length}</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:12,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Total Gross</div>
          <div style={{fontSize:22,fontWeight:700,fontFamily:'DM Mono',color:'var(--accent2)'}}>₹{totalGross.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:12,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Total Deductions</div>
          <div style={{fontSize:22,fontWeight:700,fontFamily:'DM Mono',color:'var(--red)'}}>₹{totalDed.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:12,color:'var(--text3)',fontWeight:600,textTransform:'uppercase'}}>Total Net Payout</div>
          <div style={{fontSize:22,fontWeight:700,fontFamily:'DM Mono',color:'var(--green)'}}>₹{totalNet.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner"/><span>Loading payroll...</span></div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <Zap size={40}/>
            <p>No payroll records. Click "Generate Payroll" to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Dept</th>
                  <th>Period</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{color:'var(--text)',fontWeight:600,fontSize:13}}>{r.employee_name}</div>
                      <div style={{fontSize:11,color:'var(--text3)',fontFamily:'DM Mono'}}>{r.emp_code}</div>
                    </td>
                    <td>{r.department_name || '—'}</td>
                    <td>{MONTHS.find(m=>m.v===r.month)?.l} {r.year}</td>
                    <td><span className="mono">₹{Number(r.gross_salary).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></td>
                    <td><span className="mono" style={{color:'var(--red)'}}>₹{Number(r.total_deductions).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></td>
                    <td><span className="mono" style={{color:'var(--green)',fontWeight:700}}>₹{Number(r.net_salary).toLocaleString('en-IN',{minimumFractionDigits:2})}</span></td>
                    <td>
                      <button
                        className={`badge badge-${r.payment_status==='paid'?'green':r.payment_status==='pending'?'yellow':'red'}`}
                        style={{cursor:'pointer',border:'none',background:'none'}}
                        onClick={() => setStatusModal(r)}
                      >
                        {r.payment_status}
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => downloadSlip(r.id)} title="Download PDF Slip">
                        <Download size={13}/>Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onDone={fetchRecords}
        />
      )}
      {statusModal && (
        <PayStatusModal
          record={statusModal}
          onClose={() => setStatusModal(null)}
          onSaved={() => { setStatusModal(null); fetchRecords(); }}
        />
      )}
    </div>
  );
}
