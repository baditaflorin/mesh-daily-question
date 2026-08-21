import { useMemo, useState } from "react";
import {
  MeshNameInput,
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
  return answer.anonymous ? "Anonymous peer" : nameOf(peerId) || `Peer ${peerId.slice(0, 5)}`;
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
  const prompt = useMemo(() => promptForDate(), []);
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

  return (
    <main className="daily-page">
      <header className="daily-hero">
        <p className="eyebrow">One room · one question · today only</p>
        <h1>Leave a small answer behind.</h1>
        <p className="prompt" aria-live="polite">
          {prompt}
        </p>
        <p className="connection" role="status">
          {room
            ? `Connected with ${room.peerCount} peer${room.peerCount === 1 ? "" : "s"}`
            : "Connecting to the room…"}
        </p>
      </header>

      <section className="daily-grid" aria-label="Daily question">
        <section className="card composer" aria-labelledby="answer-heading">
          <p className="eyebrow">Your answer</p>
          <h2 id="answer-heading">{mine ? "Your answer is in the room" : "Make it count once"}</h2>
          {mine ? (
            <>
              <blockquote>{mine.text}</blockquote>
              <p className="submitted" role="status">
                Submitted once for this device. Daily answers cannot be edited or duplicated.
              </p>
            </>
          ) : (
            <>
              <MeshNameInput
                label="Your name"
                value={named.name}
                onChange={named.setName}
                placeholder="Optional display name"
                maxLength={32}
              />
              <label htmlFor="answer">Your response</label>
              <textarea
                id="answer"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 280))}
                maxLength={280}
                rows={5}
                placeholder="A few honest words…"
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
              <button className="primary" type="button" onClick={submit} disabled={!canSubmit}>
                Share today’s answer
              </button>
              <p className="submitted" role="status">
                Anonymous mode hides your display name in this board. Answers remain visible to
                everyone with this room link.
              </p>
            </>
          )}
        </section>

        <section className="card answers" aria-labelledby="answers-heading">
          <div className="answers-heading">
            <div>
              <p className="eyebrow">Room answers</p>
              <h2 id="answers-heading">{visibleAnswers.length} shared</h2>
            </div>
            <span>{visibleAnswers.length === 1 ? "one voice" : "many voices"}</span>
          </div>
          {visibleAnswers.length ? (
            <ol>
              {visibleAnswers.map(([peerId, answer]) => {
                const hearted = reactions.myReactionsOn(peerId).has("heart");
                const count = reactions.countsFor(peerId).heart ?? 0;
                return (
                  <li key={peerId}>
                    <article>
                      <p className="author">
                        {displayName(peerId, answer, named.nameOf)}
                        {answer.anonymous && <span>anonymous</span>}
                      </p>
                      <p className="answer-text">{answer.text}</p>
                      <button
                        type="button"
                        className="heart"
                        onClick={() => reactions.toggle(peerId, "heart")}
                        aria-pressed={hearted}
                        aria-label={`${hearted ? "Remove" : "Add"} appreciation for this answer`}
                      >
                        ♥ <span>{count}</span>
                      </button>
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="empty">No answer yet. The first thoughtful line changes the room.</p>
          )}
        </section>
      </section>
    </main>
  );
}
