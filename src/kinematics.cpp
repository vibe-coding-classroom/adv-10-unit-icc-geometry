#include "kinematics_defs.h"
#include <cmath>
#include <algorithm>

/**
 * @brief  給定目標轉彎半徑與基準速度，計算左右輪 PWM 指令。
 * 
 * 實作 ICC (Instantaneous Center of Curvature) 逆向幾何運算。
 * 
 * @param  radius_cm  目標 ICC 半徑，單位 cm。
 *                    正值 -> 向右轉；負值 -> 向左轉；
 *                    0   -> 原地自轉；
 *                    超過 STRAIGHT_RADIUS_THRESHOLD_CM -> 直線行駛。
 * @param  base_speed 基準速度 (0–255 PWM)。
 * @param  out_left   [out] 左輪 PWM 輸出。
 * @param  out_right  [out] 右輪 PWM 輸出。
 */
void setSteering(float radius_cm, int base_speed,
                 int &out_left, int &out_right) {
    
    float left_pwm, right_pwm;

    // ── 邊界條件 1：直線行駛 (|R| >= STRAIGHT_RADIUS_THRESHOLD_CM) ──
    if (std::abs(radius_cm) >= STRAIGHT_RADIUS_THRESHOLD_CM) {
        left_pwm  = (float)base_speed;
        right_pwm = (float)base_speed;
    }
    // ── 邊界條件 2：原地自轉 (R === 0) ──────────────────────
    else if (radius_cm == 0.0f) {
        left_pwm  = (float)base_speed;
        right_pwm = -(float)base_speed;
        
        // 對於原地自轉，我們直接返回有號值，不進行 [0, 255] 截斷
        out_left  = (int)std::round(left_pwm  * LEFT_MOTOR_COMP);
        out_right = (int)std::round(right_pwm * RIGHT_MOTOR_COMP);
        return;
    }
    // ── 一般情況：ICC 逆向幾何運算 ───────────────────────────
    else {
        //  V_L = V * (R + L/2) / R
        //  V_R = V * (R - L/2) / R
        float halfL = WHEELBASE_CM / 2.0f;
        left_pwm  = (float)base_speed * (radius_cm + halfL) / radius_cm;
        right_pwm = (float)base_speed * (radius_cm - halfL) / radius_cm;
    }

    // 套用補償與範圍限制 [0, 255]
    float final_left  = left_pwm  * LEFT_MOTOR_COMP;
    float final_right = right_pwm * RIGHT_MOTOR_COMP;

    out_left  = (int)std::round(std::max(0.0f, std::min(255.0f, final_left)));
    out_right = (int)std::round(std::max(0.0f, std::min(255.0f, final_right)));
}
