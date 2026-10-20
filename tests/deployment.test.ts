import { describe, expect, it } from 'vitest';
import { pagesBase } from '../scripts/build-context.mjs';
import { execFileSync } from 'node:child_process';
import pkg from '../package.json';
describe('GitHub Pages 路径', () => {
  it('本地与个人主页使用根路径，项目站点使用仓库路径', () => { expect(pagesBase({})).toBe('/'); expect(pagesBase({ GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'alun/RepLog' })).toBe('/RepLog/'); expect(pagesBase({ GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'alun/alun.github.io' })).toBe('/'); });
  it('允许自定义域名根路径，拒绝错误路径', () => { expect(pagesBase({ PAGES_BASE_PATH: '/', GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'alun/RepLog' })).toBe('/'); expect(() => pagesBase({ PAGES_BASE_PATH: '/RepLog' })).toThrow(); });
  it('发布标签必须匹配应用版本', () => {
    const check = (tag: string) => execFileSync(process.execPath, ['scripts/check-version.mjs'], { env: { ...process.env, GITHUB_REF_TYPE: 'tag', GITHUB_REF_NAME: tag }, stdio: 'pipe' });
    expect(() => check(`v${pkg.version}`)).not.toThrow(); expect(() => check('v999.0.0')).toThrow();
  });
});
