import SectionHeading from "./SectionHeading.jsx";

const statCards = [
  {
    key: "members",
    icon: "👥",
    label: "Гишүүд",
    getValue: (stats) => `${Math.max(0, Number(stats.members || 0))}+`
  },
  {
    key: "events",
    icon: "📅",
    label: "Эвент",
    getValue: (stats) => `${Math.max(0, Number(stats.events || 0))}+`
  },
  {
    key: "trips",
    icon: "📍",
    label: "Аялал",
    getValue: (stats) => `${Math.max(0, Number(stats.trips || 0))}+`
  },
  {
    key: "community",
    icon: "♡",
    label: "Нэгдэл",
    getValue: (stats) => Math.max(1, Number(stats.community || 1))
  }
];

export default function Stats({ stats, isAdmin, onUpdateStat }) {
  return (
    <section id="stats" className="section" aria-labelledby="statsTitle">
      <SectionHeading eyebrow="Momentum" title="Тоон үзүүлэлт" titleId="statsTitle" />

      <div className="stats-grid">
        {statCards.map((stat) => (
          <article className="stat-card" key={stat.key}>
            <span className="stat-icon" aria-hidden="true">
              {stat.icon}
            </span>
            <strong>{stat.getValue(stats)}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </div>

      {isAdmin && (
        <div className="add-box compact-actions" aria-label="Stats actions">
          <button type="button" onClick={() => onUpdateStat("events", 1)}>
            + Эвент
          </button>
          <button type="button" onClick={() => onUpdateStat("trips", 1)}>
            + Аялал
          </button>
          <button type="button" onClick={() => onUpdateStat("community", 1)}>
            + Нэгдэл
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onUpdateStat("members", -1)}
          >
            - Гишүүн
          </button>
        </div>
      )}
    </section>
  );
}
