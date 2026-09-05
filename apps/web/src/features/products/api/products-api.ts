import {
  apiRoutes,
  type CreateProductInput,
  type Product,
  type ProductCategory,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export interface ProductFilterParams {
  category?: ProductCategory | "ALL";
  query?: string;
  promotedOnly?: boolean;
}

export const productsApi = {
  async getProducts(params?: ProductFilterParams): Promise<Product[]> {
    const { data } = await apiClient.get(apiRoutes.products.list.path, {
      params,
    });
    return data.data;
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data } = await apiClient.get(
      apiRoutes.products.getById.path.replace(":id", id),
    );
    return data.data;
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    const { data } = await apiClient.post(
      apiRoutes.products.create.path,
      input,
    );
    return data.data;
  },

  async updateProduct(
    id: string,
    input: Partial<CreateProductInput>,
  ): Promise<Product> {
    const { data } = await apiClient.patch(
      apiRoutes.products.update.path.replace(":id", id),
      input,
    );
    return data.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(apiRoutes.products.remove.path.replace(":id", id));
  },
  getTierSchedules(product: Product) {
    const marginPct =
      product.basePrice > 0
        ? Number(
            (
              ((product.basePrice - product.unitCost) / product.basePrice) *
              100
            ).toFixed(1),
          )
        : 0;
    return [
      {
        tier: "BASE",
        label: "Catalog",
        minQuantity: 1,
        discountPct: 0,
        unitPrice: product.basePrice,
        marginPct,
      },
    ];
  },
};
