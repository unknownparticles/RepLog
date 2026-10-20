import { z } from 'zod';

const knownNutrition = z.number().finite().min(0).max(100).nullable();
export const mealEstimateRequestSchema = z.object({ schemaVersion: z.literal(1), requestId: z.string().uuid(), text: z.string().trim().min(1).max(2000), locale: z.literal('zh-CN') }).strict();
export const estimatedFoodSchema = z.object({
  name: z.string().trim().min(1).max(120), grams: z.number().finite().min(.1).max(10000).multipleOf(.1),
  energyPer100g: z.number().finite().min(0).max(1000),
  proteinPer100g: knownNutrition, carbsPer100g: knownNutrition, fatPer100g: knownNutrition,
  assumptions: z.array(z.string().max(300)).max(8),
}).strict().refine(food => (food.proteinPer100g || 0) + (food.carbsPer100g || 0) + (food.fatPer100g || 0) <= 100.5, '每百克已知三大营养素总量不合理');
export const mealEstimateResponseSchema = z.object({
  schemaVersion: z.literal(1), requestId: z.string().uuid(), provider: z.string().trim().min(1).max(100),
  items: z.array(estimatedFoodSchema).min(1).max(20), warnings: z.array(z.string().max(300)).max(10),
}).strict();
export type EstimatedFood = z.infer<typeof estimatedFoodSchema>;
export type MealEstimate = z.infer<typeof mealEstimateResponseSchema>;
export type MealEstimateRequest = z.infer<typeof mealEstimateRequestSchema>;
export interface MealEstimateProvider {
  readonly enabled: boolean;
  estimate(request: MealEstimateRequest, options: { consent: boolean; signal?: AbortSignal }): Promise<MealEstimate>;
}

function checkedEndpoint(endpoint: string) {
  const url = new URL(endpoint, location.origin);
  if (url.username || url.password || url.search || url.hash) throw new Error('AI 服务地址不能包含凭据、查询参数或锚点。');
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) throw new Error('AI 服务必须使用 HTTPS；本地开发可使用 localhost。');
  return url.href;
}

export function createMealEstimateProvider(endpoint = ''): MealEstimateProvider {
  if (!endpoint.trim()) return { enabled: false, async estimate() { throw new Error('AI 尚未配置，请继续使用手动记录或本地计算。'); } };
  return {
    enabled: true,
    async estimate(rawRequest, { consent, signal }) {
      if (!consent) throw new Error('请先确认发送当前餐食描述。');
      const request = mealEstimateRequestSchema.parse(rawRequest);
      const url = checkedEndpoint(endpoint);
      const controller = new AbortController();
      const abort = () => controller.abort();
      if (signal?.aborted) controller.abort();
      signal?.addEventListener('abort',abort,{once:true});
      const timer = setTimeout(abort,15000);
      try {
        const response = await fetch(url,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(request), credentials:'omit', referrerPolicy:'no-referrer', cache:'no-store', redirect:'error', signal:controller.signal });
        if (!response.ok) throw new Error(`AI 服务暂不可用（${response.status}），请稍后重试或手动记录。`);
        if (!response.headers.get('Content-Type')?.toLowerCase().includes('application/json')) throw new Error('AI 服务返回格式不符。');
        const reader = response.body?.getReader();
        if (!reader) throw new Error('AI 服务返回空内容。');
        let length = 0; const chunks: Uint8Array[] = [];
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          length += chunk.value.byteLength;
          if (length > 64 * 1024) { await reader.cancel(); throw new Error('AI 返回内容过大，请缩短餐食描述后重试。'); }
          chunks.push(chunk.value);
        }
        const buffer = new Uint8Array(length); let offset = 0;
        for (const chunk of chunks) { buffer.set(chunk,offset); offset += chunk.byteLength; }
        const parsed = mealEstimateResponseSchema.safeParse(JSON.parse(new TextDecoder().decode(buffer)));
        if (!parsed.success || parsed.data.requestId !== request.requestId) throw new Error('AI 结果未通过校验，请重试或手动记录。');
        return parsed.data;
      } catch (error) {
        if (controller.signal.aborted) throw new Error(signal?.aborted ? '已取消 AI 请求。' : 'AI 请求超时，请重试或手动记录。');
        throw error;
      } finally { clearTimeout(timer); signal?.removeEventListener('abort',abort); }
    },
  };
}
export function configuredMealAI() { return createMealEstimateProvider(import.meta.env.VITE_MEAL_AI_ENDPOINT || ''); }
