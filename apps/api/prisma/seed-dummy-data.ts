// apps/api/prisma/seed-dummy-data.ts
/**
 * DealFlow360 — Comprehensive Cloud DB Dummy Data Seeder
 *
 * Populates 250-300+ minimum rows for core tables:
 * - Customers (250+ rows)
 * - Customer Contacts (300+ rows)
 * - Products (250+ rows)
 * - PriceList Items (250+ rows)
 * - Quotations / Deals (250+ new rows -> 300+ total)
 * - Quotation Lines (800+ rows)
 * - Billing Schedules & Invoices (200+ rows)
 * - Payments (100+ rows)
 * - Warehouses & Stock Levels (500+ rows)
 * - Deal Health Alerts (60+ rows)
 * - Sales Rep Users (10+ reps)
 *
 * Safe to execute against Neon cloud PostgreSQL.
 */

import {
  PrismaClient,
  ProductCategory,
  CustomerTier,
  QuotationStatus,
  LineType,
  InvoiceStatus,
  InvoiceKind,
  AlertType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Helper for seeded pseudo-random or varied generation
function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// Industry list for customer company name generation
const COMPANY_PREFIXES = [
  "Apex",
  "Vertex",
  "Nexis",
  "Aura",
  "Quantum",
  "Synergy",
  "Omni",
  "Crest",
  "Vanguard",
  "Pinnacle",
  "Starlight",
  "Hyperion",
  "Beacon",
  "Solstice",
  "Echo",
  "Atlas",
  "Terra",
  "Zenith",
  "Novus",
  "Strata",
  "Acro",
  "Helios",
  "Polaris",
  "Dynamo",
  "Optima",
  "Catalyst",
  "Kore",
  "Veloce",
  "Axiom",
  "Meridian",
  "Horizon",
  "Prism",
  "Cobalt",
  "Ironclad",
  "Velox",
  "Orbit",
  "Pulse",
  "Vector",
  "Titan",
  "Aegis",
  "Frontier",
  "Elevation",
  "Luminary",
  "Spectra",
];

const COMPANY_SUFFIXES = [
  "Technologies",
  "Solutions",
  "Enterprises",
  "Systems",
  "Global",
  "Networks",
  "Logistics",
  "Software",
  "Dynamics",
  "Cloud",
  "Data Labs",
  "Innovations",
  "Ventures",
  "Robotics",
  "Digital",
  "Holdings",
  "Group",
  "Analytics",
  "Industries",
  "Consulting",
  "Security",
  "Infra",
  "Media",
  "Biotech",
  "Energy",
  "Financial",
  "Capital",
  "Interactive",
  "Telecom",
];

const FIRST_NAMES = [
  "Alexander",
  "Sophia",
  "Liam",
  "Olivia",
  "Noah",
  "Emma",
  "James",
  "Ava",
  "William",
  "Isabella",
  "Benjamin",
  "Mia",
  "Lucas",
  "Charlotte",
  "Henry",
  "Amelia",
  "Theodore",
  "Harper",
  "Jack",
  "Evelyn",
  "Daniel",
  "Abigail",
  "Matthew",
  "Emily",
  "Sebastian",
  "Elizabeth",
  "Ethan",
  "Mila",
  "Oliver",
  "Ella",
  "Michael",
  "Avery",
  "Samuel",
  "Sofia",
  "David",
  "Camila",
  "Joseph",
  "Aria",
  "Carter",
  "Scarlett",
  "Owen",
  "Victoria",
  "Wyatt",
  "Madison",
  "John",
  "Luna",
  "Luke",
  "Grace",
  "Asher",
  "Chloe",
  "Julian",
  "Penelope",
  "Leo",
  "Layla",
  "Gabriel",
  "Riley",
  "Anthony",
  "Zoey",
  "Dylan",
  "Nora",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
];

const HARDWARE_TEMPLATES = [
  {
    name: "Enterprise Rack Server {model}",
    unit: "unit",
    minBase: 150000,
    maxBase: 650000,
    desc: "High-density enterprise rack server with dual Intel Xeon/AMD EPYC processors and redundant hot-swappable power supplies.",
  },
  {
    name: "Edge Computing Gateway {model}",
    unit: "unit",
    minBase: 45000,
    maxBase: 120000,
    desc: "Ruggedized industrial edge gateway for IoT telemetry, multi-sensor protocol bridging, and local inference.",
  },
  {
    name: "Layer 3 Managed PoE+ Switch {model}",
    unit: "unit",
    minBase: 35000,
    maxBase: 180000,
    desc: "48-Port Gigabit PoE+ enterprise switch with 10G SFP+ uplink ports and hardware line-rate routing.",
  },
  {
    name: "NextGen Threat Prevention Firewall {model}",
    unit: "unit",
    minBase: 80000,
    maxBase: 450000,
    desc: "High-throughput firewall appliance featuring inline deep packet inspection, zero-day threat analysis, and SSL offload.",
  },
  {
    name: "Ultra-Fast NVMe Storage SAN {model}",
    unit: "unit",
    minBase: 300000,
    maxBase: 950000,
    desc: "Enterprise All-Flash NVMe over Fabrics (NVMe-oF) storage appliance with sub-millisecond I/O latency.",
  },
  {
    name: "Enterprise Ergonomic Workstation {model}",
    unit: "unit",
    minBase: 120000,
    maxBase: 280000,
    desc: "Precision workstation with ECC memory, dedicated workstation GPU, and ISV-certified system architecture.",
  },
  {
    name: "Industrial Ruggedized Tablet {model}",
    unit: "unit",
    minBase: 65000,
    maxBase: 140000,
    desc: "MIL-STD-810H and IP65-rated handheld tablet with integrated 2D barcode scanner and hot-swappable battery.",
  },
  {
    name: "Smart Conference Telepresence Hub {model}",
    unit: "unit",
    minBase: 50000,
    maxBase: 210000,
    desc: "All-in-one 4K beamforming microphone video bar with auto-framing and multi-display output.",
  },
  {
    name: "Biometric Access Control Terminal {model}",
    unit: "unit",
    minBase: 25000,
    maxBase: 85000,
    desc: "Multimodal touchless facial recognition and NFC RFID reader with tamper-proof cryptographic enclave.",
  },
  {
    name: "High-Capacity Online UPS System {model}",
    unit: "unit",
    minBase: 40000,
    maxBase: 220000,
    desc: "Double-conversion online uninterruptible power supply with expandable lithium-iron battery packs.",
  },
];

const SERVICE_TEMPLATES = [
  {
    name: "Architecture & Cloud Modernization Consulting",
    unit: "hour",
    minBase: 18000,
    maxBase: 35000,
    desc: "Comprehensive review and blueprint design for cloud-native microservices, multi-region failover, and cost optimization.",
  },
  {
    name: "Zero Trust Security Architecture Audit",
    unit: "engagement",
    minBase: 450000,
    maxBase: 1500000,
    desc: "In-depth posture assessment evaluating IAM, network micro-segmentation, and endpoint validation against NIST 800-207.",
  },
  {
    name: "24/7 Managed Incident Detection & Response",
    unit: "month",
    minBase: 250000,
    maxBase: 800000,
    desc: "Continuous threat hunting, SOC monitoring, automated containment playbooks, and forensic RCA reports.",
  },
  {
    name: "Enterprise API Integration & Custom Connectors",
    unit: "day",
    minBase: 120000,
    maxBase: 240000,
    desc: "Custom development of hardened bidirectional ETL connectors between ERP, CRM, and internal warehouses.",
  },
  {
    name: "Disaster Recovery Drill & Failover Simulation",
    unit: "drill",
    minBase: 300000,
    maxBase: 900000,
    desc: "Full-scale live recovery drill validating RTO and RPO objectives across hybrid multi-cloud infrastructure.",
  },
  {
    name: "DevSecOps CI/CD Automation Implementation",
    unit: "project",
    minBase: 500000,
    maxBase: 1800000,
    desc: "Turnkey pipeline design integrating static analysis, container image signing, and automated compliance gates.",
  },
  {
    name: "Staff Enablement & Technical Deep Dive Training",
    unit: "session",
    minBase: 40000,
    maxBase: 120000,
    desc: "Hands-on engineering workshops on distributed systems architecture, observability, and incident triaging.",
  },
  {
    name: "Executive AI Readiness & Governance Advisory",
    unit: "package",
    minBase: 600000,
    maxBase: 2000000,
    desc: "Strategic governance framework for LLM security, hallucination containment, and proprietary data protection.",
  },
];

const SUBSCRIPTION_TEMPLATES = [
  {
    name: "DealFlow360 Enterprise Platform",
    unit: "seat/month",
    minBase: 8500,
    maxBase: 25000,
    desc: "Complete CPQ, automated risk governance, fulfillment routing, and customer portal suite for sales operations.",
  },
  {
    name: "Cloud APM & Real-Time Distributed Tracing",
    unit: "host/month",
    minBase: 4000,
    maxBase: 12000,
    desc: "Full-fidelity OpenTelemetry ingestion, distributed trace correlation, and automated anomaly detection.",
  },
  {
    name: "Identity & Access Governance Platform (IGA)",
    unit: "identity/month",
    minBase: 600,
    maxBase: 2500,
    desc: "Automated user lifecycle provisioning, privileged access management (PAM), and continuous SOC 2 audit readiness.",
  },
  {
    name: "Enterprise Managed Kafka Event Streaming",
    unit: "cluster/month",
    minBase: 75000,
    maxBase: 350000,
    desc: "Dedicated high-throughput event streaming cluster with 99.99% SLA, multi-AZ replication, and schema registry.",
  },
  {
    name: "AI Autonomous Operations Copilot Tier",
    unit: "workspace/month",
    minBase: 15000,
    maxBase: 60000,
    desc: "Domain-specific AI assistants with deterministic risk checks, proposal generation, and negotiation drafting.",
  },
  {
    name: "Continuous Cloud Compliance & Posture Monitoring",
    unit: "account/month",
    minBase: 12000,
    maxBase: 45000,
    desc: "Automated drift detection, CIS benchmark scanning, and remediation workflows across AWS, Azure, and GCP.",
  },
  {
    name: "High-Priority 24/7 SLA Technical Support",
    unit: "license/month",
    minBase: 5000,
    maxBase: 20000,
    desc: "Dedicated Technical Account Manager (TAM), 15-minute response SLA for Sev-1 tickets, and quarterly architecture reviews.",
  },
];

const MODEL_CODES = [
  "Pro-X",
  "Elite-9",
  "Ultra-300",
  "Max-500",
  "Enterprise-v4",
  "Apex-2000",
  "Titan-V",
  "Prime-8",
  "Edge-100",
  "Quantum-5",
];

async function main() {
  console.log("🚀 Starting DealFlow360 Large Dataset Seeder...");

  // 1. Ensure internal sales team users exist
  const passwordHash = await bcrypt.hash("password123", 10);

  const additionalReps = [
    {
      email: "sarah.chen@dealflow360.dev",
      name: "Sarah Chen",
      role: "sales_rep",
    },
    {
      email: "marcus.vance@dealflow360.dev",
      name: "Marcus Vance",
      role: "sales_rep",
    },
    {
      email: "elena.rostova@dealflow360.dev",
      name: "Elena Rostova",
      role: "sales_rep",
    },
    {
      email: "david.kim@dealflow360.dev",
      name: "David Kim",
      role: "sales_rep",
    },
    {
      email: "priya.patel@dealflow360.dev",
      name: "Priya Patel",
      role: "sales_rep",
    },
    {
      email: "james.wilson@dealflow360.dev",
      name: "James Wilson",
      role: "sales_rep",
    },
    {
      email: "maria.garcia@dealflow360.dev",
      name: "Maria Garcia",
      role: "sales_rep",
    },
    {
      email: "alex.tremblay@dealflow360.dev",
      name: "Alex Tremblay",
      role: "sales_rep",
    },
  ];

  for (const rep of additionalReps) {
    await db.user.upsert({
      where: { email: rep.email },
      update: {},
      create: { ...rep, password: passwordHash },
    });
  }

  const allUsers = await db.user.findMany();
  const salesReps = allUsers.filter(
    (u) => u.role === "sales_rep" || u.role === "sales_manager",
  );
  console.log(
    `✓ Ensured ${allUsers.length} users (${salesReps.length} sales reps/managers)`,
  );

  // 2. Ensure default PriceList exists
  let defaultPriceList = await db.priceList.findFirst({
    where: { name: "Default USD" },
  });
  if (!defaultPriceList) {
    defaultPriceList = await db.priceList.create({
      data: { name: "Default USD", currency: "USD" },
    });
  }

  // 3. Ensure Subscription plans exist
  const monthlyPlan = await db.subscriptionPlan.upsert({
    where: { id: "plan-monthly-default" },
    update: {},
    create: {
      id: "plan-monthly-default",
      name: "Standard Monthly Plan",
      interval: "MONTHLY",
      prorationEnabled: true,
      cancellationRule: "prorated_credit",
    },
  });

  const annualPlan = await db.subscriptionPlan.upsert({
    where: { id: "plan-annual-default" },
    update: {},
    create: {
      id: "plan-annual-default",
      name: "Enterprise Annual Plan",
      interval: "YEARLY",
      prorationEnabled: true,
      cancellationRule: "prorated_credit",
    },
  });

  // 4. Seed Products to reach at least 250 products
  const currentProductCount = await db.product.count();
  console.log(`Current product count: ${currentProductCount}`);
  const targetNewProducts = Math.max(0, 260 - currentProductCount);

  if (targetNewProducts > 0) {
    console.log(`Seeding ${targetNewProducts} new catalog products...`);
    const newProductsData = [];

    for (let i = 0; i < targetNewProducts; i++) {
      const catChoice = i % 3;
      let category: ProductCategory;
      let template: any;

      if (catChoice === 0) {
        category = "HARDWARE";
        template = randomChoice(HARDWARE_TEMPLATES);
      } else if (catChoice === 1) {
        category = "SERVICES";
        template = randomChoice(SERVICE_TEMPLATES);
      } else {
        category = "SUBSCRIPTIONS";
        template = randomChoice(SUBSCRIPTION_TEMPLATES);
      }

      const model = randomChoice(MODEL_CODES);
      const name =
        template.name.replace("{model}", model) +
        ` - Series ${Math.floor(i / 10) + 1} (${i + 1})`;
      const basePrice = randomInt(template.minBase, template.maxBase);
      // Unit cost is 50-75% of base price for positive margin
      const marginFactor = randomFloat(0.5, 0.75);
      const unitCost = Math.round(basePrice * marginFactor);
      const taxRatePct = randomChoice([0, 5, 8.5, 10, 18]);
      const isPromoted = Math.random() < 0.2;

      newProductsData.push({
        name,
        category,
        unit: template.unit,
        basePrice,
        unitCost,
        taxRatePct,
        description: template.desc,
        isPromoted,
      });
    }

    // Insert in batches
    for (let i = 0; i < newProductsData.length; i += 50) {
      const batch = newProductsData.slice(i, i + 50);
      await db.product.createMany({ data: batch });
    }
  }

  const allProducts = await db.product.findMany();
  console.log(`✓ Products count in DB: ${allProducts.length}`);

  // Link products to default price list
  const existingPriceListItems = await db.priceListItem.findMany({
    where: { priceListId: defaultPriceList.id },
    select: { productId: true },
  });
  const linkedProductIds = new Set(
    existingPriceListItems.map((item) => item.productId),
  );

  const unlinkedProducts = allProducts.filter(
    (p) => !linkedProductIds.has(p.id),
  );
  if (unlinkedProducts.length > 0) {
    const priceItemsData = unlinkedProducts.map((p) => ({
      priceListId: defaultPriceList.id,
      productId: p.id,
      price: p.basePrice,
    }));

    for (let i = 0; i < priceItemsData.length; i += 100) {
      const batch = priceItemsData.slice(i, i + 100);
      await db.priceListItem.createMany({ data: batch, skipDuplicates: true });
    }
  }
  console.log(`✓ Price list items linked: ${await db.priceListItem.count()}`);

  // 5. Seed Warehouses & Stock Levels
  const warehouseNames = [
    {
      name: "US-East Distribution Center",
      location: "Secaucus, NJ",
      shippingCostWeight: 1.0,
    },
    {
      name: "US-West Fulfillment Hub",
      location: "Hillsboro, OR",
      shippingCostWeight: 1.2,
    },
    {
      name: "EU-Central Operations Hub",
      location: "Frankfurt, Germany",
      shippingCostWeight: 1.5,
    },
    {
      name: "AP-Southeast Warehouse",
      location: "Singapore",
      shippingCostWeight: 1.8,
    },
    {
      name: "UK-North Logistics Depot",
      location: "Manchester, UK",
      shippingCostWeight: 1.4,
    },
  ];

  for (const wh of warehouseNames) {
    const existing = await db.warehouse.findFirst({ where: { name: wh.name } });
    if (!existing) {
      const createdWh = await db.warehouse.create({ data: wh });
      // add stock levels for hardware products
      const hardwareProds = allProducts
        .filter((p) => p.category === "HARDWARE")
        .slice(0, 40);
      const stockData = hardwareProds.map((p) => ({
        warehouseId: createdWh.id,
        productId: p.id,
        quantity: randomInt(20, 250),
        replenishThreshold: randomInt(10, 30),
      }));
      await db.stockLevel.createMany({ data: stockData, skipDuplicates: true });
    }
  }
  console.log(
    `✓ Warehouses seeded (${await db.warehouse.count()}) with stock levels (${await db.stockLevel.count()})`,
  );

  // 6. Seed Customers (Target: 250+ customers)
  const currentCustomerCount = await db.customer.count();
  console.log(`Current customer count: ${currentCustomerCount}`);
  const targetNewCustomers = Math.max(0, 260 - currentCustomerCount);

  if (targetNewCustomers > 0) {
    console.log(`Seeding ${targetNewCustomers} new enterprise customers...`);
    const customersData = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < targetNewCustomers; i++) {
      let companyName = `${randomChoice(COMPANY_PREFIXES)} ${randomChoice(COMPANY_SUFFIXES)}`;
      let attempt = 0;
      while (usedNames.has(companyName) && attempt < 20) {
        companyName = `${randomChoice(COMPANY_PREFIXES)} ${randomChoice(COMPANY_SUFFIXES)} ${randomChoice(["Corp", "LLC", "Inc", "Group", "Solutions"])}`;
        attempt++;
      }
      usedNames.add(companyName);

      const tierChoice = Math.random();
      const tier: CustomerTier =
        tierChoice < 0.25 ? "GOLD" : tierChoice < 0.65 ? "SILVER" : "BRONZE";
      const currency = randomChoice(["USD", "USD", "USD", "EUR", "GBP"]);
      const createdDaysAgo = randomInt(10, 400);

      customersData.push({
        name: companyName,
        tier,
        currency,
        createdAt: daysAgo(createdDaysAgo),
        updatedAt: daysAgo(Math.max(1, createdDaysAgo - randomInt(1, 10))),
      });
    }

    for (let i = 0; i < customersData.length; i += 50) {
      const batch = customersData.slice(i, i + 50);
      await db.customer.createMany({ data: batch });
    }
  }

  const allCustomers = await db.customer.findMany({
    include: { contacts: true },
  });
  console.log(`✓ Customers count in DB: ${allCustomers.length}`);

  // Ensure each customer has at least 1-2 contacts
  const contactsToAdd: Array<{
    customerId: string;
    email: string;
    name: string;
  }> = [];

  for (const cust of allCustomers) {
    if (cust.contacts.length === 0) {
      const firstName = randomChoice(FIRST_NAMES);
      const lastName = randomChoice(LAST_NAMES);
      const cleanCompName = cust.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 10);
      contactsToAdd.push({
        customerId: cust.id,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanCompName}.com`,
      });

      if (cust.tier === "GOLD") {
        const fn2 = randomChoice(FIRST_NAMES);
        const ln2 = randomChoice(LAST_NAMES);
        contactsToAdd.push({
          customerId: cust.id,
          name: `${fn2} ${ln2}`,
          email: `${fn2.toLowerCase()}.${ln2.toLowerCase()}@${cleanCompName}.com`,
        });
      }
    }
  }

  if (contactsToAdd.length > 0) {
    for (let i = 0; i < contactsToAdd.length; i += 100) {
      const batch = contactsToAdd.slice(i, i + 100);
      await db.customerContact.createMany({ data: batch });
    }
  }
  console.log(`✓ Customer contacts in DB: ${await db.customerContact.count()}`);

  // 7. Seed Quotations (Target: at least 250-300 quotations with lines)
  const currentQuotationCount = await db.quotation.count();
  console.log(`Current quotation count: ${currentQuotationCount}`);
  const targetNewQuotations = Math.max(0, 270 - currentQuotationCount);

  if (targetNewQuotations > 0) {
    console.log(
      `Seeding ${targetNewQuotations} new quotations with realistic lines and calculations...`,
    );
    const statuses: QuotationStatus[] = [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "SENT",
      "UNDER_NEGOTIATION",
      "CONFIRMED",
      "FULFILLMENT",
      "BILLING",
      "PAID",
      "REJECTED",
    ];

    const hardwareProducts = allProducts.filter(
      (p) => p.category === "HARDWARE",
    );
    const serviceProducts = allProducts.filter(
      (p) => p.category === "SERVICES",
    );
    const subProducts = allProducts.filter(
      (p) => p.category === "SUBSCRIPTIONS",
    );

    for (let i = 0; i < targetNewQuotations; i++) {
      const customer = randomChoice(allCustomers);
      const salesRep = randomChoice(salesReps);
      const status = randomChoice(statuses);
      const quotationAgeDays = randomInt(2, 300);
      const createdAt = daysAgo(quotationAgeDays);
      const lastActivityAt = daysAgo(
        Math.max(1, quotationAgeDays - randomInt(0, 20)),
      );

      // Choose 2 to 4 products for this quotation
      const lineCount = randomInt(2, 4);
      const selectedProducts: any[] = [];

      // Try to include balanced products
      if (hardwareProducts.length > 0)
        selectedProducts.push(randomChoice(hardwareProducts));
      if (serviceProducts.length > 0)
        selectedProducts.push(randomChoice(serviceProducts));
      if (subProducts.length > 0 && selectedProducts.length < lineCount)
        selectedProducts.push(randomChoice(subProducts));
      while (selectedProducts.length < lineCount) {
        selectedProducts.push(randomChoice(allProducts));
      }

      // Pre-calculate lines and totals
      let subtotalMinor = 0;
      let discountTotalMinor = 0;
      let taxTotalMinor = 0;
      let totalCostMinor = 0;

      const linesPayload = selectedProducts.map((prod) => {
        const qty =
          prod.category === "HARDWARE"
            ? randomInt(1, 15)
            : prod.category === "SERVICES"
              ? randomInt(10, 80)
              : randomInt(5, 50);
        const unitPriceMinor = prod.basePrice;
        const unitCostMinor = prod.unitCost;
        const discountPct = randomChoice([0, 0, 5, 8, 10, 12, 15]);
        const lineType: LineType =
          prod.category === "SUBSCRIPTIONS" ? "RECURRING" : "ONE_TIME";
        const subscriptionPlanId =
          lineType === "RECURRING"
            ? Math.random() < 0.5
              ? monthlyPlan.id
              : annualPlan.id
            : null;

        const gross = qty * unitPriceMinor;
        const disc = Math.round(gross * (discountPct / 100));
        const net = gross - disc;
        const tax = Math.round(net * ((prod.taxRatePct ?? 0) / 100));

        subtotalMinor += gross;
        discountTotalMinor += disc;
        taxTotalMinor += tax;
        totalCostMinor += qty * unitCostMinor;

        return {
          productId: prod.id,
          qty,
          unitPriceMinor,
          unitCostMinor,
          discountPct,
          lineType,
          subscriptionPlanId,
        };
      });

      const grandTotalMinor =
        subtotalMinor - discountTotalMinor + taxTotalMinor;
      const totalNetMinor = subtotalMinor - discountTotalMinor;
      const marginPct =
        totalNetMinor > 0
          ? Math.round(
              ((totalNetMinor - totalCostMinor) / totalNetMinor) * 10000,
            ) / 100
          : 0;
      const blendedRiskScore = randomFloat(0.1, 4.5);

      // Create quotation with lines
      const createdQuote = await db.quotation.create({
        data: {
          customerId: customer.id,
          salesRepId: salesRep.id,
          status,
          blendedRiskScore,
          subtotalMinor,
          discountTotalMinor,
          taxTotalMinor,
          grandTotalMinor,
          marginPct,
          lastActivityAt,
          createdAt,
          updatedAt: lastActivityAt,
          lines: {
            create: linesPayload,
          },
        },
      });

      // If status is CONFIRMED, BILLING, or PAID, generate BillingSchedule + Invoice
      if (["CONFIRMED", "FULFILLMENT", "BILLING", "PAID"].includes(status)) {
        const schedule = await db.billingSchedule.create({
          data: { quotationId: createdQuote.id },
        });

        const invoiceStatus: InvoiceStatus =
          status === "PAID"
            ? "PAID"
            : status === "BILLING"
              ? "ISSUED"
              : "DRAFT";
        const invoice = await db.invoice.create({
          data: {
            scheduleId: schedule.id,
            kind: "ONE_TIME",
            amountMinor: grandTotalMinor,
            status: invoiceStatus,
            createdAt: lastActivityAt,
            updatedAt: lastActivityAt,
          },
        });

        if (status === "PAID") {
          await db.payment.create({
            data: {
              invoiceId: invoice.id,
              amountMinor: grandTotalMinor,
              status: "recorded",
              createdAt: lastActivityAt,
            },
          });
        }
      }

      // If status is PENDING_APPROVAL, create ApprovalSteps
      if (status === "PENDING_APPROVAL") {
        await db.approvalStep.create({
          data: {
            quotationId: createdQuote.id,
            level: "SALES_MANAGER",
            sequence: 1,
            decision: "PENDING",
          },
        });
      }

      // Add DealHealthAlerts for stalled deals or high discount
      if (blendedRiskScore > 3.0 || quotationAgeDays > 60) {
        const alertType: AlertType =
          blendedRiskScore > 3.0 ? "DISCOUNT_ANOMALY" : "STALLED";
        await db.dealHealthAlert.create({
          data: {
            quotationId: createdQuote.id,
            type: alertType,
            severity: blendedRiskScore > 4.0 ? "high" : "medium",
            detail:
              alertType === "DISCOUNT_ANOMALY"
                ? `High blended discount risk score (${blendedRiskScore}) detected on order exceeding normal policy limits.`
                : `Quotation has been inactive for ${quotationAgeDays} days without customer progression.`,
            status: "open",
            createdAt: lastActivityAt,
          },
        });
      }
    }
  }

  // 8. Ensure Invoices count reaches at least 250
  const currentInvoiceCount = await db.invoice.count();
  if (currentInvoiceCount < 260) {
    console.log(
      `Boosting invoices count to 260+ (current: ${currentInvoiceCount})...`,
    );
    const allSchedules = await db.billingSchedule.findMany({
      include: {
        quotation: {
          include: { lines: true },
        },
      },
    });

    const additionalInvoices = [];
    let needed = 265 - currentInvoiceCount;

    for (const sched of allSchedules) {
      if (needed <= 0) break;
      const recurringLines = sched.quotation.lines.filter(
        (l) => l.lineType === "RECURRING",
      );
      const lineToUse = recurringLines[0] ?? sched.quotation.lines[0];
      const amountMinor = lineToUse
        ? Math.round(lineToUse.qty * lineToUse.unitPriceMinor * 0.9)
        : randomInt(5000, 50000);

      for (let m = 1; m <= 3 && needed > 0; m++) {
        const invDate = daysAgo(m * 30);
        const invStatus: InvoiceStatus = randomChoice([
          "PAID",
          "PAID",
          "ISSUED",
          "DRAFT",
        ]);
        additionalInvoices.push({
          scheduleId: sched.id,
          kind: (lineToUse?.lineType === "RECURRING"
            ? "RECURRING"
            : "ONE_TIME") as InvoiceKind,
          lineId: lineToUse?.id ?? null,
          periodStart: daysAgo((m + 1) * 30),
          periodEnd: invDate,
          amountMinor,
          status: invStatus,
          createdAt: invDate,
          updatedAt: invDate,
        });
        needed--;
      }
    }

    if (additionalInvoices.length > 0) {
      await db.invoice.createMany({ data: additionalInvoices });
    }
  }

  // 9. Final verification and counts summary
  const summary = {
    users: await db.user.count(),
    customers: await db.customer.count(),
    customerContacts: await db.customerContact.count(),
    products: await db.product.count(),
    priceListItems: await db.priceListItem.count(),
    quotations: await db.quotation.count(),
    quotationLines: await db.quotationLine.count(),
    billingSchedules: await db.billingSchedule.count(),
    invoices: await db.invoice.count(),
    payments: await db.payment.count(),
    warehouses: await db.warehouse.count(),
    stockLevels: await db.stockLevel.count(),
    dealHealthAlerts: await db.dealHealthAlert.count(),
  };

  console.log("=========================================");
  console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
  console.log("Database table record counts:");
  console.table(summary);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
