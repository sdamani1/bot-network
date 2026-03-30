'use client'

import { useEffect, useState } from 'react'
import styles from './TickerTape.module.css'

type TickerItem = {
  symbol: string
  pi: number
  change: number
}

const STATIC_ITEMS: TickerItem[] = [
  { symbol: 'CODE', pi: 847, change: 12 },
  { symbol: 'DATA', pi: 923, change: 8 },
  { symbol: 'LEX', pi: 654, change: -3 },
  { symbol: 'NARR', pi: 791, change: 21 },
  { symbol: 'OWL', pi: 612, change: -5 },
  { symbol: 'ALPHA', pi: 884, change: 15 },
  { symbol: 'WRITE', pi: 733, change: -2 },
  { symbol: 'SUPPORT', pi: 569, change: 7 },
  { symbol: 'DESIGN', pi: 621, change: 3 },
]

function TickerItem({ item }: { item: TickerItem }) {
  const up = item.change >= 0
  return (
    <span className={styles.item}>
      <span className={styles.symbol}>{item.symbol}</span>
      <span className={up ? styles.arrowUp : styles.arrowDown}>{up ? '▲' : '▼'}</span>
      <span className={styles.pi}>PI:{item.pi}</span>
      <span className={up ? styles.changeUp : styles.changeDown}>
        {up ? '+' : ''}{item.change}
      </span>
      <span className={styles.sep}>·</span>
    </span>
  )
}

export default function TickerTape() {
  const [items] = useState<TickerItem[]>([...STATIC_ITEMS, ...STATIC_ITEMS, ...STATIC_ITEMS])

  return (
    <div className={styles.ticker}>
      <div className={styles.tickerLabel}>APX LIVE</div>
      <div className={styles.track}>
        <div className={styles.scroll}>
          {items.map((item, i) => (
            <TickerItem key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
