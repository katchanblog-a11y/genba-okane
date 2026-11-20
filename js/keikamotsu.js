// 軽貨物ドライバーの手取り計算
// 車両・燃料などの経費を積み上げ、tax.js で税金と社会保険を計算する。
import { calculate } from './tax.js';

const num = (v, min = 0) => Math.max(min, Number(v) || 0);

/**
 * @param {object} i 入力（すべて月額・円）
 *   revenue       月の売上（委託報酬の総額・税込）
 *   days          月の稼働日数
 *   hours         1日の稼働時間
 *   km            1日の走行距離
 *   kmPerL        燃費（km/L）
 *   fuelPrice     ガソリン単価（円/L）
 *   vehicle       車両費（リース・ローン・レンタル）
 *   insurance     任意保険（黒ナンバー）
 *   feeRate       委託元・元請けへの手数料（％）
 *   other         その他経費（スマホ・駐車場・高速・メンテなど）
 *   filingType    'blue65' | 'white'
 *   invoice       'none' | 'twenty' | 'simple'
 *   age40to64     boolean
 *   healthType    'city' | 'union' | 'dependent'
 *   healthMonthly 国保組合の月額
 */
export function calcKeikamotsu(i) {
  const revenue = num(i.revenue);
  const days = num(i.days);
  const fuel = num(i.kmPerL) > 0
    ? Math.round((num(i.km) * days / num(i.kmPerL)) * num(i.fuelPrice))
    : 0;
  const fee = Math.round(revenue * Math.min(100, num(i.feeRate)) / 100);

  const monthly = {
    fuel,
    vehicle: num(i.vehicle),
    insurance: num(i.insurance),
    fee,
    other: num(i.other),
  };
  const monthlyExpense = Object.values(monthly).reduce((a, b) => a + b, 0);

  const annualRevenue = revenue * 12;

  // 消費税（売上は税込で入力されている前提）
  // twenty: 2割特例（令和8年分まで）/ simple: 簡易課税・第五種（みなし仕入率50%）
  const received = annualRevenue * 10 / 110;
  const consumption =
    i.invoice === 'twenty' ? Math.floor(received * 0.2) :
    i.invoice === 'simple' ? Math.floor(received * 0.5) : 0;

  // 税込経理：納めた消費税は事業の経費として扱う
  const annualExpense = monthlyExpense * 12 + consumption;

  const r = calculate({
    revenue: annualRevenue,
    expense: annualExpense,
    filingType: i.filingType,
    dependents: 0,
    householdMembers: 1,
    age40to64: !!i.age40to64,
    isTaxableBusiness: false,
    healthType: i.healthType,
    healthMonthly: num(i.healthMonthly),
  });

  const annualNet = r.netIncome;
  const monthlyNet = Math.round(annualNet / 12);
  const workHours = days * num(i.hours) * 12;

  return {
    monthly,
    monthlyExpense,
    consumptionAnnual: consumption,
    tax: r,
    annualRevenue,
    annualNet,
    monthlyNet,
    perDay: days > 0 ? Math.round(monthlyNet / days) : 0,
    perHour: workHours > 0 ? Math.round(annualNet / workHours) : 0,
    netRate: annualRevenue > 0 ? annualNet / annualRevenue : 0,
    // 月あたりの内訳（グラフ用）
    breakdown: [
      { key: 'net', label: '手取り', value: Math.max(0, monthlyNet) },
      { key: 'fuel', label: 'ガソリン代', value: monthly.fuel },
      { key: 'vehicle', label: '車両費', value: monthly.vehicle },
      { key: 'insurance', label: '任意保険', value: monthly.insurance },
      { key: 'fee', label: '手数料', value: monthly.fee },
      { key: 'other', label: 'その他経費', value: monthly.other },
      { key: 'consumption', label: '消費税', value: Math.round(consumption / 12) },
      { key: 'income', label: '所得税', value: Math.round(r.incomeTax / 12) },
      { key: 'resident', label: '住民税', value: Math.round(r.residentTax / 12) },
      { key: 'health', label: '国民健康保険', value: Math.round(r.healthIns / 12) },
      { key: 'pension', label: '国民年金', value: Math.round(r.pension / 12) },
    ],
  };
}
