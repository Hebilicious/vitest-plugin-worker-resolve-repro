import { it } from "vitest";

it("runs inside workerd", ({ expect }) => {
  expect(navigator.userAgent).toBe("Cloudflare-Workers");
});
