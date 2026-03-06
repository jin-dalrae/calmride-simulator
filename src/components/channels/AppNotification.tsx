import { useExplanationStore } from '../../store/useExplanationStore'

const priorityColors = { low: '#16a34a', medium: '#d97706', high: '#dc2626' }

export function AppNotification() {
  const content = useExplanationStore(s => s.current?.appNotification)
  const loading = useExplanationStore(s => s.loading)
  const consensusReached = useExplanationStore(s => s.consensusReached)

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>PUSH_NOTIF_RELAY</span>
        <span style={{ color: consensusReached ? '#16a34a' : '#ccc' }}>●</span>
      </div>
      {loading ? (
        <div style={loadingStyle}>[QUEUEING_PUSH...]</div>
      ) : content && consensusReached ? (
        <div style={{ padding: '20px 16px' }}>
          <div style={{
            background: '#f8f9fa', borderRadius: '4px', padding: '12px',
            border: `1px solid ${priorityColors[content.priority]}33`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: 2, background: '#0284c7', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>CR</div>
              <span style={{ fontSize: '9px', color: '#888', fontWeight: 700, letterSpacing: 0.5 }}>CALMRIDE_MOBILE</span>
              <span style={{ fontSize: '9px', color: '#bbb', marginLeft: 'auto', fontFamily: 'monospace' }}>NOW</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#222', marginBottom: 4 }}>{content.title}</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{content.body}</div>
            <div style={{
              marginTop: 10, fontSize: '8px', color: priorityColors[content.priority],
              textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, fontFamily: 'monospace'
            }}>
              PRIORITY: {content.priority}
            </div>
          </div>
        </div>
      ) : content && !consensusReached ? (
        <div style={loadingStyle}>[ENCRYPTING_PAYLOAD...]</div>
      ) : (
        <div style={emptyStyle}>PUSH_SERVER_IDLE</div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: '4px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #e0e0e0',
}
const headerStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: '#888',
  borderBottom: '1px solid #e0e0e0',
  background: '#fafafa',
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: 'monospace'
}
const loadingStyle: React.CSSProperties = { padding: 24, color: '#999', fontSize: 11, textAlign: 'center', fontFamily: 'monospace' }
const emptyStyle: React.CSSProperties = { padding: 24, color: '#bbb', fontSize: 10, textAlign: 'center', fontFamily: 'monospace' }
