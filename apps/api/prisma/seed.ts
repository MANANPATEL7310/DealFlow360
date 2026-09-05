// apps/api/prisma/seed.ts
/**
 * DealFlow360 — Prisma Seed Script
 *
 * Strategy: Each module uncomments its own section as its models land.
 * All upserts are idempotent — safe to re-run at any time.
 *
 * Run with: pnpm db:seed
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // ── M0: Users — one per internal role (password: "password123") ─────────────
  const password = await bcrypt.hash("password123", 10);
  for (const role of [
    "sales_rep",
    "sales_manager",
    "finance",
    "admin",
  ] as const) {
    await db.user.upsert({
      where: { email: `${role}@dealflow360.dev` },
      update: {},
      create: {
        email: `${role}@dealflow360.dev`,
        name: role.replace("_", " "),
        password,
        role,
      },
    });
  }
  console.log("✓ Users seeded");

  // ── M0: SystemSettings — governance thresholds (JSON-encoded values) ────────
  const settings: Record<string, unknown> = {
    "risk.perLineTolerancePct": 5,
    "risk.blendedThreshold": 3,
    "risk.financeValueThresholdMinor": 500000, // $5,000
    "health.stalledDays": 7,
    "health.anomalyK": 2,
    "ai.enabled": false,
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.systemSetting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  }
  console.log("✓ SystemSettings seeded");

  // ── M2: Customers (uncomment after M2 lands) ─────────────────────────────────
  // const acme = await db.customer.create({ data: { name: "Acme Corp", tier: "GOLD", currency: "USD" } });
  // await db.customer.create({ data: { name: "Globex", tier: "SILVER", currency: "USD" } });
  // await db.customer.create({ data: { name: "Initech", tier: "BRONZE", currency: "USD" } });
  // await db.customerContact.create({ data: { customerId: acme.id, email: "buyer@acme.test", name: "Ada Buyer" } });

  // ── M1: Catalog (uncomment after M1 lands) ────────────────────────────────────
  // const laptop = await db.product.create({
  //   data: { name: "Pro Laptop 15", category: "HARDWARE", unit: "unit", basePrice: 120000, unitCost: 90000, taxRatePct: 18, isPromoted: true },
  // });
  // const setup = await db.product.create({
  //   data: { name: "Onboarding & Setup", category: "SERVICES", unit: "hour", basePrice: 15000, unitCost: 6000, taxRatePct: 18 },
  // });
  // const support = await db.product.create({
  //   data: { name: "Priority Support", category: "SUBSCRIPTIONS", unit: "licence", basePrice: 5000, unitCost: 1500, taxRatePct: 18 },
  // });
  // const list = await db.priceList.create({ data: { name: "Default USD", currency: "USD" } });
  // await db.priceListItem.createMany({
  //   data: [
  //     { priceListId: list.id, productId: laptop.id, price: 118000 },
  //     { priceListId: list.id, productId: setup.id, price: 15000 },
  //     { priceListId: list.id, productId: support.id, price: 5000 },
  //   ],
  // });

  // ── M3: Discount Governance (uncomment after M3 lands) ───────────────────────
  // await db.discountTier.createMany({
  //   data: [
  //     { customerTier: "BRONZE", maxDiscountPct: 5 },
  //     { customerTier: "SILVER", maxDiscountPct: 10 },
  //     { customerTier: "GOLD", maxDiscountPct: 15 },
  //   ],
  // });
  // await db.categoryCeiling.createMany({
  //   data: [
  //     { category: "HARDWARE", maxDiscountPct: 15 },
  //     { category: "SERVICES", maxDiscountPct: 10 },
  //     { category: "SUBSCRIPTIONS", maxDiscountPct: 12 },
  //   ],
  // });
  // await db.approvalChainRule.createMany({
  //   data: [
  //     { name: "small overage", minScore: 0.01, maxScore: 3, requiredLevels: ["SALES_MANAGER"] },
  //     { name: "high risk", minScore: 3, maxScore: null, requiredLevels: ["SALES_MANAGER", "FINANCE"] },
  //   ],
  // });

  // ── M7: Warehouses + stock (uncomment after M7 lands) ────────────────────────
  // const mainWh = await db.warehouse.create({ data: { name: "Main Warehouse", location: "NY", shippingCostWeight: 1 } });
  // const eastWh = await db.warehouse.create({ data: { name: "East Depot", location: "MA", shippingCostWeight: 1.4 } });
  // await db.stockLevel.createMany({
  //   data: [
  //     { warehouseId: mainWh.id, productId: laptop.id, quantity: 8, replenishThreshold: 3 },
  //     { warehouseId: eastWh.id, productId: laptop.id, quantity: 5, replenishThreshold: 2 },
  //   ],
  // });

  // ── M8: Subscription Plan (uncomment after M8 lands) ─────────────────────────
  // await db.subscriptionPlan.create({
  //   data: { name: "Priority Support — Monthly", interval: "MONTHLY", prorationEnabled: true, cancellationRule: "prorated_credit" },
  // });

  console.log("✓ Seed complete");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
