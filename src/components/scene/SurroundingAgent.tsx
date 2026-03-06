import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Group } from 'three'
import type { Agent } from '../../types/scenario'
import { interpolateAgent } from '../../services/trajectoryInterpolator'
import { AGENT_HEX } from '../../utils/colors'

interface Props {
  agent: Agent
  time: number
}

export function SurroundingAgent({ agent, time }: Props) {
  const groupRef = useRef<Group>(null)
  const color = AGENT_HEX[agent.type] || '#666666'

  const dim: [number, number, number] = [
    agent.width || (agent.type === 'pedestrian' ? 0.6 : 1.8),
    agent.height || (agent.type === 'pedestrian' ? 1.7 : 1.4),
    agent.length || (agent.type === 'pedestrian' ? 0.6 : 4.5)
  ]

  useFrame(() => {
    if (!groupRef.current) return
    const state = interpolateAgent(agent.trajectory, time)
    if (!state.visible) {
      groupRef.current.visible = false
      return
    }
    groupRef.current.visible = true
    groupRef.current.position.set(state.x, 0, -state.y)
    groupRef.current.rotation.set(0, state.heading + Math.PI / 2, 0)
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, dim[1] / 2 + 0.1, 0]} castShadow receiveShadow>
        {agent.type === 'pedestrian' ? (
          <capsuleGeometry args={[dim[0] / 2, dim[1] - dim[0], 4, 16]} />
        ) : (
          <boxGeometry args={dim} />
        )}
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.5}
          envMapIntensity={0.5}
        />
      </mesh>

      {(agent.type === 'vehicle' || agent.type === 'cyclist') && (
        <>
          <mesh position={[0, dim[1] + 0.05, 0.4]} scale={[dim[0] - 0.1, 0.3, dim[2] * 0.3]}>
            <boxGeometry />
            <meshStandardMaterial color="#111" />
          </mesh>
          
          <mesh position={[dim[0]/2 - 0.2, 0.5, dim[2]/2]} scale={[0.3, 0.2, 0.1]}>
            <boxGeometry />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
          </mesh>
          <mesh position={[-dim[0]/2 + 0.2, 0.5, dim[2]/2]} scale={[0.3, 0.2, 0.1]}>
            <boxGeometry />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
          </mesh>
        </>
      )}

      <Text
        position={[0, dim[1] + 1.2, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        rotation={[Math.PI / 2, Math.PI, 0]}
      >
        {agent.type.toUpperCase()}
      </Text>
    </group>
  )
}
