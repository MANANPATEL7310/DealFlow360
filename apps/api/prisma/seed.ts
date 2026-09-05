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

  // ── M2: Customers ────────────────────────────────────────────────────────────
  async function upsertCustomer(data: {
    name: string;
    tier: "GOLD" | "SILVER" | "BRONZE";
    currency: string;
  }) {
    const existing = await db.customer.findFirst({
      where: { name: data.name },
    });
    if (existing) {
      return db.customer.update({ where: { id: existing.id }, data });
    }
    return db.customer.create({ data });
  }

  const acme = await upsertCustomer({
    name: "Acme Corp",
    tier: "GOLD",
    currency: "USD",
  });
  await upsertCustomer({ name: "Globex", tier: "SILVER", currency: "USD" });
  await upsertCustomer({ name: "Initech", tier: "BRONZE", currency: "USD" });

  const existingContact = await db.customerContact.findFirst({
    where: { email: "buyer@acme.test" },
  });
  if (existingContact) {
    await db.customerContact.update({
      where: { id: existingContact.id },
      data: { customerId: acme.id, name: "Ada Buyer" },
    });
  } else {
    await db.customerContact.create({
      data: {
        customerId: acme.id,
        email: "buyer@acme.test",
        name: "Ada Buyer",
      },
    });
  }
  console.log("✓ Customers seeded");

  // ── M1: Catalog ─────────────────────────────────────────────────────────────
  async function upsertProduct(data: {
    name: string;
    category: "HARDWARE" | "SERVICES" | "SUBSCRIPTIONS";
    unit: string;
    basePrice: number;
    unitCost: number;
    taxRatePct: number;
    isPromoted?: boolean;
  }) {
    const existing = await db.product.findFirst({
      where: { name: data.name },
    });
    if (existing) {
      return db.product.update({ where: { id: existing.id }, data });
    }
    return db.product.create({ data });
  }

  const laptop = await upsertProduct({
    name: "Pro Laptop 15",
    category: "HARDWARE",
    unit: "unit",
    basePrice: 120000,
    unitCost: 90000,
    taxRatePct: 18,
    isPromoted: true,
  });
  const setup = await upsertProduct({
    name: "Onboarding & Setup",
    category: "SERVICES",
    unit: "hour",
    basePrice: 15000,
    unitCost: 6000,
    taxRatePct: 18,
  });
  const support = await upsertProduct({
    name: "Priority Support",
    category: "SUBSCRIPTIONS",
    unit: "licence",
    basePrice: 5000,
    unitCost: 1500,
    taxRatePct: 18,
  });

  let defaultList = await db.priceList.findFirst({
    where: { name: "Default USD" },
  });
  if (!defaultList) {
    defaultList = await db.priceList.create({
      data: { name: "Default USD", currency: "USD" },
    });
  }

  const listItems = [
    { priceListId: defaultList.id, productId: laptop.id, price: 118000 },
    { priceListId: defaultList.id, productId: setup.id, price: 15000 },
    { priceListId: defaultList.id, productId: support.id, price: 5000 },
  ];
  for (const item of listItems) {
    await db.priceListItem.upsert({
      where: {
        priceListId_productId: {
          priceListId: item.priceListId,
          productId: item.productId,
        },
      },
      update: { price: item.price },
      create: item,
    });
  }
  console.log("✓ Products & Price Lists seeded");

  // ── M3: Discount Governance ─────────────────────────────────────────────────
  const discountTiers: {
    customerTier: "BRONZE" | "SILVER" | "GOLD";
    maxDiscountPct: number;
  }[] = [
    { customerTier: "BRONZE", maxDiscountPct: 5 },
    { customerTier: "SILVER", maxDiscountPct: 10 },
    { customerTier: "GOLD", maxDiscountPct: 15 },
  ];
  for (const dt of discountTiers) {
    await db.discountTier.upsert({
      where: { customerTier: dt.customerTier },
      update: { maxDiscountPct: dt.maxDiscountPct },
      create: dt,
    });
  }

  const categoryCeilings: {
    category: "HARDWARE" | "SERVICES" | "SUBSCRIPTIONS";
    maxDiscountPct: number;
  }[] = [
    { category: "HARDWARE", maxDiscountPct: 15 },
    { category: "SERVICES", maxDiscountPct: 10 },
    { category: "SUBSCRIPTIONS", maxDiscountPct: 12 },
  ];
  for (const cc of categoryCeilings) {
    await db.categoryCeiling.upsert({
      where: { category: cc.category },
      update: { maxDiscountPct: cc.maxDiscountPct },
      create: cc,
    });
  }

  const approvalRules = [
    {
      name: "small overage",
      minScore: 0.01,
      maxScore: 3,
      requiredLevels: ["SALES_MANAGER"],
    },
    {
      name: "high risk",
      minScore: 3,
      maxScore: null,
      requiredLevels: ["SALES_MANAGER", "FINANCE"],
    },
  ];
  for (const rule of approvalRules) {
    const existing = await db.approvalChainRule.findFirst({
      where: { name: rule.name },
    });
    if (existing) {
      await db.approvalChainRule.update({
        where: { id: existing.id },
        data: rule,
      });
    } else {
      await db.approvalChainRule.create({
        data: rule,
      });
    }
  }
  console.log("✓ Discount Governance seeded");

  // ── M6: Upsell Rules ────────────────────────────────────────────────────────
  const upsellRules = [
    {
      productId: laptop.id,
      suggestedId: setup.id,
      coPurchaseScore: 0.85,
      minMarginPct: 10,
    },
    {
      productId: laptop.id,
      suggestedId: support.id,
      coPurchaseScore: 0.7,
      minMarginPct: 15,
    },
  ];
  for (const rule of upsellRules) {
    const existingRule = await db.upsellRule.findFirst({
      where: { productId: rule.productId, suggestedId: rule.suggestedId },
    });
    if (existingRule) {
      await db.upsellRule.update({
        where: { id: existingRule.id },
        data: rule,
      });
    } else {
      await db.upsellRule.create({ data: rule });
    }
  }
  console.log("✓ Upsell Rules seeded");

  // ── M7: Warehouses + stock (uncomment after M7 lands) ────────────────────────
  // const mainWh = await db.warehouse.create({ data: { name: "Main Warehouse", location: "NY", shippingCostWeight: 1 } });
  // const eastWh = await db.warehouse.create({ data: { name: "East Depot", location: "MA", shippingCostWeight: 1.4 } });
  // await db.stockLevel.createMany({
  //   data: [
  //     { warehouseId: mainWh.id, productId: laptop.id, quantity: 8, replenishThreshold: 3 },
  //     { warehouseId: eastWh.id, productId: laptop.id, quantity: 5, replenishThreshold: 2 },
  //   ],
  // });

  // ── M8: Subscription Plan ───────────────────────────────────────────────────
  const existingPlan = await db.subscriptionPlan.findFirst({
    where: { name: "Priority Support — Monthly" },
  });
  if (existingPlan) {
    await db.subscriptionPlan.update({
      where: { id: existingPlan.id },
      data: {
        interval: "MONTHLY",
        prorationEnabled: true,
        cancellationRule: "prorated_credit",
      },
    });
  } else {
    await db.subscriptionPlan.create({
      data: {
        name: "Priority Support — Monthly",
        interval: "MONTHLY",
        prorationEnabled: true,
        cancellationRule: "prorated_credit",
      },
    });
  }
  console.log("✓ Subscription Plans seeded");

  console.log("✓ Seed complete");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
