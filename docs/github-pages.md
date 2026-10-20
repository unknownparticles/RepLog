# GitHub Pages 部署与版本

RepLog 是静态 PWA，个人记录保存在浏览器，不需要服务端或数据库服务。当前版本为 **0.5.0**，仓库为 [unknownparticles/RepLog](https://github.com/unknownparticles/RepLog)，Pages 地址为 [unknownparticles.github.io/RepLog](https://unknownparticles.github.io/RepLog/)。每次部署状态以 [Actions 记录](https://github.com/unknownparticles/RepLog/actions/workflows/pages.yml)为准。

## 本地运行

使用 Node.js 22 LTS（至少 22.12.0）或受支持的更高 LTS：

```sh
npm ci
npm run dev
```

开发服务会输出访问地址。开发模式不会注册生产离线缓存；验收离线行为时使用生产预览：

```sh
npm test
npm run build
npm run preview
```

## 发布到项目站点

1. 将仓库连接并推送到自己的 GitHub 仓库。
2. 在仓库 Settings → Pages → Build and deployment 中，将 Source 设为 **GitHub Actions**。
3. 推送主分支会运行检查和构建；在 Actions 中手动运行“构建与发布”工作流，或推送匹配版本的标签，即可发布。

当前版本标签示例，执行前应确保对应实现和测试已经提交：

```sh
git tag v0.5.0
git push origin v0.5.0
```

站点地址一般为 `https://用户名.github.io/RepLog/`，应用内地址形如 `https://用户名.github.io/RepLog/#/calendar`。仓库名不同会自动使用对应路径。无需配置 404 跳转文件，哈希路由能直接打开和刷新。

Actions 使用 Node.js 22、`npm ci`、版本校验、业务测试和生产构建，构建产物通过官方 Pages 工作流发布。实际发布只发生在手动触发或版本标签推送时；普通主分支提交只检查。

## 根站点或自定义域名

名为 `用户名.github.io` 的个人主页仓库默认使用 `/`。若将普通项目仓库绑定到自定义域名，在 Settings → Secrets and variables → Actions → Variables 添加 `PAGES_BASE_PATH`，值为 `/`；同时在 Pages 设置中配置域名与 HTTPS，再重新构建。

更换域名或路径会改变本地数据所在位置，迁移前请从旧地址导出备份，在新地址恢复。

## 本地验收仓库子路径

```sh
PAGES_BASE_PATH=/RepLog/ npm run build
PAGES_BASE_PATH=/RepLog/ npm run preview
```

访问预览地址下的 `/RepLog/`。图标、manifest、Service Worker 与所有静态资源都使用同一 base。本地数据库名称包含 base，避免同域不同项目互相影响。

浏览器自动验收需先安装对应 Chromium：

```sh
npx playwright install chromium
PAGES_BASE_PATH=/RepLog/ npm run test:e2e
```

必须让构建和验收使用相同路径。测试使用合成记录，截图及失败跟踪保存在被忽略的 `test-results/` 中。已有浏览器可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定。

## 版本规则

- `package.json` 的 `version` 是唯一应用版本来源，采用语义版本号。
- 关于页显示 `v版本号`、构建提交、构建时间、数据格式与数据库版本；导航、页脚与 JSON 备份同步使用相同应用版本。
- 新版本修改 `package.json` 和锁文件，更新 [CHANGELOG.md](../CHANGELOG.md)，完成检查并用纯中文提交信息提交，再创建 `v版本号` 标签。
- `npm run check:version` 在 GitHub 标签发布中核对标签与声明版本，不一致立即失败。
- 应用版本、数据库模式和备份格式各自演进；应用升级不自动清空业务库。

新资源缓存完成后，页面提示更新，由用户保存输入后主动刷新。版本构建产物全部为静态文件；保留旧构建时仍须考虑数据库模式兼容性，不能通过直接降级脚本覆盖新模式数据。

## 可选 AI 代理

本地计算无需代理。未来启用 AI 餐食草稿时，在仓库 Actions Variables 设置公开变量 `MEAL_AI_ENDPOINT` 为自建 HTTPS 代理地址，重新构建后生效。模型密钥只保存在代理端；不得放入 Pages 构建变量。当前未配置实际 AI 服务，详见 [AI 接入合同](meal-ai-integration.md)。
