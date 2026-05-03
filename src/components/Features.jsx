import { useState } from "react";
import CardActions from "./CardActions.jsx";
import SectionHeading from "./SectionHeading.jsx";

export default function Features({ features, isAdmin, onAdd, onEdit, onDelete }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !text.trim()) {
      return;
    }

    await onAdd({
      title: title.trim(),
      text: text.trim()
    });

    setTitle("");
    setText("");
  }

  async function handleEdit(item) {
    const nextTitle = window.prompt("Шинэ гарчиг", item.title || "");

    if (nextTitle === null) {
      return;
    }

    const nextText = window.prompt("Шинэ тайлбар", item.text || "");

    if (nextText === null) {
      return;
    }

    await onEdit(item.id, {
      title: nextTitle.trim(),
      text: nextText.trim()
    });
  }

  return (
    <section id="features" className="section" aria-labelledby="featuresTitle">
      <SectionHeading eyebrow="What we do" title="Онцлог" titleId="featuresTitle" />

      {isAdmin && (
        <form className="add-box" autoComplete="off" onSubmit={handleSubmit}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Гарчиг"
            aria-label="Feature title"
          />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Тайлбар"
            aria-label="Feature text"
          />
          <button type="submit">Нэмэх</button>
        </form>
      )}

      <div className="cards" aria-live="polite">
        {features.length === 0 ? (
          <p className="card">Одоогоор мэдээлэл алга.</p>
        ) : (
          features.map((item) => (
            <article className="card" key={item.id}>
              <h3>{item.title || "Гарчиггүй"}</h3>
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
