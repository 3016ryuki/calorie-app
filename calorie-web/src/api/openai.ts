const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ParsedFoodItem {
  name: string;
  amount: number;
  unit_name: string;
  unit_type: 'g' | 'unit';
  base_amount: number;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  category: string;
}

export async function parseFoodMemo(
  text: string,
  apiKey: string,
  knownFoodNames?: string[],
): Promise<ParsedFoodItem[]> {
  const knownFoodsSection = knownFoodNames && knownFoodNames.length > 0
    ? `\n\n以下の食材はすでにDBに登録済みです。入力テキストでこれらの食材が言及された場合は、nameを下記リストの名前と完全一致させてください。栄養値は引き続き正確に入力してください。\n\n登録済み食材:\n${knownFoodNames.map(n => `- ${n}`).join('\n')}`
    : '';

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `あなたは食事記録アシスタントです。
ユーザーの食事メモから食材と量を抽出し、日本食品標準成分表に基づく栄養情報を付与してください。

必ず以下の JSON 形式で返してください（他のテキスト不要）：
{
  "items": [
    {
      "name": "食材名",
      "amount": 実際に食べた量（数値）,
      "unit_name": "単位名（g / 個 / 杯 / 缶 / パック など）",
      "unit_type": "g または unit",
      "base_amount": 基準量（gならば100、unitならば1）,
      "kcal": 基準量あたりのkcal（数値）,
      "protein": 基準量あたりのタンパク質g（数値）,
      "fat": 基準量あたりの脂質g（数値）,
      "carb": 基準量あたりの炭水化物g（数値）,
      "category": "カテゴリ（肉類/魚介・缶詰/卵・大豆/プロテイン/主食（米）/主食（麺）/いも類/野菜/油脂・その他/その他）"
    }
  ]
}

- amount が不明な場合は一般的な1食分の量を使用する
- kcal/protein/fat/carb は必ず日本食品標準成分表または一般的な栄養データを参照して数値を入力する
- 正確な値が不明な場合も類似食品から合理的に推定して返す。0 を返してよいのは水・お茶・無糖炭酸水など本当にカロリーがない食品のみ${knownFoodsSection}`,
        },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI から空のレスポンスが返されました');

  const parsed = JSON.parse(content);
  return (parsed.items ?? []) as ParsedFoodItem[];
}

export async function analyzeWorkoutImage(
  base64Image: string,
  minutes: number,
  apiKey: string,
): Promise<{ exercise: string; kcal: number }> {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `あなたは運動・フィットネスの専門家です。
筋トレや有酸素運動のメニュー画像と運動時間（分）から消費カロリーを推定してください。

必ず以下の JSON 形式で返してください（他のテキスト不要）：
{
  "exercise": "運動内容の短い説明（例: ジム筋トレ・ベンチプレス等）",
  "kcal": 推定消費カロリー（数値・整数）
}

- 体重は65kgと仮定して計算する
- 運動時間は${minutes}分
- 画像が運動と無関係な場合は kcal: 0 を返す`,
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
            { type: 'text', text: `この運動メニューの消費カロリーを推定してください。運動時間は${minutes}分です。` },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI から空のレスポンスが返されました');

  const parsed = JSON.parse(content);
  return { exercise: parsed.exercise ?? '運動', kcal: Number(parsed.kcal) || 0 };
}
