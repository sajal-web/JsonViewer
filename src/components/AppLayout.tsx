import { useEffect } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import { useJsonStore } from '../store/useJsonStore';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import SearchBar from './SearchBar';
import MonacoEditorPanel from './MonacoEditorPanel';
import JsonTreeView from './JsonTreeView';
import SplitPane from './SplitPane';
import ErrorConsole from './ErrorConsole';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import { DiffPage } from '../pages/DiffPage';


import ParticleOverlay from './ParticleOverlay';
import CursorTrail from './CursorTrail';

export const AppLayout: React.FC = () => {
  const {
    isParsing,
    splitRatio,
    setSplitRatio,
    toggleSidebar,
    rawInput,
    formatJson,
    activePage,
    setActivePage,
  } = useJsonStore();

  useEffect(() => {
    const handleHashOrSearch = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const pageParam = searchParams.get('page') || searchParams.get('tool');
      const hash = window.location.hash;
      const path = window.location.pathname;
      
      if (
        path === '/json-compare' ||
        pageParam === 'json-diff-checker' || 
        pageParam === 'diff' || 
        hash === '#json-diff-checker' || 
        hash === '#diff' || 
        hash === '#/diff'
      ) {
        setActivePage('diff');
      } else if (pageParam === 'about' || hash === '#about' || path === '/about') {
        setActivePage('about');
      } else if (pageParam === 'contact' || hash === '#contact' || path === '/contact') {
        setActivePage('contact');
      } else if (pageParam === 'terms' || hash === '#terms' || path === '/terms') {
        setActivePage('terms');
      } else if (pageParam === 'privacy' || hash === '#privacy' || path === '/privacy') {
        setActivePage('privacy');
      } else if (pageParam === 'editor' || hash === '#editor' || hash === '') {
        setActivePage('editor');
      }
    };

    handleHashOrSearch();
    window.addEventListener('popstate', handleHashOrSearch);
    window.addEventListener('hashchange', handleHashOrSearch);

    return () => {
      window.removeEventListener('popstate', handleHashOrSearch);
      window.removeEventListener('hashchange', handleHashOrSearch);
    };
  }, [setActivePage]);

  useEffect(() => {
    const path = window.location.pathname;
    if (activePage === 'editor') {
      if (path !== '/') {
        window.history.pushState(null, '', '/');
      }
    } else {
      const targetParam = activePage === 'diff' ? '/json-compare' : `/${activePage}`;
      if (path !== targetParam) {
        window.history.pushState(null, '', targetParam);
      }
    }
  }, [activePage]);

  useEffect(() => {
    let title = 'JSON Viewer Online - Format, Validate & Beautify JSON';
    let description = 'Free online JSON Viewer and Formatter. Beautify, validate, minify, inspect and validate JSON instantly.';

    if (activePage === 'diff') {
      title = 'JSON Diff Checker - Compare JSON Files Online | JSON Viewer';
      description = 'Compare two JSON files side-by-side online. Spot additions, modifications, and deletions instantly with code syntax highlighting and automated JSON path diff parsing.';
    } else if (activePage === 'about') {
      title = 'About Us - JSON Viewer';
      description = 'Learn more about JSON Viewer, a developer-friendly tool to format, validate, and convert JSON/YAML.';
    } else if (activePage === 'contact') {
      title = 'Contact Us - JSON Viewer';
      description = 'Get in touch with the JSON Viewer development team for feedback, bugs, or feature suggestions.';
    } else if (activePage === 'terms') {
      title = 'Terms of Service - JSON Viewer';
      description = 'Read the terms of service governing the usage of the online JSON Viewer application.';
    } else if (activePage === 'privacy') {
      title = 'Privacy Policy - JSON Viewer';
      description = 'Understand how JSON Viewer respects your privacy and ensures fully client-side secure parsing.';
    }

    document.title = title;

    const updateMetaTag = (selector: string, attrName: string, value: string) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (selector.startsWith('meta[name')) {
          meta.setAttribute('name', attrName);
        } else {
          meta.setAttribute('property', attrName);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', value);
    };

    updateMetaTag('meta[name="description"]', 'description', description);
    updateMetaTag('meta[property="og:title"]', 'og:title', title);
    updateMetaTag('meta[property="og:description"]', 'og:description', description);
    updateMetaTag('meta[name="twitter:title"]', 'twitter:title', title);
    updateMetaTag('meta[name="twitter:description"]', 'twitter:description', description);
  }, [activePage]);



  const triggerFileUploadClick = () => {
    const fileInput = document.getElementById('hidden-file-input') as HTMLInputElement;
    fileInput?.click();
  };

  const handleDownloadTrigger = () => {
    const downloadBtn = document.getElementById('download-btn') as HTMLButtonElement;
    downloadBtn?.click();
  };

  const triggerSearchFocus = () => {
    const searchInput = document.getElementById('search-input-field') as HTMLInputElement;
    searchInput?.focus();
    searchInput?.select();
  };

  // Bind system-wide developer keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleDownloadTrigger,
    onSearch: triggerSearchFocus,
    onFormat: formatJson,
    onUpload: triggerFileUploadClick,
  });

  const handleSplitRatioChange = (ratio: number) => {
    setSplitRatio(ratio);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'terms':
        return <TermsPage />;
      case 'privacy':
        return <PrivacyPage />;
      case 'diff':
        return <DiffPage />;
      default:
        return null;

    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 overflow-hidden relative">
      {/* Drawer Sidebar */}
      <Sidebar />

      {/* Main Top Header Branding */}
      <header className="h-12 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between flex-shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
            title="Open side panel dashboard"
            id="sidebar-toggle-btn"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo Brand */}
          <div
            onClick={() => setActivePage('editor')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-all">
              {"{}"}
            </div>
            <span className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              JSON Viewer
              <span className="text-[9px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                v1.0.1
              </span>
            </span>
          </div>
        </div>

        {/* Global Loading Parsing/Worker Indicator */}
        <div className="flex items-center gap-3">
          {isParsing && (
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Parsing large file...</span>
            </div>
          )}

          {/* Quick Stats Summary */}
          {!isParsing && rawInput.trim() && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">
                {rawInput.length} chars
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-800" />
              <span className="text-[10px] font-mono text-slate-500">
                {rawInput.split('\n').length} lines
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Primary Editor Workspace Container */}
      <main className="flex-1 w-full flex flex-col overflow-hidden relative">
        {activePage === 'editor' ? (
          <>
            {/* Row 2: Developer Tooling Actions */}
            <Toolbar />

            {/* Row 3: Live search bar */}
            <SearchBar />

            {/* Row 4: Resizable Splitted Editor/Tree Panel */}
            <div className="flex-1 w-full overflow-hidden flex">
              <SplitPane
                leftPanel={<MonacoEditorPanel />}
                rightPanel={<JsonTreeView />}
                ratio={splitRatio}
                onChange={handleSplitRatioChange}
              />
            </div>

            {/* Bottom Console Panel */}
            <ErrorConsole />
          </>
        ) : (
          renderPage()
        )}
      </main>
      
      {/* Satisfying developer particle Canvas overlay */}
      <ParticleOverlay />

      {/* Cursor trail animation */}
      <CursorTrail />
    </div>
  );
};

export default AppLayout;
