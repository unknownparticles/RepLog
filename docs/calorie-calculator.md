# 热量计算与参考实现

入口为饮食页的“热量计算”、设置页的“估算目标”，或 `#/calories`。v0.5.0 提供三个离线工具与一个默认关闭的 AI 餐食适配接口。

## 可复查的开源参考

核实日期：2026 年 10 月 20 日。参考 [wger](https://github.com/wger-project/wger)，核对版本为 `b690e9b11642f60a45c74678ab8b923358211b04`。

| 参考位置 | 已核实行为 | 本项目采用方式 |
| --- | --- | --- |
| [core/models/profile.py](https://github.com/wger-project/wger/blob/b690e9b11642f60a45c74678ab8b923358211b04/wger/core/models/profile.py) 的 calculate_basal_metabolic_rate | Mifflin–St Jeor，男性 +5、女性 −161；另有按日时间分配的活动水平计算 | 独立实现同一公开公式；活动水平采用显式可选固定系数，不声称与 wger 的全天时间分配算法相同 |
| [nutrition/tests/test_calories_calculator.py](https://github.com/wger-project/wger/blob/b690e9b11642f60a45c74678ab8b923358211b04/wger/nutrition/tests/test_calories_calculator.py) | 男性、80 kg、180 cm、30 岁 → 1780 kcal/day，拒绝不合理输入 | 作为交叉验证样本，并补充女性系数、范围和非有限值测试 |
| [nutrition/consts.py](https://github.com/wger-project/wger/blob/b690e9b11642f60a45c74678ab8b923358211b04/wger/nutrition/consts.py) 和 [dataclasses.py](https://github.com/wger-project/wger/blob/b690e9b11642f60a45c74678ab8b923358211b04/wger/nutrition/dataclasses.py) | 蛋白质/碳水/脂肪每克 4/4/9 kcal；wger 还单独处理纤维和一致性校验 | 本项目基础工具只作三项估算，不强制覆盖食品标签，不假定纤维、糖醇和酒精为零 |
| [Waistline README](https://github.com/davidhealey/waistline/blob/master/README.md) | 按日饮食、本地食品库、按份量记录和备份 | 参考其轻量日志流程；不是本项目代谢公式的验证来源 |

wger 源码为 AGPL-3.0-or-later，Waistline 主要应用代码为 GPLv3。本项目没有复制这两个项目的源文件；公式和本地业务流程由本项目独立实现。若后续复制具体源码，应单独按对应许可处理。

## 食物热量

- 标签换算：`每百克 kcal × 食用克重 ÷ 100`。若标签为 kJ，先除以 `4.184` 转换为 kcal。
- 三大营养素估算：`蛋白质克数 × 4 + 碳水克数 × 4 + 脂肪克数 × 9`，输入均为每百克的已知量。三项必须填写，已知为零才填零。
- 食物库编辑也可显式点击“按三大营养素估算能量”，仅预填能量框；不自动覆盖已有标签或历史餐食。
- 食用克重必须为正，计算先保留精度、展示时再舍入。换算结果不自动计入摄入。

## 每日需求

[Mifflin–St Jeor 公式论文](https://pubmed.ncbi.nlm.nih.gov/2305711/)：

```text
静息能量估算（kcal/day）= 10 × 体重kg + 6.25 × 身高cm − 5 × 年龄 + 性别系数
男性系数 = +5；女性系数 = −161
每日维持热量估算 = 静息能量估算 × 活动系数
```

本工具范围：成人 18–100 岁、身高 120–230 cm、体重 30–350 kg。活动系数采用常见简化档位：久坐 1.2、轻度 1.375、中度 1.55、高度 1.725、很高 1.9。它们是粗略分类，不是个体实测或 wger 按小时计算的活动水平。

结果可以预填一个可修改的每日目标，用户选择生效日期并确认后保存。该日期已有目标时再确认修订；历史目标版本和营养素目标保留。编辑计算输入会撤销旧计算结果，避免将过时结果误保存。

## 运动消耗

```text
同时段总消耗估算 = MET × 3.5 × 体重kg ÷ 200 × 分钟
相较静息的增量估算 = (MET − 1) × 3.5 × 体重kg ÷ 200 × 分钟
```

MET 值由用户根据具体活动及强度填写，可参考 [Compendium of Physical Activities](https://pacompendium.com/)。工具范围为 1–25 MET、正时长且不超过一天。这里只提供计算方法，没有复制活动数据库或自动给所有训练指定一个 MET。

活动水平已包含运动，不能将 MET 结果再次直接叠加到每日维持热量。上述结果不自动改写训练或分析，不据此声称热量缺口或体脂变化。实际餐食与已确认目标继续使用原有统计口径。

## AI 扩展

前端保留服务提供者接口、版本化请求/响应、超时、取消、结果验证与人工确认入账。当前没有部署真实模型服务，默认不发送请求。配置方法与 JSON 合同见 [AI 接入说明](meal-ai-integration.md)。
