# 首次发布验证

版本：0.5.0。日期：2026 年 10 月 20 日。

## 本地验证

- 46 个业务、接口与组件测试通过，覆盖计算公式、营养快照、事务回滚、AI 请求约束及确认入账。
- 11 个浏览器流程通过，覆盖训练/餐食记录、目标保存、备份恢复、手机布局、线条缩略图、视频播放、缓存校验及离线重开。
- TypeScript 类型检查、GitHub Pages 子路径生产构建、版本一致性及 OpenSpec 严格校验通过。
- AI 默认关闭；未配置模型服务，构建不包含模型密钥。公开素材保留来源及 CC BY-SA 署名。

测试使用合成数据。iOS/Android 真机安装、浏览器系统存储回收、大数据性能及真实模型质量仍按任务清单继续验收。

## 发布位置

- [仓库](https://github.com/unknownparticles/RepLog)
- [站点](https://alunapp.cn/RepLog/)
- [构建与发布](https://github.com/unknownparticles/RepLog/actions/workflows/pages.yml)

发布工作流使用 Node.js 22，通过 npm ci、业务测试、版本校验及生产构建后部署。线上版本、构建提交及构建时间可在站点设置页的关于区域核对。

初次推送的线上 Node.js 22 检查已通过。Pages 使用账号既有自定义域名，已启用 HTTPS；发布环境允许 master 分支和 v* 版本标签。默认 GitHub Pages 地址会跳转到上述正式站点。
