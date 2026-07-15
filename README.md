<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/76e63937-0832-4019-a763-36d5cb8a3dea

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Open `.env` and choose provider:
   `AI_PROVIDER=local`, `AI_PROVIDER=gemini` or `AI_PROVIDER=openai`
3. Add the matching runtime/config:
   `GEMINI_API_KEY=...`, `OPENAI_API_KEY=...`, `GROQ_API_KEY=...`, or local model paths in `AI/`
   For chatbot priority, set `AI_CHAT_PROVIDER=openai`, `AI_CHAT_PROVIDER=groq`, or `AI_CHAT_PROVIDER=gemini`.
4. Run the app:
   `npm run dev`

## AI integration

- Chat and diagnosis now go through the Express server at `/api/ai/chat` and `/api/ai/diagnose`
- API keys stay on the server, not in the Vite frontend
- The chatbot can use OpenAI, Groq, and Gemini with automatic fallback, without changing React code
- Local diagnosis uses ONNX models via `python3 + onnxruntime`
- Tomato defaults to `AI/model.onnx` and `AI/tomato_onnx_class_names.json`
- Check runtime readiness at `/api/ai/status`

## Supabase

- Existing Supabase env names are still compatible:
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Legacy-style Next public names are also supported:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- Apply `supabase/community_forum.sql` and `supabase/diagnosis_history.sql` to enable forum + diagnosis history
