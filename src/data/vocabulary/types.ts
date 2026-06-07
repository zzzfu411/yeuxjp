export type VocabCategory = 
  | "greetings" | "verbs" | "adjectives" | "people" 
  | "food" | "time" | "nature" | "daily" 
  | "body" | "directions" | "transport" | "colors" 
  | "numbers" | "furniture" | "city" | "grammar_words"
  | "business" | "emotion" | "abstract" | "society" | "culture"; // New categories for higher levels

export type VocabLevel = "survival" | "daily" | "fluent";

export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface VocabExampleSentence {
  japanese: string;
  romaji?: string;
  meaning: string;
}

export interface Vocabulary {
  id: string;
  kanji?: string;
  kana: string;
  romaji: string;
  meaning: string;
  category: VocabCategory;
  level: VocabLevel;
  priority?: number;
  tags?: string[];
  jlpt?: JLPTLevel;
  lessonIds?: string[];
  exampleSentences?: VocabExampleSentence[];
  notes?: string;
  prerequisites?: string[];
}
