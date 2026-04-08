'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, MailCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const inputCls =
  'w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl pl-10 pr-4 py-3.5 text-[15px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-violet dark:focus:border-violet transition-colors placeholder:text-muted dark:placeholder:text-muted-dark';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ─── Password strength ──────────────────────────────────────────────────── */
function passwordStrength(pwd: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pwd.length === 0) return { level: 0, label: '',        color: 'transparent' };
  if (pwd.length < 8)   return { level: 1, label: 'Weak',   color: '#FF7B72' };
  if (pwd.length < 12)  return { level: 2, label: 'Fair',   color: '#F5A524' };
  return                       { level: 3, label: 'Strong', color: '#3EC99A' };
}

/* ─── Success state ──────────────────────────────────────────────────────── */
function CheckEmailCard({ email }: { email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-sm bg-surface dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-border dark:border-border-dark text-center"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: 'linear-gradient(135deg, #7C6EF820, #3EC99A20)' }}
      >
        <MailCheck size={28} className="text-mint" />
      </div>
      <h2 className="text-[20px] font-bold font-display text-text dark:text-text-dark mb-2">
        Check your email
      </h2>
      <p className="text-[13px] text-muted dark:text-muted-dark leading-relaxed">
        We sent a confirmation link to
      </p>
      <p className="text-[14px] font-semibold text-text dark:text-text-dark mt-1 mb-5 break-all">
        {email}
      </p>
      <p className="text-[12px] text-muted dark:text-muted-dark mb-6">
        Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
      </p>
      <Link
        href="/login"
        className="block w-full py-3.5 rounded-xl text-white font-semibold text-[14px] text-center"
        style={{ background: 'linear-gradient(135deg, #7C6EF8, #6457e0)' }}
      >
        Back to Sign In
      </Link>
    </motion.div>
  );
}

/* ─── Sign-up Page ───────────────────────────────────────────────────────── */
export default function SignUpPage() {
  const [name,          setName]          = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [confirm,       setConfirm]       = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [confirmed,     setConfirmed]     = useState(false); // show check-email state

  const router   = useRouter();
  const supabase = createClient();
  const strength = passwordStrength(password);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() || undefined },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation disabled — user is immediately signed in
      router.push('/dashboard');
      router.refresh();
    } else {
      // Email confirmation required
      setConfirmed(true);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark flex flex-col items-center justify-center px-5 py-12">

      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-8 text-center"
      >
        <h1
          className="text-5xl font-black font-display tracking-tight mb-1"
          style={{
            background: 'linear-gradient(135deg, #7C6EF8, #3EC99A)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          LYFE
        </h1>
        <p className="text-[14px] text-muted dark:text-muted-dark">Your personal life manager</p>
      </motion.div>

      {/* Check-email success state */}
      {confirmed ? (
        <CheckEmailCard email={email} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
          className="w-full max-w-sm bg-surface dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-border dark:border-border-dark"
        >
          <h2 className="text-[20px] font-bold font-display text-text dark:text-text-dark mb-1">
            Create account
          </h2>
          <p className="text-[13px] text-muted dark:text-muted-dark mb-6">
            Start managing your life today
          </p>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2.5 bg-coral/10 text-coral rounded-xl px-3.5 py-3 mb-4 text-[13px] font-medium overflow-hidden"
              >
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-3 mb-4">

            {/* Full Name */}
            <div className="relative">
              <User
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark pointer-events-none"
              />
              <input
                type="text"
                autoComplete="name"
                placeholder="Full name (optional)"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark pointer-events-none"
              />
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null); }}
                className={inputCls}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  className={`${inputCls} pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark hover:text-text dark:hover:text-text-dark transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        className="h-1 flex-1 rounded-full"
                        animate={{
                          backgroundColor: i <= strength.level ? strength.color : 'var(--color-border)',
                        }}
                        transition={{ duration: 0.25 }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-[11px] font-semibold w-10 text-right"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark pointer-events-none"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(null); }}
                className={`${inputCls} pr-11 ${
                  confirm.length > 0 && confirm !== password
                    ? 'border-coral/50 focus:border-coral dark:focus:border-coral'
                    : ''
                }`}
                required
              />
              {/* Match indicator */}
              {confirm.length > 0 && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold">
                  {confirm === password ? (
                    <span style={{ color: '#3EC99A' }}>✓</span>
                  ) : (
                    <span style={{ color: '#FF7B72' }}>✗</span>
                  )}
                </span>
              )}
            </div>

            {/* Create Account button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={loading || googleLoading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-[15px] flex items-center justify-center transition-opacity disabled:opacity-60 mt-1"
              style={{ background: 'linear-gradient(135deg, #7C6EF8, #6457e0)' }}
            >
              {loading ? <Spinner /> : 'Create Account'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
            <span className="text-[12px] text-muted dark:text-muted-dark font-medium">or</span>
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
          </div>

          {/* Google */}
          <motion.button
            onClick={handleGoogleSignUp}
            whileTap={{ scale: 0.97 }}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-surface-2 dark:bg-surface-2-dark border border-border dark:border-border-dark text-text dark:text-text-dark font-semibold text-[14px] transition-colors hover:bg-border/40 dark:hover:bg-border-dark/60 disabled:opacity-60"
          >
            {googleLoading ? (
              <svg className="animate-spin h-5 w-5 text-muted dark:text-muted-dark" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </motion.button>

          {/* Sign in link */}
          <p className="text-center text-[13px] text-muted dark:text-muted-dark mt-5">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-accent dark:text-violet hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      )}

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-[12px] text-muted dark:text-muted-dark text-center"
      >
        By signing up you agree to our Terms &amp; Privacy Policy
      </motion.p>
    </div>
  );
}
