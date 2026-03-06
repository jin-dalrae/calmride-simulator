import React, { useMemo } from 'react'
import { useScenarioStore } from '../../store/useScenarioStore'
import { usePlaybackStore } from '../../store/usePlaybackStore'
import { interpolateAgent } from '../../services/trajectoryInterpolator'

export function DataStreamPanel() {
    const currentScenario = useScenarioStore(s => s.currentScenario)
    const currentTime = usePlaybackStore(s => s.currentTime)

    const ego = useMemo(() => {
        if (!currentScenario) return null
        const agent = currentScenario.agents.find(a => a.id === currentScenario.egoId)
        if (!agent) return null
        return {
            agent,
            state: interpolateAgent(agent.trajectory, currentTime)
        }
    }, [currentScenario, currentTime])

    const surrounding = useMemo(() => {
        if (!currentScenario || !ego) return []
        return currentScenario.agents
            .filter(a => a.id !== currentScenario.egoId)
            .map(agent => {
                const state = interpolateAgent(agent.trajectory, currentTime)
                if (!state.visible) return null
                const dist = Math.sqrt(
                    (state.x - ego.state.x) ** 2 +
                    (state.y - ego.state.y) ** 2
                )
                if (dist > 100) return null
                return { agent, state, dist }
            })
            .filter((a): a is NonNullable<typeof a> => a !== null)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 5)
    }, [currentScenario, ego, currentTime])

    return (
        <div style={{
            flex: 1,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#059669',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '20px 16px',
                borderBottom: '1px solid #e0e0e0',
                background: '#fafafa',
                color: '#111',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <strong style={{ fontSize: '13px', letterSpacing: '1px' }}>TELEMETRY_STREAM</strong>
                <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 10px #10b981',
                    animation: 'pulse 2s infinite'
                }} />
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ color: '#888', marginBottom: '10px', fontWeight: 'bold' }}>[GLOBAL_STATE]</div>
                    <div style={{ color: '#444' }}>TIME: <span style={{ color: '#059669' }}>{currentTime.toFixed(3)}s</span></div>
                    <div style={{ color: '#444' }}>SCENARIO: <span style={{ color: '#059669' }}>{currentScenario?.id || 'IDLE'}</span></div>
                    <div style={{ color: '#444' }}>LATENCY: <span style={{ color: '#059669' }}>0.012ms</span></div>
                    <div style={{ color: '#444' }}>SAMPLING: <span style={{ color: '#059669' }}>10HZ_WOMD</span></div>
                </div>

                {ego && (
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ color: '#0284c7', marginBottom: '10px', fontWeight: 'bold' }}>[EGO_UNIT_TELEM]</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px' }}>
                            <span style={{ color: '#888' }}>COORD_X:</span> <span style={{ color: '#222' }}>{ego.state.x.toFixed(4)}</span>
                            <span style={{ color: '#888' }}>COORD_Y:</span> <span style={{ color: '#222' }}>{ego.state.y.toFixed(4)}</span>
                            <span style={{ color: '#888' }}>VELOCITY:</span> <span style={{ color: '#222' }}>{ego.state.speed.toFixed(3)} m/s</span>
                            <span style={{ color: '#888' }}>HEADING:</span> <span style={{ color: '#222' }}>{(ego.state.heading * (180 / Math.PI)).toFixed(3)}&deg;</span>
                            <span style={{ color: '#888' }}>ACCEL_Z:</span> <span style={{ color: Math.abs(ego.state.speed) > 0.1 ? '#059669' : '#888' }}>{((ego.agent.trajectory.find(p => Math.abs(p.t - currentTime) < 0.15)?.accel || 0)).toFixed(3)} m/s&sup2;</span>
                        </div>
                    </div>
                )}

                <div>
                    <div style={{ color: '#888', marginBottom: '10px', fontWeight: 'bold' }}>[PROXIMITY_DETECTION]</div>
                    {surrounding.length === 0 ? (
                        <div style={{ color: '#ccc', fontStyle: 'italic' }}>SCANNING...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {surrounding.map(obj => (
                                <div key={obj.agent.id} style={{ borderLeft: '1px solid #e0e0e0', paddingLeft: '10px' }}>
                                    <div style={{ color: '#222', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                                        <span>{obj.agent.type.toUpperCase()}_{obj.agent.id.slice(0,4)}</span>
                                        <span style={{ color: '#d97706' }}>{obj.dist.toFixed(2)}m</span>
                                    </div>
                                    <div style={{ color: '#888', fontSize: '9px', marginTop: 2 }}>
                                        VEL: {obj.state.speed.toFixed(2)}m/s | HDG: {(obj.state.heading * (180 / Math.PI)).toFixed(1)}&deg;
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #e0e0e0',
                background: '#fafafa',
                fontSize: '9px',
                color: '#bbb',
                letterSpacing: 0.5
            }}>
                WAYMO_WORLD_MODEL_V2_TELEMETRY
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #aaa;
                }
            `}</style>
        </div>
    )
}
