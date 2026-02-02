import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from tools.user_context import update_user_context
from services.mock_store import store

def test_log_workout_set():
    print("Testing log_workout_set...")
    entry = {
        "sessionId": "test-session-1",
        "exerciseId": "Squat",
        "weight": 100,
        "reps": 5
    }
    result = update_user_context("log_workout_set", entry)
    print(f"Result: {result}")
    
    # Verify in store
    session = store.sessions.get("test-session-1")
    if session and "Squat" in session["exercises"]:
        sets = session["exercises"]["Squat"]
        last_set = sets[-1]
        if last_set["weight"] == 100 and last_set["reps"] == 5:
            print("✅ log_workout_set verification PASSED")
        else:
            print("❌ log_workout_set verification FAILED: Data mismatch")
    else:
        print("❌ log_workout_set verification FAILED: Session or exercise not found")

def test_toggle_habit():
    print("\nTesting toggle_habit...")
    entry = {
        "habitId": "water",
        "date": "2026-02-02",
        "status": "completed"
    }
    result = update_user_context("toggle_habit", entry)
    print(f"Result: {result}")
    
    # Verify in store
    day_log = store.habits_log.get("2026-02-02")
    if day_log and day_log.get("water") == "completed":
        print("✅ toggle_habit verification PASSED")
    else:
        print("❌ toggle_habit verification FAILED")

if __name__ == "__main__":
    test_log_workout_set()
    test_toggle_habit()
