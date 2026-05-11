import { useState } from "react";
import CardActions from "./CardActions.jsx";
import SectionHeading from "./SectionHeading.jsx";

export default function Gallery({ gallery, isAdmin, onAdd, onEdit, onDelete }) {
  const [src, setSrc] = useState("");
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [imageFile, setImageFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!src.trim() && !imageFile) {
      return;
    }

    const formData = new FormData();
    formData.append("src", src.trim());
    formData.append("caption", caption.trim());
    formData.append("alt", alt.trim() || caption.trim() || "Lady Riders Mongolia gallery image");

    if (imageFile) {
      formData.append("image", imageFile);
    }

    await onAdd(formData);

    setSrc("");
    setCaption("");
    setAlt("");
    setImageFile(null);
    event.currentTarget.reset();
  }

  async function handleEdit(item) {
    const nextSrc = window.prompt("Зургийн URL", item.src || "");

    if (nextSrc === null) {
      return;
    }

    const nextCaption = window.prompt("Caption", item.caption || "");

    if (nextCaption === null) {
      return;
    }

    const nextAlt = window.prompt("Alt text", item.alt || "");

    if (nextAlt === null) {
      return;
    }

    await onEdit(item.id, {
      src: nextSrc.trim(),
      caption: nextCaption.trim(),
      alt: nextAlt.trim()
    });
  }

  return (
    <section id="gallery" className="section" aria-labelledby="galleryTitle">
      <SectionHeading eyebrow="Moments" title="Зургийн цомог" titleId="galleryTitle" />

      {isAdmin && (
        <form className="add-box gallery-add-box" autoComplete="off" onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            aria-label="Gallery image upload"
          />
          <input
            value={src}
            onChange={(event) => setSrc(event.target.value)}
            placeholder="Эсвэл зургийн URL"
            aria-label="Gallery image URL"
          />
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Caption"
            aria-label="Gallery caption"
          />
          <input
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="Alt text"
            aria-label="Gallery alt text"
          />
          <button type="submit">Зураг нэмэх</button>
        </form>
      )}

      <div className="gallery-grid">
        {gallery.length === 0 ? (
          <p className="card">Одоогоор зураг алга.</p>
        ) : (
          gallery.map((item) => (
            <figure className="gallery-item" key={item.id || item.src}>
              <img src={item.src} alt={item.alt || item.caption || "Lady Riders Mongolia gallery image"} loading="lazy" />
              <figcaption>
                <span>{item.caption || "Lady Riders Mongolia"}</span>
                {isAdmin && (
                  <CardActions
                    onEdit={() => handleEdit(item)}
                    onDelete={() => onDelete(item.id)}
                  />
                )}
              </figcaption>
            </figure>
          ))
        )}
      </div>
    </section>
  );
}
