export function generateSlug(name: string, id?: string): string {
  // Convert to lowercase and replace special characters
  let slug = name
    .toLowerCase()
    .trim()
    // Replace German umlauts
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    // Remove all non-alphanumeric except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces with single hyphen
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Add ID suffix if provided for uniqueness
  if (id) {
    const shortId = id.substring(0, 8);
    slug = `${slug}-${shortId}`;
  }

  return slug;
}
