import { describe, it, expect } from "vitest";
import { queryClient } from "../../../lib/queryClient";

describe("queryClient", () => {
  it("should be defined", () => {
    expect(queryClient).toBeDefined();
  });

  it("should have correct default staleTime", () => {
    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 5);
  });

  it("should have retry set to 1", () => {
    const defaultOptions = queryClient.getDefaultOptions();
    expect(defaultOptions.queries?.retry).toBe(1);
  });

  it("should have retryDelay function", () => {
    const defaultOptions = queryClient.getDefaultOptions();
    expect(typeof (defaultOptions.queries as any)?.retryDelay).toBe("function");
  });
});
