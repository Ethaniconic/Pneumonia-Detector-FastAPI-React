function FileUploader({ previewUrl, onFileSelect, disabled }) {
  const pickFromInput = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <label
      className={disabled ? 'file-uploader disabled' : 'file-uploader'}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden-input"
        onChange={pickFromInput}
        disabled={disabled}
      />

      {previewUrl ? (
        <img src={previewUrl} alt="X-ray preview" className="xray-preview" />
      ) : (
        <div className="upload-placeholder">
          <p className="upload-title">Drop chest X-ray image</p>
          <p className="upload-subtitle">or click to choose a file</p>
        </div>
      )}
    </label>
  );
}

export default FileUploader;
