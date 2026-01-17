"""Widget generation tool for NGX agents."""

from typing import Any


def generate_widget(widget_type: str, props: dict[str, Any]) -> dict:
    """
    Genera un widget visual para el frontend A2UI.
    
    Usa este tool cuando necesites mostrar información estructurada,
    datos interactivos, o acciones que el usuario puede tomar.
    
    ## Widgets por Agente
    
    ### BLAZE (Fuerza):
    - workout-card: Rutina de ejercicios
      props: { title, category, duration, workoutId, exercises[], coachNote? }
      exercises[]: { name, sets, reps, load }
    - timer-widget: Temporizador de descanso
      props: { label, seconds, autoStart? }
    - live-session-tracker: Seguimiento en vivo de la sesión
      props: { workoutId, title, exercises[] }
      exercises[]: { id, name, target: { sets, reps, rpe? }, setsCompleted: [{ weight, reps }] }
    - plate-calculator: Calculadora de discos
      props: { targetWeight, barWeight? }
    
    ### SAGE (Nutrición):
    - meal-plan: Plan de comidas del día
      props: { totalKcal, meals[] }
      meals[]: { time, name, kcal, highlight? }
    - hydration-tracker: Seguimiento de hidratación
      props: { current, goal }
    - recipe-card: Receta completa
      props: { title, kcal, time, tags[], ingredients[], instructions[] }
    
    ### SPARK (Hábitos):
    - daily-checkin: Check-in diario
      props: { date, questions[] }
      questions[]: { id, label, type: 'number'|'slider'|'text', min?, max? }
    - checklist: Lista de tareas
      props: { title, items[] }
      items[]: { id, text, checked }
    - quick-actions: Acciones rápidas
      props: { title?, actions[] }
      actions[]: { id, label, icon: 'food'|'dumbbell'|'water'|'sleep'|'activity' }
    - quote-card: Cita motivacional
      props: { quote, author }
    - habit-streak: Llama de racha visual
      props: { streakDays, message }
    
    ### STELLA (Mindset):
    - progress-dashboard: Dashboard de progreso
      props: { title, subtitle?, progress, metrics[] }
      metrics[]: { label, value }
    - insight-card: Insight de AI
      props: { title, insight, trend?, recommendation? }
    - sleep-analysis: Análisis de sueño
      props: { score, duration, stages: { deep, rem, light }, quality }
    - body-comp-visualizer: Visualizador de tendencias
      props: { title, metrics[], dataPoints: [{ date, metric1, metric2 }] }
    - breathwork-guide: Guía de respiración
      props: { durationSeconds?, technique: 'box'|'4-7-8' }
    
    ### GENESIS (Coordinación):
    - quick-actions: Inicio de sesión (legacy)
    - progress-dashboard: Resumen general
    - Puede coordinar múltiples widgets de diferentes agentes

    ### V3 CORE WIDGETS (Preferred):
    - genesis-quick-actions: Command center entry point
      props: { title, actions[], recommendation? }
      actions[]: { id, label, icon, highlight? }
      recommendation: { actionId, reason }

    - readiness-checkin: Subjective signal capture
      props: { fields[], cta, prefilledData? }
      fields[]: { id, type: 'slider'|'select', label, options?, min?, max? }
      cta: { id, label }
      prefilledData: { deviceReadiness?, deviceSource? }

    - plan-card: Unified plan format (workout/nutrition/habits)
      props: { mode, title, summary, duration?, intensity?, tabs?, primaryCta, secondaryCta?, adjustedReason? }
      mode: 'workout'|'nutrition'|'habits'
      tabs[]: { id, label, content }
      primaryCta: { id, label }

    - live-tracker: Real-time session tracking
      props: { type, sessionId, progress, currentExercise?, items?, cta }
      type: 'workout'|'habits'|'nutrition'
      progress: { current, total }
      currentExercise: { name, sets[], restTimer?, videoUrl? }
      items[]: { id, label, done, streak? }

    - weekly-review-dashboard: Weekly premium moment with insights + decision
      props: { weekRange, highlights[], insights[], nextMove, wearableData? }
      highlights[]: { title, value, trend? }
      insights[]: { type: 'win'|'risk'|'tip', text, icon? }
      nextMove: { question, options[], recommendation? }
      wearableData: { avgHrv, avgSleep, trainingLoad, trend }

    ### Variable:
    - alert-banner: Notificaciones
      props: { type: 'warning'|'error'|'success', message }
    
    ## Cuándo NO generar widget
    - LOGOS raramente genera widgets (es TEXT_ONLY)
    - Preguntas conceptuales simples
    - Cuando la respuesta es puramente explicativa
    
    Returns:
        Dict con type y props listo para A2UIMediator en frontend
    """
    return {
        "type": widget_type,
        "props": props
    }
