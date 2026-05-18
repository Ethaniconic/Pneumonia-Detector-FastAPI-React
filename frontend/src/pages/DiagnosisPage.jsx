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
        timeout: 60000,
      });
      setResult(response.data);
    } catch (requestError) {
      setResult(null);
      console.error('Prediction Error:', requestError);
      const backendError = requestError.response?.data?.error || requestError.response?.data?.detail;
      if (requestError.code === 'ECONNABORTED') {
        setError('Request timed out. The server might be waking up or the image is too large.');
      } else if (backendError) {
        setError(`Server Error: ${backendError}`);
      } else {
        setError('Prediction failed. The server might be out of memory or unavailable.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <p className="section-kicker">Intelligent Diagnostic System</p>
        <h2>Chest X-Ray Analysis</h2>
        <p>Advanced neural network for pneumonia detection and structural analysis.</p>
      </header>

      <div className="diagnosis-grid">
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

          <button 
            type="button" 
            className="primary-btn" 
            disabled={!selectedFile || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Processing Intelligence...' : 'Run Analysis'}
          </button>

          {error ? <p className="error-text">{error}</p> : null}
        </article>

        <ResultCard result={result} />
      </div>
    </section>
  );
}

export default DiagnosisPage;
