import { describe, expect, it } from "vitest";
import { totpCode, verifyTotp } from "@/lib/totp";

// Vecteur de test RFC 6238 (SHA-1, secret "12345678901234567890").
const RFC_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("TOTP", () => {
  it("respecte les vecteurs de la RFC 6238", () => {
    expect(totpCode(RFC_SECRET, Math.floor(59 / 30))).toBe("287082");
    expect(totpCode(RFC_SECRET, Math.floor(1111111109 / 30))).toBe("081804");
    expect(totpCode(RFC_SECRET, Math.floor(1234567890 / 30))).toBe("005924");
  });
  it("accepte un décalage d'une période et refuse au-delà", () => {
    const now = 1_800_000_000_000;
    const code = totpCode(RFC_SECRET, Math.floor(now / 30_000) - 1);
    expect(verifyTotp(RFC_SECRET, code, now)).toBe(true);
    const old = totpCode(RFC_SECRET, Math.floor(now / 30_000) - 3);
    expect(verifyTotp(RFC_SECRET, old, now)).toBe(false);
    expect(verifyTotp(RFC_SECRET, "abc", now)).toBe(false);
  });
});
