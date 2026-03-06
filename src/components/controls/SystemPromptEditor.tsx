import { usePromptStore } from '../../store/usePromptStore'

export function SystemPromptEditor() {
  const { systemPrompt, setSystemPrompt } = usePromptStore()

  return (
    <div style={{ padding: '0 16px' }}>
      <label style={labelStyle}>System_Instruction_Set</label>
      <textarea
        value={systemPrompt}
        onChange={e => setSystemPrompt(e.target.value)}
        rows={4}
        style={textareaStyle}
        placeholder="INPUT_OVERRIDE_COMMANDS..."
      />
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888',
  display: 'block', marginBottom: 8, fontWeight: 800, fontFamily: 'monospace'
}
const textareaStyle: React.CSSProperties = {
  width: '100%', background: '#f8f9fa', color: '#555',
  border: '1px solid #e0e0e0', borderRadius: '2px', padding: 12, fontSize: '11px',
  resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.5,
  outline: 'none'
}
