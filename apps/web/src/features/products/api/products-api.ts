import {
  apiRoutes,
  type CreateProductInput,
  type Product,
  type ProductCategory,
  SEED_PRODUCTS,
  type TierPricingSchedule,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

// In-memory mock store for local prototyping when backend is offline
let localCatalog: Product[] = [...SEED_PRODUCTS];

export interface ProductFilterParams {
  category?: ProductCategory | "ALL";
  query?: string;
  promotedOnly?: boolean;
}

export const productsApi = {
  async getProducts(params?: ProductFilterParams): Promise<Product[]> {
    try {
      const { data } = await apiClient.get(apiRoutes.products.list.path, {
        params,
      });
      return data.data;
    } catch {
      // Graceful offline mock handling
      let results = [...localCatalog];

      if (params?.category && params.category !== "ALL") {
        results = results.filter((p) => p.category === params.category);
      }

      if (params?.query && params.query.trim().length > 0) {
        const q = params.query.toLowerCase().trim();
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q),
        );
      }

      if (params?.promotedOnly) {
        results = results.filter((p) => p.isPromoted);
      }

      return results;
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.products.getById.path.replace(":id", id),
      );
      return data.data;
    } catch {
      return localCatalog.find((p) => p.id === id) ?? null;
    }
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.products.create.path,
        input,
      );
      return data.data;
    } catch {
      const newProduct: Product = {
        id: `prd-${Date.now()}`,
        name: input.name,
        category: input.category,
        unit: input.unit,
        basePrice: input.basePrice,
        unitCost: input.unitCost,
        taxRatePct: input.taxRatePct ?? 0,
        description: input.description ?? "",
        isPromoted: input.isPromoted ?? false,
        variants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localCatalog = [newProduct, ...localCatalog];
      return newProduct;
    }
  },

  async updateProduct(
    id: string,
    input: Partial<CreateProductInput>,
  ): Promise<Product> {
    try {
      const { data } = await apiClient.patch(
        apiRoutes.products.update.path.replace(":id", id),
        input,
      );
      return data.data;
    } catch {
      localCatalog = localCatalog.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          ...input,
          updatedAt: new Date().toISOString(),
        };
      });
      const updated = localCatalog.find((p) => p.id === id);
      if (!updated) throw new Error("Product not found");
      return updated;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await apiClient.delete(apiRoutes.products.remove.path.replace(":id", id));
    } catch {
      localCatalog = localCatalog.filter((p) => p.id !== id);
    }
  },

  getTierSchedules(product: Product): TierPricingSchedule[] {
    const calculateMargin = (price: number, cost: number) => {
      if (price <= 0) return 0;
      return Math.round(((price - cost) / price) * 1000) / 10;
    };

    const bronzePrice = Math.round(product.basePrice * 0.95);
    const silverPrice = Math.round(product.basePrice * 0.9);
    const goldPrice = Math.round(product.basePrice * 0.85);

    return [
      {
        tier: "BASE",
        label: "Standard List",
        discountPct: 0,
        unitPrice: product.basePrice,
        marginPct: calculateMargin(product.basePrice, product.unitCost),
        minQuantity: 1,
      },
      {
        tier: "BRONZE",
        label: "Bronze Partner Tier",
        discountPct: 5,
        unitPrice: bronzePrice,
        marginPct: calculateMargin(bronzePrice, product.unitCost),
        minQuantity: 5,
      },
      {
        tier: "SILVER",
        label: "Silver Enterprise Tier",
        discountPct: 10,
        unitPrice: silverPrice,
        marginPct: calculateMargin(silverPrice, product.unitCost),
        minQuantity: 25,
      },
      {
        tier: "GOLD",
        label: "Gold Strategic Tier",
        discountPct: 15,
        unitPrice: goldPrice,
        marginPct: calculateMargin(goldPrice, product.unitCost),
        minQuantity: 100,
      },
    ];
  },
};
