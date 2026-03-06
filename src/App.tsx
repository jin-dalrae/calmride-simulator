import { useCallback, useEffect } from 'react'
import { ControlRoom } from './components/layout/ControlRoom'
import { usePlayback } from './hooks/usePlayback'
import { useIncidentDetection } from './hooks/useIncidentDetection'
import { useGeminiExplanation } from './hooks/useGeminiExplanation'
import { useAmbientObservations } from './hooks/useAmbientObservations'
import { usePlaybackStore } from './store/usePlaybackStore'
import type { Incident } from './types/scenario'

import { useScenarioStore } from './store/useScenarioStore'

export default function App() {
  const loadScenarioList = useScenarioStore(s => s.loadScenarioList)
  const loadScenario = useScenarioStore(s => s.loadScenario)
  const { setDuration } = usePlaybackStore()

  useEffect(() => {
    loadScenarioList().then(() => {
      const { availableScenarios } = useScenarioStore.getState()
      const defaultScenario = availableScenarios.find(s => s === 'womd-00016') || availableScenarios[0]
      if (defaultScenario) {
        loadScenario(defaultScenario).then(() => {
          const scenario = useScenarioStore.getState().currentScenario
          if (scenario) setDuration(scenario.duration)
        })
      }
    })
  }, [loadScenarioList, loadScenario, setDuration])

  usePlayback()

  const { triggerExplanation } = useGeminiExplanation()

  const onIncident = useCallback((incident: Incident) => {
    if (incident.severity !== 'low' || incident.type === 'routine_update') {
      triggerExplanation(incident)
    }
  }, [triggerExplanation])

  useIncidentDetection(onIncident)
  useAmbientObservations()

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          usePlaybackStore.getState().togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          usePlaybackStore.getState().seek(usePlaybackStore.getState().currentTime - 0.5)
          break
        case 'ArrowRight':
          e.preventDefault()
          usePlaybackStore.getState().seek(usePlaybackStore.getState().currentTime + 0.5)
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return <ControlRoom />
}
