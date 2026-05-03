const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

export default function UserStatus({ user, onLogout }) {
  if (!user) {
    return null;
  }

  return (
    <div className="form-section-card user-status-card">
      <h3>Membership status</h3>
      <p>
        <strong>{user.name}</strong> ({user.email})
      </p>
      <p>
        Status: <strong>{statusLabels[user.status] || user.status}</strong>
      </p>
      <button type="button" className="secondary-button" onClick={onLogout}>
        Member logout
      </button>
    </div>
  );
}
