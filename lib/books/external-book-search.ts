import { ExternalBookResult } from "@/lib/books/types";

const RESULT_LIMIT = 10;
const FETCH_TIMEOUT_MS = 4500;

function cleanText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeIsbn(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/[^0-9Xx]/g, "").toUpperCase();
  return normalized.length >= 10 ? normalized : undefined;
}

function looksLikeIsbn(query: string) {
  return /^[\d\- Xx]{10,17}$/.test(query.trim());
}

function parseYear(value: unknown): number | undefined {
  if (typeof value === "number" && value > 0) return value;
  if (typeof value !== "string") return undefined;
  const match = value.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return match ? Number(match[1]) : undefined;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      next: { revalidate: 60 * 60 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  subject?: string[];
};

type OpenLibraryResponse = {
  docs?: OpenLibraryDoc[];
};

export async function searchOpenLibrary(query: string): Promise<ExternalBookResult[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const params = new URLSearchParams({
    limit: String(RESULT_LIMIT),
    fields: "key,title,author_name,isbn,cover_i,first_publish_year,number_of_pages_median,subject",
  });
  if (looksLikeIsbn(term)) {
    params.set("isbn", normalizeIsbn(term) ?? term);
  } else {
    params.set("q", term);
  }

  const data = await fetchJson<OpenLibraryResponse>(`https://openlibrary.org/search.json?${params.toString()}`);
  const docs = data?.docs ?? [];

  return docs
    .map((doc): ExternalBookResult | null => {
      const title = cleanText(doc.title);
      const authors = (doc.author_name ?? []).map((author) => author.trim()).filter(Boolean).slice(0, 4);
      const externalId = cleanText(doc.key)?.replace(/^\/works\//, "");
      if (!title || authors.length === 0 || !externalId) return null;

      return {
        externalSource: "open-library" as const,
        externalId,
        title,
        authors,
        isbn: normalizeIsbn(doc.isbn?.find((isbn) => normalizeIsbn(isbn))),
        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
        publishedYear: doc.first_publish_year,
        pageCount: doc.number_of_pages_median,
        genres: (doc.subject ?? []).map((subject) => subject.trim()).filter(Boolean).slice(0, 6),
      };
    })
    .filter((book): book is ExternalBookResult => Boolean(book));
}

type GoogleVolume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
  };
};

type GoogleBooksResponse = {
  items?: GoogleVolume[];
};

export async function searchGoogleBooks(query: string): Promise<ExternalBookResult[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const params = new URLSearchParams({
    q: looksLikeIsbn(term) ? `isbn:${normalizeIsbn(term) ?? term}` : term,
    maxResults: String(RESULT_LIMIT),
    printType: "books",
  });
  if (process.env.GOOGLE_BOOKS_API_KEY) params.set("key", process.env.GOOGLE_BOOKS_API_KEY);

  const data = await fetchJson<GoogleBooksResponse>(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
  const items = data?.items ?? [];

  return items
    .map((item): ExternalBookResult | null => {
      const info = item.volumeInfo;
      const title = cleanText(info?.title);
      const authors = (info?.authors ?? []).map((author) => author.trim()).filter(Boolean).slice(0, 4);
      const externalId = cleanText(item.id);
      if (!title || authors.length === 0 || !externalId) return null;

      const isbn13 = info?.industryIdentifiers?.find((identifier) => identifier.type === "ISBN_13")?.identifier;
      const isbn10 = info?.industryIdentifiers?.find((identifier) => identifier.type === "ISBN_10")?.identifier;
      const coverUrl = info?.imageLinks?.thumbnail ?? info?.imageLinks?.smallThumbnail;

      return {
        externalSource: "google-books" as const,
        externalId,
        title,
        authors,
        isbn: normalizeIsbn(isbn13) ?? normalizeIsbn(isbn10),
        coverUrl: coverUrl?.replace(/^http:/, "https:"),
        description: cleanText(info?.description),
        publishedYear: parseYear(info?.publishedDate),
        pageCount: info?.pageCount && info.pageCount > 0 ? info.pageCount : undefined,
        genres: (info?.categories ?? []).flatMap((category) => category.split("/")).map((genre) => genre.trim()).filter(Boolean).slice(0, 6),
      };
    })
    .filter((book): book is ExternalBookResult => Boolean(book));
}

function dedupeExternalResults(results: ExternalBookResult[]) {
  const seen = new Set<string>();
  return results.filter((book) => {
    const key = book.isbn
      ? `isbn:${book.isbn}`
      : `provider:${book.externalSource}:${book.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchExternalBooks(query: string): Promise<ExternalBookResult[]> {
  const openLibraryResults = await searchOpenLibrary(query);
  if (openLibraryResults.length >= 3) return dedupeExternalResults(openLibraryResults).slice(0, RESULT_LIMIT);

  const googleResults = await searchGoogleBooks(query);
  return dedupeExternalResults([...openLibraryResults, ...googleResults]).slice(0, RESULT_LIMIT);
}
