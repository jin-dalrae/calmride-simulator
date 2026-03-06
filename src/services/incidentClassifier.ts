import type { Agent, Incident, IncidentType, TrajectoryPoint } from '../types/scenario'

const HARD_BRAKE_THRESHOLD = 1.5
const HEADING_CHANGE_THRESHOLD = 0.06
const STOP_SPEED_THRESHOLD = 0.5
const MIN_SPEED_FOR_BRAKE = 1.5

export function classifyIncidents(agents: Agent[], egoId: string): Incident[] {
  const ego = agents.find(a => a.id === egoId)
  if (!ego) return []

  const incidents: Incident[] = []
  const traj = ego.trajectory
  let incidentCount = 0

  for (let i = 1; i < traj.length; i++) {
    const prev = traj[i - 1]
    const curr = traj[i]
    const dt = curr.t - prev.t
    if (dt <= 0) continue

    const decel = (prev.speed - curr.speed) / dt

    // Hard brake
    if (decel > HARD_BRAKE_THRESHOLD && prev.speed > MIN_SPEED_FOR_BRAKE) {
      incidents.push(makeIncident('hard_brake', curr, incidentCount++,
        `Hard braking detected: deceleration ${decel.toFixed(1)} m/s²`, 'high'))
    }

    // Sudden stop
    if (prev.speed > MIN_SPEED_FOR_BRAKE && curr.speed < STOP_SPEED_THRESHOLD) {
      const alreadyHasBrake = incidents.some(
        inc => inc.type === 'hard_brake' && Math.abs(inc.timestamp - curr.t) < 0.5
      )
      if (!alreadyHasBrake) {
        incidents.push(makeIncident('sudden_stop', curr, incidentCount++,
          `Sudden stop from ${prev.speed.toFixed(1)} m/s`, 'high'))
      }
    }

    // Lane change (heading change)
    if (i >= 2) {
      const prevPrev = traj[i - 2]
      const headingDelta = Math.abs(normalizeAngle(curr.heading - prevPrev.heading))
      if (headingDelta > HEADING_CHANGE_THRESHOLD && curr.speed > 2) {
        incidents.push(makeIncident('lane_change', curr, incidentCount++,
          `Lane change: heading change ${(headingDelta * 180 / Math.PI).toFixed(0)}°`, 'medium'))
      }
    }
  }

  if (traj.length > 0) {
    const duration = traj[traj.length - 1].t - traj[0].t
    const interval = 8.0
    for (let t = interval; t < duration; t += interval) {
      const point = traj.find(p => p.t >= t) || traj[traj.length - 1]
      const hasNearbyIncident = incidents.some(inc => Math.abs(inc.timestamp - point.t) < 2.0)
      
      if (!hasNearbyIncident) {
        const speedMph = (point.speed * 2.237).toFixed(0)
        const headingDeg = (normalizeAngle(point.heading) * 180 / Math.PI).toFixed(0)
        incidents.push(makeIncident('routine_update', point, incidentCount++,
          `Cruising at ${speedMph} mph, heading ${headingDeg}°. System stable.`, 'low'))
      }
    }
  }

  return deduplicateIncidents(incidents)
}

function makeIncident(
  type: IncidentType, point: TrajectoryPoint, index: number,
  description: string, severity: 'low' | 'medium' | 'high'
): Incident {
  return {
    id: `incident-${index}`,
    type,
    timestamp: point.t,
    x: point.x,
    y: point.y,
    description,
    severity,
  }
}

function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI
  while (angle < -Math.PI) angle += 2 * Math.PI
  return angle
}

function deduplicateIncidents(incidents: Incident[]): Incident[] {
  const COOLDOWN = 1.0 // seconds
  const result: Incident[] = []
  for (const inc of incidents) {
    const hasDuplicate = result.some(
      existing => existing.type === inc.type && Math.abs(existing.timestamp - inc.timestamp) < COOLDOWN
    )
    if (!hasDuplicate) result.push(inc)
  }
  return result
}
