#pragma once

// ============================================================
//  kinematics_defs.h — ICC Geometry Unit
//  核心：定義機器人軸距與輪徑參數
// ============================================================
//
//  ICC (Instantaneous Center of Curvature) 幾何公式：
//
//       R = (L / 2) * (V_L + V_R) / (V_L - V_R)
//
//  逆向推導 — 給定目標半徑 R 與基準速度 V，求左右輪速：
//
//       V_L = V * (R + L/2) / R
//       V_R = V * (R - L/2) / R
//
// ============================================================

// ----------------------------------------------------------
//  物理參數 (Physical Parameters)
//  TODO: 根據你的實車量測結果校準以下數值
// ----------------------------------------------------------

/** 輪距 L (軸距)，單位：cm。左右輪接觸地面中心點之距離 */
constexpr float WHEELBASE_CM = 15.0f;

/** 輪徑，單位：cm */
constexpr float WHEEL_DIAMETER_CM = 6.5f;

/** 輪半徑，單位：cm */
constexpr float WHEEL_RADIUS_CM = WHEEL_DIAMETER_CM / 2.0f;

/** 直線行駛視為無窮大半徑的閾值，單位：cm */
constexpr float STRAIGHT_RADIUS_THRESHOLD_CM = 200.0f;

// ----------------------------------------------------------
//  馬達補償係數 (Motor Compensation Coefficients)
//  TODO: 透過 ICC Calibration Lab 實測後填入
// ----------------------------------------------------------

/** 左馬達出力補償係數 (預設 1.0 = 無補償) */
constexpr float LEFT_MOTOR_COMP  = 1.0f;

/** 右馬達出力補償係數 (預設 1.0 = 無補償) */
constexpr float RIGHT_MOTOR_COMP = 1.0f;

// ----------------------------------------------------------
//  介面宣告 (Interface Declaration)
// ----------------------------------------------------------

/**
 * @brief  給定目標轉彎半徑與基準速度，計算左右輪 PWM 指令。
 *
 * @param  radius_cm  目標 ICC 半徑，單位 cm。
 *                    正值 → 向右轉；負值 → 向左轉；
 *                    0   → 原地自轉；
 *                    超過 STRAIGHT_RADIUS_THRESHOLD_CM → 直線行駛。
 * @param  base_speed 基準速度 (0–255 PWM)。
 * @param  out_left   [out] 左輪 PWM 輸出。
 * @param  out_right  [out] 右輪 PWM 輸出。
 */
void setSteering(float radius_cm, int base_speed,
                 int &out_left, int &out_right);
