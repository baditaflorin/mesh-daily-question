import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature, isValidAnswer, promptForDate } from "../../src/Feature";
import { config } from "../../src/config";

describe("daily question", () => {
  it("rotates a deterministic UTC prompt", () => {
    expect(promptForDate(new Date("2026-01-02T12:00:00Z"))).toBe(
      promptForDate(new Date("2026-01-02T23:00:00Z")),
    );
  });
  it("accepts bounded, complete answers only", () => {
    expect(isValidAnswer({ text: "hello", anonymous: true, submittedAt: 1 })).toBe(true);
    expect(isValidAnswer({ text: "", anonymous: true, submittedAt: 1 })).toBe(false);
    expect(isValidAnswer({ text: "ok", anonymous: "yes", submittedAt: 1 })).toBe(false);
  });
  it("renders an accessible daily prompt", () => {
    render(<Feature room={createMockRoom()} config={config} />);
    expect(
      screen.getByRole("heading", { name: "Leave a small answer behind." }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your response")).toBeInTheDocument();
  });
});
