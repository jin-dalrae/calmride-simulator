import { useExplanationStore } from '../../store/useExplanationStore'
import { useGeminiExplanation } from '../../hooks/useGeminiExplanation'

export function RegenerateButton() {
  const { currentIncident, loading } = useExplanationStore()
  const { regenerate } = useGeminiExplanation()

  if (!currentIncident) return null

  return (
    <div style={{ padding: '0 16px' }}>
      <button
        onClick={regenerate}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px 0',
          fontSize: '11px',
          fontWeight: 800,
          fontFamily: 'monospace',
          background: loading ? '#f5f5f5' : 'rgba(2, 132, 199, 0.08)',
          color: loading ? '#aaa' : '#0284c7',
          border: `1px solid ${loading ? '#e0e0e0' : '#0284c7'}`,
          borderRadius: '2px',
          cursor: loading ? 'not-allowed' : 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        {loading ? 'RE_INDEXING...' : 'FORCE_RE_DELIBERATION'}
      </button>
    </div>
  )
}
