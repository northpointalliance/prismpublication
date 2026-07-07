import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateSkylarReply } from "../src/chat.js";

describe("generateSkylarReply", () => {
  it("responds to planning questions with a concrete next step", () => {
    const reply = generateSkylarReply("How should I organize my week?");
    assert.match(reply, /week|plan|next step|focus/i);
  });

  it("returns a friendly fallback when the message is empty", () => {
    const reply = generateSkylarReply("");
    assert.match(reply, /hello|help|ready/i);
  });
});
