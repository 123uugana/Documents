import { useState } from "react";
import CardActions from "./CardActions.jsx";
import SectionHeading from "./SectionHeading.jsx";

export default function About({ abouts, isAdmin, onAdd, onEdit, onDelete }) {
  const [text, setText] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim()) {
      return;
    }

    await onAdd({ text: text.trim() });
    setText("");
  }

  async function handleEdit(item) {
    const nextText = window.prompt("Шинэ текст", item.text || "");

    if (nextText === null) {
      return;
    }

    await onEdit(item.id, {
      text: nextText.trim()
    });
  }

  return (
    <section id="about" className="section section-alt" aria-labelledby="aboutTitle">
      <SectionHeading eyebrow="Community" title="Бидний тухай" titleId="aboutTitle" />

      {isAdmin && (
        <form className="add-box" autoComplete="off" onSubmit={handleSubmit}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Текст нэмэх"
            aria-label="About text"
          />
          <button type="submit">Нэмэх</button>
        </form>
      )}

      <div className="cards" aria-live="polite">
        {abouts.length === 0 ? (
          <p className="card">Одоогоор мэдээлэл алга.</p>
        ) : (
          abouts.map((item) => (
            <article className="card" key={item.id}>
              <p>{item.text || ""}</p>

              {isAdmin && (
                <CardActions
                  onEdit={() => handleEdit(item)}
                  onDelete={() => onDelete(item.id)}
                />
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
