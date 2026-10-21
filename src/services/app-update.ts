// update() 只完成版本检查；新资源可能仍在安装，需要等到安装完成再提示更新。
export async function checkForAppUpdate(registration: ServiceWorkerRegistration): Promise<boolean> {
  if (registration.waiting) return true;
  if (!registration.active) throw new Error('离线资源正在准备，请稍后重试。');

  return new Promise((resolve, reject) => {
    let worker: ServiceWorker | null = null;
    let finished = false;
    const finish = (available: boolean, error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      worker?.removeEventListener('statechange', inspect);
      if (error) reject(error);
      else resolve(available);
    };
    const inspect = () => {
      if (worker?.state === 'installed' || registration.waiting) finish(true);
      else if (worker?.state === 'redundant') finish(false, new Error('新版本下载失败，请检查网络后重试。'));
    };
    const timer = setTimeout(() => finish(false, new Error('检查更新超时，请稍后重试。')), 60_000);
    void registration.update().then(() => {
      if (finished) return;
      if (registration.waiting) finish(true);
      else if (registration.installing) {
        worker = registration.installing;
        worker.addEventListener('statechange', inspect);
        inspect();
      } else finish(false);
    }, () => finish(false, new Error('检查更新失败，请检查网络后重试。')));
  });
}

export type UpdateStatus = 'idle' | 'checking' | 'latest' | 'error';
