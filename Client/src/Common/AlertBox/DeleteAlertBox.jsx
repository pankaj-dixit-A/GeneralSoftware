import React from "react";
import "./DeleteAlert.css"; // Import the styles

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, docNo }) => {
  if (!isOpen) return null;

  return (
    <div className="overlay">
      <div className="modal">
        <h2 className="modal-title">Delete Confirmation</h2>
        <p className="modal-message">
          Are you sure you want to delete <strong>Doc No. {docNo}</strong>? This action cannot be undone.
        </p>

        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="delete-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
