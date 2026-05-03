import { useEffect, useState } from "react";
import SectionHeading from "./SectionHeading.jsx";

const emptyContact = {
  phone: "",
  facebook: "",
  instagram: ""
};

export default function Contact({ contact, isAdmin, onSave }) {
  const [formValues, setFormValues] = useState(emptyContact);

  useEffect(() => {
    setFormValues({
      phone: contact.phone || "",
      facebook: contact.facebook || "",
      instagram: contact.instagram || ""
    });
  }, [contact]);

  async function handleSubmit(event) {
    event.preventDefault();
    await onSave({
      phone: formValues.phone.trim(),
      facebook: formValues.facebook.trim(),
      instagram: formValues.instagram.trim()
    });
  }

  function updateField(fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value
    }));
  }

  return (
    <section id="contact" className="section" aria-labelledby="contactTitle">
      <SectionHeading eyebrow="Connect" title="Холбоо барих" titleId="contactTitle" />

      {isAdmin && (
        <form className="add-box" autoComplete="off" onSubmit={handleSubmit}>
          <input
            value={formValues.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="Утас"
            aria-label="Phone"
          />
          <input
            value={formValues.facebook}
            onChange={(event) => updateField("facebook", event.target.value)}
            placeholder="Facebook"
            aria-label="Facebook"
          />
          <input
            value={formValues.instagram}
            onChange={(event) => updateField("instagram", event.target.value)}
            placeholder="https://www.instagram.com/lady_riders_mongolia_wmc/"
            aria-label="Instagram"
          />
          <button type="submit">Хадгалах</button>
        </form>
      )}

      <address className="contact-card">
        <p>
          <strong>Утас:</strong> <span>{contact.phone || "-"}</span>
        </p>
        <p>
          <strong>Facebook:</strong> <span>{contact.facebook || "-"}</span>
        </p>
        <p>
          <strong>Instagram:</strong> <InstagramLink value={contact.instagram} />
        </p>
      </address>
    </section>
  );
}

function InstagramLink({ value }) {
  if (!value || value === "-") {
    return <span>-</span>;
  }

  return (
    <a href={normalizeUrl(value)} target="_blank" rel="noopener noreferrer">
      Instagram
    </a>
  );
}

function normalizeUrl(value) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}
