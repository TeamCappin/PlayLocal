import Link from "next/link";
import styles from "./modules/Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img
            src="/Munera-logo.svg"
            alt="Munera Intelligence"
            className={styles.logo}
            height={56}
            width={56}
          />
          <div className={styles.brandText}>
            <strong>PermitParser</strong>
            <span>Market intelligence for construction.</span>
          </div>
        </div>

        <nav className={styles.cols} aria-label="Footer">
          <div className={styles.col}>
            <h3 className={styles.h}>Pages</h3>
            <ul>
              <li>
                <Link href="/">{"Home"}</Link>
              </li>
              <li>
                <Link href="/projects">{"Projects"}</Link>
              </li>
              <li>
                <Link href="/about">{"About"}</Link>
              </li>
              <li>
                <Link href="/contact">{"Contact"}</Link>
              </li>
            </ul>
          </div>

          <div className={styles.col}>
            <h3 className={styles.h}>Expertise</h3>
            <ul>
              <li>
                <span>General Contractor</span>
              </li>
              <li>
                <span>Supplier & Manufacturer</span>
              </li>
              <li>
                <span>Broker & Promoter</span>
              </li>
            </ul>
          </div>

          <div className={styles.col}>
            <h3 className={styles.h}>Contact</h3>
            <address className={styles.address}>
              <a href="mailto:support@munera.ai">support@munera.ai</a>
              <br />
              800 Rue du Square-Victoria (suite 393)
              <br />
              Montreal, QC H3C 0B4
            </address>

            <div className={styles.social}>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </nav>
      </div>

      <div className={styles.copyRow}>
        <div className={styles.copyInner}>
          <small>© {year} PermitParser. All rights reserved.</small>
          <small className={styles.muted}>Site by Alister.</small>
        </div>
      </div>
    </footer>
  );
}
