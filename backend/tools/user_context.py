"""User context tools for NGX agents."""

from typing import Any, Dict
from services.mock_store import store

def get_user_context(context_type: str) -> dict:
    """
    Obtiene contexto del usuario (perfil, estado de hoy, rachas).
    
    Args:
        context_type: 'profile', 'today', 'streak', 'goals'
    """
    return store.get_context(context_type)

def update_user_context(context_type: str, data: Dict[str, Any]) -> str:
    """
    Actualiza el estado del usuario en la "base de datos".
    
    Usa esto cuando un usuario complete una acción (check-in, log workout, etc).
    
    Args:
        context_type: 'today' (para métricas diarias), 'streak' (para rachas)
        data: Diccionario con los campos a actualizar.
              Ej: context_type='today', data={'water_ml': 500}
              Ej: context_type='streak', data={'increment': 'checkin'}
    """
    if context_type == "today":
        current = store.today.get('water_ml', 0)
        if 'water_ml' in data and isinstance(data['water_ml'], (int, float)):
             # Cumulative logic for water if passed as delta? 
             # Agent usually passes absolute or delta. Let's assume agent logic handles calculation 
             # OR we make this tool smart. For simplicity, let's assume update logic.
             # If agent sends "add 500", it might need to know current.
             # Let's support delta update specifically for water if requested, otherwise overwrite.
             # For now, simple overwrite/update.
             pass
        
        store.update_today(data)
        return "Contexto diario actualizado."

    elif context_type == "streak":
        if 'increment' in data:
            store.increment_streak(data['increment'])
            return f"Racha de {data['increment']} incrementada."
        if 'reset' in data:
            store.reset_streak(data['reset'])
            return f"Racha de {data['reset']} reiniciada."
            
    return "Tipo de contexto no soportado para actualización."