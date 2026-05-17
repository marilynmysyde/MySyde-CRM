export default function Tasks() {
  return <ComingSoon title="Tasks" phase={3} description="Kanban task boards, per-partner tabs, recurring tasks, and due-date alerts." />
}

function ComingSoon({ title, phase, description }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-8">
      <div className="w-12 h-12 rounded-full bg-[#02348E]/10 flex items-center justify-center mb-4">
        <span className="text-[#02348E] text-xl">⚙</span>
      </div>
      <h2 className="text-lg font-semibold text-[#010100] mb-1" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {title}
      </h2>
      <p className="text-sm text-gray-400 max-w-xs" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
        {description}
      </p>
      <span className="mt-4 text-xs font-medium text-[#02348E] bg-[#02348E]/10 px-3 py-1 rounded-full" style={{ fontFamily: 'Roboto, sans-serif' }}>
        Coming in Phase {phase}
      </span>
    </div>
  )
}

export { ComingSoon }
