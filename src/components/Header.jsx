import { useState } from "react";

const navLinks = [
  { href: "#features", label: "Онцлог" },
  { href: "#about", label: "Бидний тухай" },
  { href: "#stats", label: "Тоон үзүүлэлт" },
  { href: "#gallery", label: "Зураг" },
  { href: "#contact", label: "Холбоо барих" },
  { href: "#membership", label: "Анкет" },
  { href: "#admin-login", label: "Admin" }
];

export default function Header({ isAdmin, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="site-header">
      <a className="logo" href="#home" aria-label="Lady Riders Mongolia home" onClick={closeMenu}>
        <img
          src="/source.jpg"
          alt="Lady Riders Mongolia motorcycle community mark"
          className="logo-mark"
        />
        <span>Lady Riders</span>
      </a>

      <nav
        id="navMenu"
        className={`site-nav${isMenuOpen ? " is-open" : ""}`}
        aria-label="Primary navigation"
      >
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={closeMenu}>
            {link.label}
          </a>
        ))}

        <a href="/privacy.html" onClick={closeMenu}>
          Privacy
        </a>

        {isAdmin && (
          <button className="nav-button" type="button" onClick={onLogout}>
            Logout
          </button>
        )}
      </nav>

      <button
        id="menuBtn"
        className="icon-button"
        type="button"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        aria-controls="navMenu"
        onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
      >
        <span aria-hidden="true">☰</span>
      </button>
    </header>
  );
}
