import { useEffect, useRef, useState } from 'react'
import IconButton from './IconButton'
import styles from './modules/IconMenus.module.css'

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current || !btnRef.current) return
      const t = e.target as Node
      if (!menuRef.current.contains(t) && !btnRef.current.contains(t)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    addEventListener('mousedown', onDown)
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('mousedown', onDown)
      removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => setOpen((v) => !v)

  // stub actions – wire to your real settings
  const onPreferences = () => console.log('Open Preferences')
  const onAppearance = () => console.log('Open Appearance')
  const onShortcuts = () => console.log('Open Keyboard Shortcuts')

  return (
    <div className={styles.menuWrap}>
      <IconButton ref={btnRef} label="Settings" onClick={toggle}>
        <img
          src="/Settings-icon.svg"
          alt=""
          aria-hidden="true"
          draggable="false"
          className={styles.iconImg}
        />
      </IconButton>
      {open && (
        <div ref={menuRef} role="menu" aria-label="Settings" className={styles.menu}>
          <button role="menuitem" className={styles.item} onClick={onPreferences}>
            Preferences
          </button>
          <button role="menuitem" className={styles.item} onClick={onAppearance}>
            Appearance
          </button>
          <button role="menuitem" className={styles.item} onClick={onShortcuts}>
            Keyboard shortcuts
          </button>
        </div>
      )}
    </div>
  )
}
