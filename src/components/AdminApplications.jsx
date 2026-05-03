import { useEffect, useState } from "react";
import { apiFetch } from "../api.js";
import SectionHeading from "./SectionHeading.jsx";

export default function AdminApplications({ isAdmin }) {
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isAdmin) {
      loadApplications();
    } else {
      setApplications([]);
    }
  }, [isAdmin]);

  async function loadApplications() {
    try {
      const nextApplications = await apiFetch("/api/admin/applications");
      setApplications(nextApplications);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(applicationId, status) {
    try {
      await apiFetch(`/api/admin/applications/${applicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadApplications();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <section id="admin-applications" className="section" aria-labelledby="adminApplicationsTitle">
      <SectionHeading eyebrow="Admin" title="Membership applications" titleId="adminApplicationsTitle" />

      {message && <p className="card app-message">{message}</p>}

      <div className="cards" aria-live="polite">
        {applications.length === 0 ? (
          <p className="card">Одоогоор анкет алга.</p>
        ) : (
          applications.map((application) => (
            <article className="card" key={application.id}>
              <h3>{application.firstName || application.user?.name || "Нэргүй"}</h3>
              <p>Email: {application.email || application.user?.email || "-"}</p>
              <p>Утас: {application.mobilePhone || "-"}</p>
              <p>Мотоцикл: {application.motorcycleBrand || "-"}</p>
              <p>Status: <strong>{application.status || "pending"}</strong></p>

              <div className="card-actions">
                <button type="button" onClick={() => updateStatus(application.id, "approved")}>
                  Approve
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => updateStatus(application.id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
