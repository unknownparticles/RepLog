export function pagesBase(env = process.env) {
  const repository = env.GITHUB_REPOSITORY?.split('/')[1];
  const value = env.PAGES_BASE_PATH || (env.GITHUB_ACTIONS && repository && !repository.endsWith('.github.io') ? `/${repository}/` : '/');
  if (!value.startsWith('/') || !value.endsWith('/') || value.includes('..') || value.includes('?') || value.includes('#')) {
    throw new Error('部署路径必须以斜线开头和结尾，且不能包含相对跳转、查询或锚点');
  }
  return value;
}
