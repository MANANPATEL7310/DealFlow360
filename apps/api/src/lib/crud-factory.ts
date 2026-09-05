import { db } from "./db.js";

/**
 * Creates standard CRUD service functions for a Prisma model.
 *
 * Usage:
 *   const productService = createCrudService("product");
 *   const all = await productService.findMany();
 *   const one = await productService.findById("abc");
 */
export function createCrudService<T extends keyof typeof db>(modelName: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = db[modelName] as any;

  return {
    async findMany(where?: object) {
      return model.findMany({ where, orderBy: { createdAt: "desc" } });
    },

    async findById(id: string) {
      return model.findUnique({ where: { id } });
    },

    async create(data: object) {
      return model.create({ data });
    },

    async update(id: string, data: object) {
      return model.update({ where: { id }, data });
    },

    async delete(id: string) {
      return model.delete({ where: { id } });
    },

    async count(where?: object) {
      return model.count({ where });
    },
  };
}
