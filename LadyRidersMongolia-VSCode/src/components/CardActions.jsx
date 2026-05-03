export default function CardActions({ onEdit, onDelete }) {
  return (
    <div className="card-actions">
      <button type="button" onClick={onEdit}>
        Засах
      </button>
      <button className="danger-button" type="button" onClick={onDelete}>
        Устгах
      </button>
    </div>
  );
}
