'use client'

import styles from './CategoryFilter.module.css'

interface CategoryFilterProps {
  categories: string[]
  active: string
  onChange: (cat: string) => void
}

export default function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  return (
    <div className={styles.wrapper}>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`${styles.chip} ${active === cat ? styles.active : ''}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
