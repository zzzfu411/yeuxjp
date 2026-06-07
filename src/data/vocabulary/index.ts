import { Vocabulary } from "./types";
import { survivalVocab } from "./survival";
import { dailyVocab } from "./daily";
import { fluentVocab } from "./fluent";

export * from "./types";
export { loadVocabularyLevel, loadVocabularyScope } from "./loader";
export { vocabLevelCounts } from "./stats";

export const vocabData: Vocabulary[] = [
  ...survivalVocab,
  ...dailyVocab,
  ...fluentVocab
];

export const vocabByLevel = {
  survival: survivalVocab,
  daily: dailyVocab,
  fluent: fluentVocab
};
