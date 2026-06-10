import React from 'react';
import { useJsonStore } from '../store/useJsonStore';

export const Footer: React.FC = () => {
  const { setActivePage, activePage } = useJsonStore();

  return (
    <footer className="w-full py-6 px-6 border-t border-slate-900 light:border-slate-200 bg-slate-950/80 light:bg-slate-50/80 backdrop-blur-md text-slate-400 light:text-slate-650 flex flex-col md:flex-row items-center justify-between gap-4 text-xs select-none">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[8px] font-bold text-white shadow shadow-blue-500/20">
          {"{}"}
        </div>
        <span className="font-semibold text-slate-200 light:text-slate-800">
          JSON Viewer Online
        </span>
        <span className="text-slate-600 light:text-slate-400">|</span>
        <span>© {new Date().getFullYear()} All rights reserved.</span>
      </div>

      <nav className="flex items-center gap-6">
        <button
          onClick={() => setActivePage('about')}
          className={`hover:text-blue-400 light:hover:text-blue-600 transition-colors cursor-pointer focus:outline-none ${
            activePage === 'about' ? 'text-blue-400 light:text-blue-600 font-semibold' : ''
          }`}
        >
          About Us
        </button>
        <button
          onClick={() => setActivePage('contact')}
          className={`hover:text-blue-400 light:hover:text-blue-600 transition-colors cursor-pointer focus:outline-none ${
            activePage === 'contact' ? 'text-blue-400 light:text-blue-600 font-semibold' : ''
          }`}
        >
          Contact
        </button>
        <button
          onClick={() => setActivePage('terms')}
          className={`hover:text-blue-400 light:hover:text-blue-600 transition-colors cursor-pointer focus:outline-none ${
            activePage === 'terms' ? 'text-blue-400 light:text-blue-600 font-semibold' : ''
          }`}
        >
          Terms of Service
        </button>
        <button
          onClick={() => setActivePage('privacy')}
          className={`hover:text-blue-400 light:hover:text-blue-600 transition-colors cursor-pointer focus:outline-none ${
            activePage === 'privacy' ? 'text-blue-400 light:text-blue-600 font-semibold' : ''
          }`}
        >
          Privacy Policy
        </button>
      </nav>
    </footer>
  );
};

export default Footer;
