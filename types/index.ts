export type Entry = {
  id: string;
  date: string; // "YYYY-MM-DD"
  text: string;
  text2?: string;
  starred1?: boolean;
  starred2?: boolean;
  photos?: string[];
  createdAt: number;
  updatedAt: number;
};
