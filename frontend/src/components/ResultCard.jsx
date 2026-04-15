function ResultCard({ result }) {
  if (!result) return null;

  const confidence = Number(result.confidence || 0);
  const confidencePercent = (confidence * 100).toFixed(2);

  return (
    <section className="result-card">
      <p className="section-kicker">Prediction Output</p>
      <h3 className="prediction-text">{result.prediction}</h3>

      <div className="metric-stack">
        <p>Confidence: {confidencePercent}%</p>
        <div className="progress-track">
          <span className="progress-fill" style={{ width: `${confidence * 100}%` }} />
        </div>
      </div>

      <div className="probability-grid">
        <article>
          <p className="probability-label">Normal</p>
          <p>{(result.probabilities?.NORMAL * 100 || 0).toFixed(1)}%</p>
        </article>
        <article>
          <p className="probability-label">Pneumonia</p>
          <p>{(result.probabilities?.PNEUMONIA * 100 || 0).toFixed(1)}%</p>
        </article>
      </div>
    </section>
  );
}

export default ResultCard;
