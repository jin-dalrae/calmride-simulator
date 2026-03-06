import { useRef, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MapControls, Sky, Environment } from '@react-three/drei'
import { EgoVehicle } from './EgoVehicle'
import { SurroundingAgent } from './SurroundingAgent'
import { RoadMap } from './RoadMap'
import { TrajectoryLine } from './TrajectoryLine'
import { IncidentMarker } from './IncidentMarker'
import { TrafficSignals } from './TrafficSignals'
import { useScenarioStore } from '../../store/useScenarioStore'
import { usePlaybackStore } from '../../store/usePlaybackStore'
import { interpolateAgent } from '../../services/trajectoryInterpolator'
import * as THREE from 'three'

function CameraFollower() {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3())
  const userInteracting = useRef(false)
  const lastInteraction = useRef(0)

  const onStart = useCallback(() => {
    userInteracting.current = true
    lastInteraction.current = Date.now()
  }, [])

  const onEnd = useCallback(() => {
    userInteracting.current = false
    lastInteraction.current = Date.now()
  }, [])

  useFrame(() => {
    const scenario = useScenarioStore.getState().currentScenario
    const time = usePlaybackStore.getState().currentTime
    if (!scenario) return

    const ego = scenario.agents.find(a => a.id === scenario.egoId)
    if (!ego) return

    const state = interpolateAgent(ego.trajectory, time)
    if (!state.visible) return

    // Resume auto-follow 3s after user stops interacting
    const timeSinceInteraction = Date.now() - lastInteraction.current
    if (userInteracting.current || timeSinceInteraction < 3000) return

    const egoX = state.x
    const egoZ = -state.y

    target.current.set(egoX, 0, egoZ)
    const desiredPos = new THREE.Vector3(egoX, 60, egoZ)

    camera.position.lerp(desiredPos, 0.08)
    camera.lookAt(target.current)
  })

  return (
    <MapControls
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2.1}
      onStart={onStart}
      onEnd={onEnd}
    />
  )
}

export function SceneCanvas() {
  const scenario = useScenarioStore(s => s.currentScenario)
  const currentTime = usePlaybackStore(s => s.currentTime)

  return (
    <div style={{ width: '100%', height: '100%', background: '#e8edf2' }}>
      <Canvas
        shadows
        camera={{ position: [0, 60, 0], fov: 40, near: 1, far: 2000 }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.outputColorSpace = THREE.SRGBColorSpace
          camera.lookAt(0, 0, 0)
        }}
      >
        <color attach="background" args={['#e8edf2']} />
        <fog attach="fog" args={['#e8edf2', 150, 800]} />

        <Sky sunPosition={[100, 20, 100]} />
        <Environment preset="city" />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[100, 100, 50]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color="#c8cdd2" roughness={0.8} metalness={0.1} />
        </mesh>

        <gridHelper args={[2000, 100, '#bbb', '#ccc']} position={[0, 0.01, 0]} />

        <CameraFollower />

        {scenario && (
          <>
            <RoadMap features={scenario.mapFeatures} />
            <TrafficSignals signals={scenario.trafficSignals} time={currentTime} />

            {scenario.agents.map(agent => (
              agent.id === scenario.egoId ? (
                <EgoVehicle key={agent.id} agent={agent} time={currentTime} />
              ) : (
                <SurroundingAgent key={agent.id} agent={agent} time={currentTime} />
              )
            ))}

            {scenario.agents.map(agent => (
              <TrajectoryLine key={`traj-${agent.id}`} agent={agent} currentTime={currentTime} />
            ))}

            {scenario.incidents
              .filter(inc => inc.timestamp <= currentTime)
              .map(inc => (
                <IncidentMarker key={inc.id} incident={inc} />
              ))}
          </>
        )}
      </Canvas>
    </div>
  )
}
