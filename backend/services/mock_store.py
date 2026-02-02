"""
Mock In-Memory Store for NGX GENESIS.
Simulates a database for session persistence during A2UI testing.
"""

from typing import Dict, Any, List
from datetime import datetime

class MockStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MockStore, cls).__new__(cls)
            cls._instance._initialize_data()
        return cls._instance

    def _initialize_data(self):
        """Initialize default mock data."""
        self.profile = {
            "name": "Usuario Test",
            "age": 30,
            "goal": "Recomposición Corporal",
            "level": "Intermedio",
            "restrictions": [],
            "experience_months": 18
        }
        
        self.today = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "checkin_done": False,
            "workout_done": False,
            "meals_logged": 0,
            "water_ml": 0,
            "sleep_hours": 0,
            "energy_level": 0,
            "stress_level": 0
        }
        
        self.streaks = {
            "checkin": 5,
            "workout": 3,
            "nutrition": 12
        }
        
        self.goals = {
            "primary_goal": {
                "name": "Recomposición corporal",
                "target": "Ganar 3kg músculo, perder 5kg grasa",
                "progress": 45,
                "deadline": "2026-06-01",
            },
            "secondary_goals": [
                {"name": "Dormir 8h", "progress": 70},
                {"name": "Entrenar 4x/semana", "progress": 85},
            ],
            "milestones": [
                {"name": "Primera semana consistente", "achieved": True},
                {"name": "PR en sentadilla", "achieved": True},
            ],
        }

        self.sessions = {
            # session_id -> { exercises: { exercise_id: [ {weight, reps, rpe} ] } }
        }
        
        self.habits_log = {
            # date_str -> { habit_id: status }
        }

    def get_context(self, context_type: str) -> Dict[str, Any]:
        if context_type == "profile":
            return self.profile
        elif context_type == "today":
            return self.today
        elif context_type == "streak":
            return self.streaks
        elif context_type == "goals":
            return self.goals
        return {}

    def update_today(self, updates: Dict[str, Any]):
        """Update today's metrics."""
        self.today.update(updates)
        
        # Simple logic: If checkin done, increment streak logic could be handled by agent logic
        # but here we just store data.

    def increment_streak(self, streak_type: str):
        if streak_type in self.streaks:
            self.streaks[streak_type] += 1

    def reset_streak(self, streak_type: str):
        if streak_type in self.streaks:
            self.streaks[streak_type] = 0

    def log_set(self, session_id: str, exercise_id: str, set_data: Dict[str, Any]):
        if session_id not in self.sessions:
            self.sessions[session_id] = {"exercises": {}}
        
        session = self.sessions[session_id]
        if exercise_id not in session["exercises"]:
            session["exercises"][exercise_id] = []
            
        session["exercises"][exercise_id].append(set_data)
        self.today["workout_done"] = True
        return f"Set logged for {exercise_id}: {set_data}"

    def toggle_habit(self, habit_id: str, date: str, status: str):
        if date not in self.habits_log:
            self.habits_log[date] = {}
        
        self.habits_log[date][habit_id] = status
        
        # Simple streak update
        if status == 'completed':
            self.increment_streak('checkin') # Simplifying for demo
            
        return f"Habit {habit_id} marked as {status} for {date}"


# Global instance
store = MockStore()
