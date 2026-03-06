import { useState, useCallback } from 'react'
import { useExplanationStore } from '../../store/useExplanationStore'

const toneColors = { calm: '#16a34a', informative: '#0284c7', urgent: '#dc2626' }

export function VoiceChannel() {
  const content = useExplanationStore(s => s.current?.voice)
  const loading = useExplanationStore(s => s.loading)
  const consensusReached = useExplanationStore(s => s.consensusReached)
  const [speaking, setSpeaking] = useState(false)

  const speak = useCallback(() => {
    if (!content || speaking || !consensusReached) return
    const utterance = new SpeechSynthesisUtterance(content.text)
    utterance.rate = content.tone === 'urgent' ? 1.1 : 0.9
    utterance.pitch = content.tone === 'calm' ? 0.9 : 1.0
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    speechSynthesis.speak(utterance)
  }, [content, speaking, consensusReached])

  const stop = useCallback(() => {
    speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span>VOICE_COMMS_LINK</span>
        <span style={{ color: consensusReached ? '#16a34a' : '#ccc' }}>●</span>
      </div>
      {loading ? (
        <div style={loadingStyle}>[SYNTHESIZING_VOICE...]</div>
      ) : content && consensusReached ? (
        <div style={{ padding: '20px 16px' }}>
          <div style={{
            background: '#f8f9fa', borderRadius: '4px', padding: '12px',
            position: 'relative', border: '1px solid #e0e0e0'
          }}>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
              "{content.text}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ fontSize: '9px', color: toneColors[content.tone], textTransform: 'uppercase', fontWeight: 800, letterSpacing: 1, fontFamily: 'monospace' }}>
                TONE: {content.tone}
              </span>
              <button
                onClick={speaking ? stop : speak}
                style={{
                  background: speaking ? 'rgba(220, 38, 38, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                  color: speaking ? '#dc2626' : '#0284c7',
                  border: `1px solid ${speaking ? '#dc2626' : '#0284c7'}`,
                  borderRadius: '2px',
                  padding: '4px 12px',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                {speaking ? 'TERMINATE' : 'BROADCAST'}
              </button>
            </div>
          </div>
        </div>
      ) : content && !consensusReached ? (
        <div style={loadingStyle}>[AWAITING_REASONING...]</div>
      ) : (
        <div style={emptyStyle}>AUDIO_LINK_OFFLINE</div>
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
