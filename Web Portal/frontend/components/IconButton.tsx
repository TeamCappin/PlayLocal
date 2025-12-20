// src/components/IconButton.tsx
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import styles from './modules/IconMenus.module.css'

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & { label: string }

const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={[styles.iconBtn, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
})
export default IconButton
