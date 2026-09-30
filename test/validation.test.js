import assert from "node:assert/strict";
import test from "node:test";
import {
  loginSchema,
  registerSchema,
} from "../src/controller/auth.controller.js";
import {
  commentSchema,
  createIncidentSchema,
  updateIncidentSchema,
} from "../src/controller/incident.controller.js";
import {
  addMemberSchema,
  changeRoleSchema,
  createWorkspaceSchema,
} from "../src/controller/worspace.controller.js";

test("auth schemas normalize email and reject invalid credentials", () => {
  const registered = registerSchema.parse({
    name: "Ada",
    email: " ADA@EXAMPLE.COM ",
    password: "a-strong-password",
  });

  assert.equal(registered.email, "ada@example.com");
  assert.throws(() => loginSchema.parse({ email: "not-an-email", password: "x" }));
});

test("incident schemas accept only valid create and update payloads", () => {
  const incident = createIncidentSchema.parse({
    body: { title: "Database latency", description: "P99 is elevated" },
    params: { workspaceId: "550e8400-e29b-41d4-a716-446655440000" },
  });

  assert.equal(incident.body.title, "Database latency");
  assert.throws(() => updateIncidentSchema.parse({}));
  assert.equal(updateIncidentSchema.parse({ priority: "HIGH" }).priority, "HIGH");
  assert.throws(() => commentSchema.parse({ body: "   " }));
});

test("workspace schemas reject malformed input", () => {
  assert.equal(createWorkspaceSchema.parse({ name: "Operations" }).name, "Operations");
  assert.equal(addMemberSchema.parse({ email: "MEMBER@example.com" }).email, "member@example.com");
  assert.equal(changeRoleSchema.parse({ role: "VIEWER" }).role, "VIEWER");
  assert.throws(() => changeRoleSchema.parse({ role: "SUPERADMIN" }));
});
