import React, { useState, useEffect, useRef } from 'react';
import { 
  Facebook, ShieldAlert, KeyRound, Cookie, Trash2, Send, Plus, 
  UserPlus, Copy, LogIn, ExternalLink, RefreshCw, Smartphone, Settings, ArrowLeft,
  Users, Clock, Ban, CheckCircle, XCircle, Search, Filter, CalendarPlus, Activity, UserCheck, UserX, Globe, Database
} from 'lucide-react';
import * as OTPAuth from 'otpauth';
import { isFirebaseConfigured } from './firebase';

// --- Types ---
type Shortcut = {
  id: string;
  name: string;
  url: string;
  icon: React.ReactNode;
};

type UserStatus = 'pending' | 'approved' | 'rejected' | 'banned';
type Role = 'user' | 'sub_admin' | 'full_admin';

type UserAccount = {
  id: string;
  email: string;
  password: string;
  status: UserStatus;
  role?: Role;
  expiryDate: number | null;
  createdAt: number;
  successCount?: number;
};

type ActivityLog = {
  id: string;
  timestamp: number;
  action: string;
  details: string;
  userEmail?: string;
};

type CreatedAccount = {
  id: string;
  type: '2FA' | 'COOKIES';
  uid: string;
  password: string;
  thirdData: string;
  createdAt: number;
  createdBy: string;
};

const logActivity = (action: string, details: string, userEmail?: string) => {
  const logs: ActivityLog[] = JSON.parse(localStorage.getItem('app_logs') || '[]');
  logs.unshift({
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    action,
    details,
    userEmail
  });
  localStorage.setItem('app_logs', JSON.stringify(logs.slice(0, 500)));
};

// --- Firebase Setup Screen ---
function FirebaseSetupScreen() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-100 font-sans">
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl p-8 shadow-2xl border border-zinc-800">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Database className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-4">Firebase Setup Required</h1>
        <p className="text-zinc-400 text-center text-sm mb-6">
          To make this app work for all users globally and sync data across devices, you must connect it to a Firebase Realtime Database.
        </p>
        
        <div className="bg-zinc-800 rounded-xl p-4 mb-6">
          <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Step 1: Create a Firebase Project
          </h2>
          <p className="text-zinc-400 text-xs mb-4">
            Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">console.firebase.google.com</a>, create a new project, and add a Web App.
          </p>
          
          <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Step 2: Enable Realtime Database
          </h2>
          <p className="text-zinc-400 text-xs mb-4">
            In your Firebase project, go to "Realtime Database" and click "Create Database". Start in <strong>Test Mode</strong> so the app can read/write data immediately.
          </p>
          
          <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Step 3: Add Environment Variables
          </h2>
          <p className="text-zinc-400 text-xs">
            Open the AI Studio environment variables settings and add the following keys from your Firebase config:
          </p>
          <ul className="list-disc list-inside text-xs text-zinc-500 mt-2 space-y-1">
            <li><code className="text-orange-400">VITE_FIREBASE_API_KEY</code></li>
            <li><code className="text-orange-400">VITE_FIREBASE_AUTH_DOMAIN</code></li>
            <li><code className="text-orange-400">VITE_FIREBASE_DATABASE_URL</code></li>
            <li><code className="text-orange-400">VITE_FIREBASE_PROJECT_ID</code></li>
            <li><code className="text-orange-400">VITE_FIREBASE_STORAGE_BUCKET</code></li>
            <li><code className="text-orange-400">VITE_FIREBASE_MESSAGING_SENDER_ID</code></li>
            <li><code className="text-orange-400">VITE_FIREBASE_APP_ID</code></li>
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-zinc-500">
            After adding the variables, the app will automatically connect to your database and this screen will disappear.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | 'ADMIN' | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [accountType, setAccountType] = useState<'2FA' | 'COOKIES' | 'ADMIN_PANEL' | null>(null);
  
  // Generate a mock Device ID on first load
  useEffect(() => {
    const storedId = localStorage.getItem('deviceId');
    if (storedId) {
      setDeviceId(storedId);
    } else {
      const newId = 'UID-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('deviceId', newId);
      setDeviceId(newId);
    }
    
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      if (storedUser === 'ADMIN') {
        setCurrentUser('ADMIN');
      } else {
        try {
          const parsed = JSON.parse(storedUser);
          const users: UserAccount[] = JSON.parse(localStorage.getItem('app_users') || '[]');
          const dbUser = users.find(u => u.id === parsed.id);
          if (dbUser && dbUser.status === 'approved' && (!dbUser.expiryDate || Date.now() < dbUser.expiryDate)) {
             setCurrentUser(dbUser);
          } else {
             localStorage.removeItem('currentUser');
          }
        } catch (e) {
          localStorage.removeItem('currentUser');
        }
      }
    }
  }, []);

  const handleLogin = (user: UserAccount | 'ADMIN') => {
    setCurrentUser(user);
    if (user === 'ADMIN') {
      localStorage.setItem('currentUser', 'ADMIN');
    } else {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAccountType(null);
    localStorage.removeItem('currentUser');
  };

  if (!isFirebaseConfigured()) {
    return <FirebaseSetupScreen />;
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (accountType === 'ADMIN_PANEL') {
    return <AdminPanel currentUser={currentUser} onBack={() => setAccountType(null)} onLogout={handleLogout} />;
  }

  if (!accountType) {
    return <WelcomeScreen currentUser={currentUser} onSelect={setAccountType} onLogout={handleLogout} />;
  }

  return <MainApp currentUser={currentUser} onLogout={handleLogout} deviceId={deviceId} accountType={accountType} onBack={() => setAccountType(null)} />;
}

// --- Auth Screen ---
function AuthScreen({ onLogin }: { onLogin: (user: UserAccount | 'ADMIN') => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isLogin) {
      if (email === 'anikhossain333866@gmail.com' && password === 'Jesmin05@@') {
        logActivity('LOGIN_SUCCESS', 'Owner logged in', email);
        onLogin('ADMIN');
        return;
      }

      const users: UserAccount[] = JSON.parse(localStorage.getItem('app_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        if (user.status === 'pending') {
          logActivity('LOGIN_FAILED', 'Pending approval', email);
          setError('Wait for admin approval.');
        } else if (user.status === 'rejected') {
          logActivity('LOGIN_FAILED', 'Account rejected', email);
          setError('Your request was rejected by admin.');
        } else if (user.status === 'banned') {
          logActivity('LOGIN_FAILED', 'Account banned', email);
          setError('Your account has been banned.');
        } else if (user.status === 'approved') {
          if (user.expiryDate && Date.now() > user.expiryDate) {
             logActivity('LOGIN_FAILED', 'Access expired', email);
             setError('Your access has expired. Contact admin.');
          } else {
             logActivity('LOGIN_SUCCESS', 'User logged in', email);
             onLogin(user);
          }
        }
      } else {
        logActivity('LOGIN_FAILED', 'Invalid credentials', email);
        setError('Invalid email or password.');
      }
    } else {
      if (!email || !password) {
        setError('Please fill all fields.');
        return;
      }
      const users: UserAccount[] = JSON.parse(localStorage.getItem('app_users') || '[]');
      if (users.find(u => u.email === email)) {
        setError('Email already exists.');
        return;
      }
      if (email === 'anikhossain333866@gmail.com') {
        setError('Cannot register with admin email.');
        return;
      }

      const newUser: UserAccount = {
        id: Date.now().toString(),
        email,
        password,
        status: 'pending',
        expiryDate: null,
        createdAt: Date.now(),
        successCount: 0
      };
      users.push(newUser);
      localStorage.setItem('app_users', JSON.stringify(users));
      logActivity('REGISTER', 'New user registered', email);
      setMessage('Account created! Wait for admin approval.');
      setIsLogin(true);
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-100 font-sans">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Facebook className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Anik FB Tools</h1>
        <p className="text-zinc-400 text-center text-sm mb-6">{isLogin ? 'Login to your account' : 'Create an account'}</p>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-4 text-center">{error}</div>}
        {message && <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 text-sm p-3 rounded-xl mb-4 text-center">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1 ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            className="text-zinc-400 text-sm hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Admin Panel ---
function AdminPanel({ currentUser, onLogout, onBack }: { currentUser: UserAccount | 'ADMIN', onLogout: () => void, onBack: () => void }) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [timeInput, setTimeInput] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'accounts_2fa' | 'accounts_cookies'>('users');
  const [createdAccounts, setCreatedAccounts] = useState<CreatedAccount[]>([]);
  const [dateFilter, setDateFilter] = useState('');

  const isOwner = currentUser === 'ADMIN';
  const isFullAdmin = isOwner || (currentUser as UserAccount)?.role === 'full_admin';
  const isSubAdmin = (currentUser as UserAccount)?.role === 'sub_admin';
  const currentEmail = isOwner ? 'anikhossain333866@gmail.com' : (currentUser as UserAccount).email;

  useEffect(() => {
    const loadData = () => {
      setUsers(JSON.parse(localStorage.getItem('app_users') || '[]'));
      setLogs(JSON.parse(localStorage.getItem('app_logs') || '[]'));
      setCreatedAccounts(JSON.parse(localStorage.getItem('app_accounts') || '[]'));
    };
    
    loadData();
    window.addEventListener('sync_update', loadData);
    return () => window.removeEventListener('sync_update', loadData);
  }, []);

  const saveUsers = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    localStorage.setItem('app_users', JSON.stringify(newUsers));
  };

  const refreshLogs = () => {
    setLogs(JSON.parse(localStorage.getItem('app_logs') || '[]'));
  };

  const handleRoleChange = (id: string, newRole: Role) => {
    if (!isFullAdmin) return;
    const userToChange = users.find(u => u.id === id);
    const newUsers = users.map(u => u.id === id ? { ...u, role: newRole } : u);
    saveUsers(newUsers);
    if (userToChange) {
      logActivity('ROLE_CHANGED', `Changed role of ${userToChange.email} to ${newRole}`, currentEmail);
      refreshLogs();
    }
  };

  const handleDelete = (id: string) => {
    if (!isFullAdmin) {
      alert("You don't have permission to delete users.");
      return;
    }
    if (window.confirm('Are you sure you want to completely delete this user?')) {
      const userToDelete = users.find(u => u.id === id);
      const newUsers = users.filter(u => u.id !== id);
      saveUsers(newUsers);
      if (userToDelete) {
        logActivity('USER_DELETED', `Deleted user ${userToDelete.email}`, currentEmail);
        refreshLogs();
      }
    }
  };

  const handleExtend = (id: string) => {
    const days = timeInput[id] || 0;
    if (days <= 0) return;
    let targetEmail = '';
    const newUsers = users.map(u => {
      if (u.id === id) {
        targetEmail = u.email;
        const currentExpiry = u.expiryDate && u.expiryDate > Date.now() ? u.expiryDate : Date.now();
        return { ...u, expiryDate: currentExpiry + days * 24 * 60 * 60 * 1000 };
      }
      return u;
    });
    saveUsers(newUsers);
    setTimeInput(prev => ({ ...prev, [id]: 0 }));
    if (targetEmail) {
      logActivity('TIME_EXTENDED', `Added ${days} days to ${targetEmail}`, currentEmail);
      refreshLogs();
    }
  };

  const handleApprove = (id: string) => {
    const days = timeInput[id] || 30; // Default 30 days
    let targetEmail = '';
    const newUsers = users.map(u => {
      if (u.id === id) {
        targetEmail = u.email;
        return { ...u, status: 'approved', expiryDate: Date.now() + days * 24 * 60 * 60 * 1000 };
      }
      return u;
    });
    saveUsers(newUsers);
    setTimeInput(prev => ({ ...prev, [id]: 0 }));
    if (targetEmail) {
      logActivity('USER_APPROVED', `Approved ${targetEmail} for ${days} days`, currentEmail);
      refreshLogs();
    }
  };

  const handleReject = (id: string) => {
    let targetEmail = '';
    const newUsers = users.map(u => {
      if (u.id === id) {
        targetEmail = u.email;
        return { ...u, status: 'rejected' };
      }
      return u;
    });
    saveUsers(newUsers);
    if (targetEmail) {
      logActivity('USER_REJECTED', `Rejected ${targetEmail}`, currentEmail);
      refreshLogs();
    }
  };

  const handleBan = (id: string) => {
    let targetEmail = '';
    const newUsers = users.map(u => {
      if (u.id === id) {
        targetEmail = u.email;
        return { ...u, status: 'banned' };
      }
      return u;
    });
    saveUsers(newUsers);
    if (targetEmail) {
      logActivity('USER_BANNED', `Banned ${targetEmail}`, currentEmail);
      refreshLogs();
    }
  };

  const handleUnban = (id: string) => {
    const days = timeInput[id] || 30;
    let targetEmail = '';
    const newUsers = users.map(u => {
      if (u.id === id) {
        targetEmail = u.email;
        return { ...u, status: 'approved', expiryDate: Date.now() + days * 24 * 60 * 60 * 1000 };
      }
      return u;
    });
    saveUsers(newUsers);
    setTimeInput(prev => ({ ...prev, [id]: 0 }));
    if (targetEmail) {
      logActivity('USER_UNBANNED', `Unbanned ${targetEmail} for ${days} days`, currentEmail);
      refreshLogs();
    }
  };

  const handleTimeChange = (id: string, days: number) => {
    setTimeInput(prev => ({ ...prev, [id]: days }));
  };

  const getStatusColor = (status: UserStatus) => {
    switch(status) {
      case 'approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'pending': return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      case 'rejected': return 'text-red-400 bg-red-400/10 border-red-500/20';
      case 'banned': return 'text-zinc-400 bg-zinc-400/10 border-zinc-500/20';
    }
  };

  const filteredUsers = users
    .filter(u => filterStatus === 'all' || u.status === filterStatus)
    .filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.createdAt - a.createdAt);

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'approved').length,
    pending: users.filter(u => u.status === 'pending').length,
    banned: users.filter(u => u.status === 'banned').length,
    totalCreated: users.reduce((sum, u) => sum + (u.successCount || 0), 0)
  };

  const renderAccountList = () => {
    const typeFilter = activeTab === 'accounts_2fa' ? '2FA' : 'COOKIES';
    let filteredAccounts = createdAccounts.filter(a => a.type === typeFilter);
    
    if (dateFilter) {
      filteredAccounts = filteredAccounts.filter(a => {
        const d = new Date(a.createdAt);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return dateStr === dateFilter;
      });
    }

    const handleCopyAll = () => {
      const data = filteredAccounts.map(a => `${a.uid}|${a.password}|${a.thirdData}`).join('\n');
      navigator.clipboard.writeText(data);
      alert(`Copied ${filteredAccounts.length} accounts to clipboard!`);
    };

    const handleCopySingle = (a: CreatedAccount) => {
      navigator.clipboard.writeText(`${a.uid}|${a.password}|${a.thirdData}`);
      alert('Copied to clipboard!');
    };

    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={() => setDateFilter('')}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Clear Date
            </button>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-sm text-zinc-400">Total: <span className="text-white font-bold">{filteredAccounts.length}</span></span>
            <button 
              onClick={handleCopyAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" /> Copy All
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Created By</th>
                <th className="px-6 py-4 font-medium">UID</th>
                <th className="px-6 py-4 font-medium">Password</th>
                <th className="px-6 py-4 font-medium">{typeFilter === '2FA' ? '2FA Secret' : 'Cookie'}</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No accounts found for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(a => (
                  <tr key={a.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-300 whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">{a.createdBy}</td>
                    <td className="px-6 py-4 text-zinc-300 font-mono text-xs">{a.uid}</td>
                    <td className="px-6 py-4 text-zinc-300 font-mono text-xs">{a.password}</td>
                    <td className="px-6 py-4 text-zinc-300 font-mono text-xs max-w-[200px] truncate" title={a.thirdData}>
                      {a.thirdData}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleCopySingle(a)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-300" />
            </button>
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-zinc-400 text-sm">Manage Users & Access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { refreshLogs(); setShowLogsModal(true); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors border border-zinc-700 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Logs
            </button>
            <button onClick={onLogout} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition-colors border border-zinc-700">
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Activity className="w-5 h-5" /></div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><UserCheck className="w-5 h-5" /></div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500"><Clock className="w-5 h-5" /></div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500"><UserX className="w-5 h-5" /></div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Banned</p>
              <p className="text-2xl font-bold">{stats.banned}</p>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><Copy className="w-5 h-5" /></div>
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Created</p>
              <p className="text-2xl font-bold">{stats.totalCreated}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('users')} 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}
          >
            Manage Users
          </button>
          <button 
            onClick={() => setActiveTab('accounts_2fa')} 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'accounts_2fa' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}
          >
            NUMBER 00+ FND 2FA
          </button>
          <button 
            onClick={() => setActiveTab('accounts_cookies')} 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'accounts_cookies' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}
          >
            NUMBER 00+ FND COOKIES
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search by email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'all')}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="banned">Banned</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-500">
              No users found matching your criteria.
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{user.email}</h3>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-400 font-mono mb-2">
                    Pass: <span className="text-zinc-300">{user.password}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    <span>Created: <strong className="text-purple-400">{user.successCount || 0}</strong></span>
                    {user.status === 'approved' && user.expiryDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires: {new Date(user.expiryDate).toLocaleDateString()} {new Date(user.expiryDate).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {/* Role Selector */}
                  {isFullAdmin && user.status === 'approved' && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-zinc-500">Role:</span>
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="user">User</option>
                        <option value="sub_admin">Sub Admin</option>
                        <option value="full_admin">Full Admin</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto">
                  {/* Time Input Row */}
                  {(user.status === 'pending' || user.status === 'banned' || user.status === 'approved') && (
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="Days" 
                        value={timeInput[user.id] || ''}
                        onChange={(e) => handleTimeChange(user.id, parseInt(e.target.value) || 0)}
                        className="w-20 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-zinc-500">Days</span>
                      
                      {user.status === 'approved' && (
                        <button onClick={() => handleExtend(user.id)} className="ml-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
                          <CalendarPlus className="w-3 h-3" /> Add Time
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap gap-2">
                    {user.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(user.id)} className="flex-1 md:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleReject(user.id)} className="flex-1 md:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    
                    {user.status === 'approved' && (
                      <button onClick={() => handleBan(user.id)} className="flex-1 md:flex-none px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-500 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors border border-zinc-700">
                        <Ban className="w-4 h-4" /> Ban User
                      </button>
                    )}

                    {user.status === 'banned' && (
                      <button onClick={() => handleUnban(user.id)} className="flex-1 md:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Unban & Set Time
                      </button>
                    )}

                    {isFullAdmin && (
                      <button onClick={() => handleDelete(user.id)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors border border-red-500/20" title="Delete User">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
          </>
        ) : (
          renderAccountList()
        )}
      </div>

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Activity Logs</h2>
              <button onClick={() => setShowLogsModal(false)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              {logs.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">No activity logs found.</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded uppercase">{log.action}</span>
                        <span className="text-sm text-zinc-300">{log.details}</span>
                      </div>
                      {log.userEmail && <div className="text-xs text-zinc-500 mt-1">By: {log.userEmail}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Welcome Screen ---
function WelcomeScreen({ currentUser, onSelect, onLogout }: { currentUser: UserAccount | 'ADMIN', onSelect: (type: '2FA' | 'COOKIES' | 'ADMIN_PANEL') => void, onLogout: () => void }) {
  const isAdmin = currentUser === 'ADMIN' || (currentUser as UserAccount)?.role === 'full_admin' || (currentUser as UserAccount)?.role === 'sub_admin';

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-100 font-sans">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-6 shadow-xl border border-zinc-800 text-center">
        <h1 className="text-2xl font-bold mb-2 text-blue-500">Welcome</h1>
        <h2 className="text-lg font-semibold mb-8">Anik FB Create Tools</h2>
        
        <p className="text-zinc-400 text-sm mb-4">Select Account Creation Type:</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => onSelect('2FA')}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-4 rounded-xl transition-colors flex flex-col items-center gap-2"
          >
            <ShieldAlert className="w-8 h-8 text-amber-400" />
            <span className="font-bold text-sm">NUMBER 00+ FND 2FA</span>
            <span className="text-xs text-zinc-400">📄 SHEET: UID / PASS / 2FA</span>
          </button>
          
          <button 
            onClick={() => onSelect('COOKIES')}
            className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-4 rounded-xl transition-colors flex flex-col items-center gap-2"
          >
            <Cookie className="w-8 h-8 text-emerald-400" />
            <span className="font-bold text-sm">NUMBER 00+ FND COOKIES</span>
            <span className="text-xs text-zinc-400">📄 SHEET: UID / PASS / COOKIES</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => onSelect('ADMIN_PANEL')}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 p-4 rounded-xl transition-colors flex flex-col items-center gap-2 mt-4"
            >
              <Settings className="w-8 h-8" />
              <span className="font-bold text-sm">ADMIN PANEL</span>
              <span className="text-xs opacity-70">Manage users and access</span>
            </button>
          )}
        </div>
        
        <button onClick={onLogout} className="mt-6 text-zinc-500 text-sm hover:text-zinc-300">
          Logout
        </button>
      </div>
    </div>
  );
}

// --- Global Data ---
const countrySpoofData: Record<string, { tz: string, lang: string, locale: string, name: string }> = {
  US: { tz: 'America/New_York', lang: 'en-US,en;q=0.9', locale: 'en-US', name: 'United States' },
  UK: { tz: 'Europe/London', lang: 'en-GB,en;q=0.9', locale: 'en-GB', name: 'United Kingdom' },
  IN: { tz: 'Asia/Kolkata', lang: 'en-IN,hi;q=0.9', locale: 'en-IN', name: 'India' },
  BD: { tz: 'Asia/Dhaka', lang: 'bn-BD,en;q=0.9', locale: 'bn-BD', name: 'Bangladesh' },
  CA: { tz: 'America/Toronto', lang: 'en-CA,fr-CA;q=0.9', locale: 'en-CA', name: 'Canada' },
  AU: { tz: 'Australia/Sydney', lang: 'en-AU,en;q=0.9', locale: 'en-AU', name: 'Australia' },
  DE: { tz: 'Europe/Berlin', lang: 'de-DE,de;q=0.9', locale: 'de-DE', name: 'Germany' },
  FR: { tz: 'Europe/Paris', lang: 'fr-FR,fr;q=0.9', locale: 'fr-FR', name: 'France' },
  BR: { tz: 'America/Sao_Paulo', lang: 'pt-BR,pt;q=0.9', locale: 'pt-BR', name: 'Brazil' },
  JP: { tz: 'Asia/Tokyo', lang: 'ja-JP,ja;q=0.9', locale: 'ja-JP', name: 'Japan' },
  IT: { tz: 'Europe/Rome', lang: 'it-IT,it;q=0.9', locale: 'it-IT', name: 'Italy' },
  ES: { tz: 'Europe/Madrid', lang: 'es-ES,es;q=0.9', locale: 'es-ES', name: 'Spain' },
  MX: { tz: 'America/Mexico_City', lang: 'es-MX,es;q=0.9', locale: 'es-MX', name: 'Mexico' },
  RU: { tz: 'Europe/Moscow', lang: 'ru-RU,ru;q=0.9', locale: 'ru-RU', name: 'Russia' },
  CN: { tz: 'Asia/Shanghai', lang: 'zh-CN,zh;q=0.9', locale: 'zh-CN', name: 'China' },
  KR: { tz: 'Asia/Seoul', lang: 'ko-KR,ko;q=0.9', locale: 'ko-KR', name: 'South Korea' },
  ID: { tz: 'Asia/Jakarta', lang: 'id-ID,id;q=0.9', locale: 'id-ID', name: 'Indonesia' },
  TR: { tz: 'Europe/Istanbul', lang: 'tr-TR,tr;q=0.9', locale: 'tr-TR', name: 'Turkey' },
  SA: { tz: 'Asia/Riyadh', lang: 'ar-SA,ar;q=0.9', locale: 'ar-SA', name: 'Saudi Arabia' },
  ZA: { tz: 'Africa/Johannesburg', lang: 'en-ZA,en;q=0.9', locale: 'en-ZA', name: 'South Africa' },
  AR: { tz: 'America/Argentina/Buenos_Aires', lang: 'es-AR,es;q=0.9', locale: 'es-AR', name: 'Argentina' },
  CO: { tz: 'America/Bogota', lang: 'es-CO,es;q=0.9', locale: 'es-CO', name: 'Colombia' },
  NG: { tz: 'Africa/Lagos', lang: 'en-NG,en;q=0.9', locale: 'en-NG', name: 'Nigeria' },
  PK: { tz: 'Asia/Karachi', lang: 'ur-PK,en;q=0.9', locale: 'ur-PK', name: 'Pakistan' },
  VN: { tz: 'Asia/Ho_Chi_Minh', lang: 'vi-VN,vi;q=0.9', locale: 'vi-VN', name: 'Vietnam' },
  TH: { tz: 'Asia/Bangkok', lang: 'th-TH,th;q=0.9', locale: 'th-TH', name: 'Thailand' },
  PH: { tz: 'Asia/Manila', lang: 'en-PH,fil;q=0.9', locale: 'en-PH', name: 'Philippines' },
  MY: { tz: 'Asia/Kuala_Lumpur', lang: 'ms-MY,en;q=0.9', locale: 'ms-MY', name: 'Malaysia' },
  SG: { tz: 'Asia/Singapore', lang: 'en-SG,zh;q=0.9', locale: 'en-SG', name: 'Singapore' },
  NZ: { tz: 'Pacific/Auckland', lang: 'en-NZ,en;q=0.9', locale: 'en-NZ', name: 'New Zealand' },
  SE: { tz: 'Europe/Stockholm', lang: 'sv-SE,sv;q=0.9', locale: 'sv-SE', name: 'Sweden' },
  NO: { tz: 'Europe/Oslo', lang: 'no-NO,no;q=0.9', locale: 'no-NO', name: 'Norway' },
  DK: { tz: 'Europe/Copenhagen', lang: 'da-DK,da;q=0.9', locale: 'da-DK', name: 'Denmark' },
  FI: { tz: 'Europe/Helsinki', lang: 'fi-FI,fi;q=0.9', locale: 'fi-FI', name: 'Finland' },
  NL: { tz: 'Europe/Amsterdam', lang: 'nl-NL,nl;q=0.9', locale: 'nl-NL', name: 'Netherlands' },
};

const nameData: Record<string, {first: string[], last: string[]}> = {
  US: { first: ['John', 'Jane', 'Alex', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia'], last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'] },
  UK: { first: ['Oliver', 'George', 'Harry', 'Jack', 'Amelia', 'Isla', 'Ava', 'Emily'], last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies'] },
  IN: { first: ['Rahul', 'Priya', 'Amit', 'Neha', 'Raj', 'Anjali', 'Vikram', 'Pooja'], last: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Das', 'Gupta', 'Verma', 'Reddy'] },
  BD: { first: ['Rahim', 'Karim', 'Fatema', 'Ayesha', 'Tariq', 'Nusrat', 'Hasan', 'Mehzabin'], last: ['Islam', 'Rahman', 'Hossain', 'Ahmed', 'Chowdhury', 'Khatun', 'Akter', 'Uddin'] },
  CA: { first: ['Liam', 'Olivia', 'Noah', 'Emma', 'Jackson', 'Charlotte', 'Lucas', 'Amelia'], last: ['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Gagnon', 'Lee', 'Wilson'] },
  AU: { first: ['Oliver', 'Charlotte', 'Noah', 'Amelia', 'Jack', 'Mia', 'William', 'Isla'], last: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White'] },
  DE: { first: ['Ben', 'Mia', 'Paul', 'Emma', 'Jonas', 'Hannah', 'Leon', 'Sofia'], last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker'] },
  FR: { first: ['Gabriel', 'Jade', 'Léo', 'Louise', 'Raphaël', 'Ambre', 'Arthur', 'Alba'], last: ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois'] },
  BR: { first: ['Miguel', 'Helena', 'Arthur', 'Alice', 'Gael', 'Laura', 'Heitor', 'Manuela'], last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira'] },
  JP: { first: ['Haruto', 'Yua', 'Sota', 'Rio', 'Yuto', 'Hina', 'Haruki', 'Ichika'], last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura'] },
  IT: { first: ['Leonardo', 'Sofia', 'Alessandro', 'Aurora', 'Lorenzo', 'Giulia', 'Mattia', 'Ginevra'], last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci'] },
  ES: { first: ['Hugo', 'Lucia', 'Martin', 'Sofia', 'Lucas', 'Maria', 'Mateo', 'Julia'], last: ['Garcia', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Perez'] },
  MX: { first: ['Santiago', 'Mateo', 'Sebastian', 'Leonardo', 'Matias', 'Emiliano', 'Diego', 'Daniel'], last: ['Hernandez', 'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Rodriguez', 'Sanchez'] },
  RU: { first: ['Alexander', 'Maxim', 'Ivan', 'Artem', 'Dmitry', 'Sofia', 'Maria', 'Anna'], last: ['Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Sokolov', 'Lebedev', 'Kozlov', 'Novikov'] },
  CN: { first: ['Wei', 'Fang', 'Jian', 'Min', 'Yan', 'Lei', 'Tao', 'Hua'], last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao'] },
  KR: { first: ['Min-jun', 'Seo-yun', 'Do-yun', 'Seo-yeon', 'Si-woo', 'Ji-woo', 'Ha-joon', 'Ji-yoon'], last: ['Kim', 'Lee', 'Park', 'Choi', 'Jeong', 'Kang', 'Jo', 'Yoon'] },
  ID: { first: ['Budi', 'Siti', 'Agus', 'Sri', 'Ahmad', 'Nur', 'Wahyu', 'Dewi'], last: ['Saputra', 'Wijaya', 'Setiawan', 'Pratama', 'Hidayat', 'Kusuma', 'Lestari', 'Sari'] },
  TR: { first: ['Yusuf', 'Zeynep', 'Eymen', 'Elif', 'Mustafa', 'Defne', 'Omer', 'Asel'], last: ['Yilmaz', 'Kaya', 'Demir', 'Celik', 'Sahin', 'Yildiz', 'Yildirim', 'Ozturk'] },
  SA: { first: ['Mohammed', 'Fatima', 'Ahmed', 'Aisha', 'Ali', 'Maryam', 'Omar', 'Sara'], last: ['Al-Dawsari', 'Al-Ghamdi', 'Al-Harbi', 'Al-Mutairi', 'Al-Otaibi', 'Al-Qahtani', 'Al-Shahrani', 'Al-Zahrani'] },
  ZA: { first: ['Thabo', 'Lerato', 'Sipho', 'Zanele', 'Mandla', 'Thandi', 'Bongani', 'Nomsa'], last: ['Dlamini', 'Ndlovu', 'Khumalo', 'Sithole', 'Mokoena', 'Nkosi', 'Zungu', 'Mthembu'] },
  AR: { first: ['Mateo', 'Isabella', 'Bautista', 'Catalina', 'Juan', 'Martina', 'Felipe', 'Delfina'], last: ['Gonzalez', 'Rodriguez', 'Gomez', 'Fernandez', 'Lopez', 'Diaz', 'Martinez', 'Perez'] },
  CO: { first: ['Santiago', 'Salome', 'Samuel', 'Isabella', 'Matias', 'Mariana', 'Emiliano', 'Luciana'], last: ['Rodriguez', 'Gomez', 'Gonzalez', 'Martinez', 'Garcia', 'Lopez', 'Hernandez', 'Sanchez'] },
  NG: { first: ['Chukwudi', 'Ngozi', 'Oluwaseun', 'Aisha', 'Ibrahim', 'Fatima', 'Emeka', 'Chioma'], last: ['Ibrahim', 'Musa', 'Abubakar', 'Okafor', 'Okoro', 'Adeyemi', 'Balogun', 'Olawale'] },
  PK: { first: ['Muhammad', 'Fatima', 'Ali', 'Ayesha', 'Ahmed', 'Zainab', 'Hassan', 'Maryam'], last: ['Khan', 'Ahmed', 'Ali', 'Hussain', 'Shah', 'Malik', 'Iqbal', 'Raza'] },
  VN: { first: ['Anh', 'Chi', 'Dung', 'Hoa', 'Hung', 'Linh', 'Minh', 'Trang'], last: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu'] },
  TH: { first: ['Somchai', 'Somsri', 'Kittipong', 'Pornthip', 'Nattapong', 'Supaporn', 'Surachai', 'Wanna'], last: ['Saeng', 'Thong', 'Wong', 'Sri', 'Rattana', 'Phon', 'Siri', 'Chai'] },
  PH: { first: ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Lourdes', 'Manuel', 'Teresa'], last: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres'] },
  MY: { first: ['Ahmad', 'Nur', 'Muhammad', 'Siti', 'Abdul', 'Aisyah', 'Mohd', 'Fatimah'], last: ['Abdullah', 'Ismail', 'Ibrahim', 'Rahman', 'Hassan', 'Othman', 'Ahmad', 'Ali'] },
  SG: { first: ['Wei', 'Jia', 'Yi', 'Xin', 'Jun', 'Hui', 'Jian', 'Min'], last: ['Tan', 'Lim', 'Lee', 'Ng', 'Ong', 'Wong', 'Goh', 'Chua'] },
  NZ: { first: ['Oliver', 'Charlotte', 'Jack', 'Isla', 'Noah', 'Amelia', 'William', 'Olivia'], last: ['Smith', 'Wilson', 'Williams', 'Brown', 'Taylor', 'Jones', 'Singh', 'Wang'] },
  SE: { first: ['William', 'Alice', 'Liam', 'Maja', 'Noah', 'Vera', 'Hugo', 'Alma'], last: ['Johansson', 'Andersson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson'] },
  NO: { first: ['Jakob', 'Nora', 'Emil', 'Emma', 'Noah', 'Olivia', 'Oliver', 'Ella'], last: ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen'] },
  DK: { first: ['William', 'Alma', 'Noah', 'Clara', 'Oscar', 'Emma', 'Lucas', 'Ida'], last: ['Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen'] },
  FI: { first: ['Leo', 'Aino', 'Elias', 'Olivia', 'Oliver', 'Sofia', 'Väinö', 'Pihla'], last: ['Korhonen', 'Virtanen', 'Mäkinen', 'Nieminen', 'Mäkelä', 'Hämäläinen', 'Laine', 'Heikkinen'] },
  NL: { first: ['Noah', 'Emma', 'Sem', 'Julia', 'Lucas', 'Mila', 'Liam', 'Tess'], last: ['De Jong', 'Jansen', 'De Vries', 'Van den Berg', 'Van Dijk', 'Bakker', 'Janssen', 'Visser'] },
};

// --- Main App Interface ---
function MainApp({ currentUser, onLogout, deviceId, accountType, onBack }: { currentUser: UserAccount | 'ADMIN', onLogout: () => void, deviceId: string, accountType: '2FA' | 'COOKIES', onBack: () => void }) {
  const [currentUrl, setCurrentUrl] = useState('https://m.facebook.com/reg/');
  const [iframeKey, setIframeKey] = useState(0);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  const [customPassword, setCustomPassword] = useState(localStorage.getItem('customPassword') || '');
  const [selectedCountry, setSelectedCountry] = useState(localStorage.getItem('selectedCountry') || 'US');
  
  const [lastPassword, setLastPassword] = useState(localStorage.getItem('customPassword') || '');
  const [last2FASecret, setLast2FASecret] = useState('');
  
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    { id: 'fb-reg', name: 'FB Reg', url: 'https://m.facebook.com/reg/', icon: <Facebook className="w-5 h-5" /> },
    { id: 'fb-2fa', name: '2FA Settings', url: 'https://m.facebook.com/security/2fac/settings/', icon: <ShieldAlert className="w-5 h-5" /> },
  ]);

  const handleNavigate = (url: string) => {
    // Note: Many sites like Facebook block iframes via X-Frame-Options.
    // In a real Android WebView, this isn't an issue, but in a browser it is.
    // We'll try to load it in the iframe, but also provide an external link option.
    setCurrentUrl(url);
  };

  const handleClearCache = () => {
    if (window.confirm('Clear Facebook data, cache, and cookies?')) {
      // Preserve essential app data
      const auth = localStorage.getItem('isAuthenticated');
      const did = localStorage.getItem('deviceId');
      const keys = localStorage.getItem('saved2FAKeys');
      
      localStorage.clear();
      
      // Restore preserved data
      if (auth) localStorage.setItem('isAuthenticated', auth);
      if (did) localStorage.setItem('deviceId', did);
      if (keys) localStorage.setItem('saved2FAKeys', keys);
      
      alert('[WebView Simulation]\n\nIn a real Android app, CookieManager would clear data for facebook.com.\n\nSimulated cache cleared!');
      setIframeKey(k => k + 1); // Reload the iframe
    }
  };

  const handleExtractCookies = () => {
    const simulatedCookie = `c_user=${deviceId.replace('UID-', '')}; xs=simulated_session_token_12345; fr=simulated_browser_data;`;
    let sheetsData = '';
    let formatStr = '';
    
    if (accountType === '2FA') {
      sheetsData = `${deviceId}\t${lastPassword || 'No_Password'}\t${last2FASecret || 'No_2FA'}`;
      formatStr = 'UID | Password | 2FA';
    } else {
      sheetsData = `${deviceId}\t${lastPassword || 'No_Password'}\t${simulatedCookie}`;
      formatStr = 'UID | Password | Cookie';
    }
    
    navigator.clipboard.writeText(sheetsData);
    
    // Save created account to global list
    const newAccount: CreatedAccount = {
      id: Math.random().toString(36).substr(2, 9),
      type: accountType,
      uid: deviceId,
      password: lastPassword || 'No_Password',
      thirdData: accountType === '2FA' ? (last2FASecret || 'No_2FA') : simulatedCookie,
      createdAt: Date.now(),
      createdBy: currentUser === 'ADMIN' ? 'ADMIN' : currentUser.email
    };
    const savedAccounts = JSON.parse(localStorage.getItem('app_accounts') || '[]');
    savedAccounts.push(newAccount);
    localStorage.setItem('app_accounts', JSON.stringify(savedAccounts));

    // Increment success count
    if (currentUser !== 'ADMIN') {
      const users: UserAccount[] = JSON.parse(localStorage.getItem('app_users') || '[]');
      const updatedUsers = users.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, successCount: (u.successCount || 0) + 1 };
        }
        return u;
      });
      localStorage.setItem('app_users', JSON.stringify(updatedUsers));
      logActivity('ACCOUNT_CREATED', `Account created via ${accountType} mode`, currentUser.email);
    }

    alert(`✅ Copied to Clipboard for Google Sheets!\n\nFormat: ${formatStr}\n\nPaste directly into a spreadsheet row.`);
  };

  const handleAutoFill = () => {
    const countryData = nameData[selectedCountry] || nameData['US'];
    const fName = countryData.first[Math.floor(Math.random() * countryData.first.length)];
    const lName = countryData.last[Math.floor(Math.random() * countryData.last.length)];
    
    const pwd = customPassword || (Math.random().toString(36).slice(-8) + 'A1!');
    
    setLastPassword(pwd);
    
    const data = `First Name: ${fName}\nLast Name: ${lName}\nPassword: ${pwd}`;
    navigator.clipboard.writeText(data);
    alert(`Generated & Copied to Clipboard:\n\n${data}`);
  };

  return (
    <div className="h-screen w-full bg-zinc-100 flex flex-col font-sans overflow-hidden sm:max-w-md sm:mx-auto sm:border-x sm:border-zinc-300 sm:shadow-2xl relative">
      
      {/* Top Navigation Bar */}
      <div className="bg-blue-600 text-white shadow-md z-20 flex flex-col shrink-0">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <button onClick={onBack} className="p-1.5 hover:bg-blue-700 rounded-full transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col truncate">
              <h1 className="font-bold text-base truncate leading-tight">Anik FB Tools</h1>
              <span className="text-[9px] text-blue-200 font-medium tracking-wider uppercase">{accountType === '2FA' ? 'Mode: 2FA' : 'Mode: Cookies'}</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-1.5 hover:bg-blue-700 rounded-full transition-colors shrink-0">
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
        
        {/* Scrollable Icon Bar */}
        <div className="flex items-center overflow-x-auto px-3 pb-2 pt-1 gap-2.5 hide-scrollbar">
          {shortcuts.map(s => (
            <button 
              key={s.id}
              onClick={() => handleNavigate(s.url)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all shadow-sm ${currentUrl === s.url ? 'bg-white text-blue-600 ring-2 ring-white/50 scale-105' : 'bg-blue-500/50 hover:bg-blue-500 text-white'}`}
              title={s.name}
            >
              {s.icon}
              <span className="text-[9px] mt-1 font-semibold truncate w-full text-center px-1">{s.name}</span>
            </button>
          ))}
          
          <div className="w-px h-8 bg-blue-400/50 mx-0.5 flex-shrink-0"></div>
          
          <button 
            onClick={() => setShow2FAModal(true)}
            className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white transition-all shadow-sm"
          >
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span className="text-[9px] mt-1 font-semibold text-zinc-300">2FA Gen</span>
          </button>
          
          <button 
            onClick={handleExtractCookies}
            className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
          >
            <Cookie className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-semibold">Cookies</span>
          </button>
          
          <button 
            onClick={handleClearCache}
            className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-red-500 hover:bg-red-400 text-white transition-all shadow-sm"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-semibold">Clear</span>
          </button>
          
          <button 
            onClick={() => setShowAddShortcut(true)}
            className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-blue-500/30 hover:bg-blue-500/50 text-white transition-all border border-dashed border-white/40 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-semibold">Add</span>
          </button>

          <button 
            onClick={() => setShowConfigModal(true)}
            className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] mt-1 font-semibold">Config</span>
          </button>
        </div>
      </div>

      {/* Browser Address Bar (Simulated) */}
      <div className="bg-white border-b border-zinc-200 px-3 py-2 flex items-center gap-2 text-sm z-10 shadow-sm shrink-0">
        <div className="flex-1 bg-zinc-100 rounded-lg px-3 py-1.5 text-zinc-600 truncate flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-zinc-400" />
          <span className="truncate">{currentUrl}</span>
        </div>
        <button onClick={() => setIframeKey(k => k + 1)} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-lg">
          <RefreshCw className="w-4 h-4" />
        </button>
        <a href={currentUrl} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Open in external browser (Bypass iframe blocks)">
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Session Tracker Bar for Google Sheets */}
      <div className="bg-zinc-800 text-zinc-300 text-[10px] px-3 py-1.5 flex items-center justify-between z-10 shadow-inner shrink-0">
        <div className="flex gap-3 truncate">
          <span className="truncate"><b>UID:</b> {deviceId}</span>
          <span className="truncate"><b>Pass:</b> {lastPassword || '---'}</span>
          {accountType === '2FA' && <span className="truncate"><b>2FA:</b> {last2FASecret ? 'Set' : '---'}</span>}
          {accountType === 'COOKIES' && <span className="truncate"><b>Cookie:</b> Ready</span>}
        </div>
        <button 
          onClick={handleExtractCookies} 
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded flex items-center gap-1 shrink-0 transition-colors"
          title={`Copy for Google Sheets (${accountType === '2FA' ? 'UID/PASS/2FA' : 'UID/PASS/COOKIES'})`}
        >
          <Copy className="w-3 h-3" /> Sheets
        </button>
      </div>

      {/* Main WebView Area */}
      <div className="flex-1 relative bg-zinc-200">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-zinc-500 pointer-events-none z-0">
          <ShieldAlert className="w-12 h-12 mb-4 text-zinc-400 opacity-50" />
          <p className="font-medium mb-2">WebView Simulation</p>
          <p className="text-sm">If the page fails to load (due to Facebook X-Frame-Options blocking), use the <ExternalLink className="w-3 h-3 inline mx-1" /> button above to open it in a new tab.</p>
        </div>
        
        <iframe 
          key={iframeKey}
          src={currentUrl} 
          className="w-full h-full border-none relative z-10 bg-white"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          title="WebView"
        />
      </div>

      {/* Floating Auto-Fill Button */}
      <button 
        onClick={handleAutoFill}
        className="absolute bottom-20 right-4 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 transition-transform active:scale-95 z-20"
        title="Generate & Copy Random Name/Password"
      >
        <UserPlus className="w-6 h-6" />
      </button>

      {/* Footer Branding */}
      <div className="bg-zinc-900 text-zinc-400 py-2 px-4 text-xs flex items-center justify-between z-10 shrink-0">
        <span>By @Anik_official866</span>
        <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
          YouTube Channel
        </a>
      </div>

      {/* Modals */}
      {show2FAModal && <TwoFactorModal onClose={() => setShow2FAModal(false)} secret={last2FASecret} setSecret={setLast2FASecret} />}
      {showAddShortcut && (
        <AddShortcutModal 
          onClose={() => setShowAddShortcut(false)} 
          onAdd={(s) => setShortcuts([...shortcuts, s])} 
        />
      )}
      {showConfigModal && (
        <AutoFillConfigModal 
          onClose={() => setShowConfigModal(false)}
          customPassword={customPassword}
          setCustomPassword={(p) => { setCustomPassword(p); setLastPassword(p); }}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
        />
      )}
    </div>
  );
}

// --- 2FA Generator Modal ---
type SavedKey = {
  id: string;
  name: string;
  secret: string;
  type: 'TOTP' | 'HOTP';
  counter: number;
};

function TwoFactorModal({ onClose, secret, setSecret }: { onClose: () => void, secret: string, setSecret: (s: string) => void }) {
  const [code, setCode] = useState('------');
  const [timeLeft, setTimeLeft] = useState(30);
  const [type, setType] = useState<'TOTP' | 'HOTP'>('TOTP');
  const [counter, setCounter] = useState(0);
  
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [keyName, setKeyName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('saved2FAKeys');
    if (stored) {
      try {
        setSavedKeys(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved keys');
      }
    }
  }, []);

  useEffect(() => {
    let interval: number;
    
    const updateCode = () => {
      if (!secret.trim()) {
        setCode('------');
        setTimeLeft(30);
        return;
      }
      
      try {
        // Clean the secret (remove spaces)
        const cleanSecret = secret.replace(/\s+/g, '').toUpperCase();
        
        if (type === 'TOTP') {
          let totp = new OTPAuth.TOTP({
            issuer: 'App',
            label: 'User',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(cleanSecret)
          });
          setCode(totp.generate());
          const epoch = Math.floor(Date.now() / 1000);
          setTimeLeft(30 - (epoch % 30));
        } else {
          let hotp = new OTPAuth.HOTP({
            issuer: 'App',
            label: 'User',
            algorithm: 'SHA1',
            digits: 6,
            counter: counter,
            secret: OTPAuth.Secret.fromBase32(cleanSecret)
          });
          setCode(hotp.generate());
          setTimeLeft(30); // Full bar for HOTP
        }
      } catch (e) {
        setCode('ERROR');
        setTimeLeft(0);
      }
    };

    updateCode();
    if (type === 'TOTP') {
      interval = window.setInterval(updateCode, 1000);
    }
    
    return () => clearInterval(interval);
  }, [secret, type, counter]);

  const copyCode = () => {
    if (code !== '------' && code !== 'ERROR') {
      navigator.clipboard.writeText(code);
    }
  };

  const handleSaveKey = () => {
    if (!secret.trim() || !keyName.trim()) return;
    const newKey: SavedKey = {
      id: Date.now().toString(),
      name: keyName.trim(),
      secret: secret.trim(),
      type,
      counter
    };
    const updated = [...savedKeys, newKey];
    setSavedKeys(updated);
    localStorage.setItem('saved2FAKeys', JSON.stringify(updated));
    setKeyName('');
  };

  const handleDeleteKey = (id: string) => {
    const updated = savedKeys.filter(k => k.id !== id);
    setSavedKeys(updated);
    localStorage.setItem('saved2FAKeys', JSON.stringify(updated));
  };

  const handleLoadKey = (k: SavedKey) => {
    setSecret(k.secret);
    setType(k.type);
    if (k.type === 'HOTP') {
      setCounter(k.counter || 0);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]">
        <div className="bg-zinc-800 px-4 py-3 flex items-center justify-between border-b border-zinc-700 rounded-t-2xl shrink-0">
          <h3 className="text-white font-medium flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            2FA Code Generator
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
        </div>
        
        <div className="p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {/* Type Selector */}
          <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
            <button 
              onClick={() => setType('TOTP')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === 'TOTP' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              TOTP (Time)
            </button>
            <button 
              onClick={() => setType('HOTP')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${type === 'HOTP' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              HOTP (Counter)
            </button>
          </div>

          {/* Secret Input */}
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Secret Key</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="e.g. JBSWY3DPEHPK3PXP"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
              <button 
                onClick={() => { if(secret) navigator.clipboard.writeText(secret); }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-xl transition-colors border border-zinc-700 flex items-center justify-center shrink-0"
                title="Copy Secret Key"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* HOTP Counter */}
          {type === 'HOTP' && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs text-zinc-400 mb-1">Counter</label>
                <input 
                  type="number" 
                  value={counter}
                  onChange={(e) => setCounter(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <button 
                onClick={() => setCounter(c => c + 1)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-zinc-700"
              >
                +1
              </button>
            </div>
          )}
          
          <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 flex flex-col items-center justify-center relative">
            <div className="text-4xl font-mono font-bold tracking-widest text-white mb-2">
              {code.slice(0,3)} {code.slice(3)}
            </div>
            
            {code !== '------' && code !== 'ERROR' && type === 'TOTP' && (
              <div className="w-full max-w-[200px] bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              </div>
            )}
            
            <button 
              onClick={copyCode}
              disabled={code === '------' || code === 'ERROR'}
              className="absolute top-2 right-2 p-2 text-zinc-500 hover:text-white disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Save Key Section */}
          <div className="border-t border-zinc-800 pt-4 mt-2">
            <label className="block text-xs text-zinc-400 mb-1">Save this key</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Account name"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button 
                onClick={handleSaveKey}
                disabled={!secret || !keyName}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Saved Keys List */}
          {savedKeys.length > 0 && (
            <div className="border-t border-zinc-800 pt-4">
              <label className="block text-xs text-zinc-400 mb-2">Saved Keys</label>
              <div className="space-y-2">
                {savedKeys.map(k => (
                  <div key={k.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-2">
                    <button 
                      onClick={() => handleLoadKey(k)}
                      className="flex-1 text-left flex flex-col overflow-hidden"
                    >
                      <span className="text-sm text-white font-medium truncate">{k.name}</span>
                      <span className="text-[10px] text-zinc-500 flex gap-2 mt-0.5">
                        <span className="bg-zinc-800 px-1.5 rounded text-zinc-300">{k.type}</span>
                        <span className="truncate font-mono">{k.secret.substring(0, 8)}...</span>
                      </span>
                    </button>
                    <button 
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 rounded-b-2xl shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Config Modal ---
function AutoFillConfigModal({ 
  onClose, customPassword, setCustomPassword, selectedCountry, setSelectedCountry 
}: { 
  onClose: () => void, customPassword: string, setCustomPassword: (p: string) => void, selectedCountry: string, setSelectedCountry: (c: string) => void 
}) {
  const [tempPwd, setTempPwd] = useState(customPassword);
  const [tempCountry, setTempCountry] = useState(selectedCountry);
  const [generatedName, setGeneratedName] = useState('');

  const handleSave = () => {
    setCustomPassword(tempPwd);
    setSelectedCountry(tempCountry);
    localStorage.setItem('customPassword', tempPwd);
    localStorage.setItem('selectedCountry', tempCountry);
    
    const spoof = countrySpoofData[tempCountry];
    if (spoof) {
      alert(`[Anti-Detect Spoofing Applied]\n\nCountry: ${tempCountry}\nTimezone: ${spoof.tz}\nLanguage: ${spoof.lang}\nLocale: ${spoof.locale}\n\nBrowser environment updated to match selected country.`);
    }
    
    onClose();
  };

  const handleGenerateName = () => {
    const data = nameData[tempCountry] || nameData['US'];
    const fName = data.first[Math.floor(Math.random() * data.first.length)];
    const lName = data.last[Math.floor(Math.random() * data.last.length)];
    const fullName = `${fName} ${lName}`;
    setGeneratedName(fullName);
  };

  const handleCopyName = () => {
    if (generatedName) {
      navigator.clipboard.writeText(generatedName);
      alert(`Copied: ${generatedName}`);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-zinc-800 px-4 py-3 flex items-center justify-between border-b border-zinc-700">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            Config & Spoofing
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
        </div>
        
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Custom Password (Optional)</label>
            <input 
              type="text" 
              value={tempPwd}
              onChange={(e) => setTempPwd(e.target.value)}
              placeholder="Leave blank for random passwords"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <p className="text-[10px] text-zinc-500 mt-1">If set, this password will be used for all generated accounts.</p>
          </div>
          
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Browser Country & Spoofing</label>
            <select 
              value={tempCountry}
              onChange={(e) => {
                setTempCountry(e.target.value);
                setGeneratedName(''); // Reset generated name when country changes
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 mb-2"
            >
              {Object.entries(countrySpoofData).map(([code, data]) => (
                <option key={code} value={code}>{data.name}</option>
              ))}
            </select>
            
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-3">
              <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                <Globe className="w-3 h-3 text-blue-400" />
                Active Spoofing Profile
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800/50">
                  <span className="text-zinc-500 block mb-0.5">Timezone</span>
                  <span className="text-blue-400">{countrySpoofData[tempCountry]?.tz || 'Auto'}</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800/50">
                  <span className="text-zinc-500 block mb-0.5">Language</span>
                  <span className="text-green-400">{countrySpoofData[tempCountry]?.lang || 'Auto'}</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800/50 col-span-2">
                  <span className="text-zinc-500 block mb-0.5">Locale</span>
                  <span className="text-purple-400">{countrySpoofData[tempCountry]?.locale || 'Auto'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4 mt-2">
            <label className="block text-xs text-zinc-400 mb-2">Name Generator ({tempCountry})</label>
            <div className="flex gap-2 mb-2">
              <button 
                onClick={handleGenerateName}
                className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-xl py-2 text-sm font-medium transition-colors"
              >
                Generate Name
              </button>
            </div>
            {generatedName && (
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2">
                <span className="flex-1 text-white text-sm truncate">{generatedName}</span>
                <button 
                  onClick={handleCopyName}
                  className="text-zinc-400 hover:text-white p-1"
                  title="Copy Name"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors">Save & Apply</button>
        </div>
      </div>
    </div>
  );
}

function AddShortcutModal({ onClose, onAdd }: { onClose: () => void, onAdd: (s: Shortcut) => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && url) {
      onAdd({
        id: 'custom-' + Date.now(),
        name,
        url,
        icon: <ExternalLink className="w-5 h-5" />
      });
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col">
        <div className="bg-zinc-800 px-4 py-3 flex items-center justify-between border-b border-zinc-700">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            Add Custom Shortcut
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Shortcut Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Tool"
              required
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">URL</label>
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              required
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Add Shortcut
          </button>
        </form>
      </div>
    </div>
  );
}

// Missing icon
function LogOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
