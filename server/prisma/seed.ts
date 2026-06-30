import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type SeedNode = {
  id: string;
  badge: string;
  title: string;
  sub: string;
  color: string;
  project: string;
  status: string;
  x: number;
  y: number;
  hc?: { req: number; have: number; hire: number; notice: number };
};

// Ported verbatim from the original seedInitialData().
const NODES: SeedNode[] = [
  { id: "rnd", badge: "R&D MANAGER", title: "R&D Manager", sub: "Shyam Kumar", color: "#ab47bc", project: "ops", status: "active", x: 1100, y: 30 },
  { id: "bom", badge: "OPERATIONS", title: "Business Operations Mgr", sub: "Hiring — 1 Position", color: "#1e88e5", project: "ops", status: "hiring", x: 1100, y: 160, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "pmo", badge: "PMO ANALYST", title: "Project Mgmt Analyst", sub: "Hiring — 1 Position", color: "#42a5f5", project: "ops", status: "hiring", x: 1380, y: 160, hc: { req: 1, have: 0, hire: 1, notice: 0 } },

  { id: "wc-root", badge: "PROJECT", title: "Wellness Center", sub: "3 Branches", color: "#ff7043", project: "wc", status: "active", x: 140, y: 300 },
  { id: "wc-am", badge: "AREA MGR", title: "Area Manager", sub: "Hiring in progress", color: "#ff7043", project: "wc", status: "hiring", x: 140, y: 430, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "wc-bm", badge: "BRANCH MGR", title: "Branch Manager", sub: "Pramoth Gopi", color: "#ff7043", project: "wc", status: "active", x: 140, y: 560 },

  { id: "wc-abm-an", badge: "ABM — A/N", title: "A/N Branch", sub: "Hiring", color: "#ff7043", project: "wc", status: "hiring", x: 0, y: 700, hc: { req: 11, have: 7, hire: 4, notice: 0 } },
  { id: "an-sc-lead", badge: "LEAD", title: "Sales Caller Lead", sub: "Pavithra Sakkari", color: "#ff7043", project: "wc", status: "active", x: -160, y: 840 },
  { id: "an-sc-1", badge: "SALES CALLER", title: "Sales Caller", sub: "Open Position", color: "#ff7043", project: "wc", status: "hiring", x: -160, y: 940, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "an-hc-lead", badge: "LEAD", title: "Health Coach Lead", sub: "Kokila", color: "#ff7043", project: "wc", status: "active", x: 0, y: 840 },
  { id: "an-hc-1", badge: "HEALTH COACH", title: "Health Coach 1", sub: "Open Position", color: "#ff7043", project: "wc", status: "hiring", x: 0, y: 940, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "an-hc-2", badge: "HEALTH COACH", title: "Health Coach 2", sub: "Screening", color: "#ff7043", project: "wc", status: "hiring", x: 0, y: 1040, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "an-rec", badge: "RECEPTION", title: "Receptionist", sub: "Dharshana", color: "#ff7043", project: "wc", status: "active", x: 160, y: 840 },
  { id: "an-hk", badge: "HOUSEKEEPING", title: "Housekeeping", sub: "Open", color: "#ff7043", project: "wc", status: "hiring", x: 160, y: 940, hc: { req: 1, have: 0, hire: 1, notice: 0 } },

  { id: "wc-abm-kum", badge: "ABM — KUM", title: "Kumananchavadi", sub: "Pavithra B", color: "#ff7043", project: "wc", status: "active", x: 340, y: 700, hc: { req: 8, have: 6, hire: 2, notice: 0 } },
  { id: "kum-sc-lead", badge: "LEAD", title: "Sales Caller Lead", sub: "TBD", color: "#ff7043", project: "wc", status: "hiring", x: 300, y: 840, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "kum-sc-1", badge: "SALES CALLER", title: "Gayathri", sub: "Active", color: "#ff7043", project: "wc", status: "active", x: 300, y: 940 },
  { id: "kum-sc-2", badge: "SALES CALLER", title: "Sugashini", sub: "Dual SC/HC", color: "#ff7043", project: "wc", status: "active", x: 300, y: 1040 },
  { id: "kum-hc-lead", badge: "LEAD", title: "Health Coach Lead", sub: "TBD", color: "#ff7043", project: "wc", status: "hiring", x: 460, y: 840, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "kum-hc-1", badge: "HEALTH COACH", title: "Kavi Priya", sub: "Active", color: "#ff7043", project: "wc", status: "active", x: 460, y: 940 },
  { id: "kum-hc-2", badge: "HEALTH COACH", title: "Pongali", sub: "Dual role", color: "#ff7043", project: "wc", status: "active", x: 460, y: 1040 },
  { id: "kum-rec", badge: "RECEPTION", title: "Ajay", sub: "Replacement", color: "#ff7043", project: "wc", status: "active", x: 620, y: 840 },

  { id: "wc-abm-tey", badge: "NEW OUTLET", title: "Teynampet", sub: "Location TBD", color: "#546e7a", project: "wc", status: "future", x: 780, y: 700 },

  { id: "dev", badge: "COMMON — TECH", title: "Development Team", sub: "System & Process · Outlets", color: "#7c4dff", project: "dev", status: "hiring", x: 940, y: 560, hc: { req: 2, have: 0, hire: 2, notice: 0 } },
  { id: "dev-spc", badge: "SYS & PROCESS", title: "System & Process", sub: "Hire 1 Position", color: "#7c4dff", project: "dev", status: "hiring", x: 880, y: 700, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "dev-nos", badge: "OUTLET SOURCE", title: "New Outlet Sourcing", sub: "Hire 1 Position", color: "#7c4dff", project: "dev", status: "hiring", x: 1020, y: 700, hc: { req: 1, have: 0, hire: 1, notice: 0 } },

  { id: "mkt", badge: "COMMON — MKTG", title: "Marketing Team", sub: "Abi — Budget · Ads · Leads", color: "#f06292", project: "mkt", status: "active", x: 1180, y: 560, hc: { req: 1, have: 1, hire: 0, notice: 0 } },

  { id: "vsl-root", badge: "BDM — LEAD", title: "VSL Lead", sub: "Robin", color: "#26c6da", project: "vsl", status: "active", x: 1440, y: 560 },
  { id: "vsl-sc", badge: "SETTER CALLER", title: "Setter Caller", sub: "Hire 1 Position", color: "#26c6da", project: "vsl", status: "hiring", x: 1380, y: 700, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "vsl-hc", badge: "HEALTH COACH", title: "Health Coach", sub: "Hire 1 Position", color: "#26c6da", project: "vsl", status: "hiring", x: 1520, y: 700, hc: { req: 1, have: 0, hire: 1, notice: 0 } },

  { id: "col-root", badge: "BDM — LEAD", title: "Collab Lead", sub: "Ram Ravanan", color: "#66bb6a", project: "col", status: "active", x: 1720, y: 560 },
  { id: "col-tc", badge: "TELE CALLER", title: "Tele Caller", sub: "Future Hire 1", color: "#66bb6a", project: "col", status: "future", x: 1660, y: 700, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
  { id: "col-bde", badge: "BDE", title: "Business Dev Exec", sub: "Future Hire 1", color: "#66bb6a", project: "col", status: "future", x: 1800, y: 700, hc: { req: 1, have: 0, hire: 1, notice: 0 } },
];

const CONNECTIONS: [string, string][] = [
  ["rnd", "bom"], ["bom", "pmo"], ["bom", "wc-root"], ["bom", "vsl-root"],
  ["bom", "col-root"], ["bom", "dev"], ["bom", "mkt"],
  ["pmo", "wc-root"], ["pmo", "vsl-root"], ["pmo", "col-root"],
  ["wc-root", "wc-am"], ["wc-am", "wc-bm"], ["wc-bm", "wc-abm-an"],
  ["wc-bm", "wc-abm-kum"], ["wc-bm", "wc-abm-tey"],
  ["wc-abm-an", "an-sc-lead"], ["wc-abm-an", "an-hc-lead"], ["wc-abm-an", "an-rec"],
  ["an-sc-lead", "an-sc-1"], ["an-hc-lead", "an-hc-1"], ["an-hc-lead", "an-hc-2"],
  ["an-rec", "an-hk"],
  ["wc-abm-kum", "kum-sc-lead"], ["wc-abm-kum", "kum-hc-lead"], ["wc-abm-kum", "kum-rec"],
  ["kum-sc-lead", "kum-sc-1"], ["kum-sc-lead", "kum-sc-2"],
  ["kum-hc-lead", "kum-hc-1"], ["kum-hc-lead", "kum-hc-2"],
  ["dev", "dev-spc"], ["dev", "dev-nos"],
  ["vsl-root", "vsl-sc"], ["vsl-root", "vsl-hc"],
  ["col-root", "col-tc"], ["col-root", "col-bde"],
];

const DEFAULT_CLARITY = {
  reports_to: "",
  dept: "",
  responsibilities: "",
  kpis: [],
  kras: [],
  doc_notes: "",
  doc_link: "",
};

async function main() {
  const count = await prisma.node.count();
  if (count > 0) {
    console.log(`Database already has ${count} nodes — skipping seed.`);
    console.log("Run `npm run db:reset` first if you want a clean reseed.");
    return;
  }

  for (const n of NODES) {
    await prisma.node.create({
      data: {
        id: n.id,
        badge: n.badge,
        title: n.title,
        sub: n.sub,
        color: n.color,
        project: n.project,
        status: n.status,
        x: n.x,
        y: n.y,
        view: "master",
        collapsed: false,
        hc: (n.hc ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        clarity: DEFAULT_CLARITY as Prisma.InputJsonValue,
      },
    });
  }

  for (const [from, to] of CONNECTIONS) {
    await prisma.connection.create({
      data: {
        id: `conn_${from}_${to}`,
        fromNode: from,
        toNode: to,
        view: "master",
      },
    });
  }

  await prisma.history.create({ data: { action: "Seeded initial org structure" } });

  console.log(
    `Seeded ${NODES.length} nodes and ${CONNECTIONS.length} connections.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
