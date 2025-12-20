// src/components/LanguageToggle.tsx
import { useEffect, useState } from 'react'
import i18n from 'i18next'
import styles from './modules/LanguageToggle.module.css'

export default function LanguageToggle() {
  const norm = (l: string) => (l?.startsWith('fr') ? 'fr' : 'en')
  const [lng, setLng] = useState<'en' | 'fr'>(norm(i18n.language))

  useEffect(() => {
    const onChange = (l: string) => setLng(norm(l))
    i18n.on('languageChanged', onChange)
    return () => i18n.off('languageChanged', onChange)
  }, [])

  return (
    <div className={styles.wrap} data-lang={lng} role="radiogroup" aria-label="Language">
      {/* Sliding green background */}
      <span className={styles.activeBg} aria-hidden="true" />

      {/* Static center circle */}
      <span className={styles.centerDot} aria-hidden="true" />

      <button
        type="button"
        role="radio"
        aria-checked={lng === 'en'}
        className={`${styles.segment} ${styles.left}`}
        onClick={() => i18n.changeLanguage('en')}
        title="English"
      >
        EN
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={lng === 'fr'}
        className={`${styles.segment} ${styles.right}`}
        onClick={() => i18n.changeLanguage('fr')}
        title="Français"
      >
        FR
      </button>
    </div>
  )
}
