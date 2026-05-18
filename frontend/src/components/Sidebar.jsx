const links = [
  { id: 'diagnosis', title: 'Diagnosis', subtitle: 'AI Triage & Analysis' },
  { id: 'evolution', title: 'Training Metrics', subtitle: 'Performance Logs' },
];

function Sidebar({ activePage, onChange, theme, onToggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <p className="brand-kicker">Vision AI Research</p>
        <h1>PneumoScan</h1>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className={activePage === link.id ? 'nav-item active' : 'nav-item'}
            onClick={() => onChange(link.id)}
          >
            <span className="nav-title">{link.title}</span>
            <span className="nav-subtitle">{link.subtitle}</span>
          </button>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <button 
          onClick={onToggleTheme} 
          className="nav-item" 
          style={{ width: '100%', textAlign: 'center' }}
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
