"""
Waymax-powered data loading service.

Loads scenarios from the Waymo Open Motion Dataset using waymax.dataloader,
then converts them into CalmRide's frontend-compatible format.

If Waymax / WOMD data is not available, falls back to loading local sample
JSON files from public/sample-scenarios/.
"""

from __future__ import annotations

import json
import logging
import math
from pathlib import Path
from typing import Optional, cast, Any

from models import (
    AgentModel,
    AgentType,
    MapFeatureModel,
    MapFeatureType,
    ParsedScenarioModel,
    QACategory,
    QAPairModel,
    ScenarioSummaryModel,
    TrajectoryPointModel,
    TrafficSignalModel,
)
from config import WOMD_DATA_DIR, MAX_SCENARIOS, MAX_AGENTS_PER_SCENARIO

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
_WAYMAX_AVAILABLE = False
waymax_config = None
waymax_dataloader = None
waymax_datatypes = None


def _ensure_waymax():
    global _WAYMAX_AVAILABLE, waymax_config, waymax_dataloader, waymax_datatypes
    if waymax_config is not None:
        return _WAYMAX_AVAILABLE

    try:
        from waymax import config, dataloader, datatypes

        waymax_config = config
        waymax_dataloader = dataloader
        waymax_datatypes = datatypes
        _WAYMAX_AVAILABLE = True
        logger.info("✅ Waymax loaded successfully")
    except ImportError:
        _WAYMAX_AVAILABLE = False
        logger.warning("⚠️  Waymax not installed — falling back to local samples.")
    return _WAYMAX_AVAILABLE

    try:
        from waymax import config, dataloader, datatypes

        waymax_config = config
        waymax_dataloader = dataloader
        waymax_datatypes = datatypes
        _WAYMAX_AVAILABLE = True
        logger.info("✅ Waymax loaded successfully")
    except ImportError:
        _WAYMAX_AVAILABLE = False
        logger.warning("⚠️  Waymax not installed — falling back to local samples.")
    return _WAYMAX_AVAILABLE


# ---------------------------------------------------------------------------
# In-memory scenario cache
# ---------------------------------------------------------------------------
_scenario_index: dict[str, ScenarioSummaryModel] = {}
_scenario_cache: dict[str, ParsedScenarioModel] = {}

# Path to local sample scenarios (fallback)
SAMPLE_DIR = (
    Path(__file__).resolve().parent.parent.parent / "public" / "sample-scenarios"
)


# ===========================================================================
# Public API
# ===========================================================================


def initialize() -> None:
    """Build the scenario index at startup from real WOMD data only."""
    if _ensure_waymax() and WOMD_DATA_DIR.exists():
        _load_waymax_scenarios()
    elif _ensure_waymax() and not WOMD_DATA_DIR.exists():
        logger.warning(
            f"Waymax is installed but WOMD data directory not found at {WOMD_DATA_DIR}. "
            f"Set WOMD_DATA_DIR env var to point to your dataset."
        )
    else:
        logger.warning("Waymax not available. No scenarios loaded.")

    logger.info(f"Indexed {len(_scenario_index)} scenarios total")


def list_scenarios() -> list[ScenarioSummaryModel]:
    """Return all indexed scenario summaries."""
    return list(_scenario_index.values())


def get_scenario(scenario_id: str) -> Optional[ParsedScenarioModel]:
    """Retrieve a full parsed scenario by ID."""
    if scenario_id in _scenario_cache:
        return _scenario_cache[scenario_id]

    # Lazy-load from Waymax if indexed but not cached
    summary = _scenario_index.get(scenario_id)
    if summary and summary.source == "womd" and _ensure_waymax():
        scenario = _load_single_waymax_scenario(scenario_id)
        if scenario:
            _scenario_cache[scenario_id] = scenario
            return scenario

    return None


# ===========================================================================
# Local sample scenarios (fallback)
# ===========================================================================


def _load_sample_scenarios() -> None:
    """Load JSON sample scenarios from public/sample-scenarios/."""
    if not SAMPLE_DIR.exists():
        logger.info("No sample-scenarios directory found")
        return

    for json_file in sorted(SAMPLE_DIR.glob("*.json")):
        try:
            raw = json.loads(json_file.read_text())
            scenario = _parse_sample_json(raw, json_file.stem)
            _scenario_cache[scenario.id] = scenario
            _scenario_index[scenario.id] = ScenarioSummaryModel(
                id=scenario.id,
                agent_count=len(scenario.agents),
                duration=scenario.duration,
                has_incidents=len(scenario.incidents) > 0,
                incident_types=list({i.type for i in scenario.incidents}),
                source="sample",
            )
        except Exception as e:
            logger.error(f"Failed to load sample {json_file.name}: {e}")


def _parse_sample_json(raw: dict, fallback_id: str) -> ParsedScenarioModel:
    """Convert a WOMD-Reasoning style JSON into ParsedScenarioModel."""
    sid = raw.get("sid", fallback_id)
    ego_id = raw.get("ego", "ego")
    duration = raw.get("future_time", 9.0)
    cur_time = raw.get("cur_time", 0.0)

    # Parse Q&A pairs
    qa_pairs: list[QAPairModel] = []
    for category, q_key, a_key in [
        ("environment", "env_q", "env_a"),
        ("ego", "ego_q", "ego_a"),
        ("surrounding", "sur_q", "sur_a"),
        ("interaction", "int_q", "int_a"),
    ]:
        questions = raw.get(q_key, [])
        answers = raw.get(a_key, [])
        for i, q in enumerate(questions):
            qa_pairs.append(
                QAPairModel(
                    category=cast(QACategory, category),
                    question=q,
                    answer=answers[i] if i < len(answers) else "",
                    timestamp=cur_time,
                )
            )

    # Parse agents (real or synthetic)
    agents: list[AgentModel] = []
    if "agents" in raw and raw["agents"]:
        for a in raw["agents"][:MAX_AGENTS_PER_SCENARIO]:
            trajectory = [
                TrajectoryPointModel(
                    t=p["t"],
                    x=p["x"],
                    y=p["y"],
                    heading=p.get("heading", 0),
                    speed=math.sqrt(p.get("vx", 0) ** 2 + p.get("vy", 0) ** 2),
                    accel=0.0,
                )
                for p in a.get("trajectory", [])
            ]
            agents.append(
                AgentModel(
                    id=a["id"],
                    type=a["type"],
                    length=a.get("length", 4.5 if a["type"] == "vehicle" else 0.6),
                    width=a.get("width", 2.0 if a["type"] == "vehicle" else 0.6),
                    height=a.get("height", 1.5 if a["type"] == "vehicle" else 1.8),
                    trajectory=trajectory,
                )
            )
    else:
        agents = _generate_synthetic_agents(raw, duration, cur_time)

    # Map features
    map_features: list[MapFeatureModel] = []
    for f in raw.get("map_features", []):
        map_features.append(MapFeatureModel(type=f["type"], points=f["polyline"]))

    # Classify incidents (simple threshold-based, mirrors frontend logic)
    incidents = _classify_incidents_simple(agents, ego_id)

    return ParsedScenarioModel(
        id=sid,
        ego_id=ego_id,
        duration=duration,
        cur_time=cur_time,
        agents=agents,
        qa_pairs=qa_pairs,
        incidents=incidents,
        map_features=map_features,
        source="sample",
    )


def _generate_synthetic_agents(
    raw: dict, duration: float, cur_time: float
) -> list[AgentModel]:
    """Generate synthetic agents from Q&A text (mirrors frontend scenarioParser.ts)."""
    num_steps = 90
    dt = duration / num_steps

    ego_answers = raw.get("ego_a", [])
    has_stop = any(
        "stop" in a.lower() or "brake" in a.lower() or "yield" in a.lower()
        for a in ego_answers
    )
    has_turn = any(
        "turn" in a.lower() or "lane change" in a.lower() or "swerve" in a.lower()
        for a in ego_answers
    )

    # Ego trajectory
    ego_traj: list[TrajectoryPointModel] = []
    x, y, heading, speed = 0.0, 0.0, 0.0, 10.0
    stop_time = num_steps * 0.4
    turn_time = num_steps * 0.3

    for i in range(num_steps + 1):
        t = cur_time + i * dt
        if has_stop and stop_time < i < stop_time + 15:
            speed = max(0, speed - 1.5)
        elif has_stop and stop_time + 15 <= i < stop_time + 30:
            speed = min(10, speed + 0.5)
        if has_turn and turn_time < i < turn_time + 10:
            heading += 0.03

        prev_speed = ego_traj[-1].speed if ego_traj else speed
        accel = (speed - prev_speed) / dt if dt > 0 else 0

        x += math.cos(heading) * speed * dt
        y += math.sin(heading) * speed * dt
        ego_traj.append(
            TrajectoryPointModel(
                t=t, x=x, y=y, heading=heading, speed=speed, accel=accel
            )
        )

    agents = [
        AgentModel(
            id="ego", type="ego", length=4.5, width=2.0, height=1.5, trajectory=ego_traj
        )
    ]

    # Surrounding agents
    sur_answers = raw.get("sur_a", [])
    for idx in range(min(len(sur_answers), 4) or 1):
        answer = sur_answers[idx] if idx < len(sur_answers) else ""
        is_ped = any(w in answer.lower() for w in ["pedestrian", "walk", "cross"])
        is_cyclist = any(w in answer.lower() for w in ["cyclist", "bike", "bicycle"])
        agent_type = "pedestrian" if is_ped else "cyclist" if is_cyclist else "vehicle"

        offset_x = (1 if idx % 2 == 0 else -1) * (8 + idx * 4)
        offset_y = (1 if idx < 2 else -1) * (5 + idx * 3)
        agent_speed = (
            1.5
            if agent_type == "pedestrian"
            else 5.0
            if agent_type == "cyclist"
            else 8.0
        )
        agent_heading = math.atan2(-offset_y, 1)

        traj: list[TrajectoryPointModel] = []
        for i in range(num_steps + 1):
            t = cur_time + i * dt
            ax = offset_x + math.cos(agent_heading) * agent_speed * i * dt
            ay = offset_y + math.sin(agent_heading) * agent_speed * i * dt
            traj.append(
                TrajectoryPointModel(
                    t=t, x=ax, y=ay, heading=agent_heading, speed=agent_speed, accel=0
                )
            )

        agents.append(
            AgentModel(
                id=f"agent-{idx + 1}",
                type=agent_type,
                length=1.0 if is_ped else 2.0 if is_cyclist else 4.0,
                width=1.0 if is_ped else 0.8 if is_cyclist else 1.8,
                height=1.8 if is_ped else 1.5 if is_cyclist else 1.4,
                trajectory=traj,
            )
        )

    return agents


# ===========================================================================
# Waymax-powered loading (when available)
# ===========================================================================


def _load_waymax_scenarios() -> None:
    """Index scenarios from WOMD via waymax.dataloader."""
    if not _ensure_waymax():
        return

    try:
        import glob

        pattern = f"{WOMD_DATA_DIR}/*.tfrecord*"
        files = glob.glob(pattern)
        logger.info(f"🔍 Found {len(files)} tfrecord files in {WOMD_DATA_DIR}: {files}")

        # Use first file directly if exactly one found, otherwise fallback to glob
        target_path = files[0] if len(files) == 1 else pattern

        wod_config = waymax_config.DatasetConfig(  # type: ignore
            path=target_path,
            max_num_objects=MAX_AGENTS_PER_SCENARIO,
        )
        scenarios = waymax_dataloader.simulator_state_generator(wod_config)  # type: ignore

        count = 0
        for state in scenarios:
            if count >= MAX_SCENARIOS:
                break

            scenario_id = f"womd-{count:05d}"
            num_agents = int(state.log_trajectory.valid.any(axis=-1).sum())

            _scenario_index[scenario_id] = ScenarioSummaryModel(
                id=scenario_id,
                agent_count=num_agents,
                duration=float(state.remaining_timesteps) * 0.1,  # 10Hz
                has_incidents=False,  # Will be computed on detail load
                source="womd",
            )
            count += 1

        logger.info(f"Indexed {count} WOMD scenarios via Waymax")

    except Exception as e:
        logger.error(f"Failed to load WOMD scenarios via Waymax: {e}")


def _load_single_waymax_scenario(scenario_id: str) -> Optional[ParsedScenarioModel]:
    """Load and convert a single WOMD scenario to CalmRide format."""
    if not _ensure_waymax():
        return None

    try:
        import glob

        pattern = f"{WOMD_DATA_DIR}/*.tfrecord*"
        files = glob.glob(pattern)
        target_path = files[0] if len(files) == 1 else pattern

        # Re-iterate to find the scenario (in production, use an index/offset)
        idx = int(scenario_id.split("-")[1])
        wod_config = waymax_config.DatasetConfig(  # type: ignore
            path=target_path,
            max_num_objects=MAX_AGENTS_PER_SCENARIO,
        )
        scenarios = waymax_dataloader.simulator_state_generator(wod_config)  # type: ignore

        for i, state in enumerate(scenarios):
            if i == idx:
                return _convert_waymax_state(state, scenario_id)

    except Exception as e:
        logger.error(f"Failed to load Waymax scenario {scenario_id}: {e}")

    return None


def _convert_waymax_state(state, scenario_id: str) -> ParsedScenarioModel:
    """Convert a Waymax SimulatorState to CalmRide's ParsedScenarioModel."""
    import numpy as np

    agents: list[AgentModel] = []
    log_traj = state.log_trajectory

    # Number of objects and timesteps
    num_objects = log_traj.x.shape[0]
    num_timesteps = log_traj.x.shape[1]
    dt = 0.1  # WOMD is at 10Hz

    for obj_idx in range(min(num_objects, MAX_AGENTS_PER_SCENARIO)):
        valid_mask = log_traj.valid[obj_idx]
        if not valid_mask.any():
            continue

        # Determine agent type
        # Waymo SDC is indicated in object_metadata.sda_idx
        is_ego = bool(state.object_metadata.is_sdc[obj_idx])
        obj_type = state.object_metadata.object_types[obj_idx]
        # Waymax type mapping: 1=vehicle, 2=pedestrian, 3=cyclist
        type_map = {1: "vehicle", 2: "pedestrian", 3: "cyclist"}
        agent_type = "ego" if is_ego else type_map.get(int(obj_type), "vehicle")

        # Dimensions from trajectory
        first_valid_idx = int(valid_mask.argmax())
        length = float(state.log_trajectory.length[obj_idx, first_valid_idx])
        width = float(state.log_trajectory.width[obj_idx, first_valid_idx])
        height = float(state.log_trajectory.height[obj_idx, first_valid_idx])

        # Skip invalid or tiny objects
        if length < 0.1 or width < 0.1:
            continue

        trajectory: list[TrajectoryPointModel] = []
        for t_idx in range(num_timesteps):
            if not valid_mask[t_idx]:
                continue

            x = float(log_traj.x[obj_idx, t_idx])
            y = float(log_traj.y[obj_idx, t_idx])
            heading = float(log_traj.yaw[obj_idx, t_idx])
            vx = (
                float(log_traj.vel_x[obj_idx, t_idx])
                if hasattr(log_traj, "vel_x")
                else 0
            )
            vy = (
                float(log_traj.vel_y[obj_idx, t_idx])
                if hasattr(log_traj, "vel_y")
                else 0
            )
            speed = math.sqrt(vx**2 + vy**2)

            # Compute acceleration from speed delta
            if trajectory:
                prev_speed = trajectory[-1].speed
                accel = (speed - prev_speed) / dt
            else:
                accel = 0.0

            trajectory.append(
                TrajectoryPointModel(
                    t=t_idx * dt,
                    x=x,
                    y=y,
                    heading=heading,
                    speed=speed,
                    accel=accel,
                )
            )

        if trajectory:
            agents.append(
                AgentModel(
                    id="ego" if is_ego else f"agent-{obj_idx}",
                    type=cast(AgentType, agent_type),
                    length=length,
                    width=width,
                    height=height,
                    trajectory=trajectory,
                )
            )

    # Extract road graph as map features
    map_features = _extract_waymax_map_features(state)
    traffic_signals = _extract_waymax_traffic_lights(state)

    # Classify incidents
    ego_id = "ego"
    incidents = _classify_incidents_simple(agents, ego_id)

    duration = num_timesteps * dt

    return ParsedScenarioModel(
        id=scenario_id,
        ego_id=ego_id,
        duration=duration,
        cur_time=0.0,
        agents=agents,
        qa_pairs=[],  # WOMD doesn't have Q&A — only WOMD-Reasoning does
        incidents=incidents,
        map_features=map_features,
        traffic_signals=traffic_signals,
        source="womd",
    )


def _extract_waymax_map_features(state) -> list[MapFeatureModel]:
    """Extract road graph features from a Waymax state."""
    features: list[MapFeatureModel] = []
    if not _ensure_waymax() or state is None:
        return features

    try:
        roadgraph = state.roadgraph_points
        if roadgraph is None:
            return features

        # Detailed Waymo map element mapping
        # types according to waymax/visualization/color.py and map.proto
        type_map = {
            1: "LaneCenter-Freeway",
            2: "LaneCenter-SurfaceStreet",
            3: "LaneCenter-BikeLane",
            6: "RoadLine-BrokenSingleWhite",
            7: "RoadLine-SolidSingleWhite",
            8: "RoadLine-SolidDoubleWhite",
            9: "RoadLine-BrokenSingleYellow",
            10: "RoadLine-BrokenDoubleYellow",
            11: "RoadLine-SolidSingleYellow",
            12: "RoadLine-SolidDoubleYellow",
            13: "RoadLine-PassingDoubleYellow",
            15: "RoadEdgeBoundary",
            16: "RoadEdgeMedian",
            17: "StopSign",
            18: "Crosswalk",
            19: "SpeedBump",
        }

        valid = roadgraph.valid
        x_coords = roadgraph.x
        y_coords = roadgraph.y
        road_types = roadgraph.types

        for rtype, feature_name in type_map.items():
            mask = (road_types == rtype) & valid
            if not mask.any():
                continue

            xs = x_coords[mask]
            ys = y_coords[mask]

            # Better subsampling: keep more detail for road lines
            limit = 400 if "RoadLine" in feature_name else 200
            step = max(1, len(xs) // limit)
            points = [
                {"x": float(xs[i]), "y": float(ys[i])} for i in range(0, len(xs), step)
            ]

            if points:
                features.append(
                    MapFeatureModel(
                        type=cast(MapFeatureType, feature_name), points=points
                    )
                )

    except Exception as e:
        logger.warning(f"Could not extract map features: {e}")

    return features


def _extract_waymax_traffic_lights(state) -> list[TrafficSignalModel]:
    """Extract traffic light states from Waymax state."""
    signals = []
    try:
        if not hasattr(state, "log_traffic_light"):
            return []

        tl = state.log_traffic_light
        # Shape: (num_signals, num_timesteps)
        num_signals = tl.state.shape[0]
        num_timesteps = tl.state.shape[1]
        dt = 0.1

        for s_idx in range(num_signals):
            valid_mask = tl.valid[s_idx]
            if not valid_mask.any():
                continue

            # For simplicity, we sample the states at their timestamps
            for t_idx in range(num_timesteps):
                if valid_mask[t_idx]:
                    signals.append(
                        TrafficSignalModel(
                            id=f"tl-{s_idx}",
                            x=float(tl.x[s_idx, t_idx]),
                            y=float(tl.y[s_idx, t_idx]),
                            state=int(tl.state[s_idx, t_idx]),
                            timestamp=t_idx * dt,
                        )
                    )
    except Exception as e:
        logger.warning(f"Could not extract traffic lights: {e}")

    return signals


# ===========================================================================
# Simple incident classifier (mirrors frontend incidentClassifier.ts)
# ===========================================================================

from models import IncidentModel

HARD_BRAKE_THRESHOLD = 1.5
HEADING_CHANGE_THRESHOLD = 0.06
STOP_SPEED_THRESHOLD = 0.5
MIN_SPEED_FOR_BRAKE = 1.5


def _classify_incidents_simple(
    agents: list[AgentModel], ego_id: str
) -> list[IncidentModel]:
    """Threshold-based incident classification (matches frontend logic)."""
    ego = next((a for a in agents if a.id == ego_id), None)
    if not ego:
        return []

    incidents: list[IncidentModel] = []
    traj = ego.trajectory
    count = 0

    for i in range(1, len(traj)):
        prev = traj[i - 1]
        curr = traj[i]
        dt = curr.t - prev.t
        if dt <= 0:
            continue

        decel = (prev.speed - curr.speed) / dt

        # Hard brake
        if decel > HARD_BRAKE_THRESHOLD and prev.speed > MIN_SPEED_FOR_BRAKE:
            incidents.append(
                IncidentModel(
                    id=f"incident-{count}",
                    type="hard_brake",
                    timestamp=curr.t,
                    x=curr.x,
                    y=curr.y,
                    description=f"Hard braking detected: deceleration {decel:.1f} m/s²",
                    severity="high",
                )
            )
            count += 1

        # Sudden stop
        if prev.speed > MIN_SPEED_FOR_BRAKE and curr.speed < STOP_SPEED_THRESHOLD:
            has_brake = any(
                inc.type == "hard_brake" and abs(inc.timestamp - curr.t) < 0.5
                for inc in incidents
            )
            if not has_brake:
                incidents.append(
                    IncidentModel(
                        id=f"incident-{count}",
                        type="sudden_stop",
                        timestamp=curr.t,
                        x=curr.x,
                        y=curr.y,
                        description=f"Sudden stop from {prev.speed:.1f} m/s",
                        severity="high",
                    )
                )
                count += 1

        # Lane change
        if i >= 2:
            prev_prev = traj[i - 2]
            heading_delta = abs(_normalize_angle(curr.heading - prev_prev.heading))
            if heading_delta > HEADING_CHANGE_THRESHOLD and curr.speed > 2:
                incidents.append(
                    IncidentModel(
                        id=f"incident-{count}",
                        type="lane_change",
                        timestamp=curr.t,
                        x=curr.x,
                        y=curr.y,
                        description=f"Lane change: heading change {math.degrees(heading_delta):.0f}°",
                        severity="medium",
                    )
                )
                count += 1

    if traj:
        duration = traj[-1].t - traj[0].t
        interval = 8.0
        t = interval
        while t < duration:
            point = next((p for p in traj if p.t >= t), traj[-1])
            has_nearby = any(abs(inc.timestamp - point.t) < 2.0 for inc in incidents)
            if not has_nearby:
                speed_mph = int(point.speed * 2.237)
                heading_deg = int(math.degrees(_normalize_angle(point.heading)))
                incidents.append(
                    IncidentModel(
                        id=f"incident-{count}",
                        type="routine_update",
                        timestamp=point.t,
                        x=point.x,
                        y=point.y,
                        description=f"Cruising at {speed_mph} mph, heading {heading_deg} degrees. All systems nominal.",
                        severity="low",
                    )
                )
                count += 1
            t += interval

    return _deduplicate_incidents(incidents)


def _normalize_angle(angle: float) -> float:
    while angle > math.pi:
        angle -= 2 * math.pi
    while angle < -math.pi:
        angle += 2 * math.pi
    return angle


def _deduplicate_incidents(incidents: list[IncidentModel]) -> list[IncidentModel]:
    cooldown = 1.0
    result: list[IncidentModel] = []
    for inc in incidents:
        has_dup = any(
            e.type == inc.type and abs(e.timestamp - inc.timestamp) < cooldown
            for e in result
        )
        if not has_dup:
            result.append(inc)
    return result
