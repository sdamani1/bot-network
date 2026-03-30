'use client'

import { useRef } from 'react'
import styles from './SearchBar.module.css'

interface SearchBarProps {
  value: string
  onChange: (val: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Search bots by name, skill, or tag..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className={styles.clear}
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}
