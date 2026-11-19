import "server-only";
import { randomUUID } from "node:crypto";
import { hashSync } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  Prisma,
  ServiceCategory,
  ServiceStatus,
} from "@prisma/client";

type MockRecord = Record<string, unknown>;

const SEEDED_SERVICES: MockRecord[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Standard Cleaning",
    slug: "standard-cleaning",
    description:
      "Routine cleaning to help maintain clean, comfortable homes and workplaces.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Deep Cleaning",
    slug: "deep-cleaning",
    description:
      "Detailed cleaning for areas that need more attention than routine cleaning.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    name: "Post-Construction Cleaning",
    slug: "post-construction-cleaning",
    description:
      "Cleaning after construction or renovation to prepare a property for use.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    name: "Carpet Cleaning",
    slug: "carpet-cleaning",
    description:
      "Carpet cleaning to help remove accumulated dirt and improve cleanliness.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    name: "Upholstery Cleaning",
    slug: "upholstery-cleaning",
    description:
      "Cleaning for upholstered furniture and other suitable fabric surfaces.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    name: "Move-In / Move-Out Cleaning",
    slug: "move-in-move-out-cleaning",
    description: "Cleaning properties before moving in or after moving out.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    name: "Pre-Event Cleaning",
    slug: "pre-event-cleaning",
    description: "Cleaning and preparation of venues before events.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    name: "Post-Event Cleaning",
    slug: "post-event-cleaning",
    description: "Cleaning and tidying venues after events.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    name: "Disinfection & Sanitization",
    slug: "disinfection-sanitization",
    description:
      "Cleaning and sanitization services personalized to the requirements of a space.",
    category: ServiceCategory.CLEANING,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    name: "Laundry Services",
    slug: "laundry-services",
    description:
      "Laundry services including washing, drying, folding, ironing, and fabric care.",
    category: ServiceCategory.LAUNDRY,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000011",
    name: "Provision of Domestic Helpers for Households",
    slug: "provision-of-domestic-helpers",
    description:
      "Vetted, dependable domestic helpers provided to assist with everyday household chores, routines, and family care.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000012",
    name: "Housekeeping and General Home Maintenance",
    slug: "housekeeping-home-maintenance",
    description:
      "Comprehensive housekeeping, daily tidying, floor care, dusting, and ongoing home upkeep to maintain pristine living spaces.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000013",
    name: "Cooking and Meal Preparation",
    slug: "cooking-meal-preparation",
    description:
      "Wholesome, customized home-cooked meals prepared in your kitchen according to your family's tastes, dietary plans, and agreed schedule.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000014",
    name: "Laundry, Ironing, and Clothing Care",
    slug: "domestic-laundry-clothing-care",
    description:
      "Dedicated in-home washing, precise ironing, garment pressing, wardrobe organization, and gentle clothing care.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000015",
    name: "Temporary and Regular Domestic Assistance",
    slug: "temporary-regular-domestic-assistance",
    description:
      "Flexible domestic support tailored to your schedule, whether you need temporary emergency help, holiday assistance, or ongoing regular service.",
    category: ServiceCategory.DOMESTIC_SUPPORT,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000016",
    name: "Residential and Office Pest Control",
    slug: "residential-office-pest-control",
    description:
      "Targeted pest eradication treatments designed for residential homes, apartments, and corporate workspaces to keep premises pest-free.",
    category: ServiceCategory.PEST_CONTROL,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000017",
    name: "Cockroach, Ant, and Crawling-Insect Control",
    slug: "crawling-insect-control",
    description:
      "Specialized eradication protocols to eliminate cockroach infestations, ant colonies, and destructive crawling insects at the root.",
    category: ServiceCategory.PEST_CONTROL,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000018",
    name: "Rodent Control",
    slug: "rodent-control",
    description:
      "Strategic rodent management utilizing secure baiting stations, humane trapping, and structural entry-point exclusion methods.",
    category: ServiceCategory.PEST_CONTROL,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000019",
    name: "Pest Treatment for Commercial Premises",
    slug: "commercial-pest-treatment",
    description:
      "Industrial-grade pest control and compliant sanitation treatments tailored for warehouses, restaurants, retail outlets, and commercial buildings.",
    category: ServiceCategory.PEST_CONTROL,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
  {
    id: "10000000-0000-4000-8000-000000000020",
    name: "Scheduled Pest Prevention and Maintenance",
    slug: "scheduled-pest-prevention-maintenance",
    description:
      "Proactive monitoring and routine scheduled pest barrier applications to guarantee long-term protection against re-infestation.",
    category: ServiceCategory.PEST_CONTROL,
    imageUrl: null,
    status: ServiceStatus.ACTIVE,
  },
].map((service) => ({
  ...service,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
}));

function buildPreviewSeedStore(): Record<string, MockRecord[]> {
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 0, 0)
  );
  const tomorrow = new Date(todayStart.getTime() + 86_400_000);
  const yesterday = new Date(todayStart.getTime() - 86_400_000);
  const twoDaysAgo = new Date(todayStart.getTime() - 2 * 86_400_000);
  const passwordHash = hashSync("SambPreview!2026", 8);

  const adminId = "20000000-0000-4000-8000-000000000001";
  const supervisorId = "20000000-0000-4000-8000-000000000002";
  const staff1Id = "20000000-0000-4000-8000-000000000003";
  const staff2Id = "20000000-0000-4000-8000-000000000004";
  const customerId = "20000000-0000-4000-8000-000000000005";

  const users: MockRecord[] = [
    {
      id: adminId,
      name: "Samuel Mensah",
      email: "admin@sambservices.com",
      phone: "+233540240754",
      passwordHash,
      role: "ADMIN",
      accountStatus: "ACTIVE",
      sessionVersion: 0,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: supervisorId,
      name: "Kwame Boateng",
      email: "supervisor@sambservices.com",
      phone: "+233244100200",
      passwordHash,
      role: "SUPERVISOR",
      accountStatus: "ACTIVE",
      sessionVersion: 0,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: staff1Id,
      name: "Ama Mensah",
      email: "staff1@sambservices.com",
      phone: "+233244100301",
      passwordHash,
      role: "STAFF",
      accountStatus: "ACTIVE",
      sessionVersion: 0,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: staff2Id,
      name: "Kojo Owusu",
      email: "staff2@sambservices.com",
      phone: "+233244100302",
      passwordHash,
      role: "STAFF",
      accountStatus: "ACTIVE",
      sessionVersion: 0,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: customerId,
      name: "Abena Darko",
      email: "customer@sambservices.com",
      phone: "+233244555666",
      passwordHash,
      role: "CUSTOMER",
      accountStatus: "ACTIVE",
      sessionVersion: 0,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
  ];

  const b1 = "30000000-0000-4000-8000-000000000001";
  const b2 = "30000000-0000-4000-8000-000000000002";
  const b3 = "30000000-0000-4000-8000-000000000003";
  const b4 = "30000000-0000-4000-8000-000000000004";
  const b5 = "30000000-0000-4000-8000-000000000005";
  const b6 = "30000000-0000-4000-8000-000000000006";

  const bookings: MockRecord[] = [
    {
      id: b1,
      bookingNumber: "SAMB-2026-1001",
      customerId,
      serviceId: "10000000-0000-4000-8000-000000000001",
      status: "PENDING",
      preferredDate: tomorrow,
      preferredTime: "09:00 AM",
      address: "14 Independence Ave, Ridge, Accra",
      propertyType: "Apartment",
      numberOfRooms: 3,
      estimatedSize: "1,400 sq ft",
      specialInstructions: "Call security desk on arrival.",
      serviceDetails: null,
      adminNotes: null,
      supervisorId: null,
      supervisorAssignedAt: null,
      supervisionStatus: "NOT_REQUIRED",
      finalApprovedById: null,
      finalApprovedAt: null,
      finalApprovalNote: null,
      confirmedAt: null,
      completedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: b2,
      bookingNumber: "SAMB-2026-1002",
      customerId,
      serviceId: "10000000-0000-4000-8000-000000000010",
      status: "CONFIRMED",
      preferredDate: todayStart,
      preferredTime: "11:00 AM",
      address: "28 Cantonments Crescent, Accra",
      propertyType: "Residence",
      numberOfRooms: 4,
      estimatedSize: "2 baskets",
      specialInstructions: "Separate delicate linen items.",
      serviceDetails: null,
      adminNotes: "Confirmed via phone call.",
      supervisorId: null,
      supervisorAssignedAt: null,
      supervisionStatus: "NOT_REQUIRED",
      finalApprovedById: null,
      finalApprovedAt: null,
      finalApprovalNote: null,
      confirmedAt: yesterday,
      completedAt: null,
      cancelledAt: null,
      createdAt: yesterday,
      updatedAt: now,
    },
    {
      id: b3,
      bookingNumber: "SAMB-2026-1003",
      customerId,
      serviceId: "10000000-0000-4000-8000-000000000002",
      status: "IN_PROGRESS",
      preferredDate: todayStart,
      preferredTime: "08:30 AM",
      address: "7 Airport Residential Link, Accra",
      propertyType: "Office",
      numberOfRooms: 6,
      estimatedSize: "3,200 sq ft",
      specialInstructions: "Focus on conference rooms and kitchen.",
      serviceDetails: null,
      adminNotes: "Two cleaners assigned with lead supervisor.",
      supervisorId,
      supervisorAssignedAt: yesterday,
      supervisionStatus: "IN_PROGRESS",
      finalApprovedById: null,
      finalApprovedAt: null,
      finalApprovalNote: null,
      confirmedAt: twoDaysAgo,
      completedAt: null,
      cancelledAt: null,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: b4,
      bookingNumber: "SAMB-2026-1004",
      customerId,
      serviceId: "10000000-0000-4000-8000-000000000003",
      status: "IN_PROGRESS",
      preferredDate: todayStart,
      preferredTime: "02:00 PM",
      address: "42 East Legon Boundary Rd, Accra",
      propertyType: "Villa",
      numberOfRooms: 5,
      estimatedSize: "4,000 sq ft",
      specialInstructions: "Post-renovation dust removal on glass.",
      serviceDetails: null,
      adminNotes: "Ready for supervisor sign-off.",
      supervisorId,
      supervisorAssignedAt: twoDaysAgo,
      supervisionStatus: "AWAITING_SUPERVISOR_REVIEW",
      finalApprovedById: null,
      finalApprovedAt: null,
      finalApprovalNote: null,
      confirmedAt: twoDaysAgo,
      completedAt: null,
      cancelledAt: null,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: b5,
      bookingNumber: "SAMB-2026-1005",
      customerId,
      serviceId: "10000000-0000-4000-8000-000000000016",
      status: "IN_PROGRESS",
      preferredDate: yesterday,
      preferredTime: "10:00 AM",
      address: "19 Osu Oxford Street, Accra",
      propertyType: "Commercial",
      numberOfRooms: 4,
      estimatedSize: "2,100 sq ft",
      specialInstructions: "Eco-safe treatment around pantry.",
      serviceDetails: null,
      adminNotes: "Supervisor has signed off; pending final admin release.",
      supervisorId,
      supervisorAssignedAt: twoDaysAgo,
      supervisionStatus: "SUPERVISOR_APPROVED",
      finalApprovedById: null,
      finalApprovedAt: null,
      finalApprovalNote: null,
      confirmedAt: twoDaysAgo,
      completedAt: null,
      cancelledAt: null,
      createdAt: twoDaysAgo,
      updatedAt: now,
    },
    {
      id: b6,
      bookingNumber: "SAMB-2026-1006",
      customerId,
      serviceId: "10000000-0000-4000-8000-000000000004",
      status: "COMPLETED",
      preferredDate: twoDaysAgo,
      preferredTime: "01:00 PM",
      address: "5 Labone Junction, Accra",
      propertyType: "Townhouse",
      numberOfRooms: 4,
      estimatedSize: "1,800 sq ft",
      specialInstructions: "Deep shampoo on living room rugs.",
      serviceDetails: null,
      adminNotes: "Verified and customer notified.",
      supervisorId,
      supervisorAssignedAt: twoDaysAgo,
      supervisionStatus: "SUPERVISOR_APPROVED",
      finalApprovedById: adminId,
      finalApprovedAt: yesterday,
      finalApprovalNote: "All rooms verified clean and customer confirmed satisfaction.",
      confirmedAt: twoDaysAgo,
      completedAt: yesterday,
      cancelledAt: null,
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
    },
  ];

  const a1 = "40000000-0000-4000-8000-000000000001";
  const a2 = "40000000-0000-4000-8000-000000000002";
  const a3 = "40000000-0000-4000-8000-000000000003";
  const a4 = "40000000-0000-4000-8000-000000000004";
  const a5 = "40000000-0000-4000-8000-000000000005";

  const bookingAssignments: MockRecord[] = [
    {
      id: a1,
      bookingId: b3,
      staffId: staff1Id,
      assignedById: adminId,
      unassignedById: null,
      status: "IN_PROGRESS",
      notes: "Handle executive suite & glass partitions.",
      isActive: true,
      assignedAt: yesterday,
      startedAt: now,
      submittedAt: null,
      approvedAt: null,
      unassignedAt: null,
    },
    {
      id: a2,
      bookingId: b3,
      staffId: staff2Id,
      assignedById: adminId,
      unassignedById: null,
      status: "PENDING",
      notes: "Handle reception & pantry sanitization.",
      isActive: true,
      assignedAt: yesterday,
      startedAt: null,
      submittedAt: null,
      approvedAt: null,
      unassignedAt: null,
    },
    {
      id: a3,
      bookingId: b4,
      staffId: staff1Id,
      assignedById: adminId,
      unassignedById: null,
      status: "SUBMITTED_FOR_REVIEW",
      notes: "Upper floor windows and bedrooms.",
      isActive: true,
      assignedAt: twoDaysAgo,
      startedAt: yesterday,
      submittedAt: now,
      approvedAt: null,
      unassignedAt: null,
    },
    {
      id: a4,
      bookingId: b4,
      staffId: staff2Id,
      assignedById: adminId,
      unassignedById: null,
      status: "SUBMITTED_FOR_REVIEW",
      notes: "Ground floor tiles and exterior veranda.",
      isActive: true,
      assignedAt: twoDaysAgo,
      startedAt: yesterday,
      submittedAt: now,
      approvedAt: null,
      unassignedAt: null,
    },
    {
      id: a5,
      bookingId: b5,
      staffId: staff1Id,
      assignedById: adminId,
      unassignedById: null,
      status: "APPROVED",
      notes: "Full commercial perimeter pest treatment.",
      isActive: true,
      assignedAt: twoDaysAgo,
      startedAt: yesterday,
      submittedAt: yesterday,
      approvedAt: now,
      unassignedAt: null,
    },
  ];

  const assignmentSubmissions: MockRecord[] = [
    {
      id: "50000000-0000-4000-8000-000000000001",
      assignmentId: a3,
      bookingId: b4,
      submittedById: staff1Id,
      summary: "Upper floor bedrooms and glass panels cleared of construction dust.",
      workPerformed:
        "HEPA vacuumed 4 bedrooms, scrubbed window tracks, wiped built-in wardrobes, and polished glass sliding doors.",
      issuesNoted: "Minor paint speck left on master balcony rail requires paint thinner if needed.",
      photos: [],
      createdAt: now,
    },
    {
      id: "50000000-0000-4000-8000-000000000002",
      assignmentId: a4,
      bookingId: b4,
      submittedById: staff2Id,
      summary: "Ground floor porcelain tiles and kitchen surfaces deep cleaned.",
      workPerformed:
        "Removed grout haze across living room & kitchen, sanitized countertops, and pressure-washed front veranda.",
      issuesNoted: null,
      photos: [],
      createdAt: now,
    },
    {
      id: "50000000-0000-4000-8000-000000000003",
      assignmentId: a5,
      bookingId: b5,
      submittedById: staff1Id,
      summary: "Pest barrier and baiting stations installed across commercial rooms.",
      workPerformed:
        "Applied residual barrier spray along skirting boards, placed 8 tamper-proof bait stations, and sealed kitchen wall gaps.",
      issuesNoted: null,
      photos: [],
      createdAt: yesterday,
    },
  ];

  const workflowReviews: MockRecord[] = [
    {
      id: "60000000-0000-4000-8000-000000000001",
      bookingId: b5,
      assignmentId: a5,
      reviewerId: supervisorId,
      reviewerRole: "SUPERVISOR",
      decision: "APPROVED",
      comment: "Inspected all 4 treatment zones and verified tamper-proof station placement. Ready for Admin final sign-off.",
      createdAt: now,
    },
  ];

  const auditLogs: MockRecord[] = [
    {
      id: "70000000-0000-4000-8000-000000000001",
      actorId: supervisorId,
      action: "SUPERVISOR_APPROVED_JOB",
      entityType: "BOOKING",
      entityId: b5,
      reason: "Inspected pest barrier treatment and approved for final admin review.",
      changes: { bookingNumber: "SAMB-2026-1005", supervisionStatus: "SUPERVISOR_APPROVED" },
      createdAt: now,
    },
    {
      id: "70000000-0000-4000-8000-000000000002",
      actorId: adminId,
      action: "BOOKING_COMPLETED",
      entityType: "BOOKING",
      entityId: b6,
      reason: "Final admin completion approved.",
      changes: { bookingNumber: "SAMB-2026-1006", status: "COMPLETED" },
      createdAt: yesterday,
    },
  ];

  const notifications: MockRecord[] = [
    {
      id: "80000000-0000-4000-8000-000000000001",
      userId: adminId,
      title: "Booking ready for final approval",
      message: "Supervisor Kwame Boateng approved SAMB-2026-1005 for final admin sign-off.",
      type: "FINAL_APPROVAL_READY",
      isRead: false,
      createdAt: now,
    },
    {
      id: "80000000-0000-4000-8000-000000000002",
      userId: supervisorId,
      title: "Completion reports ready for review",
      message: "All staff reports for SAMB-2026-1004 have been submitted.",
      type: "SUPERVISOR_REVIEW_READY",
      isRead: false,
      createdAt: now,
    },
  ];

  const contactMessages: MockRecord[] = [
    {
      id: "90000000-0000-4000-8000-000000000001",
      name: "Kofi Asante",
      email: "kofi.asante@example.com",
      phone: "+233201112233",
      subject: "Corporate office weekly contract",
      message: "Looking for recurring weekend cleaning for a 3-floor office in Airport City.",
      status: "NEW",
      createdAt: now,
    },
  ];

  return {
    user: users,
    service: SEEDED_SERVICES.map((s) => ({ ...s })),
    booking: bookings,
    notification: notifications,
    contactMessage: contactMessages,
    quote: [],
    bookingAssignment: bookingAssignments,
    assignmentSubmission: assignmentSubmissions,
    workflowReview: workflowReviews,
    review: [],
    passwordResetToken: [],
    auditLog: auditLogs,
    vacancy: [],
    jobApplication: [],
    applicationStatusHistory: [],
  };
}

const globalForMockStore = globalThis as unknown as {
  __sambMockStore?: Record<string, MockRecord[]>;
};

function getMockStore(): Record<string, MockRecord[]> {
  if (!globalForMockStore.__sambMockStore) {
    globalForMockStore.__sambMockStore = buildPreviewSeedStore();
  }
  return globalForMockStore.__sambMockStore;
}

function asRecord(val: unknown): MockRecord | undefined {
  return typeof val === "object" &&
    val !== null &&
    !(val instanceof Date) &&
    !Array.isArray(val)
    ? (val as MockRecord)
    : undefined;
}

function toComparableTime(val: unknown): number | null {
  if (val instanceof Date) return val.getTime();
  if (typeof val === "string" || typeof val === "number") {
    const t = new Date(val).getTime();
    return Number.isFinite(t) ? t : null;
  }
  return null;
}

function matchesFilter(
  record: MockRecord,
  whereInput: unknown,
  store: Record<string, MockRecord[]>
): boolean {
  const where = asRecord(whereInput);
  if (!where) return true;

  for (const [key, condition] of Object.entries(where)) {
    if (condition === undefined) continue;

    if (key === "AND") {
      const clauses = Array.isArray(condition) ? condition : [condition];
      if (!clauses.every((clause) => matchesFilter(record, clause, store))) {
        return false;
      }
      continue;
    }

    if (key === "OR") {
      const clauses = Array.isArray(condition) ? condition : [condition];
      if (!clauses.some((clause) => matchesFilter(record, clause, store))) {
        return false;
      }
      continue;
    }

    if (key === "NOT") {
      const clauses = Array.isArray(condition) ? condition : [condition];
      if (clauses.some((clause) => matchesFilter(record, clause, store))) {
        return false;
      }
      continue;
    }

    const condObj = asRecord(condition);

    // Single relation filters
    if (key === "booking" && record.bookingId && condObj) {
      const target = (store.booking || []).find(
        (b) => b.id === record.bookingId
      );
      if (!target) return false;
      const inner = "is" in condObj ? condObj.is : condObj;
      if (!matchesFilter(target, inner, store)) return false;
      continue;
    }

    if (key === "staff" && record.staffId && condObj) {
      const target = (store.user || []).find((u) => u.id === record.staffId);
      if (!target) return false;
      const inner = "is" in condObj ? condObj.is : condObj;
      if (!matchesFilter(target, inner, store)) return false;
      continue;
    }

    if (key === "supervisor" && condObj) {
      const target = record.supervisorId
        ? (store.user || []).find((u) => u.id === record.supervisorId)
        : null;
      if ("is" in condObj) {
        if (condObj.is === null && target !== null) return false;
        if (condObj.is !== null && (!target || !matchesFilter(target, condObj.is, store))) {
          return false;
        }
      } else if (!target || !matchesFilter(target, condObj, store)) {
        return false;
      }
      continue;
    }

    if (key === "assignment" && record.assignmentId && condObj) {
      const target = (store.bookingAssignment || []).find(
        (a) => a.id === record.assignmentId
      );
      if (!target) return false;
      const inner = "is" in condObj ? condObj.is : condObj;
      if (!matchesFilter(target, inner, store)) return false;
      continue;
    }

    // Collection relation filters on Booking
    if (key === "assignments" && condObj) {
      const rows = (store.bookingAssignment || []).filter(
        (a) => a.bookingId === record.id
      );
      if ("some" in condObj && !rows.some((r) => matchesFilter(r, condObj.some, store))) {
        return false;
      }
      if ("none" in condObj && rows.some((r) => matchesFilter(r, condObj.none, store))) {
        return false;
      }
      if ("every" in condObj && !rows.every((r) => matchesFilter(r, condObj.every, store))) {
        return false;
      }
      continue;
    }

    if (key === "submissions" && condObj) {
      const rows = (store.assignmentSubmission || []).filter(
        (s) => s.bookingId === record.id || s.assignmentId === record.id
      );
      if ("some" in condObj && !rows.some((r) => matchesFilter(r, condObj.some, store))) {
        return false;
      }
      if ("none" in condObj && rows.some((r) => matchesFilter(r, condObj.none, store))) {
        return false;
      }
      continue;
    }

    const value = record[key];

    if (condition === null) {
      if (value !== null && value !== undefined) return false;
      continue;
    }

    if (condObj) {
      if ("equals" in condObj && value !== condObj.equals) return false;
      if ("not" in condObj) {
        const notVal = condObj.not;
        if (notVal === null ? value == null : value === notVal) return false;
      }
      if ("in" in condObj && Array.isArray(condObj.in)) {
        if (!condObj.in.includes(value)) return false;
      }
      if ("notIn" in condObj && Array.isArray(condObj.notIn)) {
        if (condObj.notIn.includes(value)) return false;
      }
      if ("contains" in condObj && typeof condObj.contains === "string") {
        if (typeof value !== "string") return false;
        const insensitive = condObj.mode === "insensitive";
        const haystack = insensitive ? value.toLowerCase() : value;
        const needle = insensitive
          ? condObj.contains.toLowerCase()
          : condObj.contains;
        if (!haystack.includes(needle)) return false;
      }
      if ("gte" in condObj) {
        if (typeof value === "number" && typeof condObj.gte === "number") {
          if (value < condObj.gte) return false;
        } else {
          const vt = toComparableTime(value);
          const ct = toComparableTime(condObj.gte);
          if (vt === null || ct === null || vt < ct) return false;
        }
      }
      if ("lte" in condObj) {
        if (typeof value === "number" && typeof condObj.lte === "number") {
          if (value > condObj.lte) return false;
        } else {
          const vt = toComparableTime(value);
          const ct = toComparableTime(condObj.lte);
          if (vt === null || ct === null || vt > ct) return false;
        }
      }
      if ("gt" in condObj) {
        if (typeof value === "number" && typeof condObj.gt === "number") {
          if (value <= condObj.gt) return false;
        } else {
          const vt = toComparableTime(value);
          const ct = toComparableTime(condObj.gt);
          if (vt === null || ct === null || vt <= ct) return false;
        }
      }
      if ("lt" in condObj) {
        if (typeof value === "number" && typeof condObj.lt === "number") {
          if (value >= condObj.lt) return false;
        } else {
          const vt = toComparableTime(value);
          const ct = toComparableTime(condObj.lt);
          if (vt === null || ct === null || vt >= ct) return false;
        }
      }
      continue;
    }

    if (value !== condition) return false;
  }

  return true;
}

function sortRecords(records: MockRecord[], orderBy: unknown): MockRecord[] {
  if (!orderBy) return records;
  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...records].sort((a, b) => {
    for (const clause of clauses) {
      if (!clause || typeof clause !== "object") continue;
      for (const [field, dir] of Object.entries(clause)) {
        const av = a[field];
        const bv = b[field];
        if (av === bv) continue;
        if (av == null) return dir === "asc" ? -1 : 1;
        if (bv == null) return dir === "asc" ? 1 : -1;
        const cmp =
          av instanceof Date && bv instanceof Date
            ? av.getTime() - bv.getTime()
            : String(av).localeCompare(String(bv));
        if (cmp !== 0) return dir === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}

function queryRelatedCollection(
  modelName: string,
  allRows: MockRecord[],
  relSpec: unknown,
  store: Record<string, MockRecord[]>
): MockRecord[] {
  const specObj = asRecord(relSpec);
  let rows = allRows;
  if (specObj?.where) {
    rows = rows.filter((r) => matchesFilter(r, specObj.where, store));
  }
  if (specObj?.orderBy) {
    rows = sortRecords(rows, specObj.orderBy);
  }
  if (typeof specObj?.take === "number") {
    rows = rows.slice(0, specObj.take);
  }
  return rows.map((r) => hydrateRecord(modelName, r, specObj, store));
}

function hydrateRecord(
  modelName: string,
  record: MockRecord,
  args: MockRecord | undefined,
  store: Record<string, MockRecord[]>
): MockRecord {
  const result: MockRecord = { ...record };

  const attachRelations = (specInput: unknown) => {
    const spec = asRecord(specInput);
    if (!spec) return;

    if (spec.service && result.serviceId) {
      result.service =
        (store.service || []).find((s) => s.id === result.serviceId) ?? null;
    }
    if (spec.customer && result.customerId) {
      result.customer =
        (store.user || []).find((u) => u.id === result.customerId) ?? null;
    }
    if (spec.supervisor) {
      result.supervisor = result.supervisorId
        ? (store.user || []).find((u) => u.id === result.supervisorId) ?? null
        : null;
    }
    if (spec.finalApprovedBy) {
      result.finalApprovedBy = result.finalApprovedById
        ? (store.user || []).find((u) => u.id === result.finalApprovedById) ??
          null
        : null;
    }
    if (spec.user && result.userId) {
      result.user =
        (store.user || []).find((u) => u.id === result.userId) ?? null;
    }
    if (spec.actor && result.actorId) {
      result.actor =
        (store.user || []).find((u) => u.id === result.actorId) ?? null;
    }
    if (spec.createdBy && result.createdById) {
      result.createdBy =
        (store.user || []).find((u) => u.id === result.createdById) ?? null;
    }
    if (spec.staff && result.staffId) {
      result.staff =
        (store.user || []).find((u) => u.id === result.staffId) ?? null;
    }
    if (spec.assignedBy && result.assignedById) {
      result.assignedBy =
        (store.user || []).find((u) => u.id === result.assignedById) ?? null;
    }
    if (spec.unassignedBy) {
      result.unassignedBy = result.unassignedById
        ? (store.user || []).find((u) => u.id === result.unassignedById) ?? null
        : null;
    }
    if (spec.submittedBy && result.submittedById) {
      result.submittedBy =
        (store.user || []).find((u) => u.id === result.submittedById) ?? null;
    }
    if (spec.reviewer && result.reviewerId) {
      result.reviewer =
        (store.user || []).find((u) => u.id === result.reviewerId) ?? null;
    }
    if (spec.assignment && result.assignmentId) {
      const assignment =
        (store.bookingAssignment || []).find(
          (a) => a.id === result.assignmentId
        ) ?? null;
      const aSpec = asRecord(spec.assignment);
      result.assignment = assignment
        ? hydrateRecord("bookingAssignment", assignment, aSpec, store)
        : null;
    }
    if (spec.booking && result.bookingId) {
      const booking =
        (store.booking || []).find((b) => b.id === result.bookingId) ?? null;
      const bookingSpec = asRecord(spec.booking);
      result.booking = booking
        ? hydrateRecord(
            "booking",
            booking,
            bookingSpec?.include || bookingSpec?.select
              ? bookingSpec
              : { include: { service: true, customer: true } },
            store
          )
        : null;
    }
    if (spec.vacancy && result.vacancyId) {
      result.vacancy =
        (store.vacancy || []).find((v) => v.id === result.vacancyId) ?? null;
    }
    if (spec.review && modelName === "booking") {
      result.review =
        (store.review || []).find((r) => r.bookingId === result.id) ?? null;
    }
    if (spec.assignments && modelName === "booking") {
      const all = (store.bookingAssignment || []).filter(
        (a) => a.bookingId === result.id
      );
      result.assignments = queryRelatedCollection(
        "bookingAssignment",
        all,
        spec.assignments,
        store
      );
    }
    if (spec.submissions && (modelName === "booking" || modelName === "bookingAssignment")) {
      const all = (store.assignmentSubmission || []).filter((s) =>
        modelName === "booking"
          ? s.bookingId === result.id
          : s.assignmentId === result.id
      );
      result.submissions = queryRelatedCollection(
        "assignmentSubmission",
        all,
        spec.submissions,
        store
      );
    }
    if (spec.workflowReviews && (modelName === "booking" || modelName === "bookingAssignment")) {
      const all = (store.workflowReview || []).filter((w) =>
        modelName === "booking"
          ? w.bookingId === result.id
          : w.assignmentId === result.id
      );
      result.workflowReviews = queryRelatedCollection(
        "workflowReview",
        all,
        spec.workflowReviews,
        store
      );
    }
    if (spec.assignmentsReceived && modelName === "user") {
      const all = (store.bookingAssignment || []).filter(
        (a) => a.staffId === result.id
      );
      result.assignmentsReceived = queryRelatedCollection(
        "bookingAssignment",
        all,
        spec.assignmentsReceived,
        store
      );
    }
    if (spec.bookingsSupervised && modelName === "user") {
      const all = (store.booking || []).filter(
        (b) => b.supervisorId === result.id
      );
      result.bookingsSupervised = queryRelatedCollection(
        "booking",
        all,
        spec.bookingsSupervised,
        store
      );
    }
    if (spec.statusHistory && modelName === "jobApplication") {
      result.statusHistory = (store.applicationStatusHistory || []).filter(
        (h) => h.applicationId === result.id
      );
    }
    if (spec._count && modelName === "user") {
      result._count = {
        bookings: (store.booking || []).filter((b) => b.customerId === result.id)
          .length,
        assignmentsReceived: (store.bookingAssignment || []).filter(
          (a) => a.staffId === result.id
        ).length,
        assignmentsCreated: (store.bookingAssignment || []).filter(
          (a) => a.assignedById === result.id
        ).length,
        bookingsSupervised: (store.booking || []).filter(
          (b) => b.supervisorId === result.id
        ).length,
      };
    }
    if (spec._count && modelName === "booking") {
      result._count = {
        quotes: (store.quote || []).filter((q) => q.bookingId === result.id)
          .length,
        assignments: (store.bookingAssignment || []).filter(
          (a) => a.bookingId === result.id
        ).length,
        submissions: (store.assignmentSubmission || []).filter(
          (s) => s.bookingId === result.id
        ).length,
        workflowReviews: (store.workflowReview || []).filter(
          (w) => w.bookingId === result.id
        ).length,
      };
    }
    if (spec._count && modelName === "service") {
      result._count = {
        bookings: (store.booking || []).filter((b) => b.serviceId === result.id)
          .length,
        reviews: (store.review || []).filter((r) => r.serviceId === result.id)
          .length,
      };
    }
  };

  attachRelations(args?.include);
  attachRelations(args?.select);

  return result;
}

function applyUpdatePatch(
  existing: MockRecord,
  patch: MockRecord
): MockRecord {
  const next: MockRecord = { ...existing };
  for (const [key, val] of Object.entries(patch)) {
    const obj = asRecord(val);
    if (obj && typeof obj.increment === "number") {
      const current = typeof next[key] === "number" ? (next[key] as number) : 0;
      next[key] = current + obj.increment;
    } else if (obj && typeof obj.decrement === "number") {
      const current = typeof next[key] === "number" ? (next[key] as number) : 0;
      next[key] = current - obj.decrement;
    } else {
      next[key] = val;
    }
  }
  next.updatedAt = new Date();
  return next;
}

function createMockPrismaClient(): PrismaClient {
  const store = getMockStore();

  const createDelegate = (modelName: string) => {
    const getTable = () => {
      if (!store[modelName]) store[modelName] = [];
      return store[modelName];
    };

    return {
      findMany: async (args: MockRecord = {}) => {
        let rows = getTable().filter((r) => matchesFilter(r, args.where, store));
        if (args.orderBy) rows = sortRecords(rows, args.orderBy);
        if (typeof args.skip === "number") rows = rows.slice(args.skip);
        if (typeof args.take === "number") rows = rows.slice(0, args.take);
        return rows.map((r) => hydrateRecord(modelName, r, args, store));
      },
      findFirst: async (args: MockRecord = {}) => {
        let rows = getTable().filter((r) => matchesFilter(r, args.where, store));
        if (args.orderBy) rows = sortRecords(rows, args.orderBy);
        const found = rows[0] ?? null;
        return found ? hydrateRecord(modelName, found, args, store) : null;
      },
      findFirstOrThrow: async (args: MockRecord = {}) => {
        let rows = getTable().filter((r) => matchesFilter(r, args.where, store));
        if (args.orderBy) rows = sortRecords(rows, args.orderBy);
        const found = rows[0];
        if (!found) throw new Error(`Record not found in ${modelName}`);
        return hydrateRecord(modelName, found, args, store);
      },
      findUnique: async (args: MockRecord = {}) => {
        const found =
          getTable().find((r) => matchesFilter(r, args.where, store)) ?? null;
        return found ? hydrateRecord(modelName, found, args, store) : null;
      },
      findUniqueOrThrow: async (args: MockRecord = {}) => {
        const found = getTable().find((r) =>
          matchesFilter(r, args.where, store)
        );
        if (!found) throw new Error(`Record not found in ${modelName}`);
        return hydrateRecord(modelName, found, args, store);
      },
      create: async (args: MockRecord = {}) => {
        const now = new Date();
        const data = asRecord(args.data) ?? {};
        const defaults: MockRecord =
          modelName === "user"
            ? { sessionVersion: 0, accountStatus: "ACTIVE", role: "CUSTOMER" }
            : modelName === "bookingAssignment"
              ? { status: "PENDING", isActive: true, assignedAt: now }
              : modelName === "booking"
                ? { status: "PENDING", supervisionStatus: "NOT_REQUIRED" }
                : {};
        const record: MockRecord = {
          id: randomUUID(),
          ...defaults,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        getTable().push(record);
        return hydrateRecord(modelName, record, args, store);
      },
      createMany: async (args: MockRecord = {}) => {
        const items = Array.isArray(args.data) ? args.data : [args.data];
        const now = new Date();
        for (const item of items) {
          getTable().push({
            id: randomUUID(),
            createdAt: now,
            updatedAt: now,
            ...(asRecord(item) ?? {}),
          });
        }
        return { count: items.length };
      },
      update: async (args: MockRecord = {}) => {
        const table = getTable();
        const idx = table.findIndex((r) => matchesFilter(r, args.where, store));
        if (idx === -1) throw new Error(`Record not found in ${modelName}`);
        table[idx] = applyUpdatePatch(table[idx], asRecord(args.data) ?? {});
        return hydrateRecord(modelName, table[idx], args, store);
      },
      updateMany: async (args: MockRecord = {}) => {
        const table = getTable();
        const data = asRecord(args.data) ?? {};
        let count = 0;
        for (let i = 0; i < table.length; i++) {
          if (matchesFilter(table[i], args.where, store)) {
            table[i] = applyUpdatePatch(table[i], data);
            count += 1;
          }
        }
        return { count };
      },
      upsert: async (args: MockRecord = {}) => {
        const table = getTable();
        const idx = table.findIndex((r) => matchesFilter(r, args.where, store));
        if (idx !== -1) {
          table[idx] = applyUpdatePatch(
            table[idx],
            asRecord(args.update) ?? {}
          );
          return hydrateRecord(modelName, table[idx], args, store);
        }
        const now = new Date();
        const created: MockRecord = {
          id: randomUUID(),
          createdAt: now,
          updatedAt: now,
          ...(asRecord(args.create) ?? {}),
        };
        table.push(created);
        return hydrateRecord(modelName, created, args, store);
      },
      delete: async (args: MockRecord = {}) => {
        const table = getTable();
        const idx = table.findIndex((r) => matchesFilter(r, args.where, store));
        if (idx === -1) throw new Error(`Record not found in ${modelName}`);
        const [removed] = table.splice(idx, 1);
        return removed;
      },
      deleteMany: async (args: MockRecord = {}) => {
        const table = getTable();
        const remaining = table.filter(
          (r) => !matchesFilter(r, args.where, store)
        );
        const count = table.length - remaining.length;
        store[modelName] = remaining;
        return { count };
      },
      count: async (args: MockRecord = {}) => {
        return getTable().filter((r) => matchesFilter(r, args.where, store))
          .length;
      },
      groupBy: async () => [],
      aggregate: async () => ({ _count: { _all: 0 } }),
    };
  };

  const client: MockRecord = {
    $connect: async () => undefined,
    $disconnect: async () => undefined,
    $queryRaw: async () => [],
    $executeRaw: async () => 0,
    $transaction: async (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: PrismaClient) => Promise<unknown>)(proxy);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return [];
    },
  };

  const proxy: PrismaClient = new Proxy(client, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return createDelegate(prop);
    },
  }) as unknown as PrismaClient;

  return proxy;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createDatabaseClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    console.warn(
      "[AI Studio] DATABASE_URL is not set — using in-memory mock database."
    );
    return createMockPrismaClient();
  }

  try {
    const caCertificate = process.env.SUPABASE_CA_CERT_BASE64;
    const adapter = new PrismaPg({
      connectionString,
      ssl: caCertificate
        ? {
            ca: Buffer.from(caCertificate, "base64").toString("utf8"),
            rejectUnauthorized: true,
          }
        : undefined,
    });

    return new PrismaClient({ adapter });
  } catch (error) {
    console.warn(
      "[AI Studio] Database connection failed — using in-memory mock database.",
      error
    );
    return createMockPrismaClient();
  }
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createDatabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export type { Prisma };
