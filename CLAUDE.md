# CLAUDE.md

## Token-saving rules (חיסכון בטוקנים)
- Answer briefly; no long summaries or repeating the code back.
- Read only the needed part of a file (offset/limit, grep first) — never whole large files.
- Don't read `package-lock.json`, `tsconfig.tsbuildinfo`, `.next/`, `node_modules/`.
- Make targeted edits (Edit), not full-file rewrites.
- Don't spawn sub-agents for small tasks; avoid unnecessary tool calls.
- Don't re-run builds/tests unless something changed.
- LLM API cost: chatbot (`src/lib/chatbot.ts`) is real-time → keep Haiku + prompt caching. Bulk/offline jobs (e.g. summarizing many leads) → use Batch API (Anthropic Message Batches / Gemini Batch) = 50% cheaper, results within 24h.

## Project
Next.js + Tailwind + Supabase CRM, deployed on Vercel. Code in `src/`, DB in `supabase/`.
