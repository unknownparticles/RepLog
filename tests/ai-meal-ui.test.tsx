import React from 'react';
import { afterEach,beforeEach,expect,it } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppContext } from '../src/components/ui';
import { AiMealEstimate } from '../src/features/AiMealEstimate';
import { db,initialize,readSnapshot } from '../src/db/database';
import type { MealEstimateProvider } from '../src/services/meal-ai';

beforeEach(async()=>{await db.delete();await db.open();await initialize();});
afterEach(cleanup);
it('AI 草稿可检查修改，确认前不入库，确认后按修订份量保存',async()=>{
  const data=await readSnapshot();const errors:string[]=[];
  const provider:MealEstimateProvider={enabled:true,async estimate(request,options){
    expect(options.consent).toBe(true);expect(request.text).toBe('米饭一碗');
    return {schemaVersion:1,requestId:request.requestId,provider:'本地测试适配器',items:[{name:'米饭',grams:150,energyPer100g:116,proteinPer100g:null,carbsPer100g:25,fatPer100g:null,assumptions:['按熟重']}],warnings:['请确认碗的大小']};
  }};
  render(<MemoryRouter><AppContext.Provider value={{data,notify:()=>{},run:async(action)=>{try{await action();return true;}catch(error){errors.push(String(error));return false;}}}}><AiMealEstimate provider={provider}/></AppContext.Provider></MemoryRouter>);
  fireEvent.change(screen.getByRole('textbox',{name:/^餐食描述/}),{target:{value:'米饭一碗'}});
  fireEvent.click(screen.getByLabelText(/我同意将本次餐食描述/));
  fireEvent.click(screen.getByRole('button',{name:'生成待确认草稿'}));
  await screen.findByRole('heading',{name:'检查并修改结果'});
  expect((await readSnapshot()).meals).toHaveLength(0);
  fireEvent.change(screen.getByLabelText('食物 1 克重'),{target:{value:'200'}});
  expect(screen.getByRole('button',{name:'确认并保存餐食'})).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/我已检查食物/));
  expect(screen.getByRole('button',{name:'确认并保存餐食'})).toBeEnabled();
  fireEvent.click(screen.getByRole('button',{name:'确认并保存餐食'}));
  await waitFor(async()=>expect((await readSnapshot()).meals).toHaveLength(1));
  const saved=(await readSnapshot()).meals[0];expect(saved.items[0].grams).toBe(200);expect(saved.items[0].food.protein).toBeNull();
  expect(saved.note).toContain('本地测试适配器');expect(errors).toEqual([]);
});
