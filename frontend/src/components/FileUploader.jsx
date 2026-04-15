function FileUploader({ previewUrl, onFileSelect, disabled }) {
  const compressImage = (file) =>
    new Promise((resolve) => {
      // Skip compression for already-small files.
      if (file.size <= 1024 * 1024) {
        resolve(file);
        return;
      }

      const imageElement = new Image();
      const objectUrl = URL.createObjectURL(file);

      imageElement.onload = () => {
        const MAX_DIMENSION = 1600;
        let { width, height } = imageElement;

        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height >= width && height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        if (!context) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        context.drawImage(imageElement, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.85,
        );
      };

      imageElement.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      imageElement.src = objectUrl;
    });

  const pickFromInput = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const optimizedFile = await compressImage(file);
      onFileSelect(optimizedFile);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      const optimizedFile = await compressImage(file);
      onFileSelect(optimizedFile);
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
