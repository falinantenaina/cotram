import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../../stores/useAuthStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it("should have null user and token by default", () => {
    const { user, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
  });

  it("should set auth with user and token", () => {
    const user = {
      id: "1",
      name: "Test User",
      email: "test@test.com",
      role: "user" as const,
      isEmailVerified: true,
    };
    useAuthStore.getState().setAuth(user, "test-token");

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe("test-token");
  });

  it("should clear auth", () => {
    const user = {
      id: "1",
      name: "Test User",
      email: "test@test.com",
      role: "user" as const,
      isEmailVerified: true,
    };
    useAuthStore.getState().setAuth(user, "test-token");
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it("should update user", () => {
    const user = {
      id: "1",
      name: "Test User",
      email: "test@test.com",
      role: "user" as const,
      isEmailVerified: true,
    };
    useAuthStore.getState().setAuth(user, "test-token");
    useAuthStore.getState().setUser({ ...user, name: "Updated Name" });

    expect(useAuthStore.getState().user?.name).toBe("Updated Name");
  });
});
