from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, List, Tuple

from ..schemas import Constraints
from .validate import ValidationResult, validate_layout
from .doors import RoomRect


@dataclass(frozen=True)
class RepairOutcome:
    rooms: List[RoomRect]
    attempts: int
    last_errors: List[str]


def repair_with_restarts(
    *,
    width_m: float,
    height_m: float,
    constraints: Constraints,
    build_candidate: Callable[[float, float, int], List[RoomRect]],
    max_iterations: int,
) -> RepairOutcome:
    """
    Try multiple candidate parameterizations. This is a pragmatic restart-based repair loop.
    A later version can implement local-search moves (shift/resize/swap) in continuous space.
    """
    last: ValidationResult | None = None
    for k in range(max_iterations):
        rooms = build_candidate(width_m, height_m, k)
        last = validate_layout(width_m=width_m, height_m=height_m, rooms=rooms, constraints=constraints)
        if last.ok:
            return RepairOutcome(rooms=rooms, attempts=k + 1, last_errors=[])
    return RepairOutcome(rooms=build_candidate(width_m, height_m, max_iterations - 1), attempts=max_iterations, last_errors=(last.errors if last else ["unknown"]))

