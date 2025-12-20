"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import IconButton from "./IconButton";
import styles from "./modules/IconMenus.module.css";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    addEventListener("mousedown", onDown);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("mousedown", onDown);
      removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => setOpen((v) => !v);

  return (
    <div className={styles.menuWrap}>
      <IconButton
        ref={btnRef}
        label="Account"
        onClick={toggle}
        className={styles.iconUser}
      />
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className={styles.menu}
        >
          {user ? (
            <>
              <button role="menuitem" className={styles.item}>
                {t("userMenu.profile")}
              </button>
              <button role="menuitem" className={styles.item}>
                {t("userMenu.settings")}
              </button>
              <hr className={styles.sep} />
              <button
                role="menuitem"
                className={styles.item}
                onClick={() => {
                  logout();
                  setOpen(false);
                  router.push("/");
                }}
              >
                {t("userMenu.logout")}
              </button>
            </>
          ) : (
            <>
              <button
                role="menuitem"
                className={styles.item}
                onClick={() => {
                  setOpen(false);
                  router.push("/login");
                }}
              >
                {t("userMenu.login")}
              </button>
              <button
                role="menuitem"
                className={styles.item}
                onClick={() => {
                  setOpen(false);
                  router.push("/signup");
                }}
              >
                {t("userMenu.signup")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
