import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { sanitizeInput, limiter, authLimiter, reservationLimiter } from "../../../middleware/security.middleware";

describe("sanitizeInput middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {}, query: {} };
    res = {};
    next = vi.fn();
  });

  it("should strip script tags from body strings", () => {
    req.body = {
      name: 'John <script>alert("xss")</script> Doe',
      email: "test@test.com",
    };
    sanitizeInput(req as Request, res as Response, next);
    expect(req.body.name).toBe('John  Doe');
    expect(req.body.email).toBe("test@test.com");
    expect(next).toHaveBeenCalled();
  });

  it("should strip script tags from query strings", () => {
    req.query = {
      search: '<script>alert("xss")</script>test',
    };
    sanitizeInput(req as Request, res as Response, next);
    expect(req.query.search).toBe("test");
  });

  it("should trim whitespace from body strings", () => {
    req.body = { name: "  John  " };
    sanitizeInput(req as Request, res as Response, next);
    expect(req.body.name).toBe("John");
  });

  it("should not modify non-string body values", () => {
    req.body = { count: 42, active: true };
    sanitizeInput(req as Request, res as Response, next);
    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
  });

  it("should handle null/undefined body gracefully", () => {
    req.body = null;
    sanitizeInput(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("rate limiters", () => {
  it("limiter should be defined", () => {
    expect(limiter).toBeDefined();
  });

  it("authLimiter should be defined", () => {
    expect(authLimiter).toBeDefined();
  });

  it("reservationLimiter should be defined", () => {
    expect(reservationLimiter).toBeDefined();
  });
});
