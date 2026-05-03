import { useState } from "react";

const initialForm = {
  email: "",
  password: ""
};

export default function UserLogin({ onLogin }) {
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
    <form className="form-section-card" autoComplete="on" onSubmit={handleSubmit}>
      <h3>Member login</h3>
      <label className="form-group">
        <span>Email</span>
        <input
          type="email"
          value={formValues.email}
          onChange={(event) => updateField("email", event.target.value)}
          autoComplete="email"
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
      <button type="submit">Нэвтрэх</button>
      <p className="membership-message" role="status">{message}</p>
    </form>
  );
}
