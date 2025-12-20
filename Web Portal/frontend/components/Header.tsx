"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./modules/Header.module.css";
import LanguageToggle from "./LanguageToggle";
import UserMenu from "./UserMenu";
import SettingsMenu from "./SettingsMenu";

const NAV = [
  { path: "/about", key: "nav.about" },
  { path: "/projects", key: "nav.projects" },
  { path: "/contact", key: "nav.contact" },
];

export default function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();

  // scroll direction: 'down' makes header slightly transparent
  const [dir, setDir] = useState<"up" | "down">("up");
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setDir(y > lastY.current ? "down" : "up");
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        styles.header,
        dir === "down" ? styles.headerTransparent : styles.headerSolid,
      ].join(" ")}
    >
      <div className={styles.headerContainer}>
        {/* Brand */}
        <Link
          href="/"
          aria-label="Munera Intelligence"
          className={styles.brand}
        >
          <img
            src="/Munera-logo.svg"
            alt="Munera Intelligence"
            className={styles.brandLogo}
          />
          <span className={styles.brandName}>PermitParser</span>
        </Link>

        {/* Nav */}
        <nav className={styles.navWrapper}>
          <ul className={styles.navLinks}>
            {NAV.map((n) => (
              <li key={n.path} className={styles.navItem}>
                <Link
                  href={n.path}
                  className={[
                    styles.navLink,
                    pathname === n.path ? styles.activeLink : "",
                  ].join(" ")}
                >
                  {t(n.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.lang}>
          <LanguageToggle />
          <SettingsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
