import { useEffect, useState } from 'react';
import axios from 'axios';
import FileUploader from '../components/FileUploader';
import ResultCard from '../components/ResultCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

function DiagnosisPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError('Please select a chest X-ray image first.');
      return;
    }

    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      setError('Image is too large. Please upload an image smaller than 6 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      setResult(response.data);
    } catch (requestError) {
      setResult(null);
      if (requestError.code === 'ECONNABORTED') {
        setError('Request timed out. Please try a smaller image or try again shortly.');
      } else {
        setError(requestError.response?.data?.error || 'Prediction failed. Please verify backend service.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <p className="section-kicker">Live Inference</p>
        <h2>Upload an X-ray and get instant classification</h2>
        <p>Designed for fast triage support. This tool does not replace clinical judgment.</p>
      </header>

      <form className="diagnosis-grid" onSubmit={handleSubmit}>
        <article className="panel">
          <FileUploader
            previewUrl={previewUrl}
            onFileSelect={(file) => {
              setSelectedFile(file);
              setResult(null);
              setError('');
            }}
            disabled={loading}
          />

          <button type="submit" className="primary-btn" disabled={!selectedFile || loading}>
            {loading ? 'Analyzing image...' : 'Run prediction'}
          </button>

          {error ? <p className="error-text">{error}</p> : null}
        </article>

        <ResultCard result={result} />
      </form>
    </section>
  );
}

export default DiagnosisPage;
