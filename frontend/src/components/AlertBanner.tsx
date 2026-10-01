import React from "react";

interface AlertBannerProps {
  type: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ type, message, onClose }) => {
  return (
    <div className={`alert-banner alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
