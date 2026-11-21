// 一人親方の手取り計算
import { calculate } from './tax.js';

const num = (v, min = 0) => Math.max(min, Number(v) || 0);

// 労災保険 特別加入（第2種・建設の事業）の保険料率。年度で改定されるため要確認
export const ROUSAI_RATE_CONSTRUCTION = 17 / 1000;

/**
 * i: 月額（円）
 *   revenue 月の売上（請負代金・税込） / material 材料費・外注費 / vehicle 車両費
 *   fuel ガソリン・駐車場・高速 / tools 道具・消耗品 / other その他経費
 *   rousai 労災特別加入するか / rousaiDaily 給付基礎日額
 *   days 稼働日数 / hours 1日の稼働時間
 *   filingType, invoice('none'|'twenty'|'simple3'|'simple4'), age40to64, healthType, healthMonthly
 */
export function calcOyakata(i) {
  const revenue = num(i.revenue);
  const monthly = {
    material: num(i.material), vehicle: num(i.vehicle), fuel: num(i.fuel),
    tools: num(i.tools), other: num(i.other),
  };
  const monthlyExpense = Object.values(monthly).reduce((a, b) => a + b, 0);
  const annualRevenue = revenue * 12;

  const received = annualRevenue * 10 / 110;
  const consumption =
    i.invoice === 'twenty' ? Math.floor(received * 0.2) :
    i.invoice === 'simple3' ? Math.floor(received * 0.3) :   // 第三種（建設業）みなし仕入率70%
    i.invoice === 'simple4' ? Math.floor(received * 0.4) :   // 第四種（材料支給の加工賃など）60%
    0;

  const rousaiAnnual = i.rousai ? Math.floor(num(i.rousaiDaily) * 365 * ROUSAI_RATE_CONSTRUCTION) : 0;

  const r = calculate({
    revenue: annualRevenue,
    expense: monthlyExpense * 12 + consumption,
    filingType: i.filingType,
    dependents: 0, householdMembers: 1,
    age40to64: !!i.age40to64,
    isTaxableBusiness: false,
    healthType: i.healthType, healthMonthly: num(i.healthMonthly),
    extraSocialAnnual: rousaiAnnual,
  });

  const annualNet = r.netIncome - rousaiAnnual;
  const monthlyNet = Math.round(annualNet / 12);
  const days = num(i.days);
  const workHours = days * num(i.hours) * 12;

  return {
    monthly, monthlyExpense, consumptionAnnual: consumption, rousaiAnnual, tax: r,
    annualRevenue, annualNet, monthlyNet,
    perDay: days > 0 ? Math.round(monthlyNet / days) : 0,
    perHour: workHours > 0 ? Math.round(annualNet / workHours) : 0,
    netRate: annualRevenue > 0 ? annualNet / annualRevenue : 0,
    breakdown: [
      { key: 'net', label: '手取り', value: Math.max(0, monthlyNet) },
      { key: 'material', label: '材料費・外注費', value: monthly.material },
      { key: 'vehicle', label: '車両費', value: monthly.vehicle },
      { key: 'fuel', label: 'ガソリン・駐車場など', value: monthly.fuel },
      { key: 'tools', label: '道具・消耗品', value: monthly.tools },
      { key: 'other', label: 'その他経費', value: monthly.other },
      { key: 'consumption', label: '消費税', value: Math.round(consumption / 12) },
      { key: 'income', label: '所得税', value: Math.round(r.incomeTax / 12) },
      { key: 'resident', label: '住民税', value: Math.round(r.residentTax / 12) },
      { key: 'health', label: '健康保険', value: Math.round(r.healthIns / 12) },
      { key: 'pension', label: '国民年金', value: Math.round(r.pension / 12) },
      { key: 'rousai', label: '労災特別加入', value: Math.round(rousaiAnnual / 12) },
    ],
  };
}
