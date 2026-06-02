import "dotenv/config";
import {
  PrismaClient,
  type EnrollmentStatus,
  type Role,
  type UserStatus,
} from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CLINIC_NAMES = [
  "Lakeside Oncology Center",
  "Westbrook Cancer Institute",
] as const;

const PATHWAY_NAMES = [
  "Breast lumpectomy recovery",
  "Mastectomy recovery",
  "Colon cancer surgery recovery",
  "Prostatectomy recovery",
  "Port placement care",
  "Post-op symptom monitoring",
  "Drain care instructions",
  "Surgical wound care after oncology procedure",
] as const;

type SeedPatient = {
  email: string;
  role: Role;
  status: UserStatus;
  firstName: string;
  lastName: string;
  phone: string;
  clinicName: (typeof CLINIC_NAMES)[number];
  enrollments: Array<{
    pathwayName: (typeof PATHWAY_NAMES)[number];
    status: EnrollmentStatus;
  }>;
};

const SEED_PATIENTS: SeedPatient[] = [
  {
    email: "maria.garcia@example.com",
    role: "PATIENT",
    status: "ACTIVE",
    firstName: "Maria",
    lastName: "Garcia",
    phone: "555-1001",
    clinicName: "Lakeside Oncology Center",
    enrollments: [{ pathwayName: "Mastectomy recovery", status: "ACTIVE" }],
  },
  {
    email: "james.wilson@example.com",
    role: "PATIENT",
    status: "INVITED",
    firstName: "James",
    lastName: "Wilson",
    phone: "555-1002",
    clinicName: "Lakeside Oncology Center",
    enrollments: [
      { pathwayName: "Breast lumpectomy recovery", status: "ACTIVE" },
    ],
  },
  {
    email: "elena.rodriguez@example.com",
    role: "PATIENT",
    status: "ACTIVE",
    firstName: "Elena",
    lastName: "Rodriguez",
    phone: "555-1003",
    clinicName: "Lakeside Oncology Center",
    enrollments: [{ pathwayName: "Colon cancer surgery recovery", status: "PAUSED" }],
  },
  {
    email: "david.chen@example.com",
    role: "PATIENT",
    status: "ACTIVE",
    firstName: "David",
    lastName: "Chen",
    phone: "555-2001",
    clinicName: "Westbrook Cancer Institute",
    enrollments: [
      { pathwayName: "Port placement care", status: "ACTIVE" },
    ],
  },
  {
    email: "sarah.patel@example.com",
    role: "PATIENT",
    status: "ACTIVE",
    firstName: "Sarah",
    lastName: "Patel",
    phone: "555-2002",
    clinicName: "Westbrook Cancer Institute",
    enrollments: [
      { pathwayName: "Drain care instructions", status: "COMPLETED" },
    ],
  },
  {
    email: "robert.kim@example.com",
    role: "PATIENT",
    status: "INVITED",
    firstName: "Robert",
    lastName: "Kim",
    phone: "555-2003",
    clinicName: "Westbrook Cancer Institute",
    enrollments: [
      { pathwayName: "Post-op symptom monitoring", status: "ACTIVE" },
    ],
  },
];

async function main() {
  await prisma.$transaction(async (tx) => {
    const clinics: Record<string, { id: string; name: string }> = {};

    for (const name of CLINIC_NAMES) {
      const existing = await tx.clinic.findFirst({ where: { name } });
      clinics[name] = existing ?? (await tx.clinic.create({ data: { name } }));
    }

    const lakesideId = clinics["Lakeside Oncology Center"].id;
    const westbrookId = clinics["Westbrook Cancer Institute"].id;

    const pathwaysByClinicAndName = new Map<string, { id: string }>();

    for (const [index, pathwayName] of PATHWAY_NAMES.entries()) {
      const clinicId = index < 4 ? lakesideId : westbrookId;
      const existing = await tx.pathway.findFirst({
        where: { clinicId, name: pathwayName },
      });
      const pathway =
        existing ??
        (await tx.pathway.create({
          data: { clinicId, name: pathwayName },
        }));
      pathwaysByClinicAndName.set(`${clinicId}:${pathwayName}`, pathway);
    }

    await upsertUserInTx(tx, lakesideId, "admin@example.com", "ADMIN", "ACTIVE");

    for (const seed of SEED_PATIENTS) {
      const clinicId = clinics[seed.clinicName].id;
      const user = await upsertUserInTx(
        tx,
        clinicId,
        seed.email,
        seed.role,
        seed.status
      );
      const patient = await upsertPatientInTx(
        tx,
        clinicId,
        user.id,
        seed.firstName,
        seed.lastName,
        seed.phone
      );

      for (const enrollment of seed.enrollments) {
        const pathway = pathwaysByClinicAndName.get(
          `${clinicId}:${enrollment.pathwayName}`
        );
        if (!pathway) {
          throw new Error(
            `Pathway not found for seed: ${enrollment.pathwayName}`
          );
        }
        await upsertEnrollmentInTx(
          tx,
          patient.id,
          pathway.id,
          enrollment.status
        );
      }
    }
  });

  console.log("Seed complete:");
  console.log(`  Clinics: ${CLINIC_NAMES.length}`);
  console.log(`  Pathways: ${PATHWAY_NAMES.length}`);
  console.log(`  Users: ${SEED_PATIENTS.length + 1} (includes admin)`);
  console.log(
    `  Enrollments: ${SEED_PATIENTS.reduce((n, p) => n + p.enrollments.length, 0)}`
  );
}

type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

async function upsertUserInTx(
  tx: Tx,
  clinicId: string,
  email: string,
  role: Role,
  status: UserStatus
) {
  return tx.user.upsert({
    where: { email },
    create: { clinicId, email, role, status },
    update: { clinicId, role, status },
  });
}

async function upsertPatientInTx(
  tx: Tx,
  clinicId: string,
  userId: string,
  firstName: string,
  lastName: string,
  phone: string
) {
  return tx.patient.upsert({
    where: { userId },
    create: { clinicId, userId, firstName, lastName, phone },
    update: { clinicId, firstName, lastName, phone },
  });
}

async function upsertEnrollmentInTx(
  tx: Tx,
  patientId: string,
  pathwayId: string,
  status: EnrollmentStatus
) {
  return tx.enrollment.upsert({
    where: { patientId_pathwayId: { patientId, pathwayId } },
    create: { patientId, pathwayId, status },
    update: { status },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
