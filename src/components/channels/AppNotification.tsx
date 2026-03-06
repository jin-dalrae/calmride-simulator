import { useExplanationStore } from '../../store/useExplanationStore'

const priorityColors = { low: '#22c55e', medium: '#fbbf24', high: '#ef4444' }

export function AppNotification() {
  const content = useExplanationStore(s => s.current?.appNotification)
  const loading = useExplanationStore(s => s.loading)
  const consensusReached = useExplanationStore(s => s.consensusReached)

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>App Push</div>
      {loading ? (
        <div style={loadingStyle}>Generating...</div>
      ) : content && consensusReached ? (
        <div style={{ padding: 12 }}>
          {/* Mobile notification mockup */}
          <div style={{
            background: '#374151', borderRadius: 12, padding: 12,
            border: `1px solid ${priorityColors[content.priority]}44`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: '#3b82f6', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>CR</div>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>CalmRide</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 'auto' }}>now</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f3f4f6', marginBottom: 2 }}>{content.title}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{content.body}</div>
            <div style={{
              marginTop: 6, fontSize: 10, color: priorityColors[content.priority],
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {content.priority} priority
            </div>
          </div>
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
