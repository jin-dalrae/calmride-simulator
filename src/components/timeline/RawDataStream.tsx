import { useMemo } from 'react'
import { useScenarioStore } from '../../store/useScenarioStore'
import { usePlaybackStore } from '../../store/usePlaybackStore'

export function RawDataStream() {
    const currentScenario = useScenarioStore(s => s.currentScenario)
    const currentTime = usePlaybackStore(s => s.currentTime)

    const activeAgents = useMemo(() => {
        if (!currentScenario) return []
        return currentScenario.agents.filter(agent => {
            const state = agent.trajectory.find(p => Math.abs(p.t - currentTime) < 0.1)
            return !!state
        })
    }, [currentScenario, currentTime])

    const egoState = useMemo(() => {
        return currentScenario?.agents.find(a => a.id === currentScenario.egoId)?.trajectory.find(p => Math.abs(p.t - currentTime) < 0.1)
    }, [currentScenario, currentTime])

    return (
        <div style={{
            background: '#0f172a',
            color: '#34d399',
            fontFamily: 'monospace',
            fontSize: 10,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            height: '100%',
            overflowY: 'auto',
            borderTop: '1px solid #1e293b'
        }}>
            <div style={{ color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>
                Real-World Data Stream (Waymax / WOMD)
            </div>

            <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: 4 }}>
                SYSTEM_TIME: {currentTime.toFixed(2)}s
                <br />
                SCENARIO_ID: {currentScenario?.id || '---'}
                <br />
                AGENTS_ACTIVE: {activeAgents.length}
            </div>

            {egoState && (
                <div style={{ color: '#60a5fa' }}>
                    EGO_VEHICLE_LOG:
                    <br />
                    - X_POS: {egoState.x.toFixed(3)}
                    <br />
                    - Y_POS: {egoState.y.toFixed(3)}
                    <br />
                    - SPEED: {egoState.speed.toFixed(2)} m/s
                    <br />
                    - ACCEL: {egoState.accel.toFixed(2)} m/s²
                    <br />
                    - HEADING: {(egoState.heading * (180 / Math.PI)).toFixed(1)}°
                </div>
            )}

            {activeAgents.length > 0 && (
                <div>
                    RECENT_DETECTED_AGENTS:
                    {activeAgents.slice(1, 4).map(agent => {
                        const state = agent.trajectory.find(p => Math.abs(p.t - currentTime) < 0.1)
                        return (
                            <div key={agent.id} style={{ marginLeft: 8, marginTop: 4, color: '#94a3b8' }}>
                                ID: {agent.id} ({agent.type})
                                <br />
                                DIST_TO_EGO: {egoState ? Math.sqrt(Math.pow(state!.x - egoState.x, 2) + Math.pow(state!.y - egoState.y, 2)).toFixed(2) : '---'}m
                            </div>
                        )
                    })}
                </div>
            )}

            {!currentScenario && (
                <div style={{ color: '#444', animation: 'pulse 2s infinite' }}>
                    [WAITING_FOR_DATA_PACKET...]
                </div>
            )}
        </div>
    )
}
