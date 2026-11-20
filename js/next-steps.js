// 計算結果に合わせて出す「次の一手」
// url が null のものは表示されない（記事や提携ができたら url を入れる）
// when(ctx): ctx は calcKeikamotsu の結果に revenueMonthly / vehicle / invoice を足したもの

export const NEXT_STEPS = [
  {
    id: 'cashflow',
    title: '報酬の入金まで、最大60日待っていませんか？',
    body: '「月末締め・翌月末払い」だと、走った分のお金が入るのは最大2か月後。その間のガソリン代は立て替えです。請求書を早めに現金化する方法をまとめました。',
    cta: '入金を早める方法を見る',
    url: '/articles/keikamotsu-nyukin-hayaku',
    when: () => true,
  },
  {
    id: 'vehicle',
    title: '車両費が手取りを圧迫しています',
    body: '車両費が売上の1割を超えています。黒ナンバーで使えるリースや、月々の負担を下げる方法を比べてみましょう。',
    cta: '車両費を下げる方法を見る',
    url: null,
    when: (c) => c.revenueMonthly > 0 && c.vehicle / c.revenueMonthly > 0.1,
  },
  {
    id: 'lowhour',
    title: '時給に直すと、思ったより低いかもしれません',
    body: '経費と税金を引いた時給が1,200円を下回っています。単価の高い案件や、条件の良い委託先を探す選択肢もあります。',
    cta: '条件の良い仕事の探し方を見る',
    url: null,
    when: (c) => c.perHour > 0 && c.perHour < 1200,
  },
];
