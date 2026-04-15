import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DiagnosisPage from './pages/DiagnosisPage';
import TrainingProofPage from './pages/TrainingProofPage';
import './styles/app.css';

function App() {
  const [activePage, setActivePage] = useState('diagnosis');

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onChange={setActivePage} />

      <main className="content">
        {activePage === 'diagnosis' ? <DiagnosisPage /> : <TrainingProofPage />}
      </main>
    </div>
  );
}

export default App;