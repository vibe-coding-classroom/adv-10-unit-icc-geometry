// ============================================================
//  geometry.test.js — ICC Geometry Unit  (Vitest)
//  自動化：檢核幾何比例與邊界例外處理
// ============================================================

import { describe, it, expect } from "vitest";
import {
  setSteering,
  applyCompensation,
  spiralUpdate,
  WHEELBASE_CM,
  STRAIGHT_THRESHOLD_CM,
} from "../src/drive_logic.js";

// ────────────────────────────────────────────────────────────
//  輔助函式
// ────────────────────────────────────────────────────────────

/**
 * 從左右輪速推算實際 ICC 半徑
 *   R = (L/2) * (V_L + V_R) / (V_L - V_R)
 */
function computeRadius(left, right) {
  if (left === right) return Infinity;           // 直線行駛
  if (left === -right) return 0;                 // 原地自轉
  return (WHEELBASE_CM / 2) * (left + right) / (left - right);
}

// ────────────────────────────────────────────────────────────
//  Task 1：精準圓周控制 — 速比一致性 (Ratio Consistency)
// ────────────────────────────────────────────────────────────

describe("Task 1 — setSteering() 幾何一致性", () => {

  it("R=50, V=100 → 右轉，推算半徑誤差 < 1 cm", () => {
    const { left, right } = setSteering(50, 100);
    expect(left).toBeGreaterThan(right);          // 右轉時左輪較快
    const actual = computeRadius(left, right);
    expect(Math.abs(actual - 50)).toBeLessThan(1);
  });

  it("R=30, V=120 → 推算半徑誤差 < 1 cm", () => {
    const { left, right } = setSteering(30, 120);
    const actual = computeRadius(left, right);
    expect(Math.abs(actual - 30)).toBeLessThan(1);
  });

  it("R=-50, V=100 → 左轉，推算半徑誤差 < 1 cm", () => {
    const { left, right } = setSteering(-50, 100);
    expect(right).toBeGreaterThan(left);          // 左轉時右輪較快
    const actual = computeRadius(left, right);
    expect(Math.abs(actual + 50)).toBeLessThan(1);
  });

  it("PWM 輸出不超出 [0, 255] 範圍", () => {
    const cases = [
      [20, 200], [50, 100], [100, 80], [200, 60],
    ];
    for (const [r, v] of cases) {
      const { left, right } = setSteering(r, v);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(255);
      expect(right).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(255);
    }
  });
});

// ────────────────────────────────────────────────────────────
//  邊界條件 (Boundary Conditions)
// ────────────────────────────────────────────────────────────

describe("邊界條件 — 直線與自轉", () => {

  it("R=0 → 原地自轉：left === -right", () => {
    const { left, right } = setSteering(0, 100);
    expect(left).toBe(-right);
  });

  it(`|R| >= ${STRAIGHT_THRESHOLD_CM} → 直線行駛：left === right`, () => {
    const { left: l1, right: r1 } = setSteering(STRAIGHT_THRESHOLD_CM, 100);
    expect(l1).toBe(r1);

    const { left: l2, right: r2 } = setSteering(-STRAIGHT_THRESHOLD_CM, 100);
    expect(l2).toBe(r2);
  });

  it("不得拋出除以零錯誤", () => {
    expect(() => setSteering(0,   100)).not.toThrow();
    expect(() => setSteering(200, 100)).not.toThrow();
    expect(() => setSteering(-200, 100)).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────
//  Task 2：ICC 漂移補償
// ────────────────────────────────────────────────────────────

describe("Task 2 — applyCompensation() 補償係數", () => {

  it("補償後 PWM 仍在 [0, 255]", () => {
    const { left, right } = applyCompensation(100, 100);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left).toBeLessThanOrEqual(255);
    expect(right).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(255);
  });

  it("補償係數為 1.0 時輸出不變", () => {
    // 預設補償係數應為 1.0，輸入即輸出
    const { left, right } = applyCompensation(150, 130);
    // 允許 ±1 誤差（四捨五入）
    expect(Math.abs(left  - 150)).toBeLessThanOrEqual(1);
    expect(Math.abs(right - 130)).toBeLessThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────────────────
//  Task 3：螺旋線路徑 — 動態半徑遞增
// ────────────────────────────────────────────────────────────

describe("Task 3 — spiralUpdate() 螺旋路徑", () => {

  it("t=0 時半徑接近 minR", () => {
    const { radius } = spiralUpdate(0, 20, 100, 10, 100);
    expect(Math.abs(radius - 20)).toBeLessThan(5);
  });

  it("t=steps 時半徑接近 maxR 或觸發直線", () => {
    const { radius } = spiralUpdate(10, 20, 100, 10, 100);
    expect(radius).toBeGreaterThanOrEqual(95);
  });

  it("半徑超過閾值時回傳直線（left === right）", () => {
    const { left, right } = spiralUpdate(100, 20, 300, 10, 100);
    expect(left).toBe(right);
  });

  it("所有時間步 PWM 均不超出 [0, 255]", () => {
    for (let t = 0; t <= 20; t++) {
      const { left, right } = spiralUpdate(t, 20, 250, 20, 120);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(255);
      expect(right).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(255);
    }
  });
});
