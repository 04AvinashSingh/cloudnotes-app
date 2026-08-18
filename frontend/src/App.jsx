import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Pin,
  PinOff,
  Search,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Tag,
  Clock,
  X,
  Database,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  LogOut,
  User,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://cloudnotes-api-yksu.onrender.com/api';

const COLOR_THEMES = {
  slate: {
    id: 'slate',
    name: 'Classic Slate',
    bg: 'bg-white',
    border: 'border-slate-200 hover:border-slate-300',
    headerBg: 'bg-slate-50',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    indicator: 'bg-slate-500',
    ring: 'focus:ring-slate-400',
  },
  amber: {
    id: 'amber',
    name: 'Warm Amber',
    bg: 'bg-amber-50/50',
    border: 'border-amber-200 hover:border-amber-300',
    headerBg: 'bg-amber-100/50',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    indicator: 'bg-amber-500',
    ring: 'focus:ring-amber-400',
  },
  emerald: {
    id: 'emerald',
    name: 'Mint Emerald',
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-200 hover:border-emerald-300',
    headerBg: 'bg-emerald-100/50',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    indicator: 'bg-emerald-500',
    ring: 'focus:ring-emerald-400',
  },
  sky: {
    id: 'sky',
    name: 'Sky Blue',
    bg: 'bg-sky-50/50',
    border: 'border-sky-200 hover:border-sky-300',
    headerBg: 'bg-sky-100/50',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    indicator: 'bg-sky-500',
    ring: 'focus:ring-sky-400',
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo Violet',
    bg: 'bg-indigo-50/50',
    border: 'border-indigo-200 hover:border-indigo-300',
    headerBg: 'bg-indigo-100/50',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    indicator: 'bg-indigo-500',
    ring: 'focus:ring-indigo-400',
  },
  rose: {
    id: 'rose',
    name: 'Soft Rose',
    bg: 'bg-rose-50/50',
    border: 'border-rose-200 hover:border-rose-300',
    headerBg: 'bg-rose-100/50',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    indicator: 'bg-rose-500',
    ring: 'focus:ring-rose-400',
  },
};

const DEFAULT_CATEGORIES = ['General', 'Work', 'Personal', 'Ideas', 'Tasks', 'Study'];

function App() {
  // Auth State
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cloudnotes_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cloudnotes_token') || null);

  // Auth Form State
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Notes State
  const [notes, setNotes] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // New Note Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [color, setColor] = useState('slate');
  const [isPinned, setIsPinned] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Edit Modal State
  const [editingNote, setEditingNote] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Clipboard Copied State
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Helper for authenticated requests
  const getAuthHeaders = useCallback(() => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    setNotes(undefined);
    localStorage.removeItem('cloudnotes_user');
    localStorage.removeItem('cloudnotes_token');
    showToast('Logged out successfully');
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await axios.post(`${API_URL}/auth/signup`, {
          name: authName.trim(),
          email: authEmail.trim(),
          password: authPassword,
        });

        const { user: newUser, token: newToken } = res.data;
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem('cloudnotes_user', JSON.stringify(newUser));
        localStorage.setItem('cloudnotes_token', newToken);
        showToast(`🎉 Welcome to CloudNotes, ${newUser.name}!`);
      } else {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email: authEmail.trim(),
          password: authPassword,
        });

        const { user: loggedInUser, token: receivedToken } = res.data;
        setUser(loggedInUser);
        setToken(receivedToken);
        localStorage.setItem('cloudnotes_user', JSON.stringify(loggedInUser));
        localStorage.setItem('cloudnotes_token', receivedToken);
        showToast(`👋 Welcome back, ${loggedInUser.name}!`);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setAuthError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setAuthEmail('demo@example.com');
    setAuthPassword('password123');
    setAuthMode('login');
  };

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notes`, getAuthHeaders());
      setNotes(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notes:', err);
      if (err.response?.status === 401) {
        handleLogout();
        showToast('Session expired. Please log in again.', 'error');
      } else {
        setError('Could not connect to backend. Please make sure the server and AWS DynamoDB are configured.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, getAuthHeaders, handleLogout]);

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token, fetchNotes]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const finalCategory = customCategory.trim() || category;

    try {
      setActionLoading(true);
      const response = await axios.post(
        `${API_URL}/notes`,
        {
          title: title.trim(),
          content: content.trim(),
          category: finalCategory,
          color,
          pinned: isPinned,
        },
        getAuthHeaders()
      );

      setNotes((prevNotes) => [response.data, ...(prevNotes || [])]);
      setTitle('');
      setContent('');
      setCategory('General');
      setCustomCategory('');
      setColor('slate');
      setIsPinned(false);
      setIsFormExpanded(false);
      setError(null);
      showToast('✨ Note saved to DynamoDB!');
    } catch (err) {
      console.error('Error adding note:', err);
      showToast('Failed to create note', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editingNote || !editingNote.title.trim() || !editingNote.content.trim()) return;

    try {
      setActionLoading(true);
      const response = await axios.put(
        `${API_URL}/notes/${editingNote.id}`,
        {
          title: editingNote.title.trim(),
          content: editingNote.content.trim(),
          category: editingNote.category || 'General',
          color: editingNote.color || 'slate',
          pinned: Boolean(editingNote.pinned),
        },
        getAuthHeaders()
      );

      setNotes((prevNotes) =>
        (prevNotes || []).map((n) => (n.id === editingNote.id ? response.data : n))
      );
      setEditingNote(null);
      showToast('Updated note successfully!');
    } catch (err) {
      console.error('Error updating note:', err);
      showToast('Failed to update note', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePin = async (note, e) => {
    e?.stopPropagation();
    const updatedPinnedState = !note.pinned;

    setNotes((prevNotes) =>
      (prevNotes || []).map((n) => (n.id === note.id ? { ...n, pinned: updatedPinnedState } : n))
    );

    try {
      await axios.put(
        `${API_URL}/notes/${note.id}`,
        {
          pinned: updatedPinnedState,
        },
        getAuthHeaders()
      );
      showToast(updatedPinnedState ? '📌 Note pinned to top' : 'Unpinned note');
    } catch (err) {
      console.error('Error toggling pin:', err);
      setNotes((prevNotes) =>
        (prevNotes || []).map((n) => (n.id === note.id ? { ...n, pinned: !updatedPinnedState } : n))
      );
      showToast('Failed to update pin status', 'error');
    }
  };

  const handleDeleteNote = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      setActionLoading(true);
      await axios.delete(`${API_URL}/notes/${id}`, getAuthHeaders());
      setNotes((prevNotes) => (prevNotes || []).filter((note) => note.id !== id));
      showToast('🗑️ Note deleted');
    } catch (err) {
      console.error('Error deleting note:', err);
      showToast('Failed to delete note', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyNote = (note, e) => {
    e?.stopPropagation();
    const textToCopy = `${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(note.id);
    showToast('📋 Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derive categories list dynamically
  const allCategories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    notes?.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [notes]);

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    if (!notes) return [];

    return notes
      .filter((note) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          (note.category || 'General').toLowerCase() === selectedCategory.toLowerCase();

        const matchesSearch =
          searchQuery === '' ||
          note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.category?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === 'alpha') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });
  }, [notes, selectedCategory, searchQuery, sortBy]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.pinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((n) => !n.pinned), [filteredNotes]);

  // If user is not logged in, render the Auth Screen
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${
                toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'
              }`}
            >
              {toast.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4 text-emerald-400" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          {/* Simple black logo */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-4">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">CloudNotes</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Full-stack React &amp; Express backed by AWS DynamoDB
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white border border-slate-200 py-8 px-6 shadow-sm rounded-2xl sm:px-10">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`w-1/2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                }}
                className={`w-1/2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-xl flex items-center space-x-2 text-xs text-red-700">
                <X className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Create Free Account' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Preset */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400 mb-2">Want to test quickly without creating an account?</p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium underline underline-offset-4"
              >
                Use Demo Account (demo@example.com)
              </button>
            </div>
          </div>

          {/* Features badge bar */}
          <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" /> AWS DynamoDB
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> JWT &amp; bcrypt
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Instant Sync
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Main Screen
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 transition-all transform duration-300 ease-out animate-bounce-short">
          <div
            className={`flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900'
            }`}
          >
            {toast.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4 text-emerald-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Modern App Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                CloudNotes <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Pro</span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">Full-stack React & Express backed by AWS DynamoDB</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DynamoDB Live</span>
            </div>

            <button
              onClick={fetchNotes}
              disabled={loading}
              title="Refresh notes from DynamoDB"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center pl-2 border-l border-slate-200 space-x-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
                <div className="text-[10px] text-slate-400 leading-none mt-0.5 truncate max-w-[120px]">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start space-x-3 text-red-800 shadow-sm">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Note Creation Card */}
        <div className="max-w-2xl mx-auto mb-10">
          <form
            onSubmit={handleAddNote}
            className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
              isFormExpanded ? 'border-blue-400 ring-4 ring-blue-50 p-5' : 'border-slate-200 p-4'
            }`}
          >
            {isFormExpanded && (
              <div className="flex items-center justify-between mb-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="text-lg font-bold text-slate-900 placeholder-slate-400 w-full focus:outline-none bg-transparent"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isPinned
                      ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title={isPinned ? 'Pinned' : 'Pin note to top'}
                >
                  <Pin className="w-4 h-4 fill-current" />
                </button>
              </div>
            )}

            <textarea
              value={content}
              onFocus={() => setIsFormExpanded(true)}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isFormExpanded ? "What's on your mind?..." : "Take a quick note..."}
              rows={isFormExpanded ? 4 : 1}
              className="w-full text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent resize-none text-sm leading-relaxed"
              required
            />

            {isFormExpanded && (
              <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Options: Category & Color */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Category Selection */}
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="text-xs bg-slate-100 text-slate-700 border-none rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color Picker */}
                  <div className="flex items-center space-x-1.5">
                    {Object.values(COLOR_THEMES).map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setColor(theme.id)}
                        className={`w-5 h-5 rounded-full transition-transform ${theme.indicator} ${
                          color === theme.id ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        title={theme.name}
                      />
                    ))}
                  </div>

                  {/* Character/Word Counter */}
                  <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                    {content.trim() ? content.trim().split(/\s+/).length : 0} words
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormExpanded(false);
                      setTitle('');
                      setContent('');
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !content.trim()}
                    className="inline-flex items-center px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                    Add Note
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by keyword or title..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 text-xs text-slate-500 self-end md:self-auto">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alpha">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Notes ({notes ? notes.length : 0})
            </button>
            {allCategories.map((cat) => {
              const count = notes?.filter((n) => (n.category || 'General').toLowerCase() === cat.toLowerCase()).length || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes Grid */}
        {notes === undefined || loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-3" />
            <p className="text-sm font-medium text-slate-500">Syncing your notes with AWS DynamoDB...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 max-w-lg mx-auto">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No notes found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? `No notes matched "${searchQuery}"` : 'Create your first note above to save to DynamoDB!'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Notes Section */}
            {pinnedNotes.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
                  <Pin className="w-3.5 h-3.5 fill-current" />
                  <span>Pinned Notes ({pinnedNotes.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      copiedId={copiedId}
                      onTogglePin={handleTogglePin}
                      onEdit={setEditingNote}
                      onDelete={handleDeleteNote}
                      onCopy={handleCopyNote}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Notes Section */}
            {otherNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Other Notes ({otherNotes.length})</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      copiedId={copiedId}
                      onTogglePin={handleTogglePin}
                      onEdit={setEditingNote}
                      onDelete={handleDeleteNote}
                      onCopy={handleCopyNote}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Edit Note
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNote} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Content</label>
                <textarea
                  rows={5}
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* Category Selection */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-slate-500">Category:</span>
                  <select
                    value={editingNote.category || 'General'}
                    onChange={(e) => setEditingNote({ ...editingNote, category: e.target.value })}
                    className="text-xs bg-slate-100 text-slate-700 rounded-lg px-2.5 py-1 font-medium border-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Selection */}
                <div className="flex items-center space-x-1.5">
                  {Object.values(COLOR_THEMES).map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setEditingNote({ ...editingNote, color: theme.id })}
                      className={`w-5 h-5 rounded-full ${theme.indicator} ${
                        (editingNote.color || 'slate') === theme.id ? 'ring-2 ring-offset-2 ring-slate-500 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Note Card Component
function NoteCard({ note, copiedId, onTogglePin, onEdit, onDelete, onCopy }) {
  const theme = COLOR_THEMES[note.color] || COLOR_THEMES.slate;

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between p-5 ${theme.bg} ${theme.border} ${
        note.pinned ? 'ring-2 ring-amber-400/40 shadow-sm' : 'shadow-sm'
      }`}
    >
      <div>
        {/* Card Header: Category & Actions */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
            {note.category || 'General'}
          </span>

          <div className="flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition-opacity">
            {/* Pin Button */}
            <button
              onClick={(e) => onTogglePin(note, e)}
              className={`p-1.5 rounded-lg transition-colors ${
                note.pinned
                  ? 'text-amber-600 bg-amber-100/70 hover:bg-amber-200'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
              title={note.pinned ? 'Unpin note' : 'Pin note'}
            >
              {note.pinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
            </button>

            {/* Copy Button */}
            <button
              onClick={(e) => onCopy(note, e)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
              title="Copy note text"
            >
              {copiedId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Edit Button */}
            <button
              onClick={() => onEdit(note)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit note"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => onDelete(note.id, e)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug break-words">
          {note.title}
        </h4>

        {/* Content */}
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-words mb-4 line-clamp-6">
          {note.content}
        </p>
      </div>

      {/* Card Footer: Timestamp */}
      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3" />
          {note.createdAt ? new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
        </span>
        {note.updatedAt && note.updatedAt !== note.createdAt && (
          <span className="text-[10px] text-slate-400 italic">edited</span>
        )}
      </div>
    </div>
  );
}

export default App;
