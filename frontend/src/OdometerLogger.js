import React, { useState } from "react";
import axios from "./api";
import { formatDate } from "./utils";
import { FaRoad, FaTrash } from "react-icons/fa";
import "./OdometerLogger.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function OdometerLogger({ logs = [], onUpdate, showToast }) {
  const [date, setDate] = useState("");
  const [startKm, setStartKm] = useState("");
  const [endKm, setEndKm] = useState("");
  const [notes, setNotes] = useState("");

  const calculatedDistance =
    startKm !== "" && endKm !== "" && Number(endKm) >= Number(startKm)
      ? Number(endKm) - Number(startKm)
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) {
      showToast("Please select a date", "error");
      return;
    }
    if (startKm === "" || endKm === "") {
      showToast("Please enter Start KM and End KM", "error");
      return;
    }
    if (Number(endKm) < Number(startKm)) {
      showToast("End KM cannot be less than Start KM", "error");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/odometer`, {
        date,
        startKm: Number(startKm),
        endKm: Number(endKm),
        notes,
      });

      setDate("");
      setStartKm("");
      setEndKm("");
      setNotes("");
      onUpdate();
      showToast("Travel KM logged successfully!", "success");
    } catch (err) {
      console.error("Error logging odometer:", err.message);
      const msg = err.response?.data?.error || "Failed to log Travel KM";
      showToast(msg, "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/odometer/${id}`);
      onUpdate();
      showToast("Odometer log deleted", "success");
    } catch (err) {
      console.error("Error deleting log:", err.message);
      showToast("Failed to delete log", "error");
    }
  };

  return (
    <div className="odometer-container">
      <div className="panel-card odo-form-card">
        <h2>🛣️ Log Travel KM (Odometer)</h2>
        <form className="odo-form" onSubmit={handleSubmit}>
          <div className="odo-form-group">
            <label htmlFor="odo-date">Date</label>
            <input
              id="odo-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="odo-form-group">
            <label htmlFor="odo-start">Start KM</label>
            <input
              id="odo-start"
              type="number"
              placeholder="e.g. 45000"
              value={startKm}
              onChange={(e) => setStartKm(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="odo-form-group">
            <label htmlFor="odo-end">End KM</label>
            <input
              id="odo-end"
              type="number"
              placeholder="e.g. 45120"
              value={endKm}
              onChange={(e) => setEndKm(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="odo-form-group">
            <label>Calculated Distance</label>
            <div className="calculated-distance-badge">
              <FaRoad /> {calculatedDistance} KM
            </div>
          </div>

          <div className="odo-form-group full-width">
            <label htmlFor="odo-notes">Trip Notes / Purpose (Optional)</label>
            <input
              id="odo-notes"
              type="text"
              placeholder="e.g. City drive, Highway trip to Pune"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength="100"
            />
          </div>

          <button type="submit" className="btn-save-odo">Log Travel KM</button>
        </form>
      </div>

      <div className="panel-card odo-logs-card" style={{ marginTop: "20px" }}>
        <h2>📜 Travel Logs History ({logs.length})</h2>
        {logs.length === 0 ? (
          <div className="empty-state" style={{ padding: "20px" }}>
            <p>🛣️ No travel logs yet</p>
            <small>Log your first Odometer reading above</small>
          </div>
        ) : (
          <div className="odo-logs-list">
            {logs.map((log) => (
              <div key={log._id} className="odo-log-card">
                <div className="odo-log-main">
                  <div className="odo-log-date">📅 {formatDate(log.date)}</div>
                  <div className="odo-log-dist">
                    <strong>{log.distance} KM</strong> driven
                  </div>
                  <div className="odo-log-readings">
                    Start: {log.startKm} KM &nbsp;→&nbsp; End: {log.endKm} KM
                  </div>
                  {log.notes && <div className="odo-log-notes">📝 {log.notes}</div>}
                </div>
                <button
                  className="btn-delete-odo"
                  onClick={() => handleDelete(log._id)}
                  title="Delete log"
                  aria-label="Delete travel log"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OdometerLogger;
