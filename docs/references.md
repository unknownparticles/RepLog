# 开源参考调研

手机布局与操作适配见[移动端适配](mobile-design.md)；新增设备、对应动作和悍马系列的官方参考见[器械目录](equipment-catalog.md)。

核实日期：2026 年 10 月 20 日。通过 GitHub 仓库元数据与当前默认分支 README 核对；以下为功能和架构参考，不是对其应用运行效果的实测结论。

| 项目 | 已核实能力 | RepLog 参考点 | 技术和复用边界 |
| --- | --- | --- | --- |
| [wger](https://github.com/wger-project/wger) | 训练计划、动作百科、营养管理、体重和 REST API | 动作与肌群/器械关联，训练、饮食和体重共同构成个人日志 | Django/Python、自托管、多用户；代码 AGPL-3.0-or-later，动作/食材数据按条目采用 Creative Commons，文档 CC-BY-SA-4.0 |
| [Workout.lol](https://github.com/workout-lol/workout-lol) | 根据可用器械和目标肌群创建训练 | 先选部位与器械，再选动作的轻量流程 | Web 应用，仓库含 MongoDB 导入说明；代码 MIT，第三方图片或动作数据仍须独立核对来源 |
| [Waistline](https://github.com/davidhealey/waistline) | 按日饮食日记、本地食物库、条码/在线食物检索、导入导出、体重追踪 | 本地优先食物库、餐次组织和可恢复备份 | Android/Cordova/Framework7，非现成 PWA；README 声明 www 内代码 GPLv3，其他目录含各自许可证 |

## 采用结论

RepLog 独立设计前端 PWA，借鉴以上项目的产品组织方式。首版提供内置中文动作种子和用户自建食物，不引入服务端运行依赖。选择本地优先是为了覆盖健身房网络不稳定和快速随手记录的场景。

- wger 的完整服务端适合未来多设备同步或教练场景，首版不以其 API 可用为前提。
- Workout.lol 的筛选方式适合动作选择器；首版自己编写动作说明，登记种子数据来源。
- Waistline 的食物库与备份流程适合日常记录；首版以手动输入为基础，后续再接在线条码库。

## 后续数据源

热量计算的源码位置、已核对版本和示例结果见 [热量计算参考](calorie-calculator.md)，重点参考 wger 的 Mifflin–St Jeor 实现及测试、每克营养能量因子。Waistline 作为本地食物日记与份量流程参考，不作为代谢公式来源。

[Open Food Facts](https://github.com/openfoodfacts/openfoodfacts-server) 可作为包装食品条码检索的后续候选。接入前需核对当时的 API、调用限制、数据库及图片许可，单独设计中文食品覆盖不足、未知营养项、网络失败和缓存策略。首版不依赖该数据源，也不承诺自动识别餐食热量。

## 可复查来源

### 界面组件与布局

- [shadcn/ui](https://github.com/shadcn-ui/ui)：MIT；参考中性色设计、紧凑数据列表、表单与筛选布局。未复制示例应用或整站模板。
- [Radix Primitives](https://github.com/radix-ui/primitives)：MIT；实际引入 Dialog、Toggle Group、Tooltip 包，处理模态语义、焦点约束、键盘筛选和提示。样式由 RepLog 自行定义。

通过项目默认分支 README 核对定位与许可。动作文字独立编写，视频素材另按条目核对授权。

- [wger README 与 License](https://github.com/wger-project/wger/blob/master/README.md#license)
- [Workout.lol README](https://github.com/workout-lol/workout-lol/blob/main/README.md) 与 [LICENSE](https://github.com/workout-lol/workout-lol/blob/main/LICENSE)
- [Waistline README 与 License](https://github.com/davidhealey/waistline/blob/master/README.md#license)

未复用上述项目源码或食物数据库。v0.3.0 使用逐项授权为 CC BY-SA 4.0 的 wger 视频及衍生海报，完整来源和修改说明见 [动作示范](exercise-media.md)。

## 健身食谱引入（2026 年 10 月 21 日）

实际采用 [Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook) 的八篇菜谱，固定提交 `0e106eea348c734fe1586f781202994439cf98a5`，授权为 Unlicense。不是专门的健身营养数据库，选取其中适用的早餐、蛋白配菜和蔬菜，明确改编克重、油盐及制作步骤；原文与逐文件校验保存在 `resources/recipes/`。实际运行内置本地结构化食谱，不需要调用上游接口。

同时检查了 MIT 项目 [Sosiggg/Fitness-Feast](https://github.com/Sosiggg/Fitness-Feast) 的食谱页面，其示例热量与营养展示有不一致，且包含站外素材，因此本次不采用其数据或素材。HowToCook 上游部分估算也不一致，本次统一按本地食材表重新计算。来源、估算范围与验收方法见 [健身食谱](fitness-recipes.md)。

## 健身搭配参考（2026 年 10 月 21 日）

- [NHS Eatwell Guide](https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/)：已核对蔬果、较高纤维主食、豆鱼蛋肉与奶类的搭配，以及少量植物油原则。用于组织食物分类和组合示例，不复制站点图片或食谱。
- [ISSN Position Stand: protein and exercise, 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/)：已核对一般运动人群蛋白质建议、食物来源与补剂的作用。没有把文中区间自动设置为所有人的目标，也没有据此虚构补剂热量。

四种健康组合由本项目自行编写，明确克重并仅匹配用户登记的食材。通用参考目录的营养为项目维护的估算，不是从以上文献导入的食物成分数据库；具体产品使用用户实际标签。详细匹配边界见 [健身食物与健康组合餐](healthy-meals.md)。
