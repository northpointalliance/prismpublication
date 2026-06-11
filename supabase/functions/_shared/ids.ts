// New primary keys for inserts. Existing rows use cuid (from the old Prisma backend); ids are opaque
// TEXT, so UUIDs interoperate fine. We prefix to keep them visually distinct and sortable-ish.
export const newId = (): string => crypto.randomUUID();
