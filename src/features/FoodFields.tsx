import { useRef, useState } from 'react';
import { Actions, Button, Field, num, submit, useApp, value } from '../components/ui';
import { energyFromMacros } from '../domain/calories';
import { foodSchema, meta, type Food } from '../domain/model';
import { saveFood } from '../db/commands';

export function FoodFields({ food, initial, onSaved }: { food?: Food; initial?: Partial<Food>; onSaved: (food: Food) => void }) {
  const { data, run } = useApp();
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  return <form ref={formRef} onSubmit={submit(async form => {
    setBusy(true);
    await run(async () => {
      const next = foodSchema.parse({ ...(food || { ...meta(), favorite: false, archived: false }),
        name: value(form, 'name'), energy: num(form, 'energy'), protein: num(form, 'protein', true), carbs: num(form, 'carbs', true), fat: num(form, 'fat', true),
        servingName: value(form, 'servingName'), servingGrams: num(form, 'servingGrams', true),
      });
      if (next.servingName && !next.servingGrams) throw new Error('请填写这份食物对应的克重');
      const saved = await saveFood(next, data.generation); onSaved(saved);
    }, '食物已保存'); setBusy(false);
  })}>
    <Field label="食物名称"><input name="name" defaultValue={(food || initial)?.name} required placeholder="例如：原味酸奶" maxLength={120} autoFocus /></Field>
    <p className="form-note">按食品标签或自己的测量填写每 100 克营养。未知项留空，已知为零才填 0。</p>
    <div className="form-grid"><Field label="能量（千卡 / 100 克）"><input name="energy" type="number" min="0" step="any" defaultValue={(food || initial)?.energy} required /></Field><Field label="蛋白质（克 / 100 克）"><input name="protein" type="number" min="0" step="any" defaultValue={(food || initial)?.protein ?? ''} /></Field><Field label="碳水（克 / 100 克）"><input name="carbs" type="number" min="0" step="any" defaultValue={(food || initial)?.carbs ?? ''} /></Field><Field label="脂肪（克 / 100 克）"><input name="fat" type="number" min="0" step="any" defaultValue={(food || initial)?.fat ?? ''} /></Field></div>
    <button type="button" className="text-button macro-estimate" onClick={() => void run(async () => {
      const form = new FormData(formRef.current!);
      const energy = energyFromMacros({protein:num(form,'protein')!,carbs:num(form,'carbs')!,fat:num(form,'fat')!});
      const input = formRef.current!.elements.namedItem('energy') as HTMLInputElement;
      input.value = String(energy);
    }, '已按 4/4/9 估算每百克能量；已知标签值时请优先使用标签。')}>按三大营养素估算能量</button>
    <div className="form-grid"><Field label="可选份量名称"><input name="servingName" placeholder="例如：杯、碗、份" defaultValue={(food || initial)?.servingName} /></Field><Field label="每份克重（克）"><input name="servingGrams" type="number" min="0.1" step="0.1" defaultValue={(food || initial)?.servingGrams ?? ''} /></Field></div>
    <Actions><Button type="submit" disabled={busy}>{busy ? '正在保存…' : '保存食物'}</Button></Actions>
  </form>;
}
