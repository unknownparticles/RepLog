export function meta(id: string = crypto.randomUUID()) { const now = new Date().toISOString(); return { id, createdAt: now, updatedAt: now, revision: 1 }; }
