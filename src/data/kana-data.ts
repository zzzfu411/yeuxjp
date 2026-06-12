export interface Kana {
  romaji: string;
  hiragana: string;
  katakana: string;
  type: 'seion' | 'dakuon' | 'handakuon' | 'yoon' | 'special';
  row?: string;
}

export const kanaData: Kana[] = [
  // --- A-row ---
  { 
    romaji: 'a', hiragana: 'あ', katakana: 'ア', type: 'seion', row: 'a',
  },
  { 
    romaji: 'i', hiragana: 'い', katakana: 'イ', type: 'seion', row: 'a',
  },
  { 
    romaji: 'u', hiragana: 'う', katakana: 'ウ', type: 'seion', row: 'a',
  },
  { 
    romaji: 'e', hiragana: 'え', katakana: 'エ', type: 'seion', row: 'a',
  },
  { 
    romaji: 'o', hiragana: 'お', katakana: 'オ', type: 'seion', row: 'a',
  },

  // Ka-row
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
