import { useEffect } from 'react'

// Small toast that appears top-right, fades after 2.5s.
export default function CelebrateToast({ message = 'Nice work!', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <>
      <div className="fixed top-6 right-6 z-[101] pointer-events-none mysyde-celebrate-toast">
        <div
          className="bg-white text-[#111827] font-semibold text-sm px-4 py-3 rounded-lg shadow-2xl border border-green-200 flex items-center gap-2"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <span className="text-lg" aria-hidden>🎉</span>
          {message}
        </div>
      </div>
      <style>{`
        @keyframes mysyde-celebrate-toast-in {
          0%   { transform: translateY(-20px); opacity: 0; }
          15%  { transform: translateY(0);      opacity: 1; }
          85%  { transform: translateY(0);      opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        .mysyde-celebrate-toast { animation: mysyde-celebrate-toast-in 2500ms ease-out forwards; }
      `}</style>
    </>
  )
}
