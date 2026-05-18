import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DiagnosisPage from './pages/DiagnosisPage';
import TrainingProofPage from './pages/TrainingProofPage';
import './styles/app.css';

function App() {
  const [activePage, setActivePage] = useState('diagnosis');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="app-shell">
      <Sidebar 
        activePage={activePage} 
        onChange={setActivePage} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
      />

      <main className="content">
        {activePage === 'diagnosis' ? <DiagnosisPage /> : <TrainingProofPage />}
      </main>
    </div>
  );
}

export default App;
