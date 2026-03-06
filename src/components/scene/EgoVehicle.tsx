import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, PerspectiveCamera } from '@react-three/drei'
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

  useFrame((state) => {
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

  const width = agent.width || 2.0
  const height = agent.height || 1.4
  const length = agent.length || 4.8

  return (
    <group ref={groupRef}>
      <mesh position={[0, height / 2 + 0.1, 0]} castShadow>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color={EGO_COLOR} roughness={0.1} metalness={0.8} envMapIntensity={1} />
      </mesh>

      <mesh position={[0, height + 0.05, 0.5]}>
        <boxGeometry args={[width - 0.1, 0.4, length * 0.4]} />
        <meshStandardMaterial color="#111" roughness={0} metalness={1} />
      </mesh>

      <mesh position={[0, height + 0.3, -0.5]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 32]} />
        <meshStandardMaterial color="#000" metalness={1} roughness={0} />
      </mesh>
      
      <mesh position={[0, height + 0.55, -0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} />
      </mesh>

      {[[-0.9, 0.4, 1.5], [0.9, 0.4, 1.5], [-0.9, 0.4, -1.5], [0.9, 0.4, -1.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}

      <mesh position={[width/2 - 0.2, 0.6, length/2]} scale={[0.4, 0.2, 0.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
      </mesh>
      <mesh position={[-width/2 + 0.2, 0.6, length/2]} scale={[0.4, 0.2, 0.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
      </mesh>

      <mesh position={[width/2 - 0.2, 0.6, -length/2]} scale={[0.4, 0.2, 0.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-width/2 + 0.2, 0.6, -length/2]} scale={[0.4, 0.2, 0.1]}>
        <boxGeometry />
        <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={3} />
      </mesh>

      <Text
        position={[0, height + 1.5, 0]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        rotation={[Math.PI / 2, Math.PI, 0]}
      >
        EGO_SDC_ACTIVE
      </Text>
    </group>
  )
}
