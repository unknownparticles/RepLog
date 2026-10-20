# RepLog

以日历串联训练与饮食的健身 PWA：每天吃了什么、练了什么，以及长期变化趋势。

当前交付为 **OpenSpec 设计方案**，尚未编写应用代码。默认中文、移动端优先、无需登录、本地离线存储，体重以千克、重量以千克、能量以千卡显示。

## 文档入口

- [功能提案](openspec/changes/design-fitness-pwa/proposal.md)：范围、首版交付、后续扩展。
- [技术与交互设计](openspec/changes/design-fitness-pwa/design.md)：页面、技术栈、数据模型、统计公式、离线策略。
- [实施任务](openspec/changes/design-fitness-pwa/tasks.md)：按依赖排序的待开发清单及验收方式。
- [开源参考](docs/references.md)：已核实的 GitHub 项目、参考点与许可证。

| 需求 | 对应行为规格 |
| --- | --- |
| 日历查看每天饮食和训练 | [日历与日详情](openspec/changes/design-fitness-pwa/specs/calendar-journal/spec.md) |
| 动作库、训练部位、器械 | [动作库](openspec/changes/design-fitness-pwa/specs/exercise-library/spec.md) |
| 训练动作、组数、重量、有氧 | [训练记录](openspec/changes/design-fitness-pwa/specs/workout-logging/spec.md) |
| 每日餐食、热量、营养素 | [饮食记录](openspec/changes/design-fitness-pwa/specs/nutrition-logging/spec.md) |
| 日、周、月、季度、年度分析与图表 | [多周期分析](openspec/changes/design-fitness-pwa/specs/period-analytics/spec.md) |
| 安装、离线、备份、恢复 | [应用与数据](openspec/changes/design-fitness-pwa/specs/pwa-data/spec.md) |

## 查看与校验

需要支持当前 OpenSpec CLI 的 Node.js 环境。

```sh
npx --yes @fission-ai/openspec@latest show design-fitness-pwa
npx --yes @fission-ai/openspec@latest validate design-fitness-pwa --strict --no-interactive
npx --yes @fission-ai/openspec@latest status --change design-fitness-pwa
```

`openspec/changes/design-fitness-pwa/` 保存本次待实施方案；`openspec/specs/` 暂留空，待开发完成并归档变更时形成正式能力基线。文档齐备不代表应用已经实现。
