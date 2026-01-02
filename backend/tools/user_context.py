"""User context retrieval tool for NGX agents."""


def get_user_context(context_type: str) -> dict:
    """
    Obtiene contexto del usuario para personalizar respuestas.
    
    Usa este tool cuando necesites información sobre el usuario para
    dar una respuesta más personalizada.
    
    ## Tipos de Contexto
    
    ### profile
    Datos básicos del usuario:
    - name: Nombre
    - goal: Objetivo principal (recomposición, hipertrofia, etc.)
    - level: Nivel de experiencia
    - restrictions: Restricciones alimenticias o físicas
    
    ### today
    Estado del día actual:
    - checkin_done: Si completó el check-in
    - workout_done: Si completó entrenamiento
    - meals_logged: Comidas registradas
    - water_ml: ml de agua consumidos
    
    ### history
    Historial reciente (última semana):
    - workouts: Entrenamientos completados
    - adherence: % de adherencia al plan
    - trends: Tendencias en métricas
    
    ### goals
    Objetivos activos y progreso:
    - primary_goal: Objetivo principal
    - secondary_goals: Objetivos secundarios
    - progress: Progreso hacia cada objetivo
    - milestones: Hitos alcanzados
    
    Returns:
        Dict con el contexto solicitado
    
    Note:
        Esta es una implementación mock para el prototipo.
        En producción, conectar a Supabase/base de datos.
    """
    # Mock implementation for prototype
    # TODO: Connect to actual user data service
    
    if context_type == "profile":
        return {
            "name": "Usuario",
            "goal": "Recomposición corporal",
            "level": "Intermedio",
            "restrictions": [],
            "age": 35,
            "experience_months": 24,
        }
    
    elif context_type == "today":
        return {
            "checkin_done": False,
            "workout_done": False,
            "meals_logged": 0,
            "water_ml": 750,
            "sleep_hours": 7.5,
            "energy_level": 7,
        }
    
    elif context_type == "history":
        return {
            "workouts_last_week": 4,
            "adherence_percent": 85,
            "avg_sleep": 7.2,
            "weight_trend": "stable",
            "strength_trend": "increasing",
        }
    
    elif context_type == "goals":
        return {
            "primary_goal": {
                "name": "Recomposición corporal",
                "target": "Ganar 3kg músculo, perder 5kg grasa",
                "progress": 45,
                "deadline": "2025-06-01",
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
    
    return {}
