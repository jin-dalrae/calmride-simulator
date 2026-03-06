import { ScenarioPicker } from '../controls/ScenarioPicker'
import { SystemPromptEditor } from '../controls/SystemPromptEditor'
import { ToneSliders } from '../controls/ToneSliders'
import { PersonalitySelector } from '../controls/PersonalitySelector'
import { RegenerateButton } from '../controls/RegenerateButton'
import { DataAccumulator } from '../timeline/DataAccumulator'
import { RawDataStream } from '../timeline/RawDataStream'

export function Sidebar() {
  return (
    <div style={{
      width: 300,
      background: '#111827',
      borderRight: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      overflowY: 'auto',
    }}>
      <div style={{
        padding: '16px 12px 8px',
        fontSize: 16,
        fontWeight: 700,
        color: '#f3f4f6',
        borderBottom: '1px solid #1f2937',
      }}>
        CalmRide Simulator
      </div>

      <ScenarioPicker />

      <div style={{ borderTop: '1px solid #1f2937', paddingTop: 12 }}>
        <PersonalitySelector />
      </div>

      <ToneSliders />

      <SystemPromptEditor />

      <RegenerateButton />

      <div style={{ borderTop: '1px solid #1f2937', minHeight: 180, flex: '0 0 auto' }}>
        <DataAccumulator />
      </div>

      <div style={{ borderTop: '1px solid #1f2937', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 250 }}>
        <RawDataStream />
      </div>
    </div>
  )
}
