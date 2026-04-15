import { phaseMetrics } from '../constants/trainingEvolution';

function TrainingProofPage() {
  const phase1 = phaseMetrics.phase1;
  const currentPhase = phaseMetrics.current;

  const renderPhase = (title, phaseData) => (
    <article className="timeline-card" key={title}>
      <p className="timeline-title">{title}</p>
      <p className="metric-label">{phaseData.label} | {phaseData.modelFile}</p>
      <div className="timeline-grid">
        <div>
          <p className="metric-label">Train Accuracy</p>
          <p>{(phaseData.train.acc * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="metric-label">Train Recall</p>
          <p>{(phaseData.train.recall * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="metric-label">Train F1</p>
          <p>{(phaseData.train.f1 * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="metric-label">Val Accuracy</p>
          <p>{(phaseData.val.acc * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="metric-label">Val Recall</p>
          <p>{(phaseData.val.recall * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="metric-label">Val F1</p>
          <p>{(phaseData.val.f1 * 100).toFixed(1)}%</p>
        </div>
      </div>
    </article>
  );

  return (
    <section className="page">
      <header className="page-header">
        <p className="section-kicker">Model Proof</p>
        <h2>Phase-wise performance summary</h2>
        <p>Phase 1 is the first trained model. Current Phase is the model currently used by the API.</p>
      </header>

      <section className="timeline">
        {phase1 ? renderPhase('Phase 1', phase1) : null}
        {currentPhase ? renderPhase('Current Phase', currentPhase) : null}
      </section>
    </section>
  );
}

export default TrainingProofPage;
