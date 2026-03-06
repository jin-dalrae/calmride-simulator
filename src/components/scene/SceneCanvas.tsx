import { useRef, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MapControls, Sky, Environment, ContactShadows } from '@react-three/drei'
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

    const timeSinceInteraction = Date.now() - lastInteraction.current
    if (userInteracting.current || timeSinceInteraction < 3000) return

    const egoX = state.x
    const egoZ = -state.y

    target.current.set(egoX, 0, egoZ)
    const desiredPos = new THREE.Vector3(egoX, 55, egoZ)

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
    <div style={{ width: '100%', height: '100%', background: '#dce3ea' }}>
      <Canvas
        shadows
        camera={{ position: [0, 55, 0], fov: 45, near: 0.5, far: 2000 }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.1
          gl.outputColorSpace = THREE.SRGBColorSpace
          camera.lookAt(0, 0, 0)
        }}
      >
        <color attach="background" args={['#b8c6d4']} />
        <fog attach="fog" args={['#b8c6d4', 120, 500]} />

        <Sky
          sunPosition={[80, 40, 60]}
          turbidity={6}
          rayleigh={0.5}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        <Environment preset="city" />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[80, 80, 40]}
          intensity={2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-120}
          shadow-camera-right={120}
          shadow-camera-top={120}
          shadow-camera-bottom={-120}
          shadow-bias={-0.0001}
        />
        <hemisphereLight args={['#b1c4d8', '#8a9a6a', 0.3]} />

        {/* Ground plane — grass/terrain */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[2000, 2000]} />
          <meshStandardMaterial color="#7a8a65" roughness={0.95} metalness={0} />
        </mesh>

        {/* Subtle grid for spatial reference */}
        <gridHelper args={[2000, 200, '#7f8f72', '#7f8f72']} position={[0, -0.01, 0]}>
          <meshBasicMaterial transparent opacity={0.08} />
        </gridHelper>

        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.3}
          scale={200}
          blur={2}
          far={10}
        />

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
