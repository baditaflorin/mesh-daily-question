import { useMemo, useState, type FocusEvent } from "react";
import {
  MeshButton,
  MeshBottomBar,
  MeshCluster,
  MeshNameInput,
  MeshPresence,
  MeshStatusPill,
  MeshSurface,
  useNamedPeer,
  usePerPeerValue,
  useReactions,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

const PROMPTS = [
  "What tiny thing made today better?",
  "What would you happily teach a stranger in ten minutes?",
  "Which place do you want to remember exactly as it is?",
  "What are you quietly looking forward to?",
  "What is one useful rule you learned the hard way?",
  "What deserves more of your attention this week?",
  "Which ordinary ritual makes you feel most like yourself?",
];

export type DailyAnswer = { text: string; anonymous: boolean; submittedAt: number };
const EMPTY_ANSWER: DailyAnswer | null = null;

export function promptForDate(date = new Date()): string {
  const day = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
  return PROMPTS[day % PROMPTS.length] ?? PROMPTS[0] ?? "What is on your mind today?";
}

export function reflectionDateLabel(date = new Date()): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function isValidAnswer(value: unknown): value is DailyAnswer {
  if (!value || typeof value !== "object") return false;
  const answer = value as Record<string, unknown>;
  return (
    typeof answer.text === "string" &&
    answer.text.trim().length > 0 &&
    answer.text.length <= 280 &&
    typeof answer.anonymous === "boolean" &&
    typeof answer.submittedAt === "number" &&
    Number.isFinite(answer.submittedAt) &&
    answer.submittedAt > 0
  );
}

function displayName(
  peerId: string,
  answer: DailyAnswer,
  nameOf: (id: string) => string | undefined,
) {
  return answer.anonymous ? "Anonymous" : nameOf(peerId) || `Peer ${peerId.slice(0, 5)}`;
}

export function Feature({ room, config }: Props) {
  const named = useNamedPeer(config, room);
  const answers = usePerPeerValue<DailyAnswer | null>(
    room,
    "mesh-daily-question:answers",
    EMPTY_ANSWER,
  );
  const reactions = useReactions(room, "mesh-daily-question:reactions");
  const [draft, setDraft] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [today] = useState(() => new Date());
  const prompt = promptForDate(today);
  const dateLabel = reflectionDateLabel(today);
  const mine = isValidAnswer(answers.my) ? answers.my : null;
  const visibleAnswers = useMemo(
    () =>
      answers.entries
        .filter((entry): entry is [string, DailyAnswer] => isValidAnswer(entry[1]))
        .sort((a, b) => a[1].submittedAt - b[1].submittedAt),
    [answers.entries],
  );
  const canSubmit = Boolean(room) && !mine && draft.trim().length > 0 && draft.trim().length <= 280;

  function submit() {
    if (!canSubmit) return;
    answers.setMy({ text: draft.trim(), anonymous, submittedAt: Date.now() });
  }

  function keepFocusedFieldClear(event: FocusEvent<HTMLElement>) {
    const field = event.target;
    const isTextField = field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement;
    if (!isTextField || !window.matchMedia("(max-width: 720px)").matches) return;
    window.requestAnimationFrame(() => {
      field.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
    });
  }

  return (
    <main className="daily-page">
      <section className="daily-stage" aria-label="Today’s shared reflection">
        <MeshSurface
          as="section"
          tone="accent"
          padding="lg"
          className="daily-question-card"
          aria-labelledby="daily-question-heading"
        >
          <div className="daily-question-marker" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <MeshCluster className="daily-question-meta" justify="space-between">
            <p className="eyebrow">Today’s shared reflection</p>
            <MeshStatusPill tone={room ? "live" : "warning"} dot announce="polite">
              {room ? "Room open" : "Joining room"}
            </MeshStatusPill>
          </MeshCluster>
          <p className="daily-date">{dateLabel}</p>
          <h1 id="daily-question-heading" aria-live="polite">
            {prompt}
          </h1>
          <p className="daily-question-copy">
            One honest answer from each peer. Leave yours, then take in what the room is holding
            today.
          </p>
          <MeshPresence
            count={room?.peerCount ?? 0}
            label={room ? "peers in this room" : "peers joining"}
            state={room ? "connected" : "connecting"}
            announce="polite"
            className="daily-presence"
          />
        </MeshSurface>

        <MeshSurface
          as="section"
          tone="raised"
          padding="lg"
          className="daily-composer"
          aria-labelledby="answer-heading"
          onFocusCapture={keepFocusedFieldClear}
        >
          <div className="daily-composer-heading">
            <div>
              <p className="eyebrow">Your answer</p>
              <h2 id="answer-heading">
                {mine ? "Your reflection is here." : "Add your reflection."}
              </h2>
            </div>
            <span className="daily-once">One response</span>
          </div>
          {mine ? (
            <>
              <blockquote className="daily-submitted-answer">{mine.text}</blockquote>
              <p className="daily-composer-note" role="status">
                You have shared your answer for today. It remains with this room.
              </p>
            </>
          ) : (
            <>
              <MeshNameInput
                label="Your name"
                value={named.name}
                onChange={named.setName}
                placeholder="How should the room know you?"
                maxLength={32}
                showCounter
                hint="Optional. Your name is shown unless you post anonymously."
              />
              <label className="daily-response-label" htmlFor="answer">
                Your response
              </label>
              <textarea
                id="answer"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 280))}
                maxLength={280}
                rows={4}
                placeholder="Write the answer you would want to find later."
              />
              <div className="composer-footer">
                <label className="anonymous">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(event) => setAnonymous(event.target.checked)}
                  />{" "}
                  Post anonymously
                </label>
                <span aria-live="polite">{draft.length}/280</span>
              </div>
              <MeshButton
                fullWidth
                size="lg"
                className="daily-inline-submit"
                onClick={submit}
                disabled={!canSubmit}
              >
                Share today’s answer
              </MeshButton>
              <p className="daily-composer-note" role="status">
                Your answer is visible to everyone who has this room link.
              </p>
            </>
          )}
        </MeshSurface>
      </section>

      {!mine ? (
        <MeshBottomBar as="div" position="fixed" className="daily-mobile-action">
          <MeshButton fullWidth size="lg" onClick={submit} disabled={!canSubmit}>
            Share today’s answer
          </MeshButton>
        </MeshBottomBar>
      ) : null}

      <MeshSurface
        as="section"
        tone="base"
        padding="lg"
        className="daily-answers"
        aria-labelledby="answers-heading"
      >
        <div className="answers-heading">
          <div>
            <p className="eyebrow">The room</p>
            <h2 id="answers-heading">Shared reflections</h2>
          </div>
          <span>
            {visibleAnswers.length} {visibleAnswers.length === 1 ? "answer" : "answers"}
          </span>
        </div>
        {visibleAnswers.length ? (
          <ol>
            {visibleAnswers.map(([peerId, answer]) => {
              const hearted = reactions.myReactionsOn(peerId).has("heart");
              const count = reactions.countsFor(peerId).heart ?? 0;
              return (
                <li key={peerId}>
                  <article>
                    <p className="author">{displayName(peerId, answer, named.nameOf)}</p>
                    <p className="answer-text">{answer.text}</p>
                    <MeshButton
                      type="button"
                      variant={hearted ? "primary" : "secondary"}
                      size="sm"
                      className="appreciation"
                      onClick={() => reactions.toggle(peerId, "heart")}
                      aria-pressed={hearted}
                      aria-label={`${hearted ? "Remove" : "Add"} appreciation for this answer`}
                    >
                      Appreciate <span aria-hidden="true">{count}</span>
                    </MeshButton>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="empty">The room is waiting for its first answer.</p>
        )}
      </MeshSurface>
    </main>
  );
}
