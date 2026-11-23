import pytest
from app.core.security import (
    hash_password, verify_password,
    generate_high_entropy_token, hash_token,
    create_access_token, decode_access_token
)
from app.services.matching_engine import calculate_similarity

def test_password_hashing():
    pw = "SecretCampusPass123!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_token_generation_and_hashing():
    token = generate_high_entropy_token()
    assert len(token) >= 32
    token_hash = hash_token(token)
    assert len(token_hash) == 64  # SHA-256 hex digest length
    assert token_hash == hash_token(token)

def test_jwt_access_token():
    token = create_access_token(subject="user_12345", role="regular")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == "user_12345"
    assert payload.get("role") == "regular"

def test_matching_engine_similarity():
    lost_item = {
        "item_name": "Black Hydro Flask Bottle",
        "category": "Bottles & Mugs",
        "color": "Black",
        "brand": "Hydro Flask",
        "location": "Main Campus Library 2nd Floor",
        "description": "32oz wide mouth bottle with NASA sticker"
    }

    found_item_match = {
        "item_name": "Black Water Flask",
        "category": "Bottles & Mugs",
        "color": "Black",
        "brand": "Hydro Flask",
        "location": "Library Study Area",
        "description": "Found a black insulated flask on table with stickers"
    }

    found_item_different = {
        "item_name": "Silver MacBook Air",
        "category": "Electronics",
        "color": "Silver",
        "brand": "Apple",
        "location": "Gym",
        "description": "Laptop found in locker room"
    }

    score_match, factors_match = calculate_similarity(lost_item, found_item_match)
    score_diff, factors_diff = calculate_similarity(lost_item, found_item_different)

    assert score_match >= 0.70  # Strong match
    assert score_diff <= 0.20   # Very low score
    assert factors_match["category"] == 1.0
    assert factors_match["color"] == 1.0
    assert factors_match["brand"] == 1.0
