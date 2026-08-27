// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import Head from './Head';
import Menus from './Menus';
import Myfoot from './Myfoot';

const AdminLTELayout = ({ children, title, breadcrumb }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Menus />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-h-screen transition-all">
        <Head />
        <main className="flex-1">
          {/* Page header */}
          <div className="bg-white border-b border border-slate-200-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h1>
                <nav className="flex items-center gap-1 text-sm text-gray-500">
                  <Link to="/tableaudebord" className="hover:text-indigo-600">Dashboard</Link>
                  <span>/</span>
                  {breadcrumb?.map((item, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {item.link ? <Link to={item.link} className="hover:text-indigo-600">{item.label}</Link> : <span className="text-gray-800 font-medium">{item.label}</span>}
                      {i < breadcrumb.length - 1 && <span>/</span>}
                    </span>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
        <Myfoot />
      </div>
    </div>
  );
};

export default AdminLTELayout;
