'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Smartphone, LayoutGrid } from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: '✅',
    color: '#7C6EF8',
    bg: '#7C6EF815',
    name: 'Smart Tasks',
    desc: 'Priorities, due dates, recurring tasks, and a streak system to keep you consistent every day.',
  },
  {
    icon: '🎯',
    color: '#3EC99A',
    bg: '#3EC99A15',
    name: 'Goal Tracking',
    desc: 'Set goals with milestones, track progress, and watch your streaks grow as you hit each checkpoint.',
  },
  {
    icon: '💪',
    color: '#F5A524',
    bg: '#F5A52415',
    name: 'Workouts',
    desc: 'Log sessions, build multi-week programs, and track your fitness journey from day one.',
  },
  {
    icon: '📅',
    color: '#5BAFEF',
    bg: '#5BAFEF15',
    name: 'Daily Schedule',
    desc: "A visual 24-hour timeline gives you a bird's-eye view of your entire day at a glance.",
  },
  {
    icon: '🛒',
    color: '#FF7B72',
    bg: '#FF7B7215',
    name: 'Supplies',
    desc: 'Smart refill tracking with usage-based reminders so you never run out of the essentials.',
  },
  {
    icon: '💡',
    color: '#F07FC6',
    bg: '#F07FC615',
    name: 'Ideas',
    desc: 'Capture sparks of inspiration anytime. Convert ideas into goals or tasks with one tap.',
  },
];

const PILLARS = [
  {
    icon: <Zap size={22} />,
    color: '#F5A524',
    bg: '#F5A52415',
    title: 'Streak-Driven',
    desc: 'Daily streaks make progress addictive. Stay consistent across goals, tasks, and habits — your best self is one streak away.',
  },
  {
    icon: <Smartphone size={22} />,
    color: '#7C6EF8',
    bg: '#7C6EF815',
    title: 'Mobile-First',
    desc: 'Built to feel like a native app — fluid animations, swipe gestures, safe-area insets, and instant feedback everywhere.',
  },
  {
    icon: <LayoutGrid size={22} />,
    color: '#3EC99A',
    bg: '#3EC99A15',
    title: 'All in One',
    desc: 'No more juggling five apps. Tasks, goals, workouts, schedule, supplies and ideas — one place, one flow.',
  },
];

/* ─── Shared animation config ────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 24 },
  whileInView:{ opacity: 1, y: 0  },
  viewport:   { once: true },
  transition: { duration: 0.5, ease: 'easeOut' as const, delay },
});

/* ─── Phone Mockup ───────────────────────────────────────────────────────────── */
function PhoneMockup() {
  const tasks = [
    { icon: '🧘', color: '#F5A524', label: 'Morning meditation', done: true  },
    { icon: '🏃', color: '#7C6EF8', label: 'Evening run — 8K',   done: false },
    { icon: '📚', color: '#3EC99A', label: 'Read for 30 minutes', done: false },
  ];

  return (
    <div className="relative w-[270px] sm:w-[300px] mx-auto select-none">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 blur-3xl opacity-30 scale-110"
        style={{ background: 'radial-gradient(ellipse at 50% 60%, #7C6EF8 0%, #3EC99A 60%, transparent 80%)' }}
      />

      {/* Phone frame */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotateY: -6 }}
        animate={{ opacity: 1, y: 0,  rotateY: -6 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        style={{
          background: '#0D0D12',
          borderRadius: '44px',
          border: '2px solid #2A2A3A',
          height: '540px',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Dynamic Island */}
        <div
          className="mx-auto mt-3 mb-1"
          style={{
            width: 120, height: 34,
            background: '#000',
            borderRadius: 20,
          }}
        />

        <div className="px-4 space-y-3">
          {/* Greeting */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Wednesday, Apr 8</p>
            <p style={{ color: '#EAE9F4', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>
              Good morning ☀️
            </p>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: '🔥', value: '12', label: 'day streak',   color: '#F5A524' },
              { icon: '✅', value: '3/6', label: 'tasks done',  color: '#3EC99A' },
              { icon: '🎯', value: '4',  label: 'goals active', color: '#7C6EF8' },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  background: '#171722',
                  borderRadius: 14,
                  padding: '8px 6px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 16 }}>{s.icon}</div>
                <div style={{ color: s.color, fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-outfit)' }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tasks */}
          <div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Today&apos;s Tasks
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tasks.map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: '#171722',
                    borderRadius: 12,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      flexShrink: 0,
                      background: t.done ? t.color : 'transparent',
                      border: t.done ? 'none' : `1.5px solid ${t.color}60`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {t.done && <span style={{ color: '#fff', fontSize: 9 }}>✓</span>}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      color: t.done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
                      fontSize: 11,
                      textDecoration: t.done ? 'line-through' : 'none',
                    }}
                  >
                    {t.label}
                  </span>
                  <span style={{ fontSize: 13 }}>{t.icon}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal card */}
          <div style={{ background: '#171722', borderRadius: 14, padding: '10px 12px', borderLeft: '3px solid #7C6EF8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600 }}>🏃 Run a Marathon</span>
              <span style={{ color: '#7C6EF8', fontSize: 10, fontWeight: 700 }}>40%</span>
            </div>
            <div style={{ height: 4, background: '#2A2A3A', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, #7C6EF8, #3EC99A)', borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 64,
            background: '#171722',
            borderTop: '1px solid #2A2A3A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingInline: 8,
          }}
        >
          {['🏠', '✅', '🎯', '💪', '👤'].map((icon, i) => (
            <div
              key={i}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: i === 0 ? 1 : 0.28 }}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              {i === 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7C6EF8' }} />}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────────── */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/80 dark:bg-bg-dark/80 border-b border-border dark:border-border-dark">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <span
          className="text-2xl font-black font-display tracking-tight"
          style={{ background: 'linear-gradient(135deg, #7C6EF8, #3EC99A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          LYFE
        </span>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[14px] font-semibold text-muted dark:text-muted-dark hover:text-text dark:hover:text-text-dark transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-[13px] font-semibold shadow-sm transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7C6EF8, #6457e0)' }}
          >
            Get Started
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Landing Page ───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg dark:bg-bg-dark">
      <Navbar />

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — copy */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 mb-6">
                <span
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border"
                  style={{ color: '#7C6EF8', borderColor: '#7C6EF830', background: '#7C6EF810' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
                  Personal Life Manager
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1 {...fadeUp(0.07)} className="text-[44px] sm:text-[56px] lg:text-[64px] font-black font-display leading-[1.05] tracking-tight text-text dark:text-text-dark mb-5">
                Your{' '}
                <span
                  style={{ background: 'linear-gradient(135deg, #7C6EF8, #3EC99A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  LYFE
                </span>
                ,<br />
                beautifully<br />
                organized.
              </motion.h1>

              {/* Subtitle */}
              <motion.p {...fadeUp(0.14)} className="text-[16px] sm:text-[18px] text-muted dark:text-muted-dark leading-relaxed max-w-md mx-auto lg:mx-0 mb-8">
                Goals, tasks, workouts, and streaks — all in one place, built for momentum. Stop managing chaos. Start building the life you want.
              </motion.p>

              {/* CTAs */}
              <motion.div {...fadeUp(0.2)} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-white text-[15px] font-semibold shadow-lg transition-opacity hover:opacity-90 active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, #7C6EF8, #3EC99A)' }}
                >
                  Start for Free
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-7 py-4 rounded-2xl text-[15px] font-semibold text-text dark:text-text-dark bg-surface dark:bg-surface-dark border border-border dark:border-border-dark hover:bg-surface-2 dark:hover:bg-surface-2-dark transition-colors"
                >
                  Sign In
                </Link>
              </motion.div>

              {/* Social proof chips */}
              <motion.div {...fadeUp(0.26)} className="flex items-center gap-4 mt-8 justify-center lg:justify-start flex-wrap">
                {['6 core features', 'Streak-driven', 'Mobile-first PWA'].map(t => (
                  <span key={t} className="text-[12px] text-muted dark:text-muted-dark flex items-center gap-1.5">
                    <span className="text-mint">✓</span> {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right — phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
              className="flex justify-center lg:justify-end"
              style={{ perspective: '900px' }}
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────────── */}
        <section className="bg-surface dark:bg-surface-dark border-y border-border dark:border-border-dark py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">

            <motion.div {...fadeUp(0)} className="text-center mb-14">
              <p className="text-[12px] font-semibold text-muted dark:text-muted-dark uppercase tracking-[0.15em] mb-3">
                Everything you need
              </p>
              <h2 className="text-[32px] sm:text-[40px] font-black font-display text-text dark:text-text-dark tracking-tight">
                One app. Six superpowers.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.name}
                  {...fadeUp(i * 0.06)}
                  className="bg-bg dark:bg-bg-dark rounded-2xl p-5 border border-border dark:border-border-dark hover:border-violet/40 dark:hover:border-violet/40 transition-colors group"
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-[22px] mb-4 transition-transform group-hover:scale-110 duration-300"
                    style={{ background: f.bg }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-[15px] font-bold text-text dark:text-text-dark mb-1.5"
                    style={{ fontFamily: 'var(--font-outfit)' }}>
                    {f.name}
                  </h3>
                  <p className="text-[13px] text-muted dark:text-muted-dark leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why LYFE ────────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">

            <motion.div {...fadeUp(0)} className="text-center mb-14">
              <p className="text-[12px] font-semibold text-muted dark:text-muted-dark uppercase tracking-[0.15em] mb-3">
                Why LYFE
              </p>
              <h2 className="text-[32px] sm:text-[40px] font-black font-display text-text dark:text-text-dark tracking-tight">
                Built differently.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {PILLARS.map((p, i) => (
                <motion.div
                  key={p.title}
                  {...fadeUp(i * 0.1)}
                  className="bg-surface dark:bg-surface-dark rounded-2xl p-6 border border-border dark:border-border-dark text-center"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: p.bg, color: p.color }}
                  >
                    {p.icon}
                  </div>
                  <h3 className="text-[17px] font-bold font-display text-text dark:text-text-dark mb-2">
                    {p.title}
                  </h3>
                  <p className="text-[13px] text-muted dark:text-muted-dark leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ──────────────────────────────────────────────────── */}
        <section className="py-20 sm:py-28 bg-surface dark:bg-surface-dark border-t border-border dark:border-border-dark">
          <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center">
            <motion.div {...fadeUp(0)}>
              <div className="text-5xl mb-5">🚀</div>
              <h2 className="text-[32px] sm:text-[44px] font-black font-display text-text dark:text-text-dark tracking-tight mb-4">
                Ready to manage your{' '}
                <span style={{ background: 'linear-gradient(135deg, #7C6EF8, #3EC99A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  LYFE?
                </span>
              </h2>
              <p className="text-[16px] text-muted dark:text-muted-dark mb-8 leading-relaxed">
                Join today and take control of your goals, tasks, and daily routine — all in one beautiful app.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white text-[16px] font-bold shadow-xl transition-opacity hover:opacity-90 active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #7C6EF8, #3EC99A)' }}
              >
                Create Your Account — Free
                <ArrowRight size={18} />
              </Link>
              <p className="text-[12px] text-muted dark:text-muted-dark mt-4">
                No credit card required.{' '}
                <Link href="/login" className="underline hover:text-text dark:hover:text-text-dark transition-colors">
                  Already have an account?
                </Link>
              </p>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border dark:border-border-dark">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="text-xl font-black font-display tracking-tight"
            style={{ background: 'linear-gradient(135deg, #7C6EF8, #3EC99A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            LYFE
          </span>
          <div className="flex items-center gap-6 text-[13px] text-muted dark:text-muted-dark">
            <Link href="/login"  className="hover:text-text dark:hover:text-text-dark transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-text dark:hover:text-text-dark transition-colors">Sign Up</Link>
          </div>
          <p className="text-[12px] text-muted dark:text-muted-dark">
            © {new Date().getFullYear()} LYFE. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
