import { usePromptStore } from '../../store/usePromptStore'

const sliders = [
  { key: 'anxietyLevel' as const, label: 'Anxiety Acknowledgment' },
  { key: 'technicalDepth' as const, label: 'Technical Depth' },
  { key: 'verbosity' as const, label: 'Verbosity' },
]

export function ToneSliders() {
  const { tone, setTone } = usePromptStore()

  return (
    <div style={{ padding: '0 16px' }}>
      <label style={labelStyle}>Tone_Parameters</label>
      {sliders.map(({ key, label }) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '10px', color: '#555', fontWeight: 600, fontFamily: 'monospace' }}>{label.toUpperCase()}</span>
            <span style={{ fontSize: '10px', color: '#059669', fontFamily: 'monospace' }}>{tone[key]}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={tone[key]}
            onChange={e => setTone({ [key]: parseInt(e.target.value) })}
            className="tone-slider"
            style={{ width: '100%', accentColor: '#0284c7', height: '2px', background: '#e0e0e0', appearance: 'none' }}
          />
        </div>
      ))}
      <style>{`
        .tone-slider::-webkit-slider-thumb {
            appearance: none;
            width: 10px;
            height: 10px;
            background: #0284c7;
            border-radius: 2px;
        }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888',
  display: 'block', marginBottom: 12, fontWeight: 800, fontFamily: 'monospace'
}
