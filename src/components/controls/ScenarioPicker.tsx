import { useScenarioStore } from '../../store/useScenarioStore'
import { usePlaybackStore } from '../../store/usePlaybackStore'
import { useExplanationStore } from '../../store/useExplanationStore'

export function ScenarioPicker() {
  const { availableScenarios, currentScenario, loading, error, backendConnected } = useScenarioStore()
  const { reset, setDuration } = usePlaybackStore()
  const clearExplanations = useExplanationStore(s => s.clear)
  const loadScenario = useScenarioStore(s => s.loadScenario)

  const handleSelect = async (id: string) => {
    if (!id) return
    reset()
    clearExplanations()
    await loadScenario(id)
    const scenario = useScenarioStore.getState().currentScenario
    if (scenario) setDuration(scenario.duration)
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <label style={labelStyle}>Scenario_Source</label>
      {!backendConnected && (
        <div style={{ fontSize: 9, color: '#d97706', marginBottom: 8, fontFamily: 'monospace', lineHeight: 1.4 }}>
          BACKEND_OFFLINE: Start server to load WOMD data
        </div>
      )}
      <select
        onChange={e => handleSelect(e.target.value)}
        value={currentScenario?.id || ''}
        style={selectStyle}
        disabled={loading || !backendConnected}
      >
        <option value="">SELECT_WOMD_SCENARIO</option>
        {availableScenarios.map(id => (
          <option key={id} value={id}>{id.toUpperCase()}</option>
        ))}
      </select>
      {loading && <div style={{ fontSize: 9, color: '#0284c7', marginTop: 8, fontFamily: 'monospace' }}>{'>'} LOADING_TFRECORDS...</div>}
      {error && <div style={{ fontSize: 9, color: '#dc2626', marginTop: 8, fontFamily: 'monospace' }}>{'>'} ERR: {error.toUpperCase()}</div>}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888',
  display: 'block', marginBottom: 8, fontWeight: 800, fontFamily: 'monospace'
}
const selectStyle: React.CSSProperties = {
  width: '100%', background: '#f8f9fa', color: '#333',
  border: '1px solid #e0e0e0', borderRadius: '2px', padding: '10px 12px', fontSize: '12px',
  fontFamily: 'monospace', outline: 'none'
}
