import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Layers,
  Mail,
  Lock,
  User,
  Store,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Zap,
  PackageCheck,
  Sparkles,
  Sun,
  Moon,
  GraduationCap,
  Building,
  MapPin,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const AuthPage = () => {
  const { login, demoLogin, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCollege, setRegCollege] = useState('MNIT Jaipur');
  const [regBranch, setRegBranch] = useState('Computer Science & Engineering');
  const [regYear, setRegYear] = useState('3rd Year');
  const [regHostel, setRegHostel] = useState('Hostel 5 (Room 304)');
  const [regPhone, setRegPhone] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(loginEmail, loginPassword);
      if (!result.success) {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (role = 'STUDENT', email = 'rahul@mnit.ac.in') => {
    setError(null);
    setSubmitting(true);
    try {
      let result;
      if (demoLogin) {
        result = await demoLogin(role, email);
      } else {
        result = await login(email, 'Password123!');
      }
      if (!result.success) {
        setError(result.message || 'Demo login failed');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: regName,
        email: regEmail,
        password: regPassword,
        role: 'STUDENT',
        college: regCollege,
        branch: regBranch,
        year: regYear,
        hostel: regHostel,
        phone: regPhone,
      };

      const result = await register(payload);
      if (!result.success) {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#5B85FA] dark:bg-[#090A10] brutal-grid-bg flex flex-col justify-center items-center px-4 py-12 relative transition-colors duration-200">
      {/* Floating Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#FEF08A] dark:bg-[#FFE600] text-black font-display font-black text-xs border-3 border-black shadow-brutal flex items-center space-x-2 hover:scale-105 active:translate-x-[2px] transition cursor-pointer"
        title="Toggle Light / Dark Theme"
      >
        {isDark ? (
          <>
            <Sun className="w-4 h-4 text-black fill-current" />
            <span>Light Mode ☀️</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4 text-black fill-current" />
            <span>Cyber Dark 🌙</span>
          </>
        )}
      </button>

      {/* Brand Sticker */}
      <div className="text-center mb-6 animate-pop-in">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-[#FEF08A] dark:bg-[#FFE600] border-3 border-black shadow-brutal-lg mb-2 rotate-[-2deg]">
          <span className="w-9 h-9 rounded-xl bg-black text-[#FFE600] font-black font-display flex items-center justify-center text-lg border-2 border-black mr-2">
            CX
          </span>
          <span className="font-display font-black text-2xl text-black tracking-tight">CampusExchange</span>
        </div>
        <div className="block space-y-1">
          <p className="text-xs font-mono font-bold bg-white dark:bg-[#1A1E30] text-black dark:text-white px-3.5 py-1 rounded-full border-2 border-black shadow-brutal-sm inline-block">
            🎓 Buy. Sell. Reuse. Within Your Campus.
          </p>
          <div className="text-[11px] font-mono text-white dark:text-slate-300 font-bold drop-shadow">
            MNIT Jaipur Campus Network • 0% Platform Fee • Zero Shipping • In-Person Hand-Offs
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg animate-pop-in">
        <div className="bg-white dark:bg-[#121522] border-3 border-black rounded-3xl shadow-brutal-xl p-6 sm:p-8 space-y-5 text-black dark:text-white transition-colors">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-[#F3F4F6] dark:bg-[#1A1E30] p-1.5 rounded-2xl border-2 border-black">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2.5 rounded-xl text-xs font-display font-black transition border-2 border-black ${
                mode === 'login'
                  ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black shadow-brutal-sm'
                  : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              Student Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-2.5 rounded-xl text-xs font-display font-black transition border-2 border-black ${
                mode === 'register'
                  ? 'bg-[#FEF08A] dark:bg-[#FFE600] text-black shadow-brutal-sm'
                  : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              New Student Account
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FF6B97]/20 dark:bg-[#FF2A85]/20 border-2 border-black flex items-center gap-2.5 text-xs font-bold text-black dark:text-white shadow-brutal-sm">
              <AlertCircle className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── Login Form ─── */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs font-bold">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-mono tracking-wider text-black dark:text-slate-300">College / Student Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black dark:text-white" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@mnit.ac.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white placeholder-slate-400 font-semibold shadow-brutal-sm focus:bg-[#FEFCE8] dark:focus:bg-[#252A42] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-mono tracking-wider text-black dark:text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black dark:text-white" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white placeholder-slate-400 font-semibold shadow-brutal-sm focus:bg-[#FEFCE8] dark:focus:bg-[#252A42] focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black dark:text-white hover:opacity-70"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-[#FEF08A] hover:bg-[#FDE047] dark:bg-[#FFE600] dark:hover:bg-[#FFF500] text-black font-display font-black text-sm border-2.5 border-black shadow-brutal flex items-center justify-center space-x-2 transition hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Entering Campus...' : (
                  <>
                    <span>Enter CampusExchange</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Student Demo Login */}
              <div className="p-3.5 bg-[#EBF3FE] dark:bg-[#1A1E30] border-2 border-black rounded-2xl text-xs space-y-2 text-black dark:text-slate-300">
                <div className="font-bold flex items-center space-x-1.5 text-black dark:text-white">
                  <Sparkles className="w-4 h-4 text-[#5B85FA] dark:text-[#FFE600]" />
                  <span className="font-display font-black text-xs uppercase tracking-wide">Student Demo Login</span>
                </div>
                <p className="text-[11px] font-sans font-medium text-black/70 dark:text-slate-300">
                  Explore Campus Exchange with a demo student account.
                </p>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemoLogin('STUDENT', 'rahul@mnit.ac.in')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#6EE7B7] hover:bg-[#34D399] dark:bg-[#00FF87] text-black font-display font-black text-xs border-2 border-black shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Try Student Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* ─── Register Form ─── */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-black dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-semibold shadow-brutal-sm focus:bg-[#FEFCE8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-black dark:text-slate-300">College Email *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="priya@mnit.ac.in"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-semibold shadow-brutal-sm focus:bg-[#FEFCE8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-black dark:text-slate-300">Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-mono shadow-brutal-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-black dark:text-slate-300">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-mono shadow-brutal-sm"
                  />
                </div>
              </div>

              {/* Campus Credentials Section */}
              <div className="p-3 bg-amber-50 dark:bg-[#1A1E30] border-2 border-black rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-display font-black text-black dark:text-white">
                  <GraduationCap className="w-4 h-4 text-[#5B85FA]" />
                  <span>Campus Verification Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-black dark:text-slate-300">College / Institute</label>
                    <select
                      value={regCollege}
                      onChange={(e) => setRegCollege(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121522] border-2 border-black text-black dark:text-white text-xs font-semibold"
                    >
                      <option value="MNIT Jaipur">MNIT Jaipur</option>
                      <option value="IIT Delhi">IIT Delhi</option>
                      <option value="BITS Pilani">BITS Pilani</option>
                      <option value="NIT Trichy">NIT Trichy</option>
                      <option value="Other Campus">Other Campus</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-black dark:text-slate-300">Academic Year</label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121522] border-2 border-black text-black dark:text-white text-xs font-semibold"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-black dark:text-slate-300">Branch / Major</label>
                    <input
                      type="text"
                      value={regBranch}
                      onChange={(e) => setRegBranch(e.target.value)}
                      placeholder="e.g. Electrical Engineering"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121522] border-2 border-black text-black dark:text-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-mono tracking-wider text-black dark:text-slate-300">Hostel & Room #</label>
                    <input
                      type="text"
                      value={regHostel}
                      onChange={(e) => setRegHostel(e.target.value)}
                      placeholder="Hostel 4, Room 102"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121522] border-2 border-black text-black dark:text-white text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-mono tracking-wider text-black dark:text-slate-300">WhatsApp / Campus Phone</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210 (For hand-off coordination)"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121522] border-2 border-black text-black dark:text-white text-xs font-semibold"
                  />
                </div>
              </div>



              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-[#6EE7B7] hover:bg-[#34D399] dark:bg-[#00FF87] text-black font-display font-black text-sm border-2.5 border-black shadow-brutal flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2 cursor-pointer"
              >
                {submitting ? 'Creating Campus Account...' : (
                  <>
                    <span>Join CampusExchange</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
