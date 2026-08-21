import { describe, it, expect } from "vitest";
import api from "../../../lib/axios";

describe("axios instance", () => {
  it("should have correct base URL", () => {
    expect(api.defaults.baseURL).toBe("/api");
  });

  it("should have timeout configured", () => {
    expect(api.defaults.timeout).toBe(30000);
  });

  it("should have JSON content type", () => {
    expect(api.defaults.headers["Content-Type"]).toBe("application/json");
  });
});
