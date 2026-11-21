# AI Compare

Send one prompt to Claude, GPT, Gemini, and a local Llama model, then read the replies side by side as they stream in.

**Compare** shows all four models at once and sends the same prompt to each. **Chat** keeps a single thread with the model you pick from the dropdown. Enter sends. Shift+Enter adds a line. Stop cuts off a reply while it is still streaming.

API keys stay on the server. The browser only talks to `/api/chat`.

## Stack

- [Next.js](https://nextjs.org/) App Router and React
- [Vercel AI SDK](https://ai-sdk.dev/) (`useChat` on the client, `streamText` on the server)
- Provider SDKs for Anthropic, OpenAI, and Google
- [Ollama](https://ollama.com/) through its OpenAI-compatible API
- Tailwind CSS

## Getting started

You need Node.js 20 or newer. Ollama is only required for the local Llama column.

```bash
npm install
cp .env.example .env
```

Fill in the keys you have. `.env` is gitignored. `.env.example` only has empty placeholders.

```bash
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
```

Restart the dev server after you change `.env`.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

A missing key does not stop the other models. That pane returns an error, and the rest keep streaming.

### Local model

Ollama does not use an API key. Install it, pull the model this app asks for, and leave it running:

```bash
ollama pull llama3.2:1b
ollama serve
```

The default base URL is `http://127.0.0.1:11434/v1`. That address is this machine, so the Llama column only works where Ollama is running.

## Models

| Model id | Shown as | Provider | Environment variable |
| --- | --- | --- | --- |
| `claude-sonnet-5-5` | Claude, Sonnet 5.5 | Anthropic | `ANTHROPIC_API_KEY` |
| `gpt-4.1-mini` | OpenAI, GPT-4.1 mini | OpenAI | `OPENAI_API_KEY` |
| `gemini-3.6-flash` | Gemini, 3.6 Flash | Google | `GEMINI_API_KEY` |
| `llama3.2:1b` | Ollama, Llama 3.2 1B | Local | `OLLAMA_BASE_URL` |

To add or swap a model, edit `src/lib/models.ts`, then handle that id in `src/lib/language-model.ts`.

## How a message moves

1. Each pane uses `useChat` and posts `{ messages, model }` to `/api/chat`.
2. The route checks the body, picks a provider in `getLanguageModel`, and calls `streamText`.
3. Replies are capped at 1024 output tokens and stream back to that pane.
4. In Compare, the same text is sent to all four panes in parallel. Each pane keeps its own history.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
