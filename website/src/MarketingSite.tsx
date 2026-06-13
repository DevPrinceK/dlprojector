import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Gauge,
  HardDrive,
  Headphones,
  Image,
  Laptop,
  Mail,
  Menu,
  MonitorUp,
  Music2,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from "lucide-react";

const releaseUrl = "https://github.com/DevPrinceK/dlprojector/releases/latest";

const productFeatures = [
  {
    icon: BookOpen,
    title: "Scripture at service speed",
    body: "Search references, switch installed Bible versions, preview a verse, and project it without breaking the service flow."
  },
  {
    icon: Music2,
    title: "Hymns that stay readable",
    body: "Search GHS locally, stage the right stanza, and use gradual auto-scrolling for lyrics that run beyond one screen."
  },
  {
    icon: Gauge,
    title: "A real production console",
    body: "Keep Preview and Live unmistakably separate, follow the service rail, and recover quickly with dedicated safety controls."
  },
  {
    icon: Users,
    title: "Plan recurring services",
    body: "Create Sunday worship, Bible study, and special-event programs once, then duplicate and adapt them as reusable templates."
  },
  {
    icon: Image,
    title: "Local media, ready offline",
    body: "Bring in images from the computer or the web and keep them stored locally for dependable projection without internet."
  },
  {
    icon: ShieldCheck,
    title: "Built for reliability",
    body: "Automatic backups, restore tools, local SQLite storage, and projector-safe controls protect the moments that matter."
  }
];

const platforms = [
  {
    name: "Windows",
    label: "Recommended",
    format: "MSI + NSIS installer",
    detail: "Windows 10 or later",
    tone: "gold"
  },
  {
    name: "macOS",
    label: "Available",
    format: "Universal DMG",
    detail: "Apple Silicon and Intel",
    tone: "blue"
  },
  {
    name: "Linux",
    label: "Available",
    format: "AppImage + DEB",
    detail: "Ubuntu, Debian, Mint and more",
    tone: "green"
  }
];

const workflows = [
  {
    number: "01",
    title: "Prepare the service",
    body: "Build a reusable program with scriptures, hymns, announcements, media, and custom moments."
  },
  {
    number: "02",
    title: "Stage in Preview",
    body: "Select the next item, check exactly what the congregation will see, and keep Live safely untouched."
  },
  {
    number: "03",
    title: "Take it Live",
    body: "Project with one decisive action, follow the active service item, and retain immediate blank and reset controls."
  }
];

const faqs = [
  {
    question: "Does DL Projector require internet during service?",
    answer: "No. Core projection, scriptures, hymns, services, and saved media are designed to work locally and offline."
  },
  {
    question: "Can our church reuse recurring service programs?",
    answer: "Yes. Create recurring programs such as Sunday Worship Service or Monday Bible Study, then duplicate, edit, reorder, or archive them."
  },
  {
    question: "Which Bible and hymn libraries are supported?",
    answer: "KJV and GHS are available, alongside downloadable English Bible versions. The library structure is ready for additions such as MHS."
  },
  {
    question: "Can PKay Software Consultancy help us get started?",
    answer: "Yes. Installation guidance, operator training, projector setup, and church-specific support are available through the contact details below."
  }
];

export function MarketingSite() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="DL Projector home">
            <img src="/dlprojector-icon.ico" alt="" />
            <span className="brand-copy">
              <strong>DL Projector</strong>
              <small>Church presentation software</small>
            </span>
          </a>

          <nav className={`primary-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
            <a href="#product" onClick={() => setMenuOpen(false)}>Product</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#downloads" onClick={() => setMenuOpen(false)}>Downloads</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </nav>

          <div className="header-actions">
            <a className="header-download" href="#downloads">
              Download app
              <ArrowRight size={16} />
            </a>
            <button
              className="menu-button"
              type="button"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="top" className="hero">
          <div className="hero-grid site-container">
            <div className="hero-copy">
              <div className="kicker"><span /> Built for the live church environment</div>
              <h1>Run every service with clarity and confidence.</h1>
              <p>
                One calm workspace for scriptures, hymns, announcements, media, and the full
                order of service. Built offline-first for church projection teams.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#downloads">
                  <Download size={18} />
                  Download DL Projector
                </a>
                <a className="button button-secondary" href="#product">
                  See how it works
                  <ArrowRight size={17} />
                </a>
              </div>
              <div className="hero-trust">
                <span><Check size={15} /> Free to download</span>
                <span><Check size={15} /> Works offline</span>
                <span><Check size={15} /> Windows, macOS, Linux</span>
              </div>
            </div>

            <ConsoleShowcase />
          </div>
          <div className="hero-rule" />
        </section>

        <section className="trust-strip">
          <div className="site-container trust-grid">
            <div><HardDrive /><strong>Offline-first</strong><span>No service-day internet dependency</span></div>
            <div><MonitorUp /><strong>Dual-display</strong><span>Separate control and projection screens</span></div>
            <div><ShieldCheck /><strong>Projection-safe</strong><span>Preview, Live, blank, and recovery controls</span></div>
            <div><Headphones /><strong>Human support</strong><span>Setup help from PKay Consultancy</span></div>
          </div>
        </section>

        <section id="product" className="section product-section">
          <div className="site-container split-heading">
            <div>
              <p className="section-label">The product</p>
              <h2>Designed around what happens at the media desk.</h2>
            </div>
            <p className="section-intro">
              DL Projector is not a collection of disconnected presentation tools. It is one
              deliberate workflow from preparation to projection, built for volunteers and
              media teams operating under real-time pressure.
            </p>
          </div>

          <div className="site-container workflow-stage">
            <div className="real-workflow-visual">
              <figure className="operator-image">
                <img
                  src="/screenshots/control-console.png"
                  alt="DL Projector operator console with separate amber Preview and green Live panels"
                  width="1920"
                  height="1034"
                  loading="lazy"
                />
                <figcaption><MonitorUp size={15} /> Operator console</figcaption>
              </figure>
              <figure className="output-image">
                <img
                  src="/screenshots/projection-screen.jpg"
                  alt="Opening Prayer displayed on the congregation projection screen"
                  width="1279"
                  height="723"
                  loading="lazy"
                />
                <figcaption><Sparkles size={15} /> Congregation output</figcaption>
              </figure>
            </div>

            <div className="workflow-copy">
              {workflows.map((item) => (
                <article key={item.number}>
                  <span>{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="section features-section">
          <div className="site-container centered-heading">
            <p className="section-label">Everything in one place</p>
            <h2>Purpose-built tools for a smoother service.</h2>
            <p>No browser tabs, improvised documents, or last-minute file hunting.</p>
          </div>
          <div className="site-container feature-grid">
            {productFeatures.map(({ icon: Icon, title, body }, index) => (
              <article className="feature-card" key={title}>
                <div className="feature-number">0{index + 1}</div>
                <div className="feature-icon"><Icon size={21} /></div>
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="feature-line" />
              </article>
            ))}
          </div>
        </section>

        <section className="library-banner">
          <div className="site-container library-grid">
            <div>
              <p className="section-label light">Content libraries</p>
              <h2>Scripture and hymns, ready before the opening prayer.</h2>
              <p>
                Install supported English Bible versions, search the complete GHS collection,
                and keep every library available locally when the internet is not.
              </p>
              <a href="#downloads">Explore the desktop app <ArrowRight size={17} /></a>
            </div>
            <div className="library-stack">
              <div className="library-card bible-card">
                <BookOpen size={22} />
                <span><small>Bible library</small><strong>KJV + downloadable versions</strong></span>
                <ChevronRight size={18} />
              </div>
              <div className="library-card hymn-card">
                <Music2 size={22} />
                <span><small>Hymn library</small><strong>260 GHS hymns and counting</strong></span>
                <ChevronRight size={18} />
              </div>
              <div className="library-card media-card">
                <Image size={22} />
                <span><small>Church media</small><strong>Local and internet image sources</strong></span>
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        </section>

        <section id="downloads" className="section downloads-section">
          <div className="site-container download-heading">
            <div>
              <p className="section-label">Download</p>
              <h2>Install DL Projector on your media computer.</h2>
            </div>
            <div className="release-note">
              <span>Latest stable release</span>
              <strong>Version 0.1.4</strong>
              <a href={releaseUrl} target="_blank" rel="noreferrer">
                View release notes <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <div className="site-container download-grid">
            {platforms.map((platform) => (
              <article className={`download-card ${platform.tone}`} key={platform.name}>
                <div className="platform-icon"><Laptop size={25} /></div>
                <span className="availability">{platform.label}</span>
                <h3>{platform.name}</h3>
                <p>{platform.format}</p>
                <small>{platform.detail}</small>
                <a href={releaseUrl} target="_blank" rel="noreferrer">
                  <Download size={17} />
                  Download for {platform.name}
                </a>
              </article>
            ))}
          </div>
          <div className="site-container download-footnote">
            <ShieldCheck size={18} />
            <span>Installers are produced automatically from the official source and published with SHA-256 checksums.</span>
          </div>
        </section>

        <section id="faq" className="section faq-section">
          <div className="site-container faq-layout">
            <div className="faq-heading">
              <p className="section-label">Questions</p>
              <h2>Practical answers for church teams.</h2>
              <p>Still deciding whether DL Projector fits your setup?</p>
              <a href="#contact">Talk to us <ArrowRight size={16} /></a>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <details key={faq.question} open={index === 0}>
                  <summary>{faq.question}<span>+</span></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="site-container contact-panel">
            <div>
              <p className="section-label light">Support and setup</p>
              <h2>Bring a calmer projection workflow to your church.</h2>
              <p>
                Contact PKay Software Consultancy for installation guidance, operator
                training, or help configuring your church&apos;s projection environment.
              </p>
            </div>
            <div className="contact-links">
              <a href="tel:+233558366133"><Phone size={18} /><span><small>Call or WhatsApp</small>+233 55 836 6133</span></a>
              <a href="tel:+233505757031"><Phone size={18} /><span><small>Alternate number</small>+233 50 575 7031</span></a>
              <a href="mailto:princesamuelpks@gmail.com"><Mail size={18} /><span><small>Primary email</small>princesamuelpks@gmail.com</span></a>
              <a href="mailto:pkaysoftwareconsultancy@gmail.com"><Mail size={18} /><span><small>Business email</small>pkaysoftwareconsultancy@gmail.com</span></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-container footer-main">
          <div className="footer-summary">
            <a className="brand footer-brand" href="#top">
              <img src="/dlprojector-icon.ico" alt="" />
              <span className="brand-copy"><strong>DL Projector</strong><small>Church presentation software</small></span>
            </a>
            <p>Dependable, offline-first projection software for churches and live worship environments.</p>
            <span className="footer-credit">A product of <strong>PKay Software Consultancy</strong></span>
          </div>
          <div className="footer-column">
            <h3>Product</h3>
            <a href="#product">How it works</a>
            <a href="#features">Features</a>
            <a href="#downloads">Downloads</a>
            <a href={releaseUrl} target="_blank" rel="noreferrer">Release notes</a>
          </div>
          <div className="footer-column">
            <h3>Platforms</h3>
            <a href="#downloads">Windows</a>
            <a href="#downloads">macOS</a>
            <a href="#downloads">Linux</a>
            <a href="#contact">Installation support</a>
          </div>
          <div className="footer-column">
            <h3>Support</h3>
            <a href="#faq">Frequently asked questions</a>
            <a href="tel:+233558366133">+233 55 836 6133</a>
            <a href="mailto:pkaysoftwareconsultancy@gmail.com">Email consultancy</a>
            <a href="https://github.com/DevPrinceK/dlprojector" target="_blank" rel="noreferrer">Source repository</a>
          </div>
        </div>
        <div className="site-container footer-bottom">
          <span>© 2026 PKay Software Consultancy. All rights reserved.</span>
          <span>DL Projector v{__APP_VERSION__}</span>
        </div>
      </footer>
    </div>
  );
}

function ConsoleShowcase() {
  return (
    <div className="console-showcase" aria-label="Actual DL Projector control console">
      <div className="screenshot-frame">
        <div className="screenshot-accent">
          <span><i /> Actual product interface</span>
          <span>Preview · Live · Service rail</span>
        </div>
        <img
          src="/screenshots/control-console.png"
          alt="DL Projector control console showing a staged scripture, live opening prayer, safety controls, and Monday Bible Studies service rail"
          width="1920"
          height="1034"
          fetchPriority="high"
        />
      </div>
      <div className="console-caption">
        <span><i /> Live output protected</span>
        <strong>Preview first. Project with confidence.</strong>
      </div>
    </div>
  );
}
