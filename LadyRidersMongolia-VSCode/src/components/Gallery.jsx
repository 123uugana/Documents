import SectionHeading from "./SectionHeading.jsx";

const galleryItems = [
  {
    src: "/lut.png",
    alt: "Motorcycle rider traveling on an open road",
    caption: "Зам дээрх эрх чөлөө"
  },
  {
    src: "/source.jpg",
    alt: "Motorcycle parked during a Lady Riders group ride",
    caption: "Хамтын аялал"
  },
  {
    src: "/biker.jpg",
    alt: "Close-up view of a motorcycle for rider lifestyle gallery",
    caption: "Rider lifestyle"
  },
  {
    src: "/lADY RIDERS.jpg",
    alt: "Lady Riders Mongolia community group moment",
    caption: "Lady Riders Mongolia"
  }
];

export default function Gallery() {
  return (
    <section id="gallery" className="section" aria-labelledby="galleryTitle">
      <SectionHeading eyebrow="Moments" title="Зургийн цомог" titleId="galleryTitle" />

      <div className="gallery-grid">
        {galleryItems.map((item) => (
          <figure className="gallery-item" key={item.src}>
            <img src={item.src} alt={item.alt} loading="lazy" />
            <figcaption>{item.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
