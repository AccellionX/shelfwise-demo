export interface IsbnLookupResult {
  title?: string;
  author?: string;
  publisher?: string;
}

export async function lookupIsbn(isbn: string): Promise<IsbnLookupResult> {
  const clean = isbn.replace(/[-\s]/g, "");
  if (!/^\d{10}(\d{3})?$/.test(clean)) {
    throw new Error("Enter a valid 10 or 13 digit ISBN");
  }

  const res = await fetch(`https://openlibrary.org/isbn/${clean}.json`, {
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) {
    throw new Error("No book found for that ISBN");
  }
  if (!res.ok) {
    throw new Error("Open Library lookup failed. Try again later.");
  }

  const data = (await res.json()) as {
    title?: string;
    publishers?: string[];
    authors?: { key: string }[];
    by_statement?: string;
  };

  let author: string | undefined;

  if (data.authors?.[0]?.key) {
    try {
      const authorRes = await fetch(
        `https://openlibrary.org${data.authors[0].key}.json`
      );
      if (authorRes.ok) {
        const authorData = (await authorRes.json()) as { name?: string };
        author = authorData.name;
      }
    } catch {
      // fall through
    }
  }

  if (!author && data.by_statement) {
    author = data.by_statement.replace(/^by\s+/i, "");
  }

  return {
    title: data.title,
    author,
    publisher: data.publishers?.[0],
  };
}
