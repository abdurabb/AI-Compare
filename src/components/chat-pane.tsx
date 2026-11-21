"use client";

import { useChat } from "@ai-sdk/react";
import type { ChatStatus, UIMessage } from "ai";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { ModelSelect } from "@/components/model-select";
import { getModel, type ModelId } from "@/lib/models";

export type ChatPaneHandle = {
  send: (text: string) => Promise<void>;
  stop: () => Promise<void>;
};

type ChatPaneProps = {
  paneId: string;
  title: string;
  modelId: ModelId;
  hidden?: boolean;
  className?: string;
  onModelChange?: (modelId: ModelId) => void;
  onStatusChange: (status: ChatStatus) => void;
};

const statusLabel: Record<ChatStatus, string> = {
  ready: "Ready",
  submitted: "Sending",
  streaming: "Streaming",
  error: "Error",
};

function messageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export const ChatPane = forwardRef<ChatPaneHandle, ChatPaneProps>(
  function ChatPane(
    {
      paneId,
      title,
      modelId,
      hidden = false,
      className = "",
      onModelChange,
      onStatusChange,
    },
    ref,
  ) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const onStatusChangeRef = useRef(onStatusChange);
    onStatusChangeRef.current = onStatusChange;
    const model = getModel(modelId);
    const { messages, sendMessage, status, stop, error, setMessages, clearError } =
      useChat({ id: paneId });

    useImperativeHandle(
      ref,
      () => ({
        send: async (text: string) => {
          clearError();
          await sendMessage({ text }, { body: { model: modelId } });
        },
        stop,
      }),
      [clearError, modelId, sendMessage, stop],
    );

    useEffect(() => {
      onStatusChangeRef.current(status);
    }, [status]);

    useEffect(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      scroller.scrollTop = scroller.scrollHeight;
    }, [messages, status]);

    return (
      <section
        hidden={hidden}
        className={`${hidden ? "hidden" : "flex"} min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] ${className}`}
        style={{ borderTop: `3px solid ${model.swatch}` }}
      >
        <header className="flex flex-col gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: model.swatch }}
              />
              <h2 className="text-sm font-medium tracking-wide text-foreground">
                {title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">{statusLabel[status]}</span>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setMessages([]);
                }}
                className="rounded-md px-2 py-1 text-xs text-muted transition hover:bg-background hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
          {onModelChange ? (
            <ModelSelect
              id={`${paneId}-model`}
              value={modelId}
              onChange={onModelChange}
            />
          ) : null}
          <p className="text-xs text-muted">
            {model.provider} · {model.id}
          </p>
        </header>

        <div ref={scrollerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-40 items-center justify-center text-center">
              <p className="max-w-xs text-sm leading-6 text-muted">
                This thread is empty. Send a prompt and the reply will stream here.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const text = messageText(message);
              const isLast = index === messages.length - 1;
              const streaming =
                isLast && message.role === "assistant" && status === "streaming";

              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-foreground px-3 py-2 text-sm leading-6 text-panel">
                      {text}
                    </p>
                  </div>
                );
              }

              return (
                <div key={message.id} className="max-w-[95%]">
                  <p className="mb-1 text-xs font-medium" style={{ color: model.swatch }}>
                    {model.name}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {text}
                    {streaming ? (
                      <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-accent" />
                    ) : null}
                  </p>
                </div>
              );
            })
          )}

          {status === "submitted" ? (
            <p className="text-sm text-muted">Waiting for the stream…</p>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-background px-3 py-2 text-sm leading-6 text-accent">
              {error.message}
            </p>
          ) : null}
        </div>
      </section>
    );
  },
);
