import { afterEach,describe,expect,it,vi } from 'vitest';
import { createMealEstimateProvider, mealEstimateRequestSchema, mealEstimateResponseSchema } from '../src/services/meal-ai';

const request=()=>({schemaVersion:1 as const,requestId:crypto.randomUUID(),text:'米饭150克',locale:'zh-CN' as const});
const response=(requestId:string)=>({schemaVersion:1,requestId,provider:'测试代理',items:[{name:'米饭',grams:150,energyPer100g:116,proteinPer100g:null,carbsPer100g:25,fatPer100g:null,assumptions:['按熟重估算']}],warnings:['烹饪方式未知']});
const json=(data:unknown)=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
describe('预留 AI 餐食接口',()=>{
  it('默认关闭，无用户许可时不发请求',async()=>{
    const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
    expect(createMealEstimateProvider().enabled).toBe(false);
    await expect(createMealEstimateProvider().estimate(request(),{consent:true})).rejects.toThrow('尚未配置');
    await expect(createMealEstimateProvider('https://example.com/estimate').estimate(request(),{consent:false})).rejects.toThrow('确认发送');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('只发送协议允许的当前文字，省略凭据并校验响应关联',async()=>{
    const input=request();const fetchMock=vi.fn().mockResolvedValue(json(response(input.requestId)));vi.stubGlobal('fetch',fetchMock);
    const result=await createMealEstimateProvider('https://example.com/estimate').estimate(input,{consent:true});
    expect(result.items[0].proteinPer100g).toBeNull();
    const [,options]=fetchMock.mock.calls[0];expect(JSON.parse(options.body)).toEqual(input);
    expect(options).toMatchObject({credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer'});
    fetchMock.mockResolvedValue(json(response(crypto.randomUUID())));
    await expect(createMealEstimateProvider('https://example.com/estimate').estimate(input,{consent:true})).rejects.toThrow('校验');
  });
  it('不接受 URL 密钥、非安全服务和额外档案字段',async()=>{
    const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
    for(const url of ['http://example.com/estimate','https://example.com/estimate?key=secret','https://user:secret@example.com/estimate']){
      await expect(createMealEstimateProvider(url).estimate(request(),{consent:true})).rejects.toThrow();
    }
    expect(mealEstimateRequestSchema.safeParse({...request(),profile:{weight:70}}).success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('拒绝非法数值、未知版本、巨大响应和非 JSON',async()=>{
    const input=request();const invalid=response(input.requestId);invalid.items[0].grams=-100;
    expect(mealEstimateResponseSchema.safeParse(invalid).success).toBe(false);
    const fetchMock=vi.fn().mockResolvedValue(json({...response(input.requestId),schemaVersion:2}));vi.stubGlobal('fetch',fetchMock);
    const provider=createMealEstimateProvider('https://example.com/estimate');
    await expect(provider.estimate(input,{consent:true})).rejects.toThrow('校验');
    fetchMock.mockResolvedValue(new Response('x'.repeat(65537),{headers:{'Content-Type':'application/json'}}));
    await expect(provider.estimate(input,{consent:true})).rejects.toThrow('过大');
    fetchMock.mockResolvedValue(new Response('<html>错误</html>',{headers:{'Content-Type':'text/html'}}));
    await expect(provider.estimate(input,{consent:true})).rejects.toThrow('格式');
  });
  it('超时会终止请求并给出可恢复提示',async()=>{
    vi.useFakeTimers();vi.stubGlobal('fetch',vi.fn((_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))));
    const pending=createMealEstimateProvider('https://example.com/estimate').estimate(request(),{consent:true});
    const checked=expect(pending).rejects.toThrow('超时');
    await vi.advanceTimersByTimeAsync(15001);await checked;
  });
});
