// apps/api/src/types/express.d.ts
// Express Request augmentation — adds req.user (internal) and req.portal (customer portal)
import "express";

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth on internal routes */
      user?: {
        sub: string;
        email: string;
        name: string;
        role: "sales_rep" | "sales_manager" | "finance" | "admin";
      };
      /** Populated by requirePortalAuth on customer portal routes */
      portal?: {
        quotationId: string;
        contactId: string;
      };
    }
  }
}

export {};
