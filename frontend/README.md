<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Genesis Chat Frontend

React + Vite UI for NGX GENESIS. The frontend calls the FastAPI backend (`/api/chat`) which runs the multi-agent ADK/Gemini flow and returns A2UI widgets.

## Run Locally

**Prerequisites:** Node.js and the backend running on `http://localhost:8000`.

1. Install dependencies:
   `npm install`
2. (Optional) set a custom backend URL in `.env.local`:
   `VITE_API_URL=http://localhost:8000`
3. Run the app:
   `npm run dev`

Open `http://localhost:3000`.

## Features

- **Backend Health Indicator**: Shows real-time connection status (online/offline/checking)
- **Image Attachments**: Send images to agents via base64 (max 5MB per image)
- **Dynamic Agent Theming**: Widgets automatically adopt the responding agent's color scheme

## Notes

- Image attachments are sent to the backend as base64 payloads.
- Backend setup and environment variables live in the repo root README.
- The app polls `/health` every 15 seconds to show backend status.
