'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLinks({ items, badge }: { items: [string, string, string][]; badge?: Record<string, number> }) {
  const p = usePathname()
  return (
    <>
      {items.map(([href, label, icon]) => {
        const root = href === '/owner' || href === '/lawyer'
        const on = p === href || (!root && p.startsWith(href))
        return (
          <Link key={href} href={href} className={`nv ${on ? 'on' : ''}`}>
            <span>{icon}</span>{label}
            {badge?.[href] ? <i className="dot">{badge[href]}</i> : null}
          </Link>
        )
      })}
    </>
  )
}
