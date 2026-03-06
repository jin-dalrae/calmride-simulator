import { useExplanationStore } from '../../store/useExplanationStore'

const iconMap = { info: 'ℹ️', warning: '⚠️', safety: '🛡️', route: '🗺️' }

export function FrontScreen() {
  const content = useExplanationStore(s => s.current?.frontScreen)
  const loading = useExplanationStore(s => s.loading)
  const consensusReached = useExplanationStore(s => s.consensusReached)

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>Front Screen</div>
      {loading ? (
        <div style={loadingStyle}>Generating...</div>
      ) : content && consensusReached ? (
        <div style={contentStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{iconMap[content.icon]}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#f3f4f6' }}>{content.headline}</span>
          </div>
          <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5, margin: 0 }}>{content.body}</p>
          {content.etaImpact && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#fbbf24', background: '#fbbf2411', padding: '4px 8px', borderRadius: 4 }}>
              ETA: {content.etaImpact}
            </div>
          )}
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
const contentStyle: React.CSSProperties = { padding: 12 }
const loadingStyle: React.CSSProperties = { padding: 16, color: '#6b7280', fontSize: 13, textAlign: 'center' }
const emptyStyle: React.CSSProperties = { padding: 16, color: '#4b5563', fontSize: 12, textAlign: 'center' }
