export default function SectionHeading({ eyebrow, title, titleId }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={titleId}>{title}</h2>
    </div>
  );
}
