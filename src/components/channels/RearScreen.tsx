import { useExplanationStore } from '../../store/useExplanationStore'

const iconMap = { info: 'ℹ️', warning: '⚠️', safety: '🛡️', route: '🗺️' }

export function RearScreen() {
  const content = useExplanationStore(s => s.current?.rearScreen)
  const loading = useExplanationStore(s => s.loading)
  const consensusReached = useExplanationStore(s => s.consensusReached)

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>REAR_DISPLAY_UNIT</span>
        <span style={{ color: consensusReached ? '#16a34a' : '#ccc' }}>●</span>
      </div>
      {loading ? (
        <div style={loadingStyle}>[STREAMING_METRICS...]</div>
      ) : content && consensusReached ? (
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111', borderLeft: '3px solid #16a34a', paddingLeft: 10 }}>
                {content.headline.toUpperCase()}
            </div>
            <p style={{ fontSize: 15, color: '#444', lineHeight: 1.6, margin: 0 }}>{content.comfortNote}</p>
          </div>
        </div>
      ) : content && !consensusReached ? (
        <div style={loadingStyle}>[PROCESSING_REASSURANCE_MAP...]</div>
      ) : (
        <div style={emptyStyle}>NO_SIGNAL: STANDBY</div>
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
