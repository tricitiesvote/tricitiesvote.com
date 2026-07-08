'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Number-with-detail: hover opens on desktop, tap toggles on touch devices.
 */
export function MetricPopover({ value, children }: { value: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open])

  return (
    <span
      ref={ref}
      className="rg-pop"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="rg-pop-trigger"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        {value}
      </button>
      {open && <span className="rg-pop-card">{children}</span>}
    </span>
  )
}
