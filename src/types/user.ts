export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  /** Persisted so emails, sent outside any request, use the right language. */
  language: string;
}
