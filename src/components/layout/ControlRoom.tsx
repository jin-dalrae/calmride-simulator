import { Sidebar } from './Sidebar'
import { ChannelStrip } from './ChannelStrip'
import { SceneCanvas } from '../scene/SceneCanvas'
import { TimelineBar } from '../timeline/TimelineBar'
import { AgentChatPanel } from '../channels/AgentChatPanel'
import { DataStreamPanel } from '../channels/DataStreamPanel'

export function ControlRoom() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr 380px',
      gridTemplateRows: '1fr auto auto',
      width: '100vw',
      height: '100vh',
      background: '#f5f5f5',
      color: '#222',
      overflow: 'hidden'
    }}>
      {/* Left Sidebar */}
      <div style={{ gridRow: '1 / -1', gridColumn: '1', borderRight: '1px solid #ddd' }}>
        <Sidebar />
      </div>

      {/* Main View Area */}
      <div style={{
        gridColumn: '2',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        position: 'relative'
      }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <SceneCanvas />
        </div>

        <div style={{ position: 'absolute', bottom: 300, left: 20, right: 20, zIndex: 10 }}>
          <TimelineBar />
        </div>

        <div style={{ height: 280, borderTop: '1px solid #ddd', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
          <ChannelStrip />
        </div>
      </div>

      {/* Right Panel - Stacked vertically */}
      <div style={{
        gridRow: '1 / -1',
        gridColumn: '3',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #ddd',
        background: '#fafafa',
        overflow: 'hidden'
      }}>
        <div style={{ flex: 1, minHeight: 0, borderBottom: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
          <AgentChatPanel />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <DataStreamPanel />
        </div>
      </div>
    </div>
  )
}
