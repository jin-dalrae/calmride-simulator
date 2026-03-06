import { create } from 'zustand'
import type { ParsedScenario, IncidentType } from '../types/scenario'
import {
  isBackendAvailable,
  fetchScenarioList,
  fetchScenario,
  type ScenarioSummary,
  type BackendScenario,
} from '../services/api'

interface ScenarioState {
  availableScenarios: string[]
  scenarioSummaries: ScenarioSummary[]
  currentScenario: ParsedScenario | null
  loading: boolean
  error: string | null
  backendConnected: boolean
  waymaxAvailable: boolean
  loadScenarioList: () => Promise<void>
  loadScenario: (id: string) => Promise<void>
}

/**
 * Convert a backend scenario response into the frontend ParsedScenario type.
 */
function backendToFrontend(backend: BackendScenario): ParsedScenario {
  return {
    id: backend.id,
    egoId: backend.ego_id,
    duration: backend.duration,
    curTime: backend.cur_time,
    agents: backend.agents.map(a => ({
      id: a.id,
      type: a.type,
      length: a.length,
      width: a.width,
      height: a.height,
      trajectory: a.trajectory,
    })),
    qaPairs: backend.qa_pairs.map(qa => ({
      category: qa.category,
      question: qa.question,
      answer: qa.answer,
      timestamp: qa.timestamp,
    })),
    incidents: backend.incidents.map(i => ({
      id: i.id,
      type: i.type as IncidentType,
      timestamp: i.timestamp,
      x: i.x,
      y: i.y,
      description: i.description,
      severity: i.severity,
    })),
    mapFeatures: backend.map_features.map(f => ({
      type: f.type as any,
      points: f.points,
    })),
    trafficSignals: backend.traffic_signals || [],
  }
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  availableScenarios: [],
  scenarioSummaries: [],
  currentScenario: null,
  loading: false,
  error: null,
  backendConnected: false,
  waymaxAvailable: false,

  loadScenarioList: async () => {
    try {
      const backendUp = await isBackendAvailable()
      if (backendUp) {
        const summaries = await fetchScenarioList()
        set({
          backendConnected: true,
          scenarioSummaries: summaries,
          availableScenarios: summaries.map(s => s.id),
        })
        return
      }
    } catch {
      // Backend not available
    }

    set({
      backendConnected: false,
      availableScenarios: [],
      error: 'Backend not connected. Start the backend server to load real WOMD data.',
    })
  },

  loadScenario: async (id: string) => {
    set({ loading: true, error: null })

    try {
      const backend = await fetchScenario(id)
      const parsed = backendToFrontend(backend)
      set({ currentScenario: parsed, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
}))
