"""User context tools for NGX agents.

Supports both Supabase (production) and mock store (development).
"""

import os
from typing import Any, Dict
from services.mock_store import store

# Check if Supabase is configured
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY)

if USE_SUPABASE:
    from services.supabase_client import (
        get_user_context_from_db,
        save_checkin,
        save_hydration,
    )


def get_user_context(context_type: str) -> dict:
    """
    Obtiene contexto del usuario (perfil, estado de hoy, rachas).

    Args:
        context_type: 'profile', 'today', 'streak', 'goals', 'full' (todo junto)

    Returns:
        Diccionario con el contexto solicitado.
        Para 'full': incluye checkin, pain_zones, recent_sessions, cycle_phase, streak
    """
    if USE_SUPABASE and context_type == "full":
        # Return comprehensive context from Supabase
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an async context, create a task
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(
                        asyncio.run,
                        get_user_context_from_db("anonymous-user")
                    ).result()
            else:
                return asyncio.run(get_user_context_from_db("anonymous-user"))
        except Exception as e:
            print(f"Supabase context fetch failed, using mock: {e}")
            return store.get_context(context_type)

    # Fallback to mock store
    return store.get_context(context_type)


def update_user_context(context_type: str, data: Dict[str, Any]) -> str:
    """
    Actualiza el estado del usuario en la base de datos.

    Usa esto cuando un usuario complete una acción (check-in, log workout, etc).

    Args:
        context_type: 'today' (para métricas diarias), 'streak' (para rachas),
                     'checkin' (para guardar check-in completo),
                     'hydration' (para registrar hidratación)
        data: Diccionario con los campos a actualizar.
              Ej: context_type='today', data={'water_ml': 500}
              Ej: context_type='checkin', data={'sleep_quality': 4, 'energy_level': 3}
              Ej: context_type='hydration', data={'amount_ml': 500}
    """
    import asyncio

    if USE_SUPABASE:
        try:
            if context_type == "checkin":
                asyncio.run(save_checkin("anonymous-user", data))
                store.update_today({"checkin_done": True})
                return "Check-in guardado en base de datos."

            elif context_type == "hydration":
                amount = data.get("amount_ml", 0)
                asyncio.run(save_hydration("anonymous-user", amount))
                current = store.today.get("water_ml", 0)
                store.update_today({"water_ml": current + amount})
                return f"Hidratación registrada: {amount}ml"
        except Exception as e:
            print(f"Supabase update failed: {e}")
            # Fall through to mock store

    # Mock store logic
    if context_type == "today":
        store.update_today(data)
        return "Contexto diario actualizado."

    elif context_type == "streak":
        if 'increment' in data:
            store.increment_streak(data['increment'])
            return f"Racha de {data['increment']} incrementada."
        if 'reset' in data:
            store.reset_streak(data['reset'])
            return f"Racha de {data['reset']} reiniciada."

    elif context_type == "checkin":
        store.update_today({
            "checkin_done": True,
            "sleep_hours": data.get("sleep_hours", 0),
            "energy_level": data.get("energy_level", 0),
            "stress_level": data.get("stress_level", 0),
        })
        return "Check-in guardado."

    elif context_type == "hydration":
        amount = data.get("amount_ml", 0)
        current = store.today.get("water_ml", 0)
        store.update_today({"water_ml": current + amount})
        return f"Hidratación registrada: {amount}ml"

    return "Tipo de contexto no soportado para actualización."