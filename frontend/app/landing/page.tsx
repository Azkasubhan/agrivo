'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

/* ── tiny hook: in-view for fade-in animations with mount fallback ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold }
    );
    obs.observe(el);

    // Fallback: force visibility after 600ms in case observer fails to trigger due to scroll-restoration
    const fallback = setTimeout(() => {
      setVisible(true);
    }, 600);

    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold]);

  return { ref, visible };
}

const FEATURES = [
  { icon: '🌾', title: 'AI Irrigation Recommendation', desc: 'Our model analyzes soil moisture, rainfall forecasts, and crop growth stage to recommend the optimal irrigation strategy—updated daily.', img: '/irrigation-water.png', side: 'right' },
  { icon: '🌤️', title: 'Weather Intelligence', desc: '7-day hyper-local forecast integrated directly into decisions. Rain events automatically adjust recommendations before you even open the app.', img: '/rice-field-editorial.png', side: 'left' },
  { icon: '🛰️', title: 'Field Monitoring', desc: "Track every plot's soil moisture, temperature, and nutrient levels. Know the exact status of each paddy at a glance.", img: '/rice-terraces-hero.png', side: 'right' },
  { icon: '🌍', title: 'Environmental Impact', desc: 'Measure your methane reduction, N₂O emissions, and net GWP savings. Every decision comes with a sustainability score.', img: '/rice-harvest-golden.png', side: 'left' },
];

const EDU_ARTICLES = [
  { title: 'Alternate Wetting & Drying', tag: 'Technique', img: '/irrigation-water.png', time: '5 min read' },
  { title: 'Continuous Flooding Methods', tag: 'Traditional', img: '/rice-field-editorial.png', time: '4 min read' },
  { title: 'Partial Irrigation Strategy', tag: 'Advanced', img: '/rice-terraces-hero.png', time: '6 min read' },
  { title: 'Climate Adaptation in Rice', tag: 'Research', img: '/rice-harvest-golden.png', time: '8 min read' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const about = useInView();
  const features = useInView(0.05);
  const rec = useInView();
  const env = useInView();
  const edu = useInView(0.05);
  const testi = useInView();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="agrivo-landing">

      {/* ── NAV ──────────────────────────────────────────────── */}
      <header className={`ag-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="ag-nav-inner">
          <Link href="/landing" className="ag-logo">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3c1.1 0 2 .9 2 2v1h-4V7c0-1.1.9-2 2-2zm3 9H7v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1z" fill="currentColor"/>
            </svg>
            AGRIVO
          </Link>

          <nav className="ag-nav-links">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#recommendation">AI Engine</a>
            <a href="#education">Learn</a>
          </nav>

          <div className="ag-nav-actions">
            <Link href="/dashboard" className="ag-btn-ghost">Sign in</Link>
            <Link href="/dashboard" className="ag-btn-pill">Get Started →</Link>
          </div>

          <button className="ag-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span/><span/><span/>
          </button>
        </div>
        {menuOpen && (
          <div className="ag-mobile-menu">
            {['About','Features','AI Engine','Learn'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ','')}`} onClick={() => setMenuOpen(false)}>{l}</a>
            ))}
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="ag-btn-pill" style={{alignSelf:'flex-start'}}>Open Dashboard →</Link>
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="home" className="ag-hero">
        <div className="ag-hero-bg">
          <Image src="/rice-terraces-hero.png" alt="Rice terraces at golden hour" fill className="ag-hero-img" priority />
          <div className="ag-hero-fade" />
        </div>

        {/* Floating stat cards */}
        <div className="ag-hero-stats">
          {[
            { label: 'Water Saved', value: '38%', sub: 'vs. continuous flood' },
            { label: 'Active Farmers', value: '12,400+', sub: 'across Indonesia' },
            { label: 'GWP Reduction', value: '24%', sub: 'net greenhouse gas' },
            { label: 'AI Accuracy', value: '92%', sub: 'recommendation precision' },
          ].map((s, i) => (
            <div key={s.label} className="ag-stat-card" style={{ animationDelay: `${i * 0.5}s` }}>
              <div className="ag-stat-value">{s.value}</div>
              <div className="ag-stat-label">{s.label}</div>
              <div className="ag-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main hero copy */}
        <div className="ag-hero-copy">
          <div className="ag-hero-eyebrow">Climate-Smart Agriculture · AI-Powered</div>
          <h1 className="ag-hero-h1">
            Climate-Smart<br />Irrigation,<br />Powered by AI.
          </h1>
          <p className="ag-hero-desc">
            AGRIVO helps rice farmers choose the optimal irrigation strategy based on real-time weather data, soil conditions, and crop growth stage — reducing water use and greenhouse gas emissions.
          </p>
          <div className="ag-hero-ctas">
            <Link href="/dashboard" className="ag-cta-primary">Get Recommendation →</Link>
            <a href="#features" className="ag-cta-secondary">Explore Platform</a>
          </div>
        </div>

        {/* Animated Rice Stalks Overlay */}
        <div className="ag-hero-rice-anim">
          <svg viewBox="0 0 100 150" className="ag-rice-svg">
            <g className="ag-rice-sway" style={{ animationDelay: '0s' }}>
              <path d="M50 150 Q45 80 50 10 Q50 30 55 50" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
              <path d="M50 30 Q35 40 40 50 Q45 55 50 45" fill="rgba(255,255,255,0.35)"/>
              <path d="M52 60 Q65 70 60 80 Q55 85 52 75" fill="rgba(255,255,255,0.35)"/>
            </g>
            <g className="ag-rice-sway" style={{ animationDelay: '1.2s' }}>
              <path d="M70 150 Q80 90 65 20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              <path d="M65 40 Q55 50 58 60 Q63 62 67 55" fill="rgba(255,255,255,0.2)"/>
            </g>
            <g className="ag-rice-sway" style={{ animationDelay: '0.6s' }}>
              <path d="M30 150 Q20 100 35 40" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
              <path d="M33 60 Q45 70 42 80 Q37 82 32 75" fill="rgba(255,255,255,0.25)"/>
            </g>
          </svg>
        </div>

        <div className="ag-hero-scroll">
          <span>Scroll to explore</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none"><rect x="6.5" y="2" width="3" height="8" rx="1.5" fill="white" opacity="0.7"/><path d="M8 18L4 14h8l-4 4z" fill="white" opacity="0.7"/></svg>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────── */}
      <section id="about" className="ag-about" ref={about.ref}>
        <div className={`ag-about-inner${about.visible ? ' visible' : ''}`}>
          <div className="ag-about-text">
            <div className="ag-section-eyebrow">About AGRIVO</div>
            <h2 className="ag-section-h2">A decision support platform, not an automation system.</h2>
            <p className="ag-body-text">
              AGRIVO is built for farmers who want to farm smarter—not replace their instincts. 
              Our AI engine synthesizes climate forecasts, soil sensor data, and decades of agronomic 
              research to surface the one recommendation that matters most today.
            </p>
            <p className="ag-body-text" style={{marginTop:'1rem'}}>
              We believe the future of sustainable rice farming is data-informed decisions made by 
              empowered farmers—not autonomous machines.
            </p>
            <Link href="/dashboard" className="ag-link-arrow">Explore the platform →</Link>
          </div>
          <div className="ag-about-img-wrap">
            <div className="ag-about-img-frame">
              <Image src="/rice-field-editorial.png" alt="Rice paddy fields" fill className="ag-rounded-img" />
            </div>
            <div className="ag-about-badge">
              <span className="ag-badge-num">12,400+</span>
              <span className="ag-badge-txt">Farmers Trust AGRIVO</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="ag-features" ref={features.ref}>
        <div className="ag-features-header">
          <div className="ag-section-eyebrow">Platform Features</div>
          <h2 className="ag-section-h2-center">Every tool a<br />rice farmer needs.</h2>
        </div>

        {FEATURES.map((f, i) => (
          <div key={f.title} className={`ag-feature-row${features.visible ? ' visible' : ''}`} style={{animationDelay:`${i*0.1}s`}}>
            {f.side === 'right' ? (
              <>
                <div className="ag-feature-text">
                  <div className="ag-feature-icon">{f.icon}</div>
                  <h3 className="ag-feature-h3">{f.title}</h3>
                  <p className="ag-body-text">{f.desc}</p>
                  <Link href="/dashboard" className="ag-link-arrow">Learn more →</Link>
                </div>
                <div className="ag-feature-img-wrap">
                  <Image src={f.img} alt={f.title} fill className="ag-rounded-img" />
                </div>
              </>
            ) : (
              <>
                <div className="ag-feature-img-wrap">
                  <Image src={f.img} alt={f.title} fill className="ag-rounded-img" />
                </div>
                <div className="ag-feature-text">
                  <div className="ag-feature-icon">{f.icon}</div>
                  <h3 className="ag-feature-h3">{f.title}</h3>
                  <p className="ag-body-text">{f.desc}</p>
                  <Link href="/dashboard" className="ag-link-arrow">Learn more →</Link>
                </div>
              </>
            )}
          </div>
        ))}
      </section>

      {/* ── AI RECOMMENDATION SHOWCASE ───────────────────────── */}
      <section id="recommendation" className="ag-rec-section" ref={rec.ref}>
        <div className={`ag-rec-inner${rec.visible ? ' visible' : ''}`}>
          <div className="ag-rec-left">
            {/* Main rec card */}
            <div className="ag-rec-card">
              <div className="ag-rec-card-header">
                <div className="ag-rec-tag">Today's Recommendation</div>
                <div className="ag-confidence">
                  <div className="ag-confidence-ring">
                    <svg viewBox="0 0 64 64" width="64" height="64">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#E8E2D9" strokeWidth="4"/>
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#14532D" strokeWidth="4"
                        strokeDasharray={`${2*Math.PI*28*0.92} ${2*Math.PI*28*0.08}`}
                        strokeDashoffset={2*Math.PI*28*0.25} strokeLinecap="round"/>
                    </svg>
                    <span className="ag-conf-pct">92%</span>
                  </div>
                  <span className="ag-conf-label">Confidence</span>
                </div>
              </div>
              <div className="ag-rec-strategy">
                <div className="ag-strategy-icon">🌾</div>
                <div>
                  <div className="ag-strategy-label">Recommended Strategy</div>
                  <div className="ag-strategy-name">Alternate Wetting &amp; Drying</div>
                </div>
              </div>
              <p className="ag-rec-explanation">
                Based on current soil moisture (74%), the 3-day forecast (no rain expected), and your crop being in 
                the tillering stage, AGRIVO recommends AWD. Allow the field to dry until the water level drops 
                15 cm below surface, then re-flood. This cycle saves significant water with no yield penalty.
              </p>
              {/* Timeline */}
              <div className="ag-timeline">
                {[
                  { day: 'Day 1–3', action: 'Allow field to dry naturally' },
                  { day: 'Day 4', action: 'Check water level (15cm below surface)' },
                  { day: 'Day 5', action: 'Re-flood to 2–5 cm depth' },
                  { day: 'Day 8', action: 'Repeat drying cycle' },
                ].map((t,i) => (
                  <div key={i} className="ag-timeline-item">
                    <div className="ag-timeline-dot" />
                    <div className="ag-timeline-day">{t.day}</div>
                    <div className="ag-timeline-action">{t.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 metric mini-cards */}
            <div className="ag-rec-metrics">
              {[
                { icon: '💧', value: '38%', label: 'Water Saving', color: '#e8f4fd' },
                { icon: '🌾', value: '5.8 t/ha', label: 'Yield Prediction', color: '#f0f7ec' },
                { icon: '🌍', value: '−24%', label: 'Net GWP', color: '#faf3e8' },
              ].map(m => (
                <div key={m.label} className="ag-metric-mini" style={{background: m.color}}>
                  <div className="ag-metric-mini-icon">{m.icon}</div>
                  <div className="ag-metric-mini-val">{m.value}</div>
                  <div className="ag-metric-mini-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ag-rec-right">
            <div className="ag-section-eyebrow">AI Engine</div>
            <h2 className="ag-section-h2">One clear recommendation, every morning.</h2>
            <p className="ag-body-text">
              AGRIVO synthesizes dozens of data streams into a single, actionable recommendation 
              delivered to every farmer before 6 AM. No dashboards to parse. No jargon. 
              Just clear guidance in your language.
            </p>
            <div className="ag-rec-data-sources">
              {['Soil Moisture Sensor','7-Day Weather Forecast','Crop Growth Stage','Historical Yield Data','GWP Database'].map(s => (
                <div key={s} className="ag-data-source">
                  <div className="ag-data-dot" />
                  {s}
                </div>
              ))}
            </div>
            <div className="ag-whatsapp-note">
              <span>📱</span>
              <span>Delivered via <strong>WhatsApp</strong> in Bahasa Indonesia — no app download required.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENVIRONMENTAL IMPACT ─────────────────────────────── */}
      <section id="impact" className="ag-env-section" ref={env.ref}>
        <div className={`ag-env-inner${env.visible ? ' visible' : ''}`}>
          <div className="ag-env-header">
            <div className="ag-section-eyebrow" style={{color:'#DCC9A3'}}>Environmental Impact</div>
            <h2 className="ag-env-h2">Farming that<br />heals the planet.</h2>
          </div>

          <div className="ag-env-metrics">
            {[
              { icon: '🌿', label: 'Methane Reduction', value: '−32%', sub: 'CH₄ vs. continuous flood', bg: 'rgba(255,255,255,0.06)' },
              { icon: '⚗️', label: 'N₂O Increase', value: '+8%', sub: 'Partial N₂O offset', bg: 'rgba(255,255,255,0.06)' },
              { icon: '🌍', label: 'Net GWP', value: '−24%', sub: 'Net global warming potential', bg: 'rgba(255,255,255,0.08)' },
              { icon: '💧', label: 'Water Saving', value: '38%', sub: 'Per growing season', bg: 'rgba(255,255,255,0.06)' },
            ].map(m => (
              <div key={m.label} className="ag-env-card" style={{background: m.bg}}>
                <div className="ag-env-icon">{m.icon}</div>
                <div className="ag-env-value">{m.value}</div>
                <div className="ag-env-label">{m.label}</div>
                <div className="ag-env-sub">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="ag-env-chart-row">
            <div className="ag-env-chart">
              <div className="ag-env-chart-label">GWP Impact Comparison (kg CO₂-eq / ha)</div>
              {[
                { label: 'Continuous Flooding', value: 100, color: '#787878' },
                { label: 'AGRIVO AWD Strategy', value: 76, color: '#5A6F45' },
                { label: 'Partial Irrigation', value: 88, color: '#DCC9A3' },
              ].map(b => (
                <div key={b.label} className="ag-bar-row">
                  <span className="ag-bar-label">{b.label}</span>
                  <div className="ag-bar-track">
                    <div className="ag-bar-fill" style={{width:`${b.value}%`, background: b.color}} />
                  </div>
                  <span className="ag-bar-val">{b.value}%</span>
                </div>
              ))}
            </div>
            <div className="ag-env-text">
              <p className="ag-body-text" style={{color:'rgba(255,255,255,0.75)'}}>
                The IPCC recognizes Alternate Wetting and Drying as one of the highest-impact interventions 
                available to rice farmers. AGRIVO makes AWD implementation practical at scale.
              </p>
              <p className="ag-body-text" style={{color:'rgba(255,255,255,0.75)', marginTop:'1rem'}}>
                Partnered with the International Rice Research Institute (IRRI) and calibrated 
                against 8 years of field trial data across Java, Sumatra, and Sulawesi.
              </p>
              <Link href="/dashboard" className="ag-btn-light" style={{marginTop:'2rem', display:'inline-flex'}}>View Full Impact Report →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── EDUCATION ────────────────────────────────────────── */}
      <section id="education" className="ag-edu-section" ref={edu.ref}>
        <div className="ag-edu-header">
          <div className="ag-section-eyebrow">Learning Hub</div>
          <h2 className="ag-section-h2-center">Grow your knowledge<br />alongside your rice.</h2>
        </div>
        <div className={`ag-edu-grid${edu.visible ? ' visible' : ''}`}>
          {EDU_ARTICLES.map((a,i) => (
            <div key={a.title} className="ag-edu-card" style={{animationDelay:`${i*0.08}s`}}>
              <div className="ag-edu-img-wrap">
                <Image src={a.img} alt={a.title} fill className="ag-edu-img" />
                <div className="ag-edu-img-overlay" />
              </div>
              <div className="ag-edu-body">
                <div className="ag-edu-tag">{a.tag}</div>
                <h3 className="ag-edu-title">{a.title}</h3>
                <div className="ag-edu-meta">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL ──────────────────────────────────────── */}
      <section className="ag-testi-section" ref={testi.ref}>
        <div className="ag-testi-img-wrap">
          <Image src="/farmer-portrait.png" alt="Pak Slamet, rice farmer" fill className="ag-testi-img" />
          <div className="ag-testi-overlay" />
        </div>
        <div className={`ag-testi-content${testi.visible ? ' visible' : ''}`}>
          <div className="ag-quote-mark">"</div>
          <blockquote className="ag-quote">
            Before AGRIVO, I used water based on habit. Now I use data. My water bill dropped by 
            a third, and my yield didn't change at all. It's the most useful thing on my phone.
          </blockquote>
          <div className="ag-testi-person">
            <div className="ag-testi-name">Pak Slamet Riyadi</div>
            <div className="ag-testi-role">Rice Farmer · Klaten, Central Java · 4.2 hectares</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="ag-footer">
        <div className="ag-footer-bg-wrap">
          <Image src="/rice-harvest-golden.png" alt="" fill className="ag-footer-bg-img" />
          <div className="ag-footer-bg-fade" />
        </div>
        <div className="ag-footer-inner">
          <div className="ag-footer-brand">
            <div className="ag-footer-logo">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 3c1.1 0 2 .9 2 2v1h-4V7c0-1.1.9-2 2-2zm3 9H7v-1c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1z" fill="currentColor"/>
              </svg>
              AGRIVO
            </div>
            <p className="ag-footer-desc">
              Climate-smart irrigation intelligence for rice farmers across Southeast Asia.
            </p>
            <div className="ag-footer-socials">
              {['f','𝕏','ig','in'].map(s => <a key={s} href="#">{s}</a>)}
            </div>
          </div>
          {[
            { heading: 'PLATFORM', links: ['Dashboard','Recommendations','Field Analysis','Weather','Profile'] },
            { heading: 'COMPANY', links: ['About Us','Research','Partners','Press','Contact'] },
            { heading: 'RESOURCES', links: ['Documentation','Blog','Research Papers','API','Status'] },
          ].map(col => (
            <div key={col.heading} className="ag-footer-col">
              <h4>{col.heading}</h4>
              {col.links.map(l => <a key={l} href="#">{l}</a>)}
            </div>
          ))}
        </div>
        <div className="ag-footer-bottom">
          <span>© 2025 AGRIVO. All rights reserved.</span>
          <Link href="/dashboard" className="ag-footer-cta">Open Platform →</Link>
        </div>
      </footer>

      {/* ── STYLES ───────────────────────────────────────────── */}
      <style>{`
        .agrivo-landing {
          font-family: 'Inter', system-ui, sans-serif;
          background: #FAF8F3;
          color: #161616;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .ag-nav {
          position: fixed; top:0; left:0; right:0; z-index:100;
          padding: 1.25rem 0;
          transition: background .3s, box-shadow .3s;
        }
        .ag-nav.scrolled {
          background: rgba(250,248,243,0.95);
          backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 #E8E2D9;
        }
        .ag-nav-inner {
          max-width: 1320px; margin:0 auto; padding:0 2.5rem;
          display:flex; align-items:center; gap:2.5rem;
        }
        .ag-logo {
          display:flex; align-items:center; gap:.6rem;
          font-size:1.05rem; font-weight:800; letter-spacing:.08em;
          color:#161616; text-decoration:none;
          flex-shrink:0;
        }
        .ag-nav-links {
          display:flex; gap:2rem; margin:0 auto;
        }
        .ag-nav-links a {
          font-size:.875rem; font-weight:500; color:#787878;
          text-decoration:none; transition:color .2s;
        }
        .ag-nav-links a:hover { color:#14532D; }
        .ag-nav-actions { display:flex; gap:.75rem; align-items:center; flex-shrink:0; }
        .ag-btn-ghost {
          font-size:.875rem; font-weight:500; color:#161616;
          text-decoration:none; padding:.5rem 1rem; transition:color .2s;
        }
        .ag-btn-ghost:hover { color:#14532D; }
        .ag-btn-pill {
          font-size:.875rem; font-weight:600; color:#fff;
          background:#14532D; text-decoration:none;
          padding:.55rem 1.25rem; border-radius:999px;
          transition:background .2s, transform .2s;
        }
        .ag-btn-pill:hover { background:#0f3d21; transform:translateY(-1px); }
        .ag-hamburger {
          display:none; flex-direction:column; gap:5px;
          background:none; border:none; cursor:pointer; margin-left:auto; padding:4px;
        }
        .ag-hamburger span { display:block; width:22px; height:2px; background:#161616; border-radius:4px; }
        .ag-mobile-menu {
          background:#FAF8F3; border-top:1px solid #E8E2D9;
          padding:1.5rem 2.5rem; display:flex; flex-direction:column; gap:1rem;
        }
        .ag-mobile-menu a { font-size:1rem; font-weight:500; color:#161616; text-decoration:none; }

        /* ── HERO ── */
        .ag-hero {
          position:relative; height:100vh; min-height:700px;
          display:flex; flex-direction:column;
          justify-content:flex-end; overflow:hidden;
        }
        .ag-hero-bg { position:absolute; inset:0; overflow:hidden; }
        .ag-hero-img { object-fit:cover; animation: zoomBg 25s linear infinite alternate; }
        @keyframes zoomBg {
          from { transform: scale(1); }
          to { transform: scale(1.1); }
        }
        .ag-hero-fade {
          position:absolute; inset:0;
          background: linear-gradient(
            180deg,
            rgba(0,0,0,0.05) 0%,
            rgba(0,0,0,0.3) 50%,
            rgba(0,0,0,0.72) 100%
          );
        }
        .ag-hero-stats {
          position:absolute; top:50%; right:3rem;
          transform:translateY(-50%);
          display:flex; flex-direction:column; gap:1rem;
          z-index:2;
        }
        .ag-stat-card {
          background:rgba(255,255,255,0.12);
          backdrop-filter:blur(12px);
          border:1px solid rgba(255,255,255,0.2);
          border-radius:16px; padding:1rem 1.25rem;
          min-width:170px; color:#fff;
          transition:background .2s;
          animation: floatFloat 6s ease-in-out infinite;
        }
        @keyframes floatFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .ag-stat-card:hover { background:rgba(255,255,255,0.18); animation-play-state: paused; }
        .ag-stat-value { font-size:1.75rem; font-weight:800; letter-spacing:-.02em; }
        .ag-stat-label { font-size:.75rem; font-weight:600; opacity:.85; margin:.15rem 0; }
        .ag-stat-sub { font-size:.7rem; opacity:.55; }
        .ag-hero-copy {
          position:relative; z-index:2;
          padding: 0 3rem 4rem; max-width:780px;
        }
        .ag-hero-eyebrow {
          font-size:.75rem; font-weight:600; letter-spacing:.12em;
          color:rgba(255,255,255,.6); margin-bottom:1.25rem;
          text-transform:uppercase;
        }
        .ag-hero-h1 {
          font-size: clamp(3rem,6vw,5.5rem);
          font-weight:900; line-height:1.05;
          letter-spacing:-.03em; color:#fff;
          margin:0 0 1.5rem;
        }
        .ag-hero-desc {
          font-size:1.05rem; color:rgba(255,255,255,.75);
          line-height:1.7; max-width:520px; margin-bottom:2rem;
        }
        .ag-hero-ctas { display:flex; gap:1rem; flex-wrap:wrap; }
        .ag-cta-primary {
          display:inline-flex; align-items:center; gap:.5rem;
          font-size:.95rem; font-weight:600; color:#161616;
          background:#FAF8F3; text-decoration:none;
          padding:.9rem 2rem; border-radius:999px;
          transition:transform .2s, box-shadow .2s;
          box-shadow:0 4px 20px rgba(0,0,0,0.25);
        }
        .ag-cta-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.3); }
        .ag-cta-secondary {
          display:inline-flex; align-items:center; font-size:.95rem; font-weight:500;
          color:#fff; border:1.5px solid rgba(255,255,255,.5);
          text-decoration:none; padding:.88rem 2rem; border-radius:999px;
          transition:border-color .2s, background .2s;
        }
        .ag-cta-secondary:hover { border-color:#fff; background:rgba(255,255,255,.08); }
        .ag-hero-scroll {
          position:absolute; bottom:2rem; left:50%; transform:translateX(-50%);
          display:flex; flex-direction:column; align-items:center; gap:.5rem;
          color:rgba(255,255,255,.5); font-size:.7rem; letter-spacing:.1em;
          text-transform:uppercase; z-index:2;
          animation:scrollPulse 2s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%,100% { opacity:.4; transform:translateX(-50%) translateY(0); }
          50% { opacity:.8; transform:translateX(-50%) translateY(4px); }
        }

        .ag-hero-rice-anim {
          position:absolute; bottom:0; left:5%; z-index:2;
          width: 120px; height: 180px; pointer-events: none;
        }
        .ag-rice-svg { width: 100%; height: 100%; }
        .ag-rice-sway {
          transform-origin: 50% 100%;
          animation: riceSway 4s ease-in-out infinite alternate;
        }
        @keyframes riceSway {
          0% { transform: rotate(-5deg); }
          100% { transform: rotate(7deg); }
        }

        /* ── SHARED SECTION TOKENS ── */
        .ag-section-eyebrow {
          font-size:.72rem; font-weight:700; letter-spacing:.14em;
          color:#14532D; text-transform:uppercase; margin-bottom:1rem;
        }
        .ag-section-h2 {
          font-size:clamp(2rem,4vw,3.25rem); font-weight:800;
          line-height:1.1; letter-spacing:-.025em; color:#161616;
          margin:0 0 1.5rem;
        }
        .ag-section-h2-center {
          font-size:clamp(2rem,4vw,3.25rem); font-weight:800;
          line-height:1.1; letter-spacing:-.025em; color:#161616;
          margin:0 0 1.5rem; text-align:center;
        }
        .ag-body-text {
          font-size:1rem; color:#787878; line-height:1.75;
        }
        .ag-link-arrow {
          display:inline-flex; align-items:center; gap:.4rem;
          font-size:.9rem; font-weight:600; color:#14532D;
          text-decoration:none; margin-top:1.75rem;
          border-bottom:1.5px solid #14532D; padding-bottom:.15rem;
          transition:gap .2s;
        }
        .ag-link-arrow:hover { gap:.7rem; }

        /* ── ABOUT ── */
        .ag-about {
          padding:7rem 2.5rem;
          max-width:1320px; margin:0 auto;
        }
        .ag-about-inner {
          display:grid; grid-template-columns:1fr 1fr; gap:6rem;
          align-items:center;
          opacity:0; transform:translateY(32px);
          transition:opacity .7s ease, transform .7s ease;
        }
        .ag-about-inner.visible { opacity:1; transform:none; }
        .ag-about-img-wrap {
          position:relative; height:560px;
        }
        .ag-about-img-frame {
          position:relative; width:100%; height:100%;
          border-radius:28px; overflow:hidden;
          box-shadow:0 24px 60px rgba(0,0,0,0.14);
        }
        .ag-rounded-img { object-fit:cover; border-radius:28px; }
        .ag-about-badge {
          position:absolute; bottom:-1.5rem; left:-1.5rem;
          background:#FAF8F3; border:1px solid #E8E2D9;
          border-radius:16px; padding:1.25rem 1.5rem;
          box-shadow:0 8px 24px rgba(0,0,0,0.1);
        }
        .ag-badge-num { display:block; font-size:1.75rem; font-weight:800; color:#14532D; }
        .ag-badge-txt { font-size:.8rem; color:#787878; font-weight:500; }

        /* ── FEATURES ── */
        .ag-features { background:#FAF8F3; padding:7rem 2.5rem; }
        .ag-features-header {
          text-align:center; max-width:600px;
          margin:0 auto 5rem;
        }
        .ag-feature-row {
          max-width:1200px; margin:0 auto 5rem;
          display:grid; grid-template-columns:1fr 1fr; gap:5rem;
          align-items:center;
          opacity:0; transform:translateY(28px);
          animation:none;
        }
        .ag-feature-row.visible {
          animation:fadeUp .6s ease forwards;
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:none; }
        }
        .ag-feature-text { display:flex; flex-direction:column; gap:.5rem; }
        .ag-feature-icon { font-size:2rem; margin-bottom:.5rem; }
        .ag-feature-h3 {
          font-size:clamp(1.5rem,2.5vw,2.25rem); font-weight:800;
          letter-spacing:-.02em; color:#161616; margin:0;
        }
        .ag-feature-img-wrap {
          position:relative; height:440px;
          border-radius:28px; overflow:hidden;
          box-shadow:0 16px 48px rgba(0,0,0,0.12);
        }

        /* ── AI REC SECTION ── */
        .ag-rec-section { background:#fff; padding:7rem 2.5rem; }
        .ag-rec-inner {
          max-width:1200px; margin:0 auto;
          display:grid; grid-template-columns:1fr 1fr; gap:5rem;
          align-items:start;
          opacity:0; transform:translateY(28px);
          transition:opacity .7s ease, transform .7s ease;
        }
        .ag-rec-inner.visible { opacity:1; transform:none; }
        .ag-rec-card {
          background:#FAF8F3; border-radius:24px;
          border:1px solid #E8E2D9; padding:2rem;
          box-shadow:0 8px 32px rgba(0,0,0,0.07);
        }
        .ag-rec-card-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
        .ag-rec-tag {
          font-size:.7rem; font-weight:700; letter-spacing:.12em;
          text-transform:uppercase; color:#14532D;
          background:#e8f5ee; padding:.35rem .8rem; border-radius:999px;
        }
        .ag-confidence { display:flex; flex-direction:column; align-items:center; gap:.25rem; }
        .ag-confidence-ring { position:relative; }
        .ag-conf-pct {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          font-size:.9rem; font-weight:800; color:#14532D;
        }
        .ag-conf-label { font-size:.65rem; color:#787878; font-weight:600; }
        .ag-rec-strategy {
          display:flex; align-items:center; gap:1rem;
          background:#fff; border-radius:16px; padding:1.25rem;
          margin-bottom:1.25rem; border:1px solid #E8E2D9;
        }
        .ag-strategy-icon { font-size:1.75rem; }
        .ag-strategy-label { font-size:.72rem; color:#787878; font-weight:500; }
        .ag-strategy-name { font-size:1.1rem; font-weight:800; color:#14532D; }
        .ag-rec-explanation { font-size:.875rem; color:#787878; line-height:1.7; margin-bottom:1.5rem; }
        .ag-timeline { display:flex; flex-direction:column; gap:.75rem; }
        .ag-timeline-item {
          display:grid; grid-template-columns:12px 80px 1fr; gap:.75rem;
          align-items:center; font-size:.8rem;
        }
        .ag-timeline-dot { width:10px; height:10px; border-radius:50%; background:#14532D; flex-shrink:0; }
        .ag-timeline-day { color:#14532D; font-weight:700; }
        .ag-timeline-action { color:#787878; }
        .ag-rec-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-top:1rem; }
        .ag-metric-mini {
          border-radius:16px; padding:1.25rem 1rem; text-align:center;
          border:1px solid rgba(0,0,0,0.05);
        }
        .ag-metric-mini-icon { font-size:1.5rem; margin-bottom:.5rem; }
        .ag-metric-mini-val { font-size:1.4rem; font-weight:800; color:#161616; }
        .ag-metric-mini-label { font-size:.72rem; color:#787878; margin-top:.2rem; }
        .ag-rec-right { padding-top:1rem; }
        .ag-rec-data-sources { display:flex; flex-direction:column; gap:.65rem; margin-top:1.75rem; }
        .ag-data-source {
          display:flex; align-items:center; gap:.75rem;
          font-size:.875rem; color:#787878; font-weight:500;
        }
        .ag-data-dot { width:6px; height:6px; border-radius:50%; background:#14532D; flex-shrink:0; }
        .ag-whatsapp-note {
          display:flex; align-items:flex-start; gap:.75rem;
          margin-top:2rem; padding:1.25rem; border-radius:14px;
          background:#f0f7ec; border:1px solid #c8dfc0;
          font-size:.875rem; color:#5A6F45; line-height:1.6;
        }

        /* ── ENV SECTION ── */
        .ag-env-section {
          background:#14532D; color:#fff; padding:7rem 2.5rem;
        }
        .ag-env-inner {
          max-width:1200px; margin:0 auto;
          opacity:0; transform:translateY(28px);
          transition:opacity .7s ease, transform .7s ease;
        }
        .ag-env-inner.visible { opacity:1; transform:none; }
        .ag-env-header { margin-bottom:4rem; }
        .ag-env-h2 {
          font-size:clamp(2.5rem,5vw,4.5rem); font-weight:900;
          line-height:1.05; letter-spacing:-.03em; color:#fff; margin:0;
        }
        .ag-env-metrics {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:1.25rem; margin-bottom:4rem;
        }
        .ag-env-card {
          border:1px solid rgba(255,255,255,0.12); border-radius:20px;
          padding:1.75rem 1.5rem;
        }
        .ag-env-icon { font-size:1.75rem; margin-bottom:1rem; }
        .ag-env-value { font-size:2.25rem; font-weight:900; color:#fff; }
        .ag-env-label { font-size:.8rem; font-weight:700; color:rgba(255,255,255,.7); margin:.3rem 0 .15rem; }
        .ag-env-sub { font-size:.72rem; color:rgba(255,255,255,.45); }
        .ag-env-chart-row { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:start; }
        .ag-env-chart { display:flex; flex-direction:column; gap:1.25rem; }
        .ag-env-chart-label { font-size:.72rem; color:rgba(255,255,255,.5); margin-bottom:.5rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; }
        .ag-bar-row { display:grid; grid-template-columns:1fr 180px 40px; gap:1rem; align-items:center; }
        .ag-bar-label { font-size:.8rem; color:rgba(255,255,255,.7); }
        .ag-bar-track { height:6px; background:rgba(255,255,255,.15); border-radius:999px; overflow:hidden; }
        .ag-bar-fill { height:100%; border-radius:999px; transition:width 1s ease; }
        .ag-bar-val { font-size:.8rem; color:rgba(255,255,255,.6); font-weight:600; }
        .ag-btn-light {
          display:inline-flex; align-items:center; gap:.4rem;
          font-size:.9rem; font-weight:600; color:#14532D;
          background:#FAF8F3; text-decoration:none;
          padding:.8rem 1.75rem; border-radius:999px;
          transition:background .2s, transform .2s;
        }
        .ag-btn-light:hover { background:#fff; transform:translateY(-2px); }

        /* ── EDUCATION ── */
        .ag-edu-section { padding:7rem 2.5rem; background:#FAF8F3; }
        .ag-edu-header { text-align:center; max-width:600px; margin:0 auto 4rem; }
        .ag-edu-grid {
          max-width:1200px; margin:0 auto;
          display:grid; grid-template-columns:repeat(4,1fr); gap:1.5rem;
        }
        .ag-edu-card {
          border-radius:24px; overflow:hidden; background:#fff;
          box-shadow:0 4px 16px rgba(0,0,0,0.07);
          cursor:pointer; transition:transform .25s, box-shadow .25s;
          opacity:0; transform:translateY(24px);
        }
        .ag-edu-grid.visible .ag-edu-card {
          animation:fadeUp .5s ease forwards;
        }
        .ag-edu-card:hover { transform:translateY(-6px); box-shadow:0 16px 40px rgba(0,0,0,0.13); }
        .ag-edu-img-wrap { position:relative; height:200px; overflow:hidden; }
        .ag-edu-img { object-fit:cover; transition:transform .4s ease; }
        .ag-edu-card:hover .ag-edu-img { transform:scale(1.06); }
        .ag-edu-img-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.12); }
        .ag-edu-body { padding:1.25rem; }
        .ag-edu-tag {
          font-size:.68rem; font-weight:700; letter-spacing:.1em;
          text-transform:uppercase; color:#14532D; margin-bottom:.5rem;
        }
        .ag-edu-title { font-size:1rem; font-weight:700; color:#161616; margin:0 0 .75rem; line-height:1.3; }
        .ag-edu-meta { font-size:.75rem; color:#787878; }

        /* ── TESTIMONIAL ── */
        .ag-testi-section {
          position:relative; min-height:600px;
          display:flex; align-items:center; justify-content:center;
        }
        .ag-testi-img-wrap { position:absolute; inset:0; }
        .ag-testi-img { object-fit:cover; }
        .ag-testi-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.58); }
        .ag-testi-content {
          position:relative; z-index:1; max-width:680px;
          padding:5rem 3rem; text-align:center; color:#fff;
          opacity:0; transform:translateY(24px);
          transition:opacity .7s ease, transform .7s ease;
        }
        .ag-testi-content.visible { opacity:1; transform:none; }
        .ag-quote-mark { font-size:6rem; line-height:.8; color:rgba(255,255,255,.2); font-family:Georgia,serif; }
        .ag-quote {
          font-size:clamp(1.25rem,2.5vw,1.75rem); font-weight:400;
          line-height:1.5; color:#fff; margin:0 0 2rem;
          font-style:italic; letter-spacing:-.01em;
        }
        .ag-testi-name { font-size:1rem; font-weight:700; color:#fff; }
        .ag-testi-role { font-size:.8rem; color:rgba(255,255,255,.55); margin-top:.25rem; }

        /* ── FOOTER ── */
        .ag-footer { position:relative; padding:6rem 2.5rem 2rem; overflow:hidden; }
        .ag-footer-bg-wrap { position:absolute; inset:0; }
        .ag-footer-bg-img { object-fit:cover; opacity:.18; }
        .ag-footer-bg-fade {
          position:absolute; inset:0;
          background:linear-gradient(to bottom, #1a1a1a 0%, #161616 100%);
        }
        .ag-footer-inner {
          position:relative; z-index:1;
          max-width:1200px; margin:0 auto;
          display:grid; grid-template-columns:2fr 1fr 1fr 1fr;
          gap:3rem; margin-bottom:4rem;
        }
        .ag-footer-logo {
          display:flex; align-items:center; gap:.6rem;
          font-size:1.1rem; font-weight:800; letter-spacing:.08em;
          color:#fff; margin-bottom:1rem;
        }
        .ag-footer-desc { font-size:.85rem; color:rgba(255,255,255,.5); line-height:1.7; margin-bottom:1.5rem; }
        .ag-footer-socials { display:flex; gap:.75rem; }
        .ag-footer-socials a {
          width:34px; height:34px; border-radius:50%;
          border:1px solid rgba(255,255,255,.15);
          display:flex; align-items:center; justify-content:center;
          font-size:.75rem; font-weight:700; color:rgba(255,255,255,.55);
          text-decoration:none; transition:border-color .2s, color .2s;
        }
        .ag-footer-socials a:hover { border-color:rgba(255,255,255,.4); color:#fff; }
        .ag-footer-col h4 {
          font-size:.68rem; font-weight:700; letter-spacing:.12em;
          color:rgba(255,255,255,.35); margin:0 0 1.25rem; text-transform:uppercase;
        }
        .ag-footer-col a {
          display:block; font-size:.875rem; color:rgba(255,255,255,.55);
          text-decoration:none; margin-bottom:.6rem; transition:color .2s;
        }
        .ag-footer-col a:hover { color:#fff; }
        .ag-footer-bottom {
          position:relative; z-index:1; max-width:1200px; margin:0 auto;
          padding-top:2rem; border-top:1px solid rgba(255,255,255,.08);
          display:flex; justify-content:space-between; align-items:center;
          font-size:.8rem; color:rgba(255,255,255,.35);
        }
        .ag-footer-cta {
          font-size:.875rem; font-weight:600; color:#DCC9A3;
          text-decoration:none; transition:color .2s;
        }
        .ag-footer-cta:hover { color:#fff; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .ag-hero-stats { position:static; flex-direction:row; flex-wrap:wrap; padding:2rem 1.5rem; gap:.75rem; transform:none; }
          .ag-stat-card { flex:1; min-width:140px; }
          .ag-hero-copy { padding:1rem 1.5rem 3rem; }
          .ag-about-inner, .ag-rec-inner { grid-template-columns:1fr; gap:3rem; }
          .ag-about-img-wrap { height:380px; }
          .ag-feature-row { grid-template-columns:1fr; gap:2rem; }
          .ag-feature-img-wrap { height:300px; }
          .ag-env-metrics { grid-template-columns:repeat(2,1fr); }
          .ag-env-chart-row { grid-template-columns:1fr; }
          .ag-edu-grid { grid-template-columns:repeat(2,1fr); }
          .ag-footer-inner { grid-template-columns:1fr 1fr; gap:2rem; }
          .ag-footer-brand { grid-column:1/-1; }
        }
        @media (max-width: 768px) {
          .ag-nav-links, .ag-nav-actions { display:none; }
          .ag-hamburger { display:flex; }
          .ag-hero-h1 { font-size:clamp(2.2rem,8vw,3.5rem); }
          .ag-env-metrics { grid-template-columns:repeat(2,1fr); }
          .ag-edu-grid { grid-template-columns:1fr 1fr; }
          .ag-testi-content { padding:3rem 1.5rem; }
          .ag-footer-inner { grid-template-columns:1fr; }
          .ag-bar-row { grid-template-columns:1fr 100px 36px; }
        }
        @media (max-width: 480px) {
          .ag-edu-grid { grid-template-columns:1fr; }
          .ag-env-metrics { grid-template-columns:1fr; }
          .ag-rec-metrics { grid-template-columns:1fr; }
          .ag-hero-stats { flex-direction:column; }
          .ag-footer-bottom { flex-direction:column; gap:1rem; }
        }
      `}</style>
    </div>
  );
}
