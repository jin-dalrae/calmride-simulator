import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { MapFeature } from '../../types/scenario'

const ROAD_COLORS: Record<string, string> = {
  'LaneCenter-Freeway': '#555555',
  'LaneCenter-SurfaceStreet': '#555555',
  'LaneCenter-BikeLane': '#4a9e6f',
  'RoadLine-BrokenSingleWhite': '#ffffff',
  'RoadLine-SolidSingleWhite': '#ffffff',
  'RoadLine-SolidDoubleWhite': '#ffffff',
  'RoadLine-BrokenSingleYellow': '#f5c542',
  'RoadLine-BrokenDoubleYellow': '#f5c542',
  'RoadLine-SolidSingleYellow': '#e0a800',
  'RoadLine-SolidDoubleYellow': '#e0a800',
  'RoadLine-PassingDoubleYellow': '#e0a800',
  'RoadEdgeBoundary': '#888888',
  'RoadEdgeMedian': '#888888',
  'StopSign': '#ef4444',
  'Crosswalk': '#ffffff',
  'SpeedBump': '#cccccc',
  'lane_boundary': '#aaaaaa',
  'lane_center': '#666666',
  'road_edge': '#999999',
  'crosswalk': '#ffffff',
}

interface Props {
  features: MapFeature[]
}

export function RoadMap({ features }: Props) {
  // Build a road surface mesh from lane centers
  const roadSurface = useMemo(() => {
    const laneCenters = features.filter(f =>
      f.type.includes('LaneCenter') && f.points.length >= 2
    )
    if (laneCenters.length === 0) return null

    // Collect all lane center points to create a road surface
    const allPoints: THREE.Vector3[] = []
    for (const lane of laneCenters) {
      for (const p of lane.points) {
        allPoints.push(new THREE.Vector3(p.x, 0.01, -p.y))
      }
    }

    if (allPoints.length < 3) return null

    // Create a convex-ish road surface by expanding each lane center into a strip
    const strips: THREE.Vector3[][] = []
    for (const lane of laneCenters) {
      if (lane.points.length < 2) continue
      const strip: THREE.Vector3[] = []
      const laneWidth = 3.7 // standard lane width in meters

      for (let i = 0; i < lane.points.length; i++) {
        const curr = lane.points[i]
        const next = lane.points[Math.min(i + 1, lane.points.length - 1)]
        const prev = lane.points[Math.max(i - 1, 0)]

        // Direction along the lane
        const dx = next.x - prev.x
        const dy = next.y - prev.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1

        // Normal (perpendicular)
        const nx = -dy / len
        const ny = dx / len

        strip.push(
          new THREE.Vector3(curr.x + nx * laneWidth / 2, 0.01, -(curr.y + ny * laneWidth / 2)),
          new THREE.Vector3(curr.x - nx * laneWidth / 2, 0.01, -(curr.y - ny * laneWidth / 2)),
        )
      }
      if (strip.length >= 4) strips.push(strip)
    }

    return strips
  }, [features])

  const renderedLines = useMemo(() => {
    return features
      .filter(f => f.points.length >= 2 && !f.type.includes('LaneCenter'))
      .map((feature, i) => {
        const points = feature.points.map(p => [p.x, 0.05, -p.y] as [number, number, number])
        const color = ROAD_COLORS[feature.type] || '#888888'
        const isRoadLine = feature.type.includes('RoadLine')
        const isRoadEdge = feature.type.includes('RoadEdge')
        const isDashed = feature.type.includes('Broken')
        const isCrosswalk = feature.type.toLowerCase().includes('crosswalk')
        const isStopSign = feature.type === 'StopSign'

        return {
          points,
          color,
          key: `map-${feature.type}-${i}`,
          lineWidth: isStopSign ? 4 : isCrosswalk ? 3 : isRoadEdge ? 2.5 : isRoadLine ? 2 : 1.5,
          dashed: isDashed,
          opacity: isRoadLine ? 0.9 : isRoadEdge ? 0.7 : 0.6,
          yOffset: isCrosswalk ? 0.06 : 0.05,
        }
      })
  }, [features])

  return (
    <group>
      {/* Asphalt road surface from lane centers */}
      {roadSurface && roadSurface.map((strip, idx) => {
        if (strip.length < 4) return null
        const geom = new THREE.BufferGeometry()
        const vertices: number[] = []
        for (let i = 0; i < strip.length - 2; i += 2) {
          // Triangle 1
          vertices.push(strip[i].x, strip[i].y, strip[i].z)
          vertices.push(strip[i + 1].x, strip[i + 1].y, strip[i + 1].z)
          vertices.push(strip[i + 2].x, strip[i + 2].y, strip[i + 2].z)
          // Triangle 2
          vertices.push(strip[i + 1].x, strip[i + 1].y, strip[i + 1].z)
          vertices.push(strip[i + 3].x, strip[i + 3].y, strip[i + 3].z)
          vertices.push(strip[i + 2].x, strip[i + 2].y, strip[i + 2].z)
        }
        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        geom.computeVertexNormals()

        return (
          <mesh key={`road-surface-${idx}`} geometry={geom}>
            <meshStandardMaterial
              color="#3a3a3a"
              roughness={0.95}
              metalness={0.0}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}

      {/* Road lines, edges, crosswalks */}
      {renderedLines.map((feat) => (
        <Line
          key={feat.key}
          points={feat.points.map(p => [p[0], feat.yOffset, p[2]] as [number, number, number])}
          color={feat.color}
          lineWidth={feat.lineWidth}
          transparent
          opacity={feat.opacity}
          dashed={feat.dashed}
          dashSize={feat.dashed ? 1.0 : undefined}
          gapSize={feat.dashed ? 0.6 : undefined}
        />
      ))}
    </group>
  )
}
