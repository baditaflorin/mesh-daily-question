import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature, isValidAnswer, promptForDate, reflectionDateLabel } from "../../src/Feature";
import { config } from "../../src/config";

describe("daily question", () => {
  it("opts into the human-named gather shell", () => {
    expect(config.displayName).toBe("Daily Question");
    expect(config.visualProfile).toBe("gather");
    expect(config.shellLayout).toBe("inset");
  });
  it("rotates a deterministic UTC prompt", () => {
    expect(promptForDate(new Date("2026-01-02T12:00:00Z"))).toBe(
      promptForDate(new Date("2026-01-02T23:00:00Z")),
    );
  });
  it("uses the same UTC calendar for the visible reflection date", () => {
    expect(reflectionDateLabel(new Date("2026-01-02T00:01:00Z"))).toBe(
      reflectionDateLabel(new Date("2026-01-02T23:59:00Z")),
    );
  });
  it("accepts bounded, complete answers only", () => {
    expect(isValidAnswer({ text: "hello", anonymous: true, submittedAt: 1 })).toBe(true);
    expect(isValidAnswer({ text: "", anonymous: true, submittedAt: 1 })).toBe(false);
    expect(isValidAnswer({ text: "ok", anonymous: "yes", submittedAt: 1 })).toBe(false);
  });
  it("renders an accessible daily prompt", () => {
    render(<Feature room={createMockRoom()} config={config} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Today’s shared reflection")).toBeInTheDocument();
    expect(screen.getByLabelText("Your response")).toBeInTheDocument();
  });
});
