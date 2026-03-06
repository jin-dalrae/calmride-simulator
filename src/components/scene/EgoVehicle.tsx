import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import type { Group } from 'three'
import type { Agent } from '../../types/scenario'
import { interpolateAgent } from '../../services/trajectoryInterpolator'

interface Props {
  agent: Agent
  time: number
}

const EGO_COLOR = '#0ea5e9'

export function EgoVehicle({ agent, time }: Props) {
  const groupRef = useRef<Group>(null)

  useFrame(() => {
    if (!groupRef.current) return
    const current = interpolateAgent(agent.trajectory, time)
    if (!current.visible) {
      groupRef.current.visible = false
      return
    }
    groupRef.current.visible = true
    groupRef.current.position.set(current.x, 0, -current.y)
    groupRef.current.rotation.set(0, current.heading + Math.PI / 2, 0)
  })

  const w = agent.width || 2.0
  const h = agent.height || 1.4
  const l = agent.length || 4.8

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh position={[0, h * 0.35, 0]} castShadow>
        <boxGeometry args={[w, h * 0.5, l]} />
        <meshStandardMaterial color={EGO_COLOR} roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Cabin / roof */}
      <mesh position={[0, h * 0.7, -l * 0.05]} castShadow>
        <boxGeometry args={[w - 0.15, h * 0.35, l * 0.55]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.05} metalness={0.9} />
      </mesh>

      {/* Windshield front */}
      <mesh position={[0, h * 0.65, l * 0.22]} rotation={[0.2, 0, 0]}>
        <planeGeometry args={[w - 0.2, h * 0.3]} />
        <meshStandardMaterial color="#88ccff" roughness={0} metalness={1} transparent opacity={0.5} />
      </mesh>

      {/* Lidar dome on roof */}
      <mesh position={[0, h * 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, h * 1.0, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
      </mesh>

      {/* Wheels */}
      {[
        [-w / 2 + 0.1, 0.3, l * 0.35],
        [w / 2 - 0.1, 0.3, l * 0.35],
        [-w / 2 + 0.1, 0.3, -l * 0.35],
        [w / 2 - 0.1, 0.3, -l * 0.35],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}

      {/* Headlights */}
      {[-w / 2 + 0.3, w / 2 - 0.3].map((xPos, i) => (
        <mesh key={`hl-${i}`} position={[xPos, h * 0.35, l / 2 + 0.01]} scale={[0.35, 0.15, 0.05]}>
          <boxGeometry />
          <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={3} />
        </mesh>
      ))}

      {/* Taillights */}
      {[-w / 2 + 0.3, w / 2 - 0.3].map((xPos, i) => (
        <mesh key={`tl-${i}`} position={[xPos, h * 0.35, -l / 2 - 0.01]} scale={[0.35, 0.1, 0.05]}>
          <boxGeometry />
          <meshStandardMaterial color="#ff2222" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      ))}

      {/* Label */}
      <Text
        position={[0, h + 0.8, 0]}
        fontSize={0.5}
        color="#0ea5e9"
        anchorX="center"
        rotation={[-Math.PI / 2, 0, 0]}
        fillOpacity={0.8}
      >
        SDC
      </Text>
    </group>
  )
}
