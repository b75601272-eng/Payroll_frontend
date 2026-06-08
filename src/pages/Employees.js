import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { employeeAPI, departmentAPI } from '../utils/api';
import { Plus, Search, Edit, Trash2, X, User } from 'lucide-react';

const EMPTY_FORM = {
  employee_id: '', name: '', email: '', phone: '',
  department_id: '', designation: '', base_salary: '',
  hra_percent: 40, da_percent: 20, ta_fixed: 1600, ma_fixed: 1250,
  joining_date: '', bank_account: '', bank_name: '', pan_number: ''
};

function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?';
}

function EmployeeModal({ emp, departments, onClose, onSaved }) {
  const [form, setForm] = useState(emp ? { ...emp, department_id: emp.department_id || '' } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.employee_id || !form.name || !form.email || !form.base_salary || !form.joining_date) {
      toast.error('Fill required fields: ID, Name, Email, Salary, Joining Date');
      return;
    }
    setSaving(true);
    try {
      if (emp) {
        await employeeAPI.update(emp.id, form);
        toast.success('Employee updated!');
      } else {
        await employeeAPI.create(form);
        toast.success('Employee created!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">{emp ? 'Edit Employee' : 'Add New Employee'}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={14}/></button>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Employee ID *</label>
            <input name="employee_id" value={form.employee_id} onChange={change} placeholder="EMP001" disabled={!!emp}/>
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input name="name" value={form.name} onChange={change} placeholder="John Doe"/>
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input name="email" value={form.email} onChange={change} placeholder="john@company.com" type="email"/>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={change} placeholder="9876543210"/>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select name="department_id" value={form.department_id} onChange={change}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Designation</label>
            <input name="designation" value={form.designation} onChange={change} placeholder="Software Engineer"/>
          </div>
          <div className="form-group">
            <label>Base Salary (₹) *</label>
            <input name="base_salary" value={form.base_salary} onChange={change} type="number" placeholder="50000"/>
          </div>
          <div className="form-group">
            <label>Joining Date *</label>
            <input name="joining_date" value={form.joining_date} onChange={change} type="date"/>
          </div>
        </div>

        <div style={{marginTop:16,padding:'14px',background:'rgba(99,102,241,0.05)',borderRadius:10,border:'1px solid rgba(99,102,241,0.15)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'#94a3b8',marginBottom:12}}>ALLOWANCE SETTINGS</div>
          <div className="form-grid">
            <div className="form-group">
              <label>HRA % of Basic</label>
              <input name="hra_percent" value={form.hra_percent} onChange={change} type="number" placeholder="40"/>
            </div>
            <div className="form-group">
              <label>DA % of Basic</label>
              <input name="da_percent" value={form.da_percent} onChange={change} type="number" placeholder="20"/>
            </div>
            <div className="form-group">
              <label>Travel Allowance (₹)</label>
              <input name="ta_fixed" value={form.ta_fixed} onChange={change} type="number" placeholder="1600"/>
            </div>
            <div className="form-group">
              <label>Medical Allowance (₹)</label>
              <input name="ma_fixed" value={form.ma_fixed} onChange={change} type="number" placeholder="1250"/>
            </div>
          </div>
        </div>

        <div className="form-grid mt-16">
          <div className="form-group">
            <label>Bank Account Number</label>
            <input name="bank_account" value={form.bank_account} onChange={change} placeholder="Account number"/>
          </div>
          <div className="form-group">
            <label>Bank Name</label>
            <input name="bank_name" value={form.bank_name} onChange={change} placeholder="State Bank of India"/>
          </div>
          <div className="form-group">
            <label>PAN Number</label>
            <input name="pan_number" value={form.pan_number} onChange={change} placeholder="ABCDE1234F"/>
          </div>
          {emp && (
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={change}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : emp ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [modal, setModal] = useState(null); // null | 'add' | employee obj

  const fetchAll = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (deptFilter) params.department_id = deptFilter;
    if (statusFilter) params.status = statusFilter;
    employeeAPI.getAll(params)
      .then(res => setEmployees(res.data || []))
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    departmentAPI.getAll().then(res => setDepartments(res.data || []));
  }, []);

  useEffect(() => { fetchAll(); }, [search, deptFilter, statusFilter]);

  const deleteEmp = async (emp) => {
    if (!window.confirm(`Delete ${emp.name}? This will also delete their payroll records.`)) return;
    try {
      await employeeAPI.delete(emp.id);
      toast.success('Employee deleted');
      fetchAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input placeholder="Search by name, ID, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{width:'180px'}}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{width:'130px'}}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={15}/>Add Employee
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner"/><span>Loading employees...</span></div>
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <User size={40} />
            <p>No employees found. Add your first employee!</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Base Salary</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="flex-gap">
                        <div className="avatar">{initials(emp.name)}</div>
                        <div>
                          <div style={{color:'var(--text)',fontWeight:600,fontSize:13}}>{emp.name}</div>
                          <div style={{fontSize:11,color:'var(--text3)'}}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="mono">{emp.employee_id}</span></td>
                    <td>{emp.department_name || '—'}</td>
                    <td>{emp.designation || '—'}</td>
                    <td><span className="mono">₹{Number(emp.base_salary).toLocaleString('en-IN')}</span></td>
                    <td>{emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      <span className={`badge badge-${emp.status==='active'?'green':emp.status==='inactive'?'yellow':'red'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(emp)}><Edit size={13}/></button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteEmp(emp)}><Trash2 size={13}/></button>
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
        <EmployeeModal
          emp={modal === 'add' ? null : modal}
          departments={departments}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchAll(); }}
        />
      )}
    </div>
  );
}
