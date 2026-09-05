import {
  apiRoutes,
  type FulfillmentPlan,
  type ManualSplitInput,
  type Warehouse,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export const fulfillmentApi = {
  async getWarehouses(): Promise<Warehouse[]> {
    const { data } = await apiClient.get(apiRoutes.warehouses.list.path);
    return data.data;
  },
  async getPlan(quotationId: string): Promise<FulfillmentPlan> {
    const { data } = await apiClient.get(
      apiRoutes.fulfillment.get.path.replace(":id", quotationId),
    );
    return data.data;
  },
  async acceptPlan(quotationId: string): Promise<FulfillmentPlan> {
    const { data } = await apiClient.post(
      apiRoutes.fulfillment.accept.path.replace(":id", quotationId),
    );
    return data.data;
  },
  async overridePlan(
    quotationId: string,
    splits: ManualSplitInput[],
  ): Promise<FulfillmentPlan> {
    const { data } = await apiClient.post(
      apiRoutes.fulfillment.override.path.replace(":id", quotationId),
      { splits },
    );
    return data.data;
  },
  async consolidateBackorder(
    quotationId: string,
    backorderId: string,
  ): Promise<FulfillmentPlan> {
    const { data } = await apiClient.post(
      apiRoutes.fulfillment.consolidate.path
        .replace(":id", quotationId)
        .replace(":backorderId", backorderId),
    );
    return data.data;
  },
};
