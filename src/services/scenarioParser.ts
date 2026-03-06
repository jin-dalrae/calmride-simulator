import type { WOMDRawScenario } from '../types/womd'
import type { Agent, MapFeature, ParsedScenario, QACategory, QAPair, TrajectoryPoint } from '../types/scenario'
import { classifyIncidents } from './incidentClassifier'

export function parseScenario(raw: WOMDRawScenario): ParsedScenario {
  const qaPairs = extractQAPairs(raw)
  const agents = raw.agents
    ? raw.agents.map(a => parseRealAgent(a))
    : generateSyntheticAgents(raw)
  const mapFeatures: MapFeature[] = (raw.map_features || []).map(f => ({
    type: f.type,
    points: f.polyline,
  }))

  const duration = raw.future_time || 9
  const egoId = raw.ego || 'ego'
  const incidents = classifyIncidents(agents, egoId)

  return {
    id: raw.sid,
    egoId,
    duration,
    curTime: raw.cur_time || 0,
    agents,
    qaPairs,
    incidents,
    mapFeatures,
    trafficSignals: [],
  }
}

function extractQAPairs(raw: WOMDRawScenario): QAPair[] {
  const pairs: QAPair[] = []
  const categories: { key: QACategory; qField: keyof WOMDRawScenario; aField: keyof WOMDRawScenario }[] = [
    { key: 'environment', qField: 'env_q', aField: 'env_a' },
    { key: 'ego', qField: 'ego_q', aField: 'ego_a' },
    { key: 'surrounding', qField: 'sur_q', aField: 'sur_a' },
    { key: 'interaction', qField: 'int_q', aField: 'int_a' },
  ]

  for (const { key, qField, aField } of categories) {
    const questions = (raw[qField] as string[]) || []
    const answers = (raw[aField] as string[]) || []
    for (let i = 0; i < questions.length; i++) {
      pairs.push({
        category: key,
        question: questions[i],
        answer: answers[i] || '',
        timestamp: raw.cur_time || 0,
      })
    }
  }

  return pairs
}

function parseRealAgent(raw: { id: string; type: string; trajectory: any[] }): Agent {
  return {
    id: raw.id,
    type: raw.type as Agent['type'],
    trajectory: raw.trajectory.map((p: any) => ({
      t: p.t,
      x: p.x,
      y: p.y,
      heading: p.heading || 0,
      speed: Math.sqrt((p.vx || 0) ** 2 + (p.vy || 0) ** 2),
      accel: 0,
    })),
  }
}

function generateSyntheticAgents(raw: WOMDRawScenario): Agent[] {
  const duration = raw.future_time || 9
  const numSteps = 90
  const dt = duration / numSteps

  // Parse ego behavior from Q&A
  const egoAnswers = raw.ego_a || []
  const hasStop = egoAnswers.some(a => /stop|brake|yield|slow/i.test(a))
  const hasTurn = egoAnswers.some(a => /turn|lane change|swerve/i.test(a))

  const ego = generateEgoTrajectory('ego', numSteps, dt, hasStop, hasTurn, raw.cur_time || 0)

  // Generate surrounding agents from context
  const surAnswers = raw.sur_a || []
  const surroundingAgents: Agent[] = []
  const agentTypes: Agent['type'][] = ['vehicle', 'pedestrian', 'cyclist']

  for (let i = 0; i < Math.min(surAnswers.length, 4); i++) {
    const answer = surAnswers[i]
    const isPed = /pedestrian|walk|cross/i.test(answer)
    const isCyclist = /cyclist|bike|bicycle/i.test(answer)
    const type = isPed ? 'pedestrian' : isCyclist ? 'cyclist' : agentTypes[0]

    surroundingAgents.push(
      generateSurroundingTrajectory(`agent-${i + 1}`, type, i, numSteps, dt, raw.cur_time || 0)
    )
  }

  if (surroundingAgents.length === 0) {
    surroundingAgents.push(
      generateSurroundingTrajectory('agent-1', 'vehicle', 0, numSteps, dt, raw.cur_time || 0)
    )
  }

  return [ego, ...surroundingAgents]
}

function generateEgoTrajectory(
  id: string, steps: number, dt: number, hasStop: boolean, hasTurn: boolean, startTime: number
): Agent {
  const trajectory: TrajectoryPoint[] = []
  let x = 0, y = 0, heading = 0, speed = 10
  const stopTime = steps * 0.4
  const turnTime = steps * 0.3

  for (let i = 0; i <= steps; i++) {
    const t = startTime + i * dt

    if (hasStop && i > stopTime && i < stopTime + 15) {
      speed = Math.max(0, speed - 1.5)
    } else if (hasStop && i >= stopTime + 15 && i < stopTime + 30) {
      speed = Math.min(10, speed + 0.5)
    }

    if (hasTurn && i > turnTime && i < turnTime + 10) {
      heading += 0.03
    }

    const accel = i > 0 ? (speed - (trajectory[i - 1]?.speed || speed)) / dt : 0
    x += Math.cos(heading) * speed * dt
    y += Math.sin(heading) * speed * dt

    trajectory.push({ t, x, y, heading, speed, accel })
  }

  return { id, type: 'ego', trajectory }
}

function generateSurroundingTrajectory(
  id: string, type: Agent['type'], index: number,
  steps: number, dt: number, startTime: number
): Agent {
  const trajectory: TrajectoryPoint[] = []
  const offsetX = (index % 2 === 0 ? 1 : -1) * (8 + index * 4)
  const offsetY = (index < 2 ? 1 : -1) * (5 + index * 3)
  const speed = type === 'pedestrian' ? 1.5 : type === 'cyclist' ? 5 : 8
  const heading = Math.atan2(-offsetY, 1) + (Math.random() - 0.5) * 0.3

  for (let i = 0; i <= steps; i++) {
    const t = startTime + i * dt
    const x = offsetX + Math.cos(heading) * speed * i * dt
    const y = offsetY + Math.sin(heading) * speed * i * dt
    trajectory.push({ t, x, y, heading, speed, accel: 0 })
  }

  return { id, type, trajectory }
}
