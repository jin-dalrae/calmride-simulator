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
  const color = AGENT_HEX[agent.type] || 0x666666

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

  if (agent.type === 'pedestrian') {
    return <Pedestrian groupRef={groupRef as React.RefObject<Group>} color={color} />
  }
  if (agent.type === 'cyclist') {
    return <Cyclist groupRef={groupRef as React.RefObject<Group>} color={color} />
  }
  return <Vehicle groupRef={groupRef as React.RefObject<Group>} agent={agent} color={color} />
}

function Vehicle({ groupRef, agent, color }: { groupRef: React.RefObject<Group>; agent: Agent; color: number }) {
  const w = agent.width || 1.8
  const h = agent.height || 1.4
  const l = agent.length || 4.5

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, h * 0.35, 0]} castShadow>
        <boxGeometry args={[w, h * 0.5, l]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, h * 0.7, -l * 0.05]} castShadow>
        <boxGeometry args={[w - 0.15, h * 0.3, l * 0.5]} />
        <meshStandardMaterial color="#222" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Wheels */}
      {[
        [-w / 2 + 0.1, 0.28, l * 0.33],
        [w / 2 - 0.1, 0.28, l * 0.33],
        [-w / 2 + 0.1, 0.28, -l * 0.33],
        [w / 2 - 0.1, 0.28, -l * 0.33],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.18, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
      {/* Headlights */}
      {[-w / 2 + 0.25, w / 2 - 0.25].map((xPos, i) => (
        <mesh key={`hl-${i}`} position={[xPos, h * 0.3, l / 2 + 0.01]} scale={[0.25, 0.12, 0.04]}>
          <boxGeometry />
          <meshStandardMaterial color="#ffe" emissive="#ffffcc" emissiveIntensity={1.5} />
        </mesh>
      ))}
      {/* Taillights */}
      {[-w / 2 + 0.25, w / 2 - 0.25].map((xPos, i) => (
        <mesh key={`tl-${i}`} position={[xPos, h * 0.3, -l / 2 - 0.01]} scale={[0.25, 0.08, 0.04]}>
          <boxGeometry />
          <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={1} />
        </mesh>
      ))}
    </group>
  )
}

function Pedestrian({ groupRef, color }: { groupRef: React.RefObject<Group>; color: number }) {
  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.7, 4, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#e8c4a0" roughness={0.8} />
      </mesh>
      {/* Label */}
      <Text
        position={[0, 1.8, 0]}
        fontSize={0.35}
        color="#22c55e"
        anchorX="center"
        rotation={[-Math.PI / 2, 0, 0]}
        fillOpacity={0.7}
      >
        PED
      </Text>
    </group>
  )
}

function Cyclist({ groupRef, color }: { groupRef: React.RefObject<Group>; color: number }) {
  return (
    <group ref={groupRef}>
      {/* Body on bike */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.5, 4, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#e8c4a0" roughness={0.8} />
      </mesh>
      {/* Bike frame */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.3, 0.1, 1.2]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Wheels */}
      {[0.45, -0.45].map((z, i) => (
        <mesh key={i} position={[0, 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.28, 0.03, 8, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Label */}
      <Text
        position={[0, 1.8, 0]}
        fontSize={0.35}
        color="#f97316"
        anchorX="center"
        rotation={[-Math.PI / 2, 0, 0]}
        fillOpacity={0.7}
      >
        CYC
      </Text>
    </group>
  )
}
