import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.models.match import MatchCandidate, MatchStatus
from app.services.audit_service import create_notification

def tokenize(text: str) -> set:
    if not text:
        return set()
    return set(re.findall(r"\w+", text.lower()))

def calculate_similarity(lost_report: dict, found_report: dict) -> Tuple[float, Dict[str, float]]:
    # 1. Category match (Weight: 0.30)
    cat_lost = (lost_report.get("category") or "").strip().lower()
    cat_found = (found_report.get("category") or "").strip().lower()
    cat_score = 1.0 if cat_lost == cat_found and cat_lost else 0.0

    # 2. Color match (Weight: 0.20)
    color_lost = tokenize(lost_report.get("color") or "")
    color_found = tokenize(found_report.get("color") or "")
    color_score = 0.0
    if color_lost and color_found:
        color_intersection = color_lost.intersection(color_found)
        color_score = 1.0 if color_intersection else 0.0

    # 3. Brand match (Weight: 0.20)
    brand_lost = tokenize(lost_report.get("brand") or "")
    brand_found = tokenize(found_report.get("brand") or "")
    brand_score = 0.0
    if brand_lost and brand_found:
        brand_intersection = brand_lost.intersection(brand_found)
        brand_score = 1.0 if brand_intersection else 0.0

    # 4. Location match (Weight: 0.15)
    loc_lost = tokenize(lost_report.get("location") or "")
    loc_found = tokenize(found_report.get("location") or "")
    loc_score = 0.0
    if loc_lost and loc_found:
        loc_intersection = loc_lost.intersection(loc_found)
        loc_score = min(1.0, len(loc_intersection) / max(1, min(len(loc_lost), len(loc_found))))

    # 5. Date proximity match (Weight: 0.10)
    # 1.0 if within 2 days, decays linearly up to 14 days
    date_score = 0.0
    t_lost = lost_report.get("event_time")
    t_found = found_report.get("event_time")
    if t_lost and t_found:
        diff_days = abs((t_lost - t_found).total_seconds()) / 86400.0
        if diff_days <= 2.0:
            date_score = 1.0
        elif diff_days <= 14.0:
            date_score = max(0.0, 1.0 - ((diff_days - 2.0) / 12.0))

    # 6. Description and Item Name Keyword overlap (Weight: 0.05)
    text_lost = tokenize(f"{lost_report.get('item_name', '')} {lost_report.get('description', '')}")
    text_found = tokenize(f"{found_report.get('item_name', '')} {found_report.get('description', '')}")
    text_score = 0.0
    if text_lost and text_found:
        jaccard = len(text_lost.intersection(text_found)) / max(1, len(text_lost.union(text_found)))
        text_score = min(1.0, jaccard * 3)

    total_score = (
        0.30 * cat_score +
        0.20 * color_score +
        0.20 * brand_score +
        0.15 * loc_score +
        0.10 * date_score +
        0.05 * text_score
    )

    factors = {
        "category": round(cat_score, 2),
        "color": round(color_score, 2),
        "brand": round(brand_score, 2),
        "location": round(loc_score, 2),
        "date_proximity": round(date_score, 2),
        "text_overlap": round(text_score, 2)
    }

    return round(total_score, 3), factors

async def evaluate_matches_for_report(target_report_id: str, db: AsyncIOMotorDatabase):
    """
    Evaluates potential matches for a newly approved report against all opposite-type published reports.
    """
    target = await db.reports.find_one({"_id": ObjectId(target_report_id)})
    if not target or target.get("moderation_status") != "published":
        return

    target_type = target.get("type")
    opposite_type = "found" if target_type == "lost" else "lost"

    candidates = db.reports.find({
        "type": opposite_type,
        "moderation_status": "published",
        "item_outcome": "open"
    })

    async for other in candidates:
        lost_item = target if target_type == "lost" else other
        found_item = other if target_type == "lost" else target

        score, factors = calculate_similarity(lost_item, found_item)
        if score >= 0.50:  # Candidate match threshold (50%+)
            lost_id_str = str(lost_item["_id"])
            found_id_str = str(found_item["_id"])

            # Check if match candidate already exists
            existing = await db.matches.find_one({
                "lost_report_id": lost_id_str,
                "found_report_id": found_id_str
            })
            if not existing:
                match_doc = {
                    "lost_report_id": lost_id_str,
                    "found_report_id": found_id_str,
                    "score": score,
                    "factors": factors,
                    "status": MatchStatus.SUGGESTED,
                    "created_at": datetime.now(timezone.utc)
                }
                await db.matches.insert_one(match_doc)

                # Send in-app notification to the lost item owner
                pct = int(score * 100)
                await create_notification(
                    user_id=lost_item["user_id"],
                    notif_type="match_found",
                    title="Potential Match Found!",
                    message=f"A found item ('{found_item.get('item_name')}') has a {pct}% match with your lost report for '{lost_item.get('item_name')}'.",
                    link=f"/reports/{found_id_str}",
                    db=db
                )
