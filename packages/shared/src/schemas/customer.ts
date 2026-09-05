import { z } from "zod";
import { customerTierSchema } from "./product";

export const customerContactSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  roleTitle: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomerContact = z.infer<typeof customerContactSchema>;

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: customerTierSchema,
  currency: z.string().default("USD"),
  industry: z.string(),
  creditLimit: z.number().int().nonnegative(), // in cents
  paymentTerms: z.string().default("Net 30"),
  contacts: z.array(customerContactSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(2, "Customer name must be at least 2 characters."),
  tier: customerTierSchema.default("BRONZE"),
  currency: z.string().default("USD"),
  industry: z.string().min(2, "Industry is required."),
  creditLimit: z
    .number()
    .int()
    .nonnegative("Credit limit must be 0 or positive."),
  paymentTerms: z.string().default("Net 30"),
});
export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const createContactInputSchema = z.object({
  name: z.string().min(2, "Contact name must be at least 2 characters."),
  email: z.string().email("Valid corporate email is required."),
  phone: z.string().optional(),
  roleTitle: z.string().optional(),
});
export type CreateContactInput = z.infer<typeof createContactInputSchema>;

export interface PortalMagicLink {
  token: string;
  url: string;
  expiresAt: string;
  contactEmail: string;
  customerName: string;
}

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cst-01",
    name: "Global FinTech Dynamics",
    tier: "GOLD",
    currency: "USD",
    industry: "Banking & Financial Services",
    creditLimit: 100000000, // $1,000,000.00
    paymentTerms: "Net 45",
    contacts: [
      {
        id: "cnt-01-a",
        customerId: "cst-01",
        name: "David Sterling",
        email: "d.sterling@globalfintech.com",
        phone: "+1 (555) 234-5678",
        roleTitle: "Chief Procurement Officer",
        createdAt: "2026-08-10T00:00:00.000Z",
        updatedAt: "2026-08-10T00:00:00.000Z",
      },
      {
        id: "cnt-01-b",
        customerId: "cst-01",
        name: "Rebecca Zhao",
        email: "r.zhao@globalfintech.com",
        phone: "+1 (555) 234-5679",
        roleTitle: "VP Infrastructure & Cloud",
        createdAt: "2026-08-12T00:00:00.000Z",
        updatedAt: "2026-08-12T00:00:00.000Z",
      },
    ],
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "cst-02",
    name: "NextGen BioHealth Systems",
    tier: "SILVER",
    currency: "USD",
    industry: "Healthcare & Life Sciences",
    creditLimit: 35000000, // $350,000.00
    paymentTerms: "Net 30",
    contacts: [
      {
        id: "cnt-02-a",
        customerId: "cst-02",
        name: "Dr. Aris Thorne",
        email: "a.thorne@nextgenbio.org",
        phone: "+1 (555) 876-5432",
        roleTitle: "Director of Clinical Informatics",
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      },
    ],
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
  },
  {
    id: "cst-03",
    name: "HyperScale Logistics Group",
    tier: "GOLD",
    currency: "USD",
    industry: "Supply Chain & Freight",
    creditLimit: 75000000, // $750,000.00
    paymentTerms: "Net 30",
    contacts: [
      {
        id: "cnt-03-a",
        customerId: "cst-03",
        name: "Samantha Morales",
        email: "s.morales@hyperscalelogistics.com",
        phone: "+1 (555) 432-1098",
        roleTitle: "Head of Global Sourcing",
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z",
      },
    ],
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-09-03T00:00:00.000Z",
  },
  {
    id: "cst-04",
    name: "Vertex AI Labs",
    tier: "BRONZE",
    currency: "USD",
    industry: "Artificial Intelligence Research",
    creditLimit: 10000000, // $100,000.00
    paymentTerms: "Immediate",
    contacts: [
      {
        id: "cnt-04-a",
        customerId: "cst-04",
        name: "Liam Chen",
        email: "liam@vertexailabs.io",
        phone: "+1 (555) 901-2345",
        roleTitle: "Lead DevOps Architect",
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-20T00:00:00.000Z",
      },
    ],
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  },
  {
    id: "cst-05",
    name: "Omnichannel Retail Corp",
    tier: "SILVER",
    currency: "USD",
    industry: "E-Commerce & Consumer Tech",
    creditLimit: 25000000, // $250,000.00
    paymentTerms: "Net 30",
    contacts: [
      {
        id: "cnt-05-a",
        customerId: "cst-05",
        name: "Jessica Patel",
        email: "j.patel@omnichannelretail.com",
        phone: "+1 (555) 678-9012",
        roleTitle: "Vendor Relations Manager",
        createdAt: "2026-08-25T00:00:00.000Z",
        updatedAt: "2026-08-25T00:00:00.000Z",
      },
    ],
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  },
];
