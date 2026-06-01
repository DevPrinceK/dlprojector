const releaseUrl = "https://github.com/DevPrinceK/dlprojector/releases/latest";

const downloadOptions = [
  {
    platform: "Windows",
    format: "MSI installer and portable EXE",
    detail: "Recommended for most church media PCs and projection laptops.",
    badge: "Available"
  },
  {
    platform: "macOS",
    format: "Universal DMG",
    detail: "Prepared for Apple Silicon and Intel Macs used by media teams.",
    badge: "Available"
  },
  {
    platform: "Linux",
    format: "AppImage and DEB",
    detail: "For churches running Ubuntu, Debian, Mint, or portable Linux setups.",
    badge: "Available"
  }
];

const features = [
  "Scripture projection with version switching",
  "GHS hymn library with live search",
  "Service program rails for recurring services",
  "Dual-screen control and projection windows",
  "Logo, blank screen, and emergency reset controls",
  "Offline-first local church media workflow"
];

const workflow = [
  {
    step: "01",
    title: "Prepare before service",
    body: "Build Sunday Worship Service, Bible Study, or special programs with scriptures, hymns, announcements, media, and people highlights."
  },
  {
    step: "02",
    title: "Stage with confidence",
    body: "Preview every item before it goes live, keep the selected service visible, and avoid guessing what the congregation will see."
  },
  {
    step: "03",
    title: "Project calmly",
    body: "Take items live, blank the screen, show the church logo, or recover quickly with projection-safe controls built for real services."
  }
];

const faqs = [
  {
    question: "Does DL Projector require internet during service?",
    answer:
      "No. The app is designed around local data and offline projection so the media team is not dependent on church internet."
  },
  {
    question: "Can we use it for recurring services?",
    answer:
      "Yes. Services such as Sunday Worship Service or Monday Bible Study can be created, selected, edited, and reused."
  },
  {
    question: "Which Bible and hymn content is planned?",
    answer:
      "The app starts with KJV scripture support and GHS hymns, with room for additional English Bible versions and MHS support later."
  },
  {
    question: "Who should we contact for setup or support?",
    answer:
      "PKay Software Consultancy can help with installation, training, church-specific setup, and support."
  }
];

export function MarketingSite() {
  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="DL Projector home">
          <span className="brand-mark">DL</span>
          <span>
            <strong>DL Projector</strong>
            <small>Church projection software</small>
          </span>
        </a>
        <nav className="topnav" aria-label="Primary navigation">
          <a href="#features">Features</a>
          <a href="#downloads">Downloads</a>
          <a href="#workflow">Workflow</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-cta" href="#downloads">
          Download
        </a>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Built for live church service</p>
          <h1>Projection software that keeps the media desk calm.</h1>
          <p className="hero-lede">
            DL Projector helps churches prepare scriptures, hymns, announcements, media,
            personalities, and service programs in one offline-first operator dashboard.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href={releaseUrl} target="_blank" rel="noreferrer">
              Get latest release
            </a>
            <a className="secondary-button" href="#contact">
              Ask for setup help
            </a>
          </div>
          <div className="hero-proof" aria-label="Product strengths">
            <span>Offline-first</span>
            <span>Dual screen</span>
            <span>Scriptures and hymns</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="DL Projector interface preview">
          <div className="projection-card">
            <div className="window-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <div className="preview-stage">
              <span className="stage-pill">Live Preview</span>
              <h2>Romans 8:28</h2>
              <p>
                And we know that all things work together for good to them that love God,
                to them who are the called according to his purpose.
              </p>
            </div>
            <div className="control-strip">
              <span>Scripture</span>
              <span>Hymn</span>
              <span>Blank</span>
              <span>Logo</span>
            </div>
          </div>
          <div className="floating-note">
            <strong>Sunday Worship Service</strong>
            <span>Ready for live projection</span>
          </div>
        </div>
      </section>

      <section id="features" className="section-panel">
        <div className="section-heading">
          <p className="eyebrow">Why churches use it</p>
          <h2>Everything the projection team needs, without the panic.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature}>
              <span className="feature-icon">+</span>
              <h3>{feature}</h3>
              <p>
                Designed for quick preparation, readable projection, and fewer service-time
                surprises.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="downloads" className="downloads-section">
        <div className="section-heading centered">
          <p className="eyebrow">Download options</p>
          <h2>Choose the version for your projection computer.</h2>
          <p>
            Installers are distributed from GitHub Releases so churches can always find the
            latest published build in one trusted location.
          </p>
        </div>
        <div className="download-grid">
          {downloadOptions.map((option) => (
            <article className="download-card" key={option.platform}>
              <div className="download-card-top">
                <span>{option.badge}</span>
                <h3>{option.platform}</h3>
              </div>
              <p className="format">{option.format}</p>
              <p>{option.detail}</p>
              <a href={releaseUrl} target="_blank" rel="noreferrer">
                Download from GitHub
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="workflow-section">
        <div className="section-heading">
          <p className="eyebrow">Service flow</p>
          <h2>From preparation to projection in three clear moves.</h2>
        </div>
        <div className="timeline">
          {workflow.map((item) => (
            <article className="timeline-card" key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="library-section">
        <div>
          <p className="eyebrow">Libraries included</p>
          <h2>Scripture and hymns are treated like first-class service items.</h2>
          <p>
            Start with KJV scriptures and GHS hymns, then expand as more approved English Bible
            versions and hymn collections are packaged for download.
          </p>
        </div>
        <div className="library-list">
          <span>KJV Bible import</span>
          <span>GHS hymn search</span>
          <span>Future Bible downloads</span>
          <span>MHS-ready roadmap</span>
        </div>
      </section>

      <section className="faq-section">
        <div className="section-heading centered">
          <p className="eyebrow">Questions</p>
          <h2>Built with church realities in mind.</h2>
        </div>
        <div className="faq-grid">
          {faqs.map((faq) => (
            <article className="faq-card" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="contact-copy">
          <p className="eyebrow">Contact us</p>
          <h2>Need installation help, training, or a church-specific setup?</h2>
          <p>
            There is no backend contact form yet, so please reach PKay Software Consultancy
            directly using the phone numbers or email addresses below.
          </p>
        </div>
        <div className="contact-grid">
          <a href="tel:+233558366133">+233 55 836 6133</a>
          <a href="tel:+233505757031">+233 50 575 7031</a>
          <a href="mailto:princesamuelpks@gmail.com">princesamuelpks@gmail.com</a>
          <a href="mailto:pkaysoftwareconsultancy@gmail.com">
            pkaysoftwareconsultancy@gmail.com
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark">DL</span>
          <div>
            <h2>DL Projector</h2>
            <p>
              Professional church projection software credited to PKay Software Consultancy.
            </p>
          </div>
        </div>
        <div className="footer-columns">
          <div>
            <h3>Product</h3>
            <a href="#features">Features</a>
            <a href="#workflow">Service workflow</a>
            <a href="#downloads">Downloads</a>
            <a href={releaseUrl} target="_blank" rel="noreferrer">
              Release notes
            </a>
          </div>
          <div>
            <h3>Platforms</h3>
            <a href={releaseUrl} target="_blank" rel="noreferrer">
              Windows
            </a>
            <a href={releaseUrl} target="_blank" rel="noreferrer">
              macOS
            </a>
            <a href={releaseUrl} target="_blank" rel="noreferrer">
              Linux
            </a>
            <a href="#contact">Installation support</a>
          </div>
          <div>
            <h3>Support</h3>
            <a href="tel:+233558366133">+233 55 836 6133</a>
            <a href="tel:+233505757031">+233 50 575 7031</a>
            <a href="mailto:princesamuelpks@gmail.com">Primary email</a>
            <a href="mailto:pkaysoftwareconsultancy@gmail.com">Consultancy email</a>
          </div>
          <div>
            <h3>Credits</h3>
            <p>Software by PKay Software Consultancy.</p>
            <p>Built for churches, media teams, and live worship projection.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>(c) 2026 PKay Software Consultancy. All rights reserved.</span>
          <span>DL Projector v0.1.3</span>
        </div>
      </footer>
    </main>
  );
}
