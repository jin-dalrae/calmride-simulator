import { usePlaybackStore } from '../../store/usePlaybackStore'
import { useScenarioStore } from '../../store/useScenarioStore'

const speeds = [0.25, 0.5, 1, 2, 4]

const EMPTY_INCIDENTS: any[] = []

export function TimelineBar() {
  const currentTime = usePlaybackStore(s => s.currentTime)
  const isPlaying = usePlaybackStore(s => s.isPlaying)
  const speed = usePlaybackStore(s => s.speed)
  const duration = usePlaybackStore(s => s.duration)
  const togglePlay = usePlaybackStore(s => s.togglePlay)
  const setSpeed = usePlaybackStore(s => s.setSpeed)
  const seek = usePlaybackStore(s => s.seek)

  const incidents = useScenarioStore(s => s.currentScenario?.incidents || EMPTY_INCIDENTS)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(20px)',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
    }}>
      <button onClick={togglePlay} style={btnStyle}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={e => seek(parseFloat(e.target.value))}
          className="timeline-slider"
          style={{
            width: '100%',
            cursor: 'pointer',
            height: '4px',
            borderRadius: '2px',
            appearance: 'none',
            background: '#e0e0e0'
          }}
        />
        {incidents.map(inc => (
          <div
            key={inc.id}
            style={{
              position: 'absolute',
              left: `${(inc.timestamp / duration) * 100}%`,
              top: '50%',
              width: 6, height: 6,
              borderRadius: '50%',
              background: inc.severity === 'high' ? '#dc2626' : '#d97706',
              transform: 'translate(-3px, -3px)',
              pointerEvents: 'none',
              boxShadow: `0 0 10px ${inc.severity === 'high' ? '#dc2626' : '#d97706'}`
            }}
          />
        ))}
      </div>

      <span style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#059669',
        minWidth: 90,
        textAlign: 'right',
        letterSpacing: '1px'
      }}>
        {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
      </span>

      <div style={{ display: 'flex', gap: 4 }}>
        {[0.5, 1, 2].map(s => (
            <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                    background: speed === s ? '#e8e8e8' : 'transparent',
                    color: speed === s ? '#0284c7' : '#aaa',
                    border: 'none',
                    fontSize: '10px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    borderRadius: '2px'
                }}
            >
                {s}X
            </button>
        ))}
      </div>

      <style>{`
        .timeline-slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: #0284c7;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(2, 132, 199, 0.4);
        }
      `}</style>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#0284c7',
  border: '1px solid #0284c7',
  borderRadius: '4px',
  width: 32, height: 32,
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
