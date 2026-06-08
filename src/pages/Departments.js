import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { departmentAPI } from '../utils/api';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

export default function Departments() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | dept obj
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    setLoading(true);
    departmentAPI.getAll()
      .then(res => setDepts(res.data || []))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setName(''); setModal('add'); };
  const openEdit = (d) => { setName(d.name); setModal(d); };

  const save = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (modal === 'add') {
        await departmentAPI.create({ name });
        toast.success('Department created');
      } else {
        await departmentAPI.update(modal.id, { name });
        toast.success('Department updated');
      }
      setModal(null);
      fetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (d) => {
    if (!window.confirm(`Delete "${d.name}"? Employees in this department won't be deleted.`)) return;
    try {
      await departmentAPI.delete(d.id);
      toast.success('Department deleted');
      fetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <div style={{flex:1}}/>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15}/>Add Department</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner"/><span>Loading...</span></div>
        ) : depts.length === 0 ? (
          <div className="empty-state"><Building2 size={40}/><p>No departments yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Department Name</th><th>Active Employees</th><th>Actions</th></tr></thead>
              <tbody>
                {depts.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{color:'var(--text3)'}}>{i+1}</td>
                    <td style={{color:'var(--text)',fontWeight:600}}><div className="flex-gap"><Building2 size={15} color="var(--accent)"/>{d.name}</div></td>
                    <td><span className="badge badge-blue">{d.employee_count || 0} employees</span></td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}><Edit size={13}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(d)}><Trash2 size={13}/></button>
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{maxWidth:400}}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? 'Add Department' : 'Edit Department'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="form-group">
              <label>Department Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Engineering" autoFocus/>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
