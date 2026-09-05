import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

const PORTAL_AUDIENCE = "dealflow-portal";

export interface PortalClaims {
  quotationId: string;
  contactId: string;
}

export function mintPortalToken(claims: PortalClaims): string {
  return jwt.sign(claims, env.PORTAL_JWT_SECRET, {
    audience: PORTAL_AUDIENCE,
    expiresIn: env.PORTAL_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyPortalToken(token: string): PortalClaims {
  const payload = jwt.verify(token, env.PORTAL_JWT_SECRET, {
    audience: PORTAL_AUDIENCE,
  }) as jwt.JwtPayload & PortalClaims;

  return {
    quotationId: payload.quotationId,
    contactId: payload.contactId,
  };
}
