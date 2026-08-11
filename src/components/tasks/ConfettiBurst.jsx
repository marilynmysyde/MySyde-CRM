import { useEffect, useMemo } from 'react'

// Brand + celebration palette
const COLORS = [
  '#1D4ED8', // MySyde Blue
  '#F59E0B', // Community Yellow
  '#10b981', // Emerald
  '#f472b6', // Pink
  '#f59e0b', // Amber
]

const PIECE_COUNT = 50
const DURATION_MS = 2500

// Self-cleaning confetti burst. Renders 50 falling pieces then calls onDone.
export default function ConfettiBurst({ onDone }) {
  const pieces = useMemo(() =>
    Array.from({ length: PIECE_COUNT }, () => ({
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      left:     Math.random() * 100,
      delay:    Math.random() * 200,
      duration: 1600 + Math.random() * 900,
      size:     6 + Math.random() * 6,
    })), [])

  useEffect(() => {
    const t = setTimeout(onDone, DURATION_MS)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {pieces.map((p, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top:          '-20px',
              left:         `${p.left}%`,
              width:        `${p.size}px`,
              height:       `${p.size * 0.4}px`,
              background:   p.color,
              borderRadius: '1px',
              animation:    `mysyde-confetti-fall ${p.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}ms forwards`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes mysyde-confetti-fall {
          0%   { transform: translateY(0) rotate(0);       opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </>
  )
}
