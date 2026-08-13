import React from "react";
import "./Modal.css";

function Modal({ title, message, onConfirm, onCancel, type = "warning" }) {
  return (
    <div className="modal-overlay">
      <div className={`modal modal-${type}`}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className={`modal-confirm modal-confirm-${type}`} onClick={onConfirm}>
            {type === "delete" ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
