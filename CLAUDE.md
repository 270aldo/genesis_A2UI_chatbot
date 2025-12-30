# CLAUDE.md - Genesis Chat (A2UI)

## Project Overview

Genesis Chat is an AI-powered fitness operating system interface built with React and TypeScript. The application implements an "A2UI" (AI-to-UI) paradigm where the Gemini API generates dynamic UI widgets based on user interactions. The chat interface features multiple AI "agents" with distinct personalities for different fitness domains.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts)

## Project Structure

```
genesis_A2UI_chatbot/
├── App.tsx                    # Main application component with chat logic
├── index.tsx                  # React entry point
├── index.html                 # HTML template with Tailwind CDN & import maps
├── types.ts                   # TypeScript type definitions
├── constants.ts               # Colors, agent config, and system prompt
├── components/
│   ├── BaseUI.tsx            # Reusable UI primitives (GlassCard, buttons, inputs)
│   ├── Widgets.tsx           # A2UI widget components and A2UIMediator
│   └── Sidebar.tsx           # Session sidebar component
├── services/
│   └── geminiService.ts      # Gemini API integration
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Concepts

### A2UI (AI-to-UI) System

The application uses a widget-based response system where the AI returns structured JSON with:
- `text`: Markdown-compatible text response
- `agent`: The AI agent personality (NEXUS, BLAZE, MACRO, AQUA, LUNA)
- `payload`: Optional widget definition with `type` and `props`

### AI Agents

| Agent | Color | Domain |
|-------|-------|--------|
| NEXUS | Purple (#6D00FF) | General orchestration, dashboards, check-ins |
| BLAZE | Orange (#FF4500) | Workouts, training, motivation, timers |
| MACRO | Tomato (#FF6347) | Nutrition, recipes, supplements |
| AQUA | Cyan (#00D4FF) | Hydration tracking |
| LUNA | Indigo (#6366F1) | Sleep, recovery, meditation |

### Available Widget Types

1. `daily-checkin` - Interactive form for daily metrics
2. `quick-actions` - Button grid for common actions
3. `workout-card` - Exercise routine display with start action
4. `meal-plan` - Daily meal schedule with calories
5. `hydration-tracker` - Water intake with add buttons
6. `progress-dashboard` - Metrics overview with progress bar
7. `recipe-card` - Recipe with ingredients and instructions
8. `sleep-analysis` - Sleep quality score and stages
9. `timer-widget` - Countdown timer for rest periods
10. `checklist` - Interactive todo list
11. `supplement-stack` - Daily supplement tracker
12. `quote-card` - Motivational quotes
13. `alert-banner` - Warning/error/success notifications

## Development Workflow

### Setup

```bash
npm install
```

### Environment Configuration

Create `.env.local` with your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

Without an API key, the app runs in "Simulation Mode" with mock responses.

### Running Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Coding Conventions

### TypeScript

- Use explicit type annotations for component props
- Define interfaces in `types.ts` for shared types
- Use `React.FC<Props>` pattern for functional components

### Component Patterns

- **Glass morphism**: Use `GlassCard` from `BaseUI.tsx` for consistent styling
- **Agent badges**: Include `AgentBadge` in widgets to show generating agent
- **Action callbacks**: Pass `onAction(id, data)` for interactive widgets

### Styling

- Use Tailwind utility classes exclusively
- Dark theme with `#050505` background
- Consistent spacing: `gap-2`, `gap-3`, `gap-4` for element spacing
- Border opacity: `border-white/5`, `border-white/10` for subtle borders
- Text opacity: `text-white/40`, `text-white/60` for muted text

### File Organization

- Keep widget components in `components/Widgets.tsx`
- Add new base UI primitives to `components/BaseUI.tsx`
- Service integrations go in `services/`
- Shared types in `types.ts`
- Constants and configuration in `constants.ts`

## Key Files Reference

### `App.tsx`
Main chat interface with:
- Message state management
- `handleSend()` for sending messages to Gemini
- `handleAction()` for widget interaction callbacks
- Responsive sidebar toggle
- Voice recording (simulated)
- Image attachment handling

### `services/geminiService.ts`
- `generateContent(prompt, attachments)`: Main API call function
- Handles image-to-base64 conversion for multimodal input
- Returns `GeminiResponse` with text, agent, and optional payload
- Falls back to mock responses without API key

### `components/Widgets.tsx`
- Individual widget components (WorkoutCard, MealPlan, etc.)
- `A2UIMediator`: Central switch that renders widgets based on payload type

### `constants.ts`
- `COLORS`: Agent and UI color palette
- `getAgentColor()`: Helper to get agent's theme color
- `SYSTEM_PROMPT`: Full system instructions for Gemini (in Spanish)

## Adding New Widgets

1. Define props interface in `Widgets.tsx`:
```typescript
interface NewWidgetProps {
  title: string;
  // ... other props
}
```

2. Create the widget component:
```typescript
export const NewWidget: React.FC<{ data: NewWidgetProps; onAction?: (id: string, payload: any) => void }> = ({ data, onAction }) => (
  <GlassCard borderColor={COLORS.nexus}>
    <AgentBadge name="NEXUS" color={COLORS.nexus} icon={Cpu} />
    {/* Widget content */}
  </GlassCard>
);
```

3. Add to `A2UIMediator` switch:
```typescript
case 'new-widget':
  return <NewWidget data={payload.props} onAction={onAction} />;
```

4. Add type to `WidgetPayload` union in `types.ts`

5. Document in `SYSTEM_PROMPT` in `constants.ts` for AI awareness

## Important Notes

- The system prompt is in Spanish, targeting Spanish-speaking users
- All AI responses are expected as pure JSON (no markdown code blocks)
- The app uses `esm.sh` for ES modules in development (via import maps)
- Voice recording is simulated (not connected to speech-to-text)
- Session management is mocked with static data

## Testing Considerations

- No test framework is currently configured
- Widget components can be tested in isolation
- Mock the `generateContent` function for testing chat flows
- Consider adding Vitest for unit testing

## Common Tasks

### Modifying AI System Prompt
Edit `SYSTEM_PROMPT` in `constants.ts`. The prompt defines:
- Agent personalities and switching rules
- Widget catalog with prop schemas
- Response format requirements

### Adding a New Agent
1. Add to `AgentType` union in `types.ts`
2. Add color entry in `COLORS` in `constants.ts`
3. Document in `SYSTEM_PROMPT`

### Changing Theme Colors
Edit `COLORS` object in `constants.ts`. Main colors:
- `bg`: Background (`#050505`)
- `card`: Card background with transparency
- `border`: Border with transparency
- Agent-specific colors (lowercase keys)
