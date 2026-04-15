const links = [
  { id: 'diagnosis', title: 'Diagnosis', subtitle: 'Upload and predict' },
  { id: 'evolution', title: 'Model Evolution', subtitle: 'Training proof page' },
];

function Sidebar({ activePage, onChange }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <p className="brand-kicker">Medical AI</p>
        <h1>Pneumonia Detector</h1>
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
    </aside>
  );
}

export default Sidebar;
