// ============================================================
//  drive_logic.js — ICC Geometry Unit
//  邏輯：待學員寫入 ICC 幾何轉換演算法
// ============================================================
//
//  ICC (Instantaneous Center of Curvature) 核心公式：
//
//       R = (L / 2) * (V_L + V_R) / (V_L - V_R)
//
//  逆推：給定目標半徑 R 與基準速度 V：
//       V_L = V * (R + L/2) / R
//       V_R = V * (R - L/2) / R
//
// ============================================================

// ----------------------------------------------------------
//  物理參數 — 根據實車量測後修改
// ----------------------------------------------------------
const WHEELBASE_CM = 15.0;          // 輪距 L，單位：cm
const STRAIGHT_THRESHOLD_CM = 200;  // 超過此半徑視為直線行駛

// 馬達補償係數 (ICC Calibration Lab 後調整)
const LEFT_COMP  = 1.0;
const RIGHT_COMP = 1.0;

// ----------------------------------------------------------
//  Task 1 ── setSteering(R, V)
//  精準圓周控制：給定半徑與速度，輸出左右輪 PWM
// ----------------------------------------------------------

/**
 * 計算左右輪 PWM，使車體以半徑 R 轉彎。
 *
 * @param {number} radius_cm  目標半徑 (cm)。
 *                            > 0 向右轉；< 0 向左轉；
 *                            0 原地自轉；
 *                            |R| >= STRAIGHT_THRESHOLD_CM 直線行駛。
 * @param {number} baseSpeed  基準速度 (0–255 PWM)。
 * @returns {{ left: number, right: number }} 左右輪 PWM。
 */
function setSteering(radius_cm, baseSpeed) {
  let left, right;

  // ── 邊界條件 1：直線行駛 (|R| >= STRAIGHT_THRESHOLD_CM) ──
  if (Math.abs(radius_cm) >= STRAIGHT_THRESHOLD_CM) {
    left  = baseSpeed;
    right = baseSpeed;
    return {
      left:  Math.round(Math.max(0, Math.min(255, left  * LEFT_COMP))),
      right: Math.round(Math.max(0, Math.min(255, right * RIGHT_COMP))),
    };

  // ── 邊界條件 2：原地自轉 (R === 0) ──────────────────────
  // 原地自轉需要反向驅動，保留有號 PWM，不套用 [0,255] 截斷
  } else if (radius_cm === 0) {
    left  = Math.round( baseSpeed * LEFT_COMP);
    right = Math.round(-baseSpeed * RIGHT_COMP);
    return { left, right };

  // ── 一般情況：ICC 逆向幾何運算 ───────────────────────────
  } else {
    //  V_L = V * (R + L/2) / R
    //  V_R = V * (R - L/2) / R
    const halfL = WHEELBASE_CM / 2;
    left  = baseSpeed * (radius_cm + halfL) / radius_cm;
    right = baseSpeed * (radius_cm - halfL) / radius_cm;
    return {
      left:  Math.round(Math.max(0, Math.min(255, left  * LEFT_COMP))),
      right: Math.round(Math.max(0, Math.min(255, right * RIGHT_COMP))),
    };
  }
}

// ----------------------------------------------------------
//  Task 2 ── applyCompensation(left, right)
//  ICC 漂移補償：校正馬達硬體不對稱
// ----------------------------------------------------------

/**
 * 套用馬達補償係數，修正 ICC 漂移。
 *
 * @param {number} left   未補償的左輪 PWM。
 * @param {number} right  未補償的右輪 PWM。
 * @returns {{ left: number, right: number }}
 */
function applyCompensation(left, right) {
  // TODO (Task 2)：根據實測結果調整 LEFT_COMP / RIGHT_COMP
  return {
    left:  Math.round(left  * LEFT_COMP),
    right: Math.round(right * RIGHT_COMP),
  };
}

// ----------------------------------------------------------
//  Task 3 ── spiralUpdate(t, minR, maxR, baseSpeed)
//  變半徑螺旋線路徑規劃
// ----------------------------------------------------------

/**
 * 根據時間步 t 線性遞增轉彎半徑，模擬螺旋線路徑。
 * 當半徑超過閾值時平滑切換為直線。
 *
 * @param {number} t          時間步 (0, 1, 2, …)。
 * @param {number} minR_cm    起始半徑 (cm)，建議 20。
 * @param {number} maxR_cm    終止半徑 (cm)，建議 100。
 * @param {number} steps      從 minR 到 maxR 的總步數。
 * @param {number} baseSpeed  基準速度 (0–255 PWM)。
 * @returns {{ left: number, right: number, radius: number }}
 */
function spiralUpdate(t, minR_cm, maxR_cm, steps, baseSpeed) {
  // 1. 線性插值計算當前半徑 R(t)
  const alpha  = Math.min(t / steps, 1);           // 0 → 1
  let   radius = minR_cm + alpha * (maxR_cm - minR_cm);

  // 2. 超過閾值時平滑切換為直線行駛
  if (Math.abs(radius) >= STRAIGHT_THRESHOLD_CM) {
    radius = STRAIGHT_THRESHOLD_CM;                // 標記為直線
  }

  // 3. 呼叫 setSteering() 取得左右輪速
  const { left, right } = setSteering(radius, baseSpeed);

  // 4. 返回 { left, right, radius }
  return { left, right, radius };
}

// ----------------------------------------------------------
//  模組匯出
// ----------------------------------------------------------
module.exports = {
  setSteering,
  applyCompensation,
  spiralUpdate,
  WHEELBASE_CM,
  STRAIGHT_THRESHOLD_CM,
};
