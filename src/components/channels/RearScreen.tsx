import { useExplanationStore } from '../../store/useExplanationStore'

const iconMap = { info: 'ℹ️', warning: '⚠️', safety: '🛡️', route: '🗺️' }

export function RearScreen() {
  const content = useExplanationStore(s => s.current?.rearScreen)
  const loading = useExplanationStore(s => s.loading)
  const consensusReached = useExplanationStore(s => s.consensusReached)

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>Rear Screen</div>
      {loading ? (
        <div style={loadingStyle}>Generating...</div>
      ) : content && consensusReached ? (
        <div style={{ padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{iconMap[content.icon]}</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#f3f4f6' }}>{content.headline}</span>
          </div>
          <p style={{ fontSize: 15, color: '#d1d5db', lineHeight: 1.6, margin: 0 }}>{content.comfortNote}</p>
        </div>
      ) : content && !consensusReached ? (
        <div style={loadingStyle}>Awaiting final consensus...</div>
      ) : (
        <div style={emptyStyle}>Waiting for incident...</div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#1f2937', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column',
  border: '1px solid #374151',
}
const headerStyle: React.CSSProperties = {
  padding: '6px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
  color: '#9ca3af', borderBottom: '1px solid #374151', background: '#111827',
}
const loadingStyle: React.CSSProperties = { padding: 16, color: '#6b7280', fontSize: 13, textAlign: 'center' }
const emptyStyle: React.CSSProperties = { padding: 16, color: '#4b5563', fontSize: 12, textAlign: 'center' }
