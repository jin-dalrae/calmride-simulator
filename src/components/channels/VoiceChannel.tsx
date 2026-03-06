import { useState, useCallback } from 'react'
import { useExplanationStore } from '../../store/useExplanationStore'

const toneColors = { calm: '#22c55e', informative: '#3b82f6', urgent: '#ef4444' }

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
      <div style={headerStyle}>Voice</div>
      {loading ? (
        <div style={loadingStyle}>Generating...</div>
      ) : content && consensusReached ? (
        <div style={{ padding: 12 }}>
          <div style={{
            background: '#374151', borderRadius: 12, padding: 12,
            position: 'relative',
          }}>
            {/* Speech bubble */}
            <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
              "{content.text}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: toneColors[content.tone], textTransform: 'uppercase' }}>
                {content.tone}
              </span>
              <button
                onClick={speaking ? stop : speak}
                style={{
                  background: speaking ? '#ef4444' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {speaking ? 'Stop' : 'Play'}
              </button>
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
