import type { QuizAnswers, QuizOption } from './_taste-profile-store';

let _quizAnswers: Partial<QuizAnswers> = {};

export function setQuizAnswer(question: keyof QuizAnswers, option: QuizOption): void {
  _quizAnswers = { ..._quizAnswers, [question]: option };
}

export function getQuizAnswers(): Partial<QuizAnswers> {
  return _quizAnswers;
}

export function resetQuizAnswers(): void {
  _quizAnswers = {};
}
