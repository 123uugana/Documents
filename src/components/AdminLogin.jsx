import { useState } from "react";
import SectionHeading from "./SectionHeading.jsx";

const initialForm = {
  username: "",
  password: ""
};

export default function AdminLogin({ isAdmin, onLogin, onLogout }) {
  const [formValues, setFormValues] = useState(initialForm);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      await onLogin(formValues);
      setFormValues(initialForm);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateField(fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value
    }));
  }

  return (
    <section id="admin-login" className="section section-alt" aria-labelledby="adminLoginTitle">
      <SectionHeading eyebrow="Admin" title="Admin login" titleId="adminLoginTitle" />

      {isAdmin ? (
        <div className="form-section-card admin-react-card">
          <h3>Admin нэвтэрсэн байна</h3>
          <p>Доорх membership applications хэсгээс approve/reject хийж болно.</p>
          <button type="button" className="secondary-button" onClick={onLogout}>
            Admin logout
          </button>
        </div>
      ) : (
        <form className="form-section-card admin-react-card" autoComplete="on" onSubmit={handleSubmit}>
          <h3>Admin нэвтрэх</h3>
          <label className="form-group">
            <span>Username</span>
            <input
              value={formValues.username}
              onChange={(event) => updateField("username", event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="form-group">
            <span>Password</span>
            <input
              type="password"
              value={formValues.password}
              onChange={(event) => updateField("password", event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit">Login</button>
          <p className="membership-message" role="status">{message}</p>
        </form>
      )}
    </section>
  );
}
