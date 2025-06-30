import {
  createSolidDataset,
  getSolidDataset,
  saveSolidDatasetAt,
  SolidDataset,
} from "@inrupt/solid-client";

/**
 * Get or create a todos dataset at the given Pod container.
 * If the dataset doesn't exist (404), it creates an empty one.
 */
export async function getOrCreateTodoList(
  containerUri: string,
  fetch: typeof window.fetch
): Promise<SolidDataset> {
  const indexUrl = `${containerUri}index.ttl`;

  try {
    const existing = await getSolidDataset(indexUrl, { fetch });
    return existing;
  } catch (error: any) {
    if (error.statusCode === 404) {
      const newDataset = createSolidDataset();
      return await saveSolidDatasetAt(indexUrl, newDataset, { fetch });
    } else {
      console.error("Unexpected error fetching dataset:", error);
      throw error;
    }
  }
}
