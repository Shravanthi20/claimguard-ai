import React, { useState, useRef } from "react";

export interface PendingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  category: "document" | "image";
}

interface EvidenceUploaderProps {
  onFilesSelected: (files: PendingFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  onFilesSelected,
  maxFiles = 10,
  maxSizeMB = 15,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<PendingFile[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setValidationError(null);

    const validNewFiles: PendingFile[] = [];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      if (selectedFiles.length + validNewFiles.length >= maxFiles) {
        setValidationError(`Maximum of ${maxFiles} files allowed.`);
        break;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setValidationError(`File "${file.name}" exceeds the maximum limit of ${maxSizeMB}MB.`);
        continue;
      }

      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp|docx?)$/i)) {
        setValidationError(`File "${file.name}" has an unsupported format. Allowed: PDF, JPG, PNG, WEBP, DOCX.`);
        continue;
      }

      const isImage = file.type.startsWith("image/");
      validNewFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        category: isImage ? "image" : "document",
      });
    }

    const updated = [...selectedFiles, ...validNewFiles];
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selectedFiles.filter((f) => f.id !== id);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        className={`dropzone ${dragActive ? "active" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="dropzone-icon">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <h4 style={{ color: "#fff", marginBottom: "0.25rem" }}>
          Click or drag & drop claim evidence here
        </h4>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Support invoices, repair estimates, police reports, accident photos (PDF, PNG, JPG, up to {maxSizeMB}MB each)
        </p>
      </div>

      {validationError && (
        <div className="form-error" style={{ marginTop: "0.5rem" }}>
          {validationError}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
            Ready to upload ({selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}):
          </div>
          <div className="file-preview-list">
            {selectedFiles.map((f) => (
              <div key={f.id} className="file-preview-card">
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", overflow: "hidden" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      background: f.category === "image" ? "rgba(6, 182, 212, 0.2)" : "rgba(99, 102, 241, 0.2)",
                      color: f.category === "image" ? "#67e8f9" : "#a5b4fc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {f.category === "image" ? "IMG" : "DOC"}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "150px",
                      }}
                    >
                      {f.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {formatFileSize(f.size)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => removeFile(f.id, e)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
