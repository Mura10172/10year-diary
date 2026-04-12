export type Entry = {
  id: string;
  date: string; // "YYYY-MM-DD"
  text: string;
  text2?: string;
  starred1?: boolean;
  starred2?: boolean;
  createdAt: number;
  updatedAt: number;
};
