import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createStaffSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(30).optional(),
    role: z.enum(["STAFF", "SUPERVISOR"]).default("STAFF"),
    password: z
      .string()
      .min(10, "Passwords must contain at least 10 characters.")
      .max(72, "Passwords must not exceed 72 characters.")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Passwords are too long."
      ),
  })
  .strict();

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can manage staff and supervisors." },
        { status: 403 }
      );
    }

    const members = await db.user.findMany({
      where: { role: { in: ["STAFF", "SUPERVISOR"] } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        assignmentsReceived: {
          where: { isActive: true },
          select: { id: true },
        },
        bookingsSupervised: {
          where: { status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
          select: { id: true },
        },
      },
    });

    interface RawStaffMember {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      role: string;
      accountStatus: string;
      createdAt: Date;
      assignmentsReceived: Array<{ id: string }>;
      bookingsSupervised: Array<{ id: string }>;
    }

    return NextResponse.json({
      staff: (members as RawStaffMember[]).map(
        ({ assignmentsReceived, bookingsSupervised, ...member }) => ({
          ...member,
          createdAt: member.createdAt.toISOString(),
          activeAssignmentCount: assignmentsReceived.length,
          activeSupervisionCount: bookingsSupervised.length,
        })
      ),
    });
  } catch (error) {
    console.error("Failed to retrieve staff and supervisors:", error);

    return NextResponse.json(
      { message: "Unable to retrieve team members." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can create team accounts." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Please provide valid JSON." },
        { status: 400 }
      );
    }

    const parsed = createStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please check the account details.",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, email, phone, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await hash(password, 12);

    const created = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          phone: phone?.trim() || null,
          passwordHash,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          accountStatus: true,
          createdAt: true,
        },
      });

      await writeAudit(tx, {
        actorId: session.user.id,
        action: role === "SUPERVISOR" ? "SUPERVISOR_CREATED" : "STAFF_CREATED",
        entityType: "USER",
        entityId: user.id,
        changes: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });

      return user;
    });

    return NextResponse.json(
      {
        message:
          role === "SUPERVISOR"
            ? "Supervisor account created successfully."
            : "Staff account created successfully.",
        staff: created,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "An account with that email address already exists." },
        { status: 409 }
      );
    }

    console.error("Failed to create team account:", error);

    return NextResponse.json(
      { message: "Unable to create the team account." },
      { status: 500 }
    );
  }
}
