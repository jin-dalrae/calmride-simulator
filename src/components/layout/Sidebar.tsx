import { ScenarioPicker } from '../controls/ScenarioPicker'
import { SystemPromptEditor } from '../controls/SystemPromptEditor'
import { ToneSliders } from '../controls/ToneSliders'
import { PersonalitySelector } from '../controls/PersonalitySelector'
import { RegenerateButton } from '../controls/RegenerateButton'
import { DataAccumulator } from '../timeline/DataAccumulator'

export function Sidebar() {
  return (
    <div style={{
      width: 280,
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '24px 16px 16px',
        fontSize: 14,
        fontWeight: 800,
        color: '#111',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        borderBottom: '1px solid #e0e0e0',
        background: '#fafafa'
      }}>
        CALMRIDE_SIM
      </div>

      <div className="custom-scrollbar" style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: '20px 0'
      }}>
        <ScenarioPicker />

        <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 20 }}>
          <PersonalitySelector />
        </div>

        <ToneSliders />

        <SystemPromptEditor />

        <div style={{ padding: '0 12px' }}>
          <RegenerateButton />
        </div>

        <div style={{ borderTop: '1px solid #e0e0e0', minHeight: 180, flex: '0 0 auto' }}>
          <DataAccumulator />
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        fontSize: '9px',
        color: '#bbb',
        borderTop: '1px solid #e0e0e0',
        fontFamily: 'monospace'
      }}>
        CORE_ENGINE_V1.2.4
      </div>
    </div>
  )
}
