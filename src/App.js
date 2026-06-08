import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, CreditCard, BarChart3,
  Settings, Building2, ChevronRight, Briefcase
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import TaxSettings from './pages/TaxSettings';
import Departments from './pages/Departments';

import './App.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/payroll', icon: CreditCard, label: 'Payroll' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/departments', icon: Building2, label: 'Departments' },
  { to: '/tax-settings', icon: Settings, label: 'Tax Settings' },
];

function Sidebar() {
  const location = useLocation();
  const current = navItems.find(n => n.to === location.pathname)?.label || 'Dashboard';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon"><Briefcase size={22} /></div>
        <div>
          <div className="brand-name">PayrollPro</div>
          <div className="brand-sub">Management System</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={14} className="nav-arrow" />
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">InfinityFree Hosted</div>
        <div className="sidebar-footer-sub">bhaveshrajput.ifree.page</div>
      </div>
    </aside>
  );
}

function Layout({ children }) {
  const location = useLocation();
  const current = navItems.find(n => {
    if (n.to === '/') return location.pathname === '/';
    return location.pathname.startsWith(n.to);
  })?.label || 'Dashboard';

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">{current}</h1>
          <div className="page-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { background: '#1e293b', color: '#f1f5f9', borderRadius: '10px' }
      }} />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/tax-settings" element={<TaxSettings />} />
        </Routes>
      </Layout>
    </Router>
  );
}
