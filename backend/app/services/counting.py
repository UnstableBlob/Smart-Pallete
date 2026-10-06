"""
Smart Palette – Counting service.

Converts a list of per-instance YOLO detections into a summary of
{name, count, confidence} where confidence is the mean of all instances.
"""
from collections import defaultdict


def count_detections(raw_detections: list[dict]) -> list[dict]:
    """
    Aggregate per-instance detections into per-ingredient counts.

    Parameters
    ----------
    raw_detections : list[dict]
        Each dict: {name: str, confidence: float, bbox: list[float]}

    Returns
    -------
    list[dict]
        Each dict: {name: str, count: int, confidence: float, bbox: list[float] | None}
        Sorted by confidence (highest first).
    """
    accumulator: dict[str, dict] = defaultdict(
        lambda: {"count": 0, "confidences": [], "bbox": None}
    )

    for det in raw_detections:
        name = det["name"].lower().strip()
        accumulator[name]["count"] += 1
        accumulator[name]["confidences"].append(det["confidence"])
        # Store the bbox of the first (highest-confidence) instance
        if accumulator[name]["bbox"] is None:
            accumulator[name]["bbox"] = det.get("bbox")

    result = []
    for name, data in accumulator.items():
        avg_conf = sum(data["confidences"]) / len(data["confidences"])
        result.append(
            {
                "name": name,
                "count": data["count"],
                "confidence": round(avg_conf, 4),
                "bbox": data["bbox"],
            }
        )

    # Sort by descending confidence
    result.sort(key=lambda x: x["confidence"], reverse=True)
    return result
