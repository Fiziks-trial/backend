export const SUBJECTS = ['physics', 'chemistry', 'biology', 'math'] as const;
export type Subject = typeof SUBJECTS[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = typeof DIFFICULTIES[number];
