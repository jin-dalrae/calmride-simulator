import { useEffect, useRef } from 'react'
import { useScenarioStore } from '../store/useScenarioStore'
import { usePlaybackStore } from '../store/usePlaybackStore'
import { useExplanationStore } from '../store/useExplanationStore'
import { interpolateAgent } from '../services/trajectoryInterpolator'
import type { ChannelExplanation, AgentMessage } from '../types/channels'

/**
 * When no incident is active, periodically scan the real scene data
 * and generate ambient observations from actual agent positions,
 * types, speeds and distances — no synthetic/mock content.
 */
export function useAmbientObservations() {
  const lastFireTime = useRef(0)
  const firedCount = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const scenario = useScenarioStore.getState().currentScenario
      const time = usePlaybackStore.getState().currentTime
      const isPlaying = usePlaybackStore.getState().isPlaying
      const { current, loading } = useExplanationStore.getState()

      if (!scenario || !isPlaying || loading) return
      // Don't interrupt active incident explanations that haven't resolved
      if (current && !useExplanationStore.getState().consensusReached) return
      // Throttle: at most every 6 seconds of playback
      if (Math.abs(time - lastFireTime.current) < 6) return

      const ego = scenario.agents.find(a => a.id === scenario.egoId)
      if (!ego) return
      const egoState = interpolateAgent(ego.trajectory, time)
      if (!egoState.visible) return

      // Gather nearby agents with real data
      const nearby = scenario.agents
        .filter(a => a.id !== scenario.egoId)
        .map(a => {
          const state = interpolateAgent(a.trajectory, time)
          if (!state.visible) return null
          const dist = Math.sqrt(
            (state.x - egoState.x) ** 2 + (state.y - egoState.y) ** 2
          )
          if (dist > 80) return null
          return { agent: a, state, dist }
        })
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .sort((a, b) => a.dist - b.dist)

      if (nearby.length === 0) return

      lastFireTime.current = time
      firedCount.current++

      const observation = buildAmbientObservation(egoState, nearby, time)
      if (!observation) return

      const { setExplanation } = useExplanationStore.getState()
      setExplanation(
        {
          id: `ambient-${firedCount.current}`,
          type: 'routine_update',
          timestamp: time,
          x: egoState.x,
          y: egoState.y,
          description: 'Ambient scene observation',
          severity: 'low',
        },
        observation
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])
}

interface NearbyAgent {
  agent: { id: string; type: string }
  state: { x: number; y: number; heading: number; speed: number }
  dist: number
}

function buildAmbientObservation(
  egoState: { x: number; y: number; heading: number; speed: number },
  nearby: NearbyAgent[],
  time: number,
): ChannelExplanation | null {
  const egoSpeedMph = (egoState.speed * 2.237).toFixed(0)
  const closest = nearby[0]
  const peds = nearby.filter(a => a.agent.type === 'pedestrian')
  const cyclists = nearby.filter(a => a.agent.type === 'cyclist')
  const vehicles = nearby.filter(a => a.agent.type === 'vehicle')

  // Build agent conversation from real data
  const messages: AgentMessage[] = []

  // Operational agent: factual scan
  const scanParts: string[] = []
  if (vehicles.length > 0) scanParts.push(`${vehicles.length} vehicle${vehicles.length > 1 ? 's' : ''}`)
  if (peds.length > 0) scanParts.push(`${peds.length} pedestrian${peds.length > 1 ? 's' : ''}`)
  if (cyclists.length > 0) scanParts.push(`${cyclists.length} cyclist${cyclists.length > 1 ? 's' : ''}`)
  messages.push({
    speaker: 'Operational',
    text: `Scanning perimeter at T+${time.toFixed(1)}s. Detected ${scanParts.join(', ')} within 80m. Closest: ${closest.agent.type} at ${closest.dist.toFixed(1)}m, moving ${closest.state.speed.toFixed(1)} m/s. Ego speed: ${egoSpeedMph} mph.`,
  })

  // Comfort agent: reassurance based on actual distances
  if (peds.length > 0) {
    const closestPed = peds[0]
    if (closestPed.dist > 20) {
      messages.push({
        speaker: 'Comfort',
        text: `Pedestrian detected ${closestPed.dist.toFixed(0)}m away — well outside our safety envelope. No concerns, maintaining course.`,
      })
    } else if (closestPed.dist > 8) {
      messages.push({
        speaker: 'Comfort',
        text: `Pedestrian at ${closestPed.dist.toFixed(0)}m, tracking closely. Speed is ${closestPed.state.speed.toFixed(1)} m/s. Comfortable margin maintained — monitoring trajectory.`,
      })
    } else {
      messages.push({
        speaker: 'Comfort',
        text: `Pedestrian nearby at ${closestPed.dist.toFixed(0)}m. We're watching carefully and ready to yield if needed. Your safety is the priority.`,
      })
    }
  } else if (cyclists.length > 0) {
    const closestCyclist = cyclists[0]
    messages.push({
      speaker: 'Comfort',
      text: `Cyclist spotted ${closestCyclist.dist.toFixed(0)}m away at ${closestCyclist.state.speed.toFixed(1)} m/s. Giving them plenty of space.`,
    })
  } else {
    messages.push({
      speaker: 'Comfort',
      text: `All clear around us — ${vehicles.length} vehicle${vehicles.length > 1 ? 's' : ''} in view, all at safe distance. Smooth sailing.`,
    })
  }

  // Technical agent: numbers
  const closestApproaching = closest.state.speed > 0.5
  const relSpeed = Math.abs(egoState.speed - closest.state.speed)
  messages.push({
    speaker: 'Technical',
    text: `Closest object: ${closest.agent.type} (ID: ${closest.agent.id.slice(0, 8)}). Range: ${closest.dist.toFixed(2)}m. Relative speed: ${relSpeed.toFixed(1)} m/s. ${closestApproaching ? 'Object in motion.' : 'Object stationary.'} TTC: ${closestApproaching && relSpeed > 0.1 ? (closest.dist / relSpeed).toFixed(1) + 's' : 'N/A'}.`,
  })

  // Concierge: contextual
  if (egoState.speed < 1) {
    messages.push({
      speaker: 'Concierge',
      text: `We're currently stopped. ${nearby.length} road user${nearby.length > 1 ? 's' : ''} around us. Everything looks calm — we'll get moving when it's clear.`,
    })
  } else {
    messages.push({
      speaker: 'Concierge',
      text: `Cruising at ${egoSpeedMph} mph with ${nearby.length} nearby road users. All distances look safe. Enjoy the ride.`,
    })
  }

  // Front screen
  const headline = peds.length > 0
    ? `${peds.length} pedestrian${peds.length > 1 ? 's' : ''} in view`
    : cyclists.length > 0
    ? `cyclist nearby — ${cyclists[0].dist.toFixed(0)}m`
    : `${vehicles.length} vehicles tracked`

  const body = `Traveling at ${egoSpeedMph} mph. Nearest ${closest.agent.type} is ${closest.dist.toFixed(0)}m away. All agents monitored — no action needed.`

  return {
    agentConversation: messages,
    frontScreen: {
      headline,
      body,
      icon: peds.length > 0 ? 'safety' : 'info',
    },
    rearScreen: {
      headline: egoState.speed < 1 ? 'Holding position' : 'On track',
      comfortNote: egoState.speed < 1
        ? `Stopped safely. ${nearby.length} road users nearby, all at safe distance.`
        : `Moving smoothly at ${egoSpeedMph} mph. Clear path ahead.`,
      icon: 'info',
    },
    appNotification: {
      title: peds.length > 0 ? 'Pedestrian Detected' : 'Scene Update',
      body: `${scanParts.join(', ')} in proximity. Closest at ${closest.dist.toFixed(0)}m. No intervention needed.`,
      priority: closest.dist < 10 ? 'medium' : 'low',
    },
    voice: {
      text: peds.length > 0 && peds[0].dist < 15
        ? `Pedestrian ahead, ${peds[0].dist.toFixed(0)} meters. We see them.`
        : `All clear. ${nearby.length} road users nearby, maintaining safe distance.`,
      tone: closest.dist < 10 ? 'informative' : 'calm',
    },
  }
}
