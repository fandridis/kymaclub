import { describe, expect, it } from "vitest";
import { formatCredits } from "@repo/utils/credits";

describe("formatCredits", () => {
  it("returns singular label for one credit", () => {
    expect(formatCredits(1)).toBe("1 credit");
    expect(formatCredits(1.2)).toBe("1 credit");
  });

  it("returns plural label for zero and many credits", () => {
    expect(formatCredits(0)).toBe("0 credits");
    expect(formatCredits(2)).toBe("2 credits");
  });
});
