import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { taxAPI } from '../utils/api';
import { Plus, Edit, Trash2, Settings, Info } from 'lucide-react';

const TAX_TYPES = ['PT', 'SS', 'IT', 'OTHER'];
const EMPTY = { name: '', tax_type: 'PT', rate: '', min_salary: 0, max_salary: '', is_active: 1 };

function TaxModal({ tax, onClose, onSaved }) {
  const [form, setForm] = useState(tax ? { ...tax, max_salary: tax.max_salary || '' } : EMPTY);
  const [saving, setSaving] = useState(false);
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.tax_type || form.rate === '') { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try {
      const payload = { ...form, max_salary: form.max_salary === '' ? null : form.max_salary };
      if (tax) { await taxAPI.update(tax.id, payload); toast.success('Tax setting updated'); }
      else { await taxAPI.create(payload); toast.success('Tax setting created'); }
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
          <h3 className="modal-title">{tax ? 'Edit Tax Setting' : 'Add Tax Setting'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          <div className="form-group full">
            <label>Name *</label>
            <input name="name" value={form.name} onChange={change} placeholder="e.g. Professional Tax"/>
          </div>
          <div className="form-group">
            <label>Tax Type *</label>
            <select name="tax_type" value={form.tax_type} onChange={change}>
              {TAX_TYPES.map(t => <option key={t} value={t}>{t === 'PT' ? 'Professional Tax' : t === 'SS' ? 'Social Security' : t === 'IT' ? 'Income Tax' : 'Other'}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Rate (%) *</label>
            <input name="rate" value={form.rate} onChange={change} type="number" step="0.01" placeholder="2.00"/>
          </div>
          <div className="form-group">
            <label>Min Salary (₹)</label>
            <input name="min_salary" value={form.min_salary} onChange={change} type="number" placeholder="0"/>
          </div>
          <div className="form-group">
            <label>Max Salary (₹) — blank = no limit</label>
            <input name="max_salary" value={form.max_salary} onChange={change} type="number" placeholder="Leave blank for no limit"/>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="is_active" value={form.is_active} onChange={change}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function TaxSettings() {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetch = () => {
    setLoading(true);
    taxAPI.getAll()
      .then(res => setTaxes(res.data || []))
      .catch(() => toast.error('Failed to load tax settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const del = async (t) => {
    if (!window.confirm(`Delete "${t.name}"?`)) return;
    try {
      await taxAPI.delete(t.id);
      toast.success('Tax setting deleted');
      fetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const typeLabel = { PT: 'Professional Tax', SS: 'Social Security', IT: 'Income Tax', OTHER: 'Other' };
  const typeColor = { PT: 'badge-yellow', SS: 'badge-blue', IT: 'badge-red', OTHER: 'badge-gray' };

  return (
    <div>
      <div style={{padding:'14px 20px',background:'rgba(59,130,246,0.05)',borderRadius:10,border:'1px solid rgba(59,130,246,0.15)',marginBottom:20,display:'flex',gap:10,alignItems:'flex-start'}}>
        <Info size={16} color="#3b82f6" style={{flexShrink:0,marginTop:2}}/>
        <div style={{fontSize:13,color:'var(--text2)'}}>
          Tax settings are used when generating payroll. PT & SS are calculated on gross salary. Income Tax (IT) is calculated on annual gross salary.
        </div>
      </div>

      <div className="toolbar">
        <div style={{flex:1}}/>
        <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={15}/>Add Tax Rule</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner"/><span>Loading...</span></div>
        ) : taxes.length === 0 ? (
          <div className="empty-state"><Settings size={40}/><p>No tax settings configured.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Rate</th>
                  <th>Min Salary</th>
                  <th>Max Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map(t => (
                  <tr key={t.id}>
                    <td style={{color:'var(--text)',fontWeight:600}}>{t.name}</td>
                    <td><span className={`badge ${typeColor[t.tax_type]||'badge-gray'}`}>{typeLabel[t.tax_type]||t.tax_type}</span></td>
                    <td><span className="mono">{t.rate}%</span></td>
                    <td><span className="mono">₹{Number(t.min_salary).toLocaleString('en-IN')}</span></td>
                    <td><span className="mono">{t.max_salary ? `₹${Number(t.max_salary).toLocaleString('en-IN')}` : 'No limit'}</span></td>
                    <td><span className={`badge ${t.is_active?'badge-green':'badge-gray'}`}>{t.is_active?'Active':'Inactive'}</span></td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(t)}><Edit size={13}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(t)}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <TaxModal
          tax={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetch(); }}
        />
      )}
    </div>
  );
}
