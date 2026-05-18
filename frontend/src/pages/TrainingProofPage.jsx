import { phaseMetrics } from '../constants/trainingEvolution';

function TrainingProofPage() {
  const phase1 = phaseMetrics.phase1;
  const currentPhase = phaseMetrics.current;

  const renderPhase = (title, phaseData) => (
    <article className="panel" key={title} style={{ marginBottom: '2rem' }}>
      <div className="result-header">
        <p className="section-kicker">{title}</p>
        <h3 className="prediction-text">{phaseData.label}</h3>
        <span className="confidence-chip">{phaseData.modelFile}</span>
      </div>
      
      <div className="probability-grid" style={{ marginTop: '1.5rem' }}>
        <div className="prob-item">
          <span className="prob-label">Validation Accuracy</span>
          <div className="prob-value">{(phaseData.val.acc * 100).toFixed(1)}%</div>
        </div>
        <div className="prob-item">
          <span className="prob-label">Validation Recall</span>
          <div className="prob-value">{(phaseData.val.recall * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="stats-row" style={{ marginTop: '1.5rem' }}>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <p>Train Acc</p>
          <h3 style={{ fontSize: '1.2rem' }}>{(phaseData.train.acc * 100).toFixed(1)}%</h3>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <p>Train F1</p>
          <h3 style={{ fontSize: '1.2rem' }}>{(phaseData.train.f1 * 100).toFixed(1)}%</h3>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <p>Val F1</p>
          <h3 style={{ fontSize: '1.2rem' }}>{(phaseData.val.f1 * 100).toFixed(1)}%</h3>
        </div>
      </div>
    </article>
  );

  return (
    <section className="page">
      <header className="page-header">
        <p className="section-kicker">Model Evolution</p>
        <h2>Training Proof & Metrics</h2>
        <p>Comprehensive performance logs across training phases. Demonstrating model reliability and accuracy gains.</p>
      </header>

      <section className="timeline">
        {phase1 ? renderPhase('Initial Phase', phase1) : null}
        {currentPhase ? renderPhase('Production Phase', currentPhase) : null}
      </section>
    </section>
  );
}

export default TrainingProofPage;
