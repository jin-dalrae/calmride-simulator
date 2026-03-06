import { usePromptStore } from '../../store/usePromptStore'
import type { Personality } from '../../types/prompt'

const personalities: { value: Personality; label: string }[] = [
  { value: 'professional', label: 'Pro (Operational)' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'comfort', label: 'Comfort/Empathy' },
  { value: 'technical', label: 'Technical' },
  { value: 'concierge', label: 'Concierge' },
]

export function PersonalitySelector() {
  const { personality, setPersonality } = usePromptStore()

  return (
    <div style={{ padding: '0 16px' }}>
      <label style={labelStyle}>AI_Personality_Kernel</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {personalities.map(p => (
          <button
            key={p.value}
            onClick={() => setPersonality(p.value)}
            style={{
              padding: '8px 4px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'monospace',
              border: personality === p.value ? '1px solid #0284c7' : '1px solid #e0e0e0',
              borderRadius: '2px',
              background: personality === p.value ? 'rgba(2, 132, 199, 0.08)' : '#f8f9fa',
              color: personality === p.value ? '#0284c7' : '#888',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {p.value.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888',
  display: 'block', marginBottom: 10, fontWeight: 800, fontFamily: 'monospace'
}
