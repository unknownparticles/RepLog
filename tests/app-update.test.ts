import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkForAppUpdate } from '../src/services/app-update';

function fixture() {
  const worker = Object.assign(new EventTarget(), { state: 'installing' as ServiceWorkerState });
  const registration = { active: {}, waiting: null, installing: null, update: vi.fn().mockResolvedValue(undefined) };
  return { worker, registration, check: () => checkForAppUpdate(registration as unknown as ServiceWorkerRegistration) };
}

afterEach(() => vi.useRealTimers());

describe('手动检查应用更新', () => {
  it('没有新版本时返回最新状态，并请求浏览器检查部署', async () => {
    const { registration, check } = fixture();
    await expect(check()).resolves.toBe(false);
    expect(registration.update).toHaveBeenCalledOnce();
  });

  it('已有待更新版本时直接提供更新，不受网络检查失败影响', async () => {
    const { registration, worker, check } = fixture();
    Object.assign(registration, { waiting: worker });
    await expect(check()).resolves.toBe(true);
    expect(registration.update).not.toHaveBeenCalled();
  });

  it('首次离线资源尚未就绪时不误报最新版本', async () => {
    const { registration, check } = fixture();
    Object.assign(registration, { active: null });
    await expect(check()).rejects.toThrow('正在准备');
    expect(registration.update).not.toHaveBeenCalled();
  });

  it('等待新资源安装完成，且检查不会主动激活或刷新', async () => {
    const { registration, worker, check } = fixture();
    Object.assign(registration, { installing: worker });
    const remove = vi.spyOn(worker, 'removeEventListener');
    let settled = false;
    const result = check().then(value => { settled = true; return value; });
    await Promise.resolve();
    expect(settled).toBe(false);
    worker.state = 'installed'; worker.dispatchEvent(new Event('statechange'));
    await expect(result).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith('statechange', expect.any(Function));
  });

  it('检查返回时已有等待版本，立即识别为可更新', async () => {
    const { registration, worker, check } = fixture();
    registration.update.mockImplementation(async () => { Object.assign(registration, { waiting: worker }); });
    await expect(check()).resolves.toBe(true);
  });

  it('新版本安装失败时提示重试', async () => {
    const { registration, worker, check } = fixture();
    Object.assign(registration, { installing: worker });
    const result = check();
    const assertion = expect(result).rejects.toThrow('下载失败');
    await Promise.resolve();
    worker.state = 'redundant'; worker.dispatchEvent(new Event('statechange'));
    await assertion;
  });

  it('网络检查失败后可以重试', async () => {
    const { registration, check } = fixture();
    registration.update.mockRejectedValueOnce(new Error('network'));
    await expect(check()).rejects.toThrow('检查更新失败');
    await expect(check()).resolves.toBe(false);
  });

  it('网络检查或安装停滞时超时，并清理安装监听', async () => {
    vi.useFakeTimers();
    for (const stalledInstall of [false, true]) {
      const { registration, worker, check } = fixture();
      const remove = vi.spyOn(worker, 'removeEventListener');
      if (stalledInstall) Object.assign(registration, { installing: worker });
      else registration.update.mockReturnValue(new Promise(() => {}));
      const assertion = expect(check()).rejects.toThrow('超时');
      await vi.advanceTimersByTimeAsync(60_000);
      await assertion;
      if (stalledInstall) expect(remove).toHaveBeenCalledWith('statechange', expect.any(Function));
    }
  });
});
