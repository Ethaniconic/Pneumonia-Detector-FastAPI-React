function ResultCard({ result }) {
  if (!result) return null;

  const confidence = Number(result.confidence || 0);
  const confidencePercent = (confidence * 100).toFixed(1);
  const isPneumonia = result.prediction === "PNEUMONIA";

  return (
    <section className="result-card">
      <div className="result-header">
        <p className="section-kicker">Diagnostic Result</p>
        <h3 className={`prediction-text ${isPneumonia ? 'pneumonia' : 'normal'}`}>
          {result.prediction}
        </h3>
        <span className="confidence-chip">{confidencePercent}% Confidence</span>
      </div>

      <div className="probability-grid">
        <div className="prob-item">
          <span className="prob-label">Normal</span>
          <div className="prob-value">
            {(result.probabilities?.NORMAL * 100 || 0).toFixed(1)}%
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${result.probabilities?.NORMAL * 100 || 0}%`, background: '#4ade80' }} 
            />
          </div>
        </div>
        <div className="prob-item">
          <span className="prob-label">Pneumonia</span>
          <div className="prob-value">
            {(result.probabilities?.PNEUMONIA * 100 || 0).toFixed(1)}%
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${result.probabilities?.PNEUMONIA * 100 || 0}%`, background: '#f87171' }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResultCard;
