import React from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  confirmText?: string;
  onConfirm?: () => void;
  isConfirmDestructive?: boolean;
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  confirmText = "Confirm",
  onConfirm,
  isConfirmDestructive = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#fff" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          {onConfirm && (
            <button
              type="button"
              className={`btn ${isConfirmDestructive ? "btn-danger" : "btn-primary"}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
