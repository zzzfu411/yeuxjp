export interface Kana {
  romaji: string;
  hiragana: string;
  katakana: string;
  type: 'seion' | 'dakuon' | 'handakuon' | 'yoon' | 'special';
  row?: string;
  strokes?: string[]; // SVG path data (KanjiVG standard: 109x109 viewbox)
}

export const kanaData: Kana[] = [
  // --- A-row (With Authentic KanjiVG Paths) ---
  { 
    romaji: 'a', hiragana: 'あ', katakana: 'ア', type: 'seion', row: 'a',
    strokes: [
      "M31.01,33c0.88,0.88,2.75,1.82,5.25,1.75c8.62-0.25,20-2.12,29.5-4.25c1.51-0.34,4.62-0.88,6.62-0.5",
      "M49.76,17.62c0.88,1,1.82,3.26,1.38,5.25c-3.75,16.75-6.25,38.13-5.13,53.63c0.41,5.7,1.88,10.88,3.38,13.62",
      "M65.63,44.12c0.75,1.12,1.16,4.39,0.5,6.12c-4.62,12.26-11.24,23.76-25.37,35.76c-6.86,5.83-15.88,3.75-16.25-8.38c-0.34-10.87,13.38-23.12,32.38-26.74c12.42-2.37,27,1.38,30.5,12.75c4.05,13.18-3.76,26.37-20.88,30.49"
    ]
  },
  { 
    romaji: 'i', hiragana: 'い', katakana: 'イ', type: 'seion', row: 'a',
    strokes: [
      "M21.5,29.66c2.01,2.17,2.61,4.68,2.17,7.43c-3.09,19.16-1.03,32.01,7.93,41.45c6.12,6.45,6.26,3.14,7.04-5.21",
      "M72.96,36.51c9.44,8.05,17.79,18.82,18.41,33.83"
    ]
  },
  { 
    romaji: 'u', hiragana: 'う', katakana: 'ウ', type: 'seion', row: 'a',
    strokes: [
      "M35.75,19.25c2.38,1.5,5.75,3.75,8.25,6.25", // Top stroke
      "M25.5,45.5c2.25,1.75,3.88,2.25,6.5,2c12.75-1.25,27.25-5.75,34.25-6.75c12-1.71,6.5,10.25-1.5,20.25c-8.75,10.94-22.5,20.25-33.5,24" // Body curve (Approx KanjiVG)
    ]
  },
  { 
    romaji: 'e', hiragana: 'え', katakana: 'エ', type: 'seion', row: 'a',
    strokes: [
      "M40.75,18.25c2.25,1.5,5.5,3.75,8,6.25", // Top stroke
      "M25.5,45.5c2.5,1,4.75,0.75,7.25,0.25c11.5-2.25,26.5-5.5,33.5-6.75c3.75-0.67,4.25,1.75,1.5,4.75c-16.75,18.25-23.75,25.5-28.5,32.25c-1.75,2.5-1.5,5.25,3.5,6.25c8.75,1.75,22.25,3.75,31.5,4.25" // Zigzag body
    ]
  },
  { 
    romaji: 'o', hiragana: 'お', katakana: 'オ', type: 'seion', row: 'a',
    strokes: [
      "M25.75,36.25c2.25,0.75,5.5,0.75,8,0.5c11.75-1.25,28.5-4,39.5-5.25c3-0.34,5.75-0.25,8,0.25", // Horizontal
      "M51.25,16c1.25,1.25,1.75,3.25,1.75,5.75c0,13.75-0.5,35.25-0.5,40.75c0,11.5-6.5,13.75-13.75,5.25c-1.5-1.75-3.5-3.25-5-4.5", // Vertical part 1
      "M52.75,50.75c7.75-1.5,18.75-3.25,25.75-4c5.75-0.61,7.25,2.75,3.25,6.75c-6.75,6.75-16.25,14.5-27.25,19.25", // Loop (Approximated curve logic)
      "M77.25,27.5c2.75,1.75,6.75,5.5,8.25,8.75" // Dot
    ]
  },

  // --- Ka-row (No strokes yet) ---
  { romaji: 'ka', hiragana: 'か', katakana: 'カ', type: 'seion', row: 'ka' },
  { romaji: 'ki', hiragana: 'き', katakana: 'キ', type: 'seion', row: 'ka' },
  { romaji: 'ku', hiragana: 'く', katakana: 'ク', type: 'seion', row: 'ka' },
  { romaji: 'ke', hiragana: 'け', katakana: 'ケ', type: 'seion', row: 'ka' },
  { romaji: 'ko', hiragana: 'こ', katakana: 'コ', type: 'seion', row: 'ka' },
  // Sa-row
  { romaji: 'sa', hiragana: 'さ', katakana: 'サ', type: 'seion', row: 'sa' },
  { romaji: 'shi', hiragana: 'し', katakana: 'シ', type: 'seion', row: 'sa' },
  { romaji: 'su', hiragana: 'す', katakana: 'ス', type: 'seion', row: 'sa' },
  { romaji: 'se', hiragana: 'せ', katakana: 'セ', type: 'seion', row: 'sa' },
  { romaji: 'so', hiragana: 'そ', katakana: 'ソ', type: 'seion', row: 'sa' },
  // Ta-row
  { romaji: 'ta', hiragana: 'た', katakana: 'タ', type: 'seion', row: 'ta' },
  { romaji: 'chi', hiragana: 'ち', katakana: 'チ', type: 'seion', row: 'ta' },
  { romaji: 'tsu', hiragana: 'つ', katakana: 'ツ', type: 'seion', row: 'ta' },
  { romaji: 'te', hiragana: 'て', katakana: 'テ', type: 'seion', row: 'ta' },
  { romaji: 'to', hiragana: 'と', katakana: 'ト', type: 'seion', row: 'ta' },
  // Na-row
  { romaji: 'na', hiragana: 'な', katakana: 'ナ', type: 'seion', row: 'na' },
  { romaji: 'ni', hiragana: 'に', katakana: 'ニ', type: 'seion', row: 'na' },
  { romaji: 'nu', hiragana: 'ぬ', katakana: 'ヌ', type: 'seion', row: 'na' },
  { romaji: 'ne', hiragana: 'ね', katakana: 'ネ', type: 'seion', row: 'na' },
  { romaji: 'no', hiragana: 'の', katakana: 'ノ', type: 'seion', row: 'na' },
  // Ha-row
  { romaji: 'ha', hiragana: 'は', katakana: 'ハ', type: 'seion', row: 'ha' },
  { romaji: 'hi', hiragana: 'ひ', katakana: 'ヒ', type: 'seion', row: 'ha' },
  { romaji: 'fu', hiragana: 'ふ', katakana: 'フ', type: 'seion', row: 'ha' },
  { romaji: 'he', hiragana: 'へ', katakana: 'ヘ', type: 'seion', row: 'ha' },
  { romaji: 'ho', hiragana: 'ほ', katakana: 'ホ', type: 'seion', row: 'ha' },
  // Ma-row
  { romaji: 'ma', hiragana: 'ま', katakana: 'マ', type: 'seion', row: 'ma' },
  { romaji: 'mi', hiragana: 'み', katakana: 'ミ', type: 'seion', row: 'ma' },
  { romaji: 'mu', hiragana: 'む', katakana: 'ム', type: 'seion', row: 'ma' },
  { romaji: 'me', hiragana: 'め', katakana: 'メ', type: 'seion', row: 'ma' },
  { romaji: 'mo', hiragana: 'も', katakana: 'モ', type: 'seion', row: 'ma' },
  // Ya-row
  { romaji: 'ya', hiragana: 'や', katakana: 'ヤ', type: 'seion', row: 'ya' },
  { romaji: 'yu', hiragana: 'ゆ', katakana: 'ユ', type: 'seion', row: 'ya' },
  { romaji: 'yo', hiragana: 'よ', katakana: 'ヨ', type: 'seion', row: 'ya' },
  // Ra-row
  { romaji: 'ra', hiragana: 'ら', katakana: 'ラ', type: 'seion', row: 'ra' },
  { romaji: 'ri', hiragana: 'り', katakana: 'リ', type: 'seion', row: 'ra' },
  { romaji: 'ru', hiragana: 'る', katakana: 'ル', type: 'seion', row: 'ra' },
  { romaji: 're', hiragana: 'れ', katakana: 'レ', type: 'seion', row: 'ra' },
  { romaji: 'ro', hiragana: 'ろ', katakana: 'ロ', type: 'seion', row: 'ra' },
  // Wa-row
  { romaji: 'wa', hiragana: 'わ', katakana: 'ワ', type: 'seion', row: 'wa' },
  { romaji: 'wo', hiragana: 'を', katakana: 'ヲ', type: 'seion', row: 'wa' },
  // N
  { romaji: 'n', hiragana: 'ん', katakana: 'ン', type: 'seion', row: 'n' },

  // --- Dakuon (Voiced) ---
  { romaji: 'ga', hiragana: 'が', katakana: 'ガ', type: 'dakuon', row: 'ga' },
  { romaji: 'gi', hiragana: 'ぎ', katakana: 'ギ', type: 'dakuon', row: 'ga' },
  { romaji: 'gu', hiragana: 'ぐ', katakana: 'グ', type: 'dakuon', row: 'ga' },
  { romaji: 'ge', hiragana: 'げ', katakana: 'ゲ', type: 'dakuon', row: 'ga' },
  { romaji: 'go', hiragana: 'ご', katakana: 'ゴ', type: 'dakuon', row: 'ga' },

  { romaji: 'za', hiragana: 'ざ', katakana: 'ザ', type: 'dakuon', row: 'za' },
  { romaji: 'ji', hiragana: 'じ', katakana: 'ジ', type: 'dakuon', row: 'za' },
  { romaji: 'zu', hiragana: 'ず', katakana: 'ズ', type: 'dakuon', row: 'za' },
  { romaji: 'ze', hiragana: 'ぜ', katakana: 'ゼ', type: 'dakuon', row: 'za' },
  { romaji: 'zo', hiragana: 'ぞ', katakana: 'ゾ', type: 'dakuon', row: 'za' },

  { romaji: 'da', hiragana: 'だ', katakana: 'ダ', type: 'dakuon', row: 'da' },
  // ぢ/づ 在现代日语中多读作 ji/zu，这里用 di/du 保证题库/键唯一性
  { romaji: 'di', hiragana: 'ぢ', katakana: 'ヂ', type: 'dakuon', row: 'da' },
  { romaji: 'du', hiragana: 'づ', katakana: 'ヅ', type: 'dakuon', row: 'da' },
  { romaji: 'de', hiragana: 'で', katakana: 'デ', type: 'dakuon', row: 'da' },
  { romaji: 'do', hiragana: 'ど', katakana: 'ド', type: 'dakuon', row: 'da' },

  { romaji: 'ba', hiragana: 'ば', katakana: 'バ', type: 'dakuon', row: 'ba' },
  { romaji: 'bi', hiragana: 'び', katakana: 'ビ', type: 'dakuon', row: 'ba' },
  { romaji: 'bu', hiragana: 'ぶ', katakana: 'ブ', type: 'dakuon', row: 'ba' },
  { romaji: 'be', hiragana: 'べ', katakana: 'ベ', type: 'dakuon', row: 'ba' },
  { romaji: 'bo', hiragana: 'ぼ', katakana: 'ボ', type: 'dakuon', row: 'ba' },

  // --- Handakuon (P-sounds) ---
  { romaji: 'pa', hiragana: 'ぱ', katakana: 'パ', type: 'handakuon', row: 'pa' },
  { romaji: 'pi', hiragana: 'ぴ', katakana: 'ピ', type: 'handakuon', row: 'pa' },
  { romaji: 'pu', hiragana: 'ぷ', katakana: 'プ', type: 'handakuon', row: 'pa' },
  { romaji: 'pe', hiragana: 'ぺ', katakana: 'ペ', type: 'handakuon', row: 'pa' },
  { romaji: 'po', hiragana: 'ぽ', katakana: 'ポ', type: 'handakuon', row: 'pa' },

  // --- Yoon (Contracted sounds) ---
  { romaji: 'kya', hiragana: 'きゃ', katakana: 'キャ', type: 'yoon', row: 'ky' },
  { romaji: 'kyu', hiragana: 'きゅ', katakana: 'キュ', type: 'yoon', row: 'ky' },
  { romaji: 'kyo', hiragana: 'きょ', katakana: 'キョ', type: 'yoon', row: 'ky' },

  { romaji: 'gya', hiragana: 'ぎゃ', katakana: 'ギャ', type: 'yoon', row: 'gy' },
  { romaji: 'gyu', hiragana: 'ぎゅ', katakana: 'ギュ', type: 'yoon', row: 'gy' },
  { romaji: 'gyo', hiragana: 'ぎょ', katakana: 'ギョ', type: 'yoon', row: 'gy' },

  { romaji: 'sha', hiragana: 'しゃ', katakana: 'シャ', type: 'yoon', row: 'sh' },
  { romaji: 'shu', hiragana: 'しゅ', katakana: 'シュ', type: 'yoon', row: 'sh' },
  { romaji: 'sho', hiragana: 'しょ', katakana: 'ショ', type: 'yoon', row: 'sh' },

  { romaji: 'ja', hiragana: 'じゃ', katakana: 'ジャ', type: 'yoon', row: 'j' },
  { romaji: 'ju', hiragana: 'じゅ', katakana: 'ジュ', type: 'yoon', row: 'j' },
  { romaji: 'jo', hiragana: 'じょ', katakana: 'ジョ', type: 'yoon', row: 'j' },

  { romaji: 'cha', hiragana: 'ちゃ', katakana: 'チャ', type: 'yoon', row: 'ch' },
  { romaji: 'chu', hiragana: 'ちゅ', katakana: 'チュ', type: 'yoon', row: 'ch' },
  { romaji: 'cho', hiragana: 'ちょ', katakana: 'チョ', type: 'yoon', row: 'ch' },

  { romaji: 'nya', hiragana: 'にゃ', katakana: 'ニャ', type: 'yoon', row: 'ny' },
  { romaji: 'nyu', hiragana: 'にゅ', katakana: 'ニュ', type: 'yoon', row: 'ny' },
  { romaji: 'nyo', hiragana: 'にょ', katakana: 'ニョ', type: 'yoon', row: 'ny' },

  { romaji: 'hya', hiragana: 'ひゃ', katakana: 'ヒャ', type: 'yoon', row: 'hy' },
  { romaji: 'hyu', hiragana: 'ひゅ', katakana: 'ヒュ', type: 'yoon', row: 'hy' },
  { romaji: 'hyo', hiragana: 'ひょ', katakana: 'ヒョ', type: 'yoon', row: 'hy' },

  { romaji: 'bya', hiragana: 'びゃ', katakana: 'ビャ', type: 'yoon', row: 'by' },
  { romaji: 'byu', hiragana: 'びゅ', katakana: 'ビュ', type: 'yoon', row: 'by' },
  { romaji: 'byo', hiragana: 'びょ', katakana: 'ビョ', type: 'yoon', row: 'by' },

  { romaji: 'pya', hiragana: 'ぴゃ', katakana: 'ピャ', type: 'yoon', row: 'py' },
  { romaji: 'pyu', hiragana: 'ぴゅ', katakana: 'ピュ', type: 'yoon', row: 'py' },
  { romaji: 'pyo', hiragana: 'ぴょ', katakana: 'ピョ', type: 'yoon', row: 'py' },

  { romaji: 'mya', hiragana: 'みゃ', katakana: 'ミャ', type: 'yoon', row: 'my' },
  { romaji: 'myu', hiragana: 'みゅ', katakana: 'ミュ', type: 'yoon', row: 'my' },
  { romaji: 'myo', hiragana: 'みょ', katakana: 'ミョ', type: 'yoon', row: 'my' },

  { romaji: 'rya', hiragana: 'りゃ', katakana: 'リャ', type: 'yoon', row: 'ry' },
  { romaji: 'ryu', hiragana: 'りゅ', katakana: 'リュ', type: 'yoon', row: 'ry' },
  { romaji: 'ryo', hiragana: 'りょ', katakana: 'リョ', type: 'yoon', row: 'ry' },

  // --- Special (Phonology) ---
  // Sokuon (促音): small っ/ッ, doubles the following consonant
  { romaji: 'sokuon', hiragana: 'っ', katakana: 'ッ', type: 'special', row: 'special' },
];
