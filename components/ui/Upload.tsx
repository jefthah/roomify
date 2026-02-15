import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  PROGRESS_INCREMENT,
  PROGRESS_INTERVAL_MS,
  REDIRECT_DELAY_MS,
} from "../../lib/constants";

interface UploadProps {
  onComplete?: (base64: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isSignedIn } = useOutletContext<AuthContext>();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const validateFile = (selectedFile: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      return "Invalid file type. Please upload a JPG or PNG image.";
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`;
    }
    return null;
  };

  const processFile = useCallback(
    (selectedFile: File) => {
      if (!isSignedIn) return;

      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setFile(selectedFile);
      setProgress(0);

      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        intervalRef.current = setInterval(() => {
          setProgress((prev) => {
            const next = Math.min(prev + PROGRESS_INCREMENT, 100);

            if (next >= 100) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = null;

              timeoutRef.current = setTimeout(() => {
                onComplete?.(base64);
                timeoutRef.current = null;
              }, REDIRECT_DELAY_MS);
            }

            return next;
          });
        }, PROGRESS_INTERVAL_MS);
      };

      reader.readAsDataURL(selectedFile);
    },
    [isSignedIn, onComplete]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return;
    setError(null);
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isSignedIn) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isSignedIn) return;

    setError(null);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
  };

  return (
    <div className="upload">
      {!file ? (
        <div
          className={`dropzone ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="drop-input"
            accept=".jpg,.jpeg,.png"
            disabled={!isSignedIn}
            onChange={handleChange}
          />

          <div className="drop-content">
            <div className="drop-icon">
              <UploadIcon size={20} />
            </div>

            <p>
              {isSignedIn
                ? "Drag and drop your floor plan here, or click to select a file"
                : "Please sign in to upload your floor plan"}
            </p>
            <p className="help">Maximum file size 10MB</p>
            {error && <p className="upload-error">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="upload-status">
          <div className="status-content">
            <div className="status-icon">
              {progress === 100 ? (
                <CheckCircle2 className="check" />
              ) : (
                <ImageIcon className="image" />
              )}
            </div>

            <h3>{file.name}</h3>

            <div className="progress">
              <div className="bar" style={{ width: `${progress}%` }}/>

              <p className="status-text">
                {progress < 100 ? `Analysing floor plan... ${progress}%` : "Redirecting..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
