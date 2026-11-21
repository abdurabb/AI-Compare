"use client";

import type { ChatStatus } from "ai";
import { useCallback, useRef, useState } from "react";
import { ChatPane, type ChatPaneHandle } from "@/components/chat-pane";
import { models, type ModelId } from "@/lib/models";

type Mode = "chat" | "compare";

const compareIds = models.map((model) => model.id);

export function Studio() {
  const [mode, setMode] = useState<Mode>("compare");
  const [draft, setDraft] = useState("");
  const [singleModel, setSingleModel] = useState<ModelId>("claude-sonnet-5-5");
  const [statuses, setStatuses] = useState<Record<string, ChatStatus>>({
    single: "ready",
    ...Object.fromEntries(compareIds.map((id) => [id, "ready"])),
  });

  const singleRef = useRef<ChatPaneHandle>(null);
  const compareRefs = useRef<Partial<Record<ModelId, ChatPaneHandle>>>({});

  const reportStatus = useCallback((paneId: string, status: ChatStatus) => {
    setStatuses((current) =>
      current[paneId] === status ? current : { ...current, [paneId]: status },
    );
  }, []);

  const reportSingle = useCallback(
    (status: ChatStatus) => reportStatus("single", status),
    [reportStatus],
  );

  const activeIds = mode === "compare" ? compareIds : ["single"];
  const busy = activeIds.some(
    (id) => statuses[id] === "submitted" || statuses[id] === "streaming",
  );

  async function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    const panes =
      mode === "compare"
        ? compareIds.map((id) => compareRefs.current[id])
        : [singleRef.current];
    await Promise.all(panes.map((pane) => pane?.send(text)));
  }

  async function stopAll() {
    const panes =
      mode === "compare"
        ? compareIds.map((id) => compareRefs.current[id])
        : [singleRef.current];
    await Promise.all(panes.map((pane) => pane?.stop()));
  }

  return (
    <div className="flex h-dvh flex-col px-4 py-4 sm:px-6">
      <header className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">
            AI Compare
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Same prompt, side by side
          </h1>
        </div>
        <div
          className="inline-flex w-fit rounded-full border border-line bg-panel p-1"
          role="tablist"
          aria-label="View"
        >
          {(
            [
              ["chat", "Chat"],
              ["compare", "Compare"],
            ] as const
          ).map(([value, label]) => {
            const selected = mode === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMode(value)}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  selected
                    ? "bg-foreground text-panel"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      <div
        className={
          mode === "compare"
            ? "flex min-h-0 flex-1 gap-3 overflow-x-auto"
            : "mx-auto flex min-h-0 w-full max-w-3xl flex-1"
        }
      >
        <ChatPane
          ref={singleRef}
          paneId="single"
          title="Chat"
          modelId={singleModel}
          hidden={mode !== "chat"}
          className="w-full"
          onModelChange={setSingleModel}
          onStatusChange={reportSingle}
        />
        {models.map((model) => (
          <ChatPane
            key={model.id}
            ref={(handle) => {
              if (handle) compareRefs.current[model.id] = handle;
            }}
            paneId={model.id}
            title={model.name}
            modelId={model.id}
            hidden={mode !== "compare"}
            className="min-w-[260px] flex-1"
            onStatusChange={(status) => reportStatus(model.id, status)}
          />
        ))}
      </div>

      <form
        className={`mt-3 ${mode === "chat" ? "mx-auto w-full max-w-3xl" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="rounded-2xl border border-line bg-panel p-2 shadow-[0_10px_30px_rgba(26,23,20,0.05)]">
          <label htmlFor="prompt" className="sr-only">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={draft}
            rows={2}
            placeholder={
              mode === "compare"
                ? "Ask all four models the same thing"
                : "Ask the selected model"
            }
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted"
          />
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <p className="text-xs text-muted">
              Enter sends. Shift+Enter adds a line.
            </p>
            <div className="flex gap-2">
              {busy ? (
                <button
                  type="button"
                  onClick={() => void stopAll()}
                  className="rounded-full border border-line px-4 py-2 text-sm text-foreground transition hover:bg-background"
                >
                  Stop
                </button>
              ) : null}
              <button
                type="submit"
                disabled={busy || draft.trim().length === 0}
                className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
