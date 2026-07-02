/**
 * FileUpload — Drag-and-drop file upload with visual feedback.
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
}

export default function FileUpload({
  onFileSelect,
  accept = { 'application/pdf': ['.pdf'] },
  maxSizeMB = 10,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0]?.errors?.[0]?.message || 'Invalid file';
        setError(err);
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="file-upload-wrapper">
      <div
        {...getRootProps()}
        className={`file-upload-zone ${isDragActive ? 'file-upload-zone--active' : ''} ${
          selectedFile ? 'file-upload-zone--has-file' : ''
        } ${error ? 'file-upload-zone--error' : ''}`}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="file"
              className="file-upload-selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <CheckCircle size={32} className="file-upload-success-icon" />
              <div className="file-upload-file-info">
                <FileText size={18} />
                <span className="file-upload-filename">{selectedFile.name}</span>
                <span className="file-upload-filesize">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button className="file-upload-remove" onClick={removeFile} type="button">
                <X size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="file-upload-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="file-upload-icon"
                animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              >
                <Upload size={36} />
              </motion.div>
              <p className="file-upload-title">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume PDF'}
              </p>
              <p className="file-upload-subtitle">
                or <span className="file-upload-browse">browse files</span> • Max {maxSizeMB}MB
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          className="file-upload-error"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
