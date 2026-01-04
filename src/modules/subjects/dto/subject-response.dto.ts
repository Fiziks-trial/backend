/** Quiz subject/category */
export class SubjectResponse {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  /** Default time limit per question in seconds */
  defaultTimeLimit: number;
  createdAt: Date;
  updatedAt: Date;
}
