import { describe, it, expect } from "vitest";
import {
  PHONE_REGEX,
  PHONE_INVALID_MESSAGE,
  isValidPhone,
  normalizePhone,
} from "../../../utils/phone.utils";

describe("PHONE_REGEX", () => {
  it("should match Madagascar 03 numbers", () => {
    expect(PHONE_REGEX.test("0341234567")).toBe(true);
    expect(PHONE_REGEX.test("0329876543")).toBe(true);
  });

  it("should reject invalid numbers", () => {
    expect(PHONE_REGEX.test("0241234567")).toBe(false);
    expect(PHONE_REGEX.test("034123456")).toBe(false);
    expect(PHONE_REGEX.test("03412345678")).toBe(false);
    expect(PHONE_REGEX.test("")).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("should strip spaces", () => {
    expect(normalizePhone("034 12 345 67")).toBe("0341234567");
    expect(normalizePhone("0341234567")).toBe("0341234567");
  });
});

describe("isValidPhone", () => {
  it("should accept valid phones with or without spaces", () => {
    expect(isValidPhone("0341234567")).toBe(true);
    expect(isValidPhone("034 12 345 67")).toBe(true);
  });

  it("should reject empty/invalid values", () => {
    expect(isValidPhone(null)).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("0241234567")).toBe(false);
    expect(isValidPhone("abc")).toBe(false);
  });
});

describe("PHONE_INVALID_MESSAGE", () => {
  it("should mention the expected format", () => {
    expect(PHONE_INVALID_MESSAGE).toContain("03XXXXXXXX");
  });
});
