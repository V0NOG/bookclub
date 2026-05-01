export type ExternalBookSource = "open-library" | "google-books";

export type ExternalBookResult = {
  externalSource: ExternalBookSource;
  externalId: string;
  title: string;
  authors: string[];
  isbn?: string;
  coverUrl?: string;
  description?: string;
  publishedYear?: number;
  pageCount?: number;
  genres?: string[];
};
