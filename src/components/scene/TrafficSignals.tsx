import { useMemo } from 'react'
import type { TrafficSignal } from '../../types/scenario'

interface Props {
    signals: TrafficSignal[]
    time: number
}

const SIGNAL_COLORS: Record<number, string> = {
    0: '#888888', // Unknown
    1: '#ff0000', // Arrow_Stop
    2: '#ffff00', // Arrow_Caution
    3: '#00cc00', // Arrow_Go
    4: '#ff0000', // Stop
    5: '#ffff00', // Caution
    6: '#00cc00', // Go
    7: '#ff4444', // Flashing_Stop
    8: '#ffff00', // Flashing_Caution
}

export function TrafficSignals({ signals, time }: Props) {
    const currentSignals = useMemo(() => {
        const grouped = signals.reduce((acc, s) => {
            if (!acc[s.id]) acc[s.id] = []
            acc[s.id].push(s)
            return acc
        }, {} as Record<string, TrafficSignal[]>)

        return Object.values(grouped).map(states => {
            const pastStates = states.filter(s => s.timestamp <= time)
            if (pastStates.length === 0) return states[0]
            return pastStates.reduce((prev, curr) =>
                (curr.timestamp > prev.timestamp) ? curr : prev
            )
        })
    }, [signals, time])

    return (
        <group>
            {currentSignals.map((signal) => {
                const color = SIGNAL_COLORS[signal.state] || '#888888'
                const isRed = signal.state === 1 || signal.state === 4 || signal.state === 7
                const isGreen = signal.state === 3 || signal.state === 6

                return (
                    <group key={signal.id} position={[signal.x, 0, -signal.y]}>
                        {/* Pole */}
                        <mesh position={[0, 2.5, 0]}>
                            <cylinderGeometry args={[0.08, 0.1, 5, 8]} />
                            <meshStandardMaterial color="#444444" roughness={0.6} metalness={0.4} />
                        </mesh>

                        {/* Housing */}
                        <mesh position={[0, 4.8, 0]}>
                            <boxGeometry args={[0.5, 1.4, 0.4]} />
                            <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.3} />
                        </mesh>

                        {/* Red light */}
                        <mesh position={[0, 5.2, 0.21]}>
                            <circleGeometry args={[0.15, 16]} />
                            <meshStandardMaterial
                                color={isRed ? '#ff0000' : '#330000'}
                                emissive={isRed ? '#ff0000' : '#000000'}
                                emissiveIntensity={isRed ? 3 : 0}
                            />
                        </mesh>

                        {/* Yellow light */}
                        <mesh position={[0, 4.8, 0.21]}>
                            <circleGeometry args={[0.15, 16]} />
                            <meshStandardMaterial
                                color={!isRed && !isGreen ? '#ffff00' : '#333300'}
                                emissive={!isRed && !isGreen ? '#ffff00' : '#000000'}
                                emissiveIntensity={!isRed && !isGreen ? 3 : 0}
                            />
                        </mesh>

                        {/* Green light */}
                        <mesh position={[0, 4.4, 0.21]}>
                            <circleGeometry args={[0.15, 16]} />
                            <meshStandardMaterial
                                color={isGreen ? '#00cc00' : '#003300'}
                                emissive={isGreen ? '#00cc00' : '#000000'}
                                emissiveIntensity={isGreen ? 3 : 0}
                            />
                        </mesh>

                        {/* Glow on ground */}
                        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[1.5, 16]} />
                            <meshBasicMaterial
                                color={color}
                                transparent
                                opacity={0.15}
                            />
                        </mesh>
                    </group>
                )
            })}
        </group>
    )
}
