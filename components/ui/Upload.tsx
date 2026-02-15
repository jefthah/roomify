import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useOutletContext } from "react-router";
import {
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

  const { isSignedIn } = useOutletContext<AuthContext>();

  const processFile = useCallback(
    (selectedFile: File) => {
      if (!isSignedIn) return;

      setFile(selectedFile);
      setProgress(0);

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;

        const interval = setInterval(() => {
          setProgress((prev) => {
            const next = Math.min(prev + PROGRESS_INCREMENT, 100);

            if (next >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                onComplete?.(base64);
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
            <p className="help">Maximum file size 50mb</p>
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
