import type { QuizAnswers, QuizOption } from './_taste-profile-store';

// ─────────────────────────────────────────
//  MODULE STATE
// ─────────────────────────────────────────

let _quizAnswers: Partial<QuizAnswers> = {};

// ─────────────────────────────────────────
//  QUIZ PROGRESS API
// ─────────────────────────────────────────

export function setQuizAnswer(question: keyof QuizAnswers, option: QuizOption): void {
  _quizAnswers = { ..._quizAnswers, [question]: option };
}

export function getQuizAnswers(): Partial<QuizAnswers> {
  return _quizAnswers;
}

export function resetQuizAnswers(): void {
  _quizAnswers = {};
}
