import assert from "node:assert/strict";
import test from "node:test";
import { lotusEventSchema } from "./events.schema.js";

const baseEvent = {
  event_id: "99999999-9999-4999-8999-999999999999",
  event_type: "pedido_novo",
  occurred_at: "2026-08-11T17:00:00.000Z",
  message: "Novo pedido"
} as const;

test("accepts canonical Lotus and Sodex tenant contexts", () => {
  assert.equal(
    lotusEventSchema.safeParse({
      ...baseEvent,
      source: "lotus",
      tenant_id: "11111111-1111-4111-8111-111111111111"
    }).success,
    true
  );
  assert.equal(
    lotusEventSchema.safeParse({
      ...baseEvent,
      source: "sodex",
      tenant_id: "22222222-2222-4222-8222-222222222222"
    }).success,
    true
  );
});

test("rejects mismatched tenant contexts and internal metadata", () => {
  assert.equal(
    lotusEventSchema.safeParse({
      ...baseEvent,
      source: "sodex",
      tenant_id: "11111111-1111-4111-8111-111111111111"
    }).success,
    false
  );
  assert.equal(
    lotusEventSchema.safeParse({
      ...baseEvent,
      source: "lotus",
      tenant_id: "11111111-1111-4111-8111-111111111111",
      organization_id: "11111111-1111-4111-8111-111111111111"
    }).success,
    false
  );
});
