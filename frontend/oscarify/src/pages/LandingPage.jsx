import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Spline from '@splinetool/react-spline'

function LandingPage() {
  const observerRef = useRef(null)
  const splineRef = useRef(null)
  const intervalRef = useRef(null)

  function onSplineLoad(splineApp) {
    splineRef.current = splineApp

    // Find all objects so we can emit on each interactive one
    const allObjects = splineApp.getAllObjects()
    const objectNames = allObjects.map((obj) => obj.name)
    console.log('Spline objects:', objectNames)

    let isActive = false
    intervalRef.current = setInterval(() => {
      if (!splineRef.current) return
      // Toggle: emitEvent triggers Base→State, emitEventReverse triggers State→Base
      allObjects.forEach((obj) => {
        if (isActive) {
          splineRef.current.emitEventReverse('mouseDown', obj.name)
        } else {
          splineRef.current.emitEvent('mouseDown', obj.name)
        }
      })
      isActive = !isActive
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    document.querySelectorAll('.lp-reveal, .lp-reveal-left, .lp-reveal-right, .lp-reveal-scale').forEach((el) => {
      observerRef.current.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div className="lp-root">

      {/* ── HEADER ── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <Link to="/" className="lp-logo">
            <svg className="lp-logo-icon" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
              <path d="M10 13h16M10 18h12M10 23h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36">
                  <stop offset="0%" stopColor="#7B5EA7"/>
                  <stop offset="100%" stopColor="#4A3570"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="lp-logo-name">Oscarify.ai</span>
          </Link>

          <nav className="lp-nav">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#pricing" className="lp-nav-link">Pricing</a>
            <a href="#reviews" className="lp-nav-link">Reviews</a>
            <a href="#blog" className="lp-nav-link">Blog</a>
          </nav>

          <div className="lp-nav-actions">
            <Link to="/login" className="lp-btn lp-btn-ghost">Log in</Link>
            <Link to="/login" className="lp-btn lp-btn-cta">Start free</Link>
          </div>
        </div>
      </header>


      {/* ── HERO ── */}
      <section className="lp-hero">
        {/* ambient blobs */}
        <div className="lp-blob lp-blob-1" aria-hidden="true"/>
        <div className="lp-blob lp-blob-2" aria-hidden="true"/>
        <div className="lp-blob lp-blob-3" aria-hidden="true"/>

        <div className="lp-hero-inner">
          {/* LEFT col */}
          <div className="lp-hero-text">

            <h1 className="lp-hero-title">
              Write worlds.<br/>
              <span className="lp-gradient-text">Live stories.</span>
            </h1>

            <p className="lp-hero-sub">
              Oscarify.ai is the AI creative partner built for writers — not just a tool,
              but a collaborator that knows your characters, your world, and your voice.
              Write faster, deeper, and with confidence.
            </p>

            <div className="lp-hero-btns">
              <Link to="/login" className="lp-btn lp-btn-cta lp-btn-lg">
                Start writing free
                <span className="lp-btn-arrow">→</span>
              </Link>
              <button className="lp-btn lp-btn-outline lp-btn-lg">
                <span className="lp-play-icon">▷</span>
                Watch demo
              </button>
            </div>

          </div>

          {/* RIGHT col — 3D model mount */}
          <div className="lp-hero-3d-wrap">
            <div className="lp-orb-outer">
              {/* 3D Spline scene */}
              <div
                className="lp-model-mount"
                id="Oscarify.ai-3d-scene"
                style={{ width: '100%', height: 640, borderRadius: 24, overflow: 'hidden', position: 'relative' }}
              >
                {/* extra height + negative bottom offset crops the Spline watermark */}
                <div style={{ position: 'absolute', inset: 0, bottom: -50, overflow: 'hidden' }}>
                  <Spline
                    scene="https://prod.spline.design/FHDl58Mlb7rEEP3D/scene.splinecode"
                    style={{ width: '100%', height: 'calc(100% + 50px)' }}
                    onLoad={onSplineLoad}
                  />
                </div>
              </div>
              <div className="lp-orb-glow" aria-hidden="true"/>
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div className="lp-scroll-cue" aria-hidden="true">
          <div className="lp-scroll-mouse"><div className="lp-scroll-dot"/></div>
        </div>
      </section>

      {/* ── LOGOS ── */}
      <section className="lp-logos lp-reveal">
        <p className="lp-logos-label">As featured in</p>
        <div className="lp-logos-row">
          {['The Verge','Wired','TechCrunch','The Atlantic','Forbes'].map((n) => (
            <span key={n} className="lp-logo-pill">{n}</span>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features">
        <div className="lp-section-head lp-reveal">
          <span className="lp-eyebrow">Features</span>
          <h2 className="lp-section-title">Everything your story needs</h2>
          <p className="lp-section-sub">Six powerful tools — one unified writing experience.</p>
        </div>

        <div className="lp-features-grid">
          {[
            { icon: '✍️', color: '#7B5EA7', title: 'Write', desc: 'AI-powered continuations that match your tone and keep the momentum going.' },
            { icon: '📖', color: '#9070C8', title: 'Describe', desc: 'Turn sparse notes into vivid, sensory-rich prose with a single click.' },
            { icon: '🎭', color: '#7B5EA7', title: 'Brainstorm', desc: 'Explore plot twists, character arcs, and world details you never considered.' },
            { icon: '🔄', color: '#6A9E7A', title: 'Rewrite', desc: 'Rephrase any passage — change tone, length, or style while keeping your intent.' },
            { icon: '📊', color: '#C79A3A', title: 'Feedback', desc: 'Real-time pacing and prose analysis before you share with a single reader.' },
            { icon: '🧠', color: '#4A3570', title: 'Story Bible', desc: 'A living document that tracks every character, place, and rule in your world.' },
          ].map((f, i) => (
            <div key={f.title} className="lp-feature-card lp-reveal-scale" style={{ '--delay': `${i * 0.08}s` }}>
              <div className="lp-feature-icon-wrap" style={{ '--clr': f.color }}>
                <span className="lp-feature-icon">{f.icon}</span>
              </div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
              <div className="lp-feature-line" style={{ '--clr': f.color }}/>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how" id="pricing">
        <div className="lp-section-head lp-reveal">
          <span className="lp-eyebrow">How it works</span>
          <h2 className="lp-section-title">From blank page to final draft</h2>
        </div>
        <div className="lp-steps">
          {[
            { n: '01', title: 'Set up your story', desc: 'Fill in your Story Bible — genres, characters, world rules. Oscarify.ai learns your universe.' },
            { n: '02', title: 'Write with AI', desc: 'Open the editor and write naturally. Use Oscarify.ai to suggest, continue, or rework any passage.' },
            { n: '03', title: 'Refine & publish', desc: 'Get pacing feedback, consistency checks, and export a clean manuscript.' },
          ].map((s, i) => (
            <div key={s.n} className="lp-step lp-reveal-left" style={{ '--delay': `${i * 0.12}s` }}>
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-body">
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
              {i < 2 && <div className="lp-step-connector" aria-hidden="true"/>}
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-testimonials" id="reviews">
        <div className="lp-section-head lp-reveal">
          <span className="lp-eyebrow">Reviews</span>
          <h2 className="lp-section-title">Stories behind the stories</h2>
        </div>
        <div className="lp-testi-grid">
          {[
            { quote: "\u201cOscarify.ai completely changed my writing process. I\u2019ve written more in the past month than in the entire previous year.\u201d", name: 'Sarah Mitchell', role: 'Fantasy Author', initials: 'SM', clr: '#7B5EA7' },
            { quote: "\u201cThe brainstorming tools are incredible. When I\u2019m stuck, Oscarify.ai always surfaces ideas that genuinely fit my story.\u201d", name: 'James Chen', role: 'Screenwriter', initials: 'JC', clr: '#9070C8' },
            { quote: "\u201cI was skeptical about AI writing tools, but Oscarify.ai understands creative writing in a way nothing else does.\u201d", name: 'Emily Rodriguez', role: 'Romance Novelist', initials: 'ER', clr: '#4A3570' },
          ].map((t, i) => (
            <div key={t.name} className="lp-testi-card lp-reveal-scale" style={{ '--delay': `${i * 0.1}s` }}>
              <div className="lp-testi-stars">{'★★★★★'}</div>
              <p className="lp-testi-quote">{t.quote}</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar" style={{ '--clr': t.clr }}>{t.initials}</div>
                <div>
                  <div className="lp-testi-name">{t.name}</div>
                  <div className="lp-testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-banner lp-reveal-scale">
        <div className="lp-cta-blob" aria-hidden="true"/>
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title">Your story is waiting.<br/>Don't keep it.</h2>
          <p className="lp-cta-sub">Join 12,000+ writers — no credit card required.</p>
          <Link to="/login" className="lp-btn lp-btn-cta lp-btn-lg">
            Start writing free
            <span className="lp-btn-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <Link to="/" className="lp-logo">
              <svg className="lp-logo-icon" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#logoGrad2)"/>
                <path d="M10 13h16M10 18h12M10 23h14" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="logoGrad2" x1="0" y1="0" x2="36" y2="36">
                    <stop offset="0%" stopColor="#7B5EA7"/>
                    <stop offset="100%" stopColor="#4A3570"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="lp-logo-name">Oscarify.ai</span>
            </Link>
            <p className="lp-footer-tagline">The AI writing partner for storytellers.</p>
          </div>

          {[
            { title: 'Product', links: [['Features','#features'],['Pricing','#pricing'],['Roadmap','#']] },
            { title: 'Resources', links: [['Blog','#blog'],['Help Center','#'],['Community','#']] },
            { title: 'Company', links: [['About','#'],['Careers','#'],['Contact','#']] },
            { title: 'Legal', links: [['Privacy','#'],['Terms','#']] },
          ].map((col) => (
            <div key={col.title} className="lp-footer-col">
              <h4 className="lp-footer-col-title">{col.title}</h4>
              {col.links.map(([label, href]) => (
                <a key={label} href={href} className="lp-footer-link">{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="lp-footer-bottom">
          <p>© 2026 Oscarify.ai. All rights reserved.</p>
          <div className="lp-footer-socials">
            {['𝕏','in','gh'].map((s) => <span key={s} className="lp-social-pill">{s}</span>)}
          </div>
        </div>
      </footer>

    </div>
  )
}

export default LandingPage
