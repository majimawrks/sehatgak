'use client'

import { useState, useEffect } from 'react'

const ITEMS = [
  { label: 'minuman', color: 'var(--action)' },
  { label: 'snack',   color: '#D4850A' },
  { label: 'makanan', color: '#5563B0' },
] as const

export function CategoryCycler() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % ITEMS.length)
    }, 1600)
    return () => clearInterval(id)
  }, [])

  const item = ITEMS[index % ITEMS.length]!

  return (
    <span
      key={index}
      style={{
        color: item.color,
        display: 'inline-block',
        animation: 'sg-word-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      }}
    >
      {item.label}
    </span>
  )
}
