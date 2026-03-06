import { FrontScreen } from '../channels/FrontScreen'
import { RearScreen } from '../channels/RearScreen'
import { AppNotification } from '../channels/AppNotification'
import { VoiceChannel } from '../channels/VoiceChannel'

export function ChannelStrip() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      padding: 12,
      background: '#ffffff',
      minHeight: 180,
    }}>
      <FrontScreen />
      <RearScreen />
      <AppNotification />
      <VoiceChannel />
    </div>
  )
}
