// apps/api/src/modules/portal/portal.token.ts
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const PORTAL_AUD = "dealflow-portal";

export interface PortalClaims {
  quotationId: string;
  contactId: string;
}

export function mintPortalToken({
  quotationId,
  contactId,
}: PortalClaims): string {
  return jwt.sign(
    { quotationId, contactId, kind: "portal" },
    env.PORTAL_JWT_SECRET,
    {
      audience: PORTAL_AUD,
      expiresIn: env.PORTAL_TOKEN_TTL as jwt.SignOptions["expiresIn"],
    },
  );
}

export function verifyPortalToken(token: string): PortalClaims {
  const p = jwt.verify(token, env.PORTAL_JWT_SECRET, {
    audience: PORTAL_AUD,
  }) as {
    quotationId: string;
    contactId: string;
    kind?: string;
  };
  return { quotationId: p.quotationId, contactId: p.contactId };
}
