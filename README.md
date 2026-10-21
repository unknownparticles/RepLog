# RepLog

以日历串联训练与饮食的健身 PWA：每天吃了什么、练了什么，以及长期变化趋势。

当前版本 **v0.6.0**，提供日历、训练、饮食、分析和设置页面。默认中文、移动端优先、无需登录，数据保存在当前浏览器。关于页显示应用版本与构建信息。全部规格验收进度见实施任务。

[GitHub 仓库](https://github.com/unknownparticles/RepLog) · [在线使用](https://alunapp.cn/RepLog/) · [构建与发布记录](https://github.com/unknownparticles/RepLog/actions/workflows/pages.yml)

界面参考 shadcn/ui，使用 Radix UI 提供弹窗和筛选交互。内置 **84 个动作、30 类器械**，支持中英文搜索、辅助肌群筛选、现有器械匹配及个人动作维护。

其中 **29 个动作提供真人视频示范**，支持循环、慢放和按需保存供离线使用。[素材与离线说明](docs/exercise-media.md)包含对应范围、作者署名和授权信息。

全部 **84 个内置动作具有 SVG 线条缩略图**，可切换动态图/静态图，支持减少动态效果及离线显示。详见 [线条缩略图说明](docs/exercise-thumbnails.md)。

新增 [热量计算](docs/calorie-calculator.md)：食物按克重、kJ/kcal 或三大营养素换算，每日需求与运动消耗估算。已核对 wger 的公式实现和测试，支持离线使用。另预留 [AI 餐食接口](docs/meal-ai-integration.md)，默认关闭，配置代理后可生成待确认草稿。

新增 [健身食谱](docs/fitness-recipes.md)：从开源 HowToCook 精选改编 8 道中文食谱，支持食材搜索、蛋白质/时间/蛋奶素筛选、按份量查看食材和营养估算，确认后计入指定日期的饮食。食谱、做法与估算均可离线使用。

新增 [健身食物与健康组合餐](docs/healthy-meals.md)：39 种蔬果、肉蛋鱼虾等通用参考食物，蛋白粉/增肌粉按标签登记。支持从已登记食物搭配、保存常用组合，以及用文字匹配已登记食物和克重；未知或歧义项需要确认，确认后计入饮食。

## 运行与部署

使用 Node.js 22 LTS（至少 22.12.0）或受支持的更高 LTS。

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

生产版本支持离线使用；开发服务用于开发预览。部署目标为 **GitHub Pages**，使用哈希路由，自动适配项目仓库子路径。详细操作见 [Pages 部署与版本规则](docs/github-pages.md)，发布内容见 [版本记录](CHANGELOG.md)。

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
| 简易热量计算与 AI 接口预留 | [热量工具](openspec/changes/design-fitness-pwa/specs/calorie-tools/spec.md) |
| 日、周、月、季度、年度分析与图表 | [多周期分析](openspec/changes/design-fitness-pwa/specs/period-analytics/spec.md) |
| 安装、离线、备份、恢复 | [应用与数据](openspec/changes/design-fitness-pwa/specs/pwa-data/spec.md) |

## 查看与校验

需要支持当前 OpenSpec CLI 的 Node.js 环境。

```sh
npx --yes @fission-ai/openspec@latest show design-fitness-pwa
npx --yes @fission-ai/openspec@latest validate design-fitness-pwa --strict --no-interactive
npx --yes @fission-ai/openspec@latest status --change design-fitness-pwa
```

`openspec/changes/design-fitness-pwa/` 保存本次方案及实施进度；`openspec/specs/` 暂留空，待全部首版验收完成并归档变更时形成正式能力基线。任务仅在对应实现及验证完成后勾选。
