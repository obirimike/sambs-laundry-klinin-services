import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  deleteEvidencePhotos,
  MAX_EVIDENCE_FILES,
  uploadEvidencePhoto,
  type StoredEvidencePhoto,
} from "@/lib/evidence-storage";
import { assertStaff } from "@/lib/role-guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ assignmentId: string }>;
};

const submissionSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(5, "Provide a brief completion summary (at least 5 characters).")
    .max(1000, "Completion summary must be 1,000 characters or fewer."),
  workPerformed: z
    .string()
    .trim()
    .min(10, "Describe the work performed (at least 10 characters).")
    .max(4000, "Work performed description must be 4,000 characters or fewer."),
  issuesNoted: z
    .string()
    .trim()
    .max(2000, "Issues or concerns must be 2,000 characters or fewer.")
    .optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const uploadedPhotos: StoredEvidencePhoto[] = [];

  try {
    const guard = await assertStaff(request);
    if (guard.response) return guard.response;

    const { assignmentId } = await context.params;

    const assignment = await db.bookingAssignment.findFirst({
      where: {
        id: assignmentId,
        staffId: guard.session.user.id,
        isActive: true,
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            supervisorId: true,
            supervisionStatus: true,
          },
        },
      },
    });

    if (!assignment) {
      return apiError(
        404,
        "ASSIGNMENT_NOT_FOUND",
        "Your active assignment could not be found."
      );
    }

    if (!["CONFIRMED", "IN_PROGRESS"].includes(assignment.booking.status)) {
      return apiError(
        409,
        "BOOKING_NOT_ACTIVE",
        "Completion reports can only be submitted for confirmed or in-progress bookings."
      );
    }

    if (
      !["PENDING", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(
        assignment.status
      )
    ) {
      return apiError(
        409,
        "INVALID_ASSIGNMENT_STATUS",
        assignment.status === "SUBMITTED_FOR_REVIEW"
          ? "This assignment has already been submitted for supervisor review."
          : "This assignment has already been approved."
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let rawInput: Record<string, unknown> = {};
    const photoFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      rawInput = {
        summary: formData.get("summary") ?? "",
        workPerformed: formData.get("workPerformed") ?? "",
        issuesNoted: formData.get("issuesNoted") ?? undefined,
      };
      const files = formData.getAll("photos");
      for (const entry of files) {
        if (entry instanceof File && entry.size > 0) {
          photoFiles.push(entry);
        }
      }
    } else {
      rawInput = (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
    }

    const parsed = submissionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return apiError(
        422,
        "VALIDATION_ERROR",
        "Please complete the required completion report fields.",
        { errors: parsed.error.flatten().fieldErrors }
      );
    }

    if (photoFiles.length > MAX_EVIDENCE_FILES) {
      return apiError(
        422,
        "TOO_MANY_PHOTOS",
        `You can upload at most ${MAX_EVIDENCE_FILES} supporting photos.`
      );
    }

    if (photoFiles.length > 0) {
      for (const file of photoFiles) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const stored = await uploadEvidencePhoto(
          buffer,
          file.name,
          file.type,
          assignment.booking.id
        );
        uploadedPhotos.push(stored);
      }
    }

    const now = new Date();
    const { summary, workPerformed, issuesNoted } = parsed.data;

    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const submission = await tx.assignmentSubmission.create({
        data: {
          assignmentId: assignment.id,
          bookingId: assignment.booking.id,
          submittedById: guard.session.user.id,
          summary,
          workPerformed,
          issuesNoted: issuesNoted?.trim() || null,
          photos: uploadedPhotos.length > 0 ? uploadedPhotos : [],
        },
      });

      const updatedAssignment = await tx.bookingAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "SUBMITTED_FOR_REVIEW",
          startedAt: assignment.startedAt ?? now,
          submittedAt: now,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
        },
      });

      const allActive = await tx.bookingAssignment.findMany({
        where: {
          bookingId: assignment.booking.id,
          isActive: true,
        },
        select: { id: true, status: true },
      });

      const allSubmittedOrApproved = allActive.every(
        (a: { id: string; status: string }) =>
          a.id === assignment.id ||
          a.status === "SUBMITTED_FOR_REVIEW" ||
          a.status === "APPROVED"
      );

      const nextSupervisionStatus = allSubmittedOrApproved
        ? "AWAITING_SUPERVISOR_REVIEW"
        : "IN_PROGRESS";

      await tx.booking.update({
        where: { id: assignment.booking.id },
        data: {
          status:
            assignment.booking.status === "CONFIRMED"
              ? "IN_PROGRESS"
              : assignment.booking.status,
          supervisionStatus: nextSupervisionStatus,
        },
      });

      if (allSubmittedOrApproved) {
        if (assignment.booking.supervisorId) {
          await tx.notification.create({
            data: {
              userId: assignment.booking.supervisorId,
              title: "Completion reports ready for review",
              message: `All assigned staff have submitted completion reports for booking ${assignment.booking.bookingNumber}.`,
              type: "SUPERVISOR_REVIEW_READY",
            },
          });
        } else {
          const admins = await tx.user.findMany({
            where: { role: "ADMIN", accountStatus: "ACTIVE" },
            select: { id: true },
          });
          for (const admin of admins) {
            await tx.notification.create({
              data: {
                userId: admin.id,
                title: "Staff reports submitted (supervisor unassigned)",
                message: `Staff completed work on booking ${assignment.booking.bookingNumber}, but no lead supervisor is assigned yet.`,
                type: "SUPERVISOR_NEEDED",
              },
            });
          }
        }
      } else if (assignment.booking.supervisorId) {
        await tx.notification.create({
          data: {
            userId: assignment.booking.supervisorId,
            title: "Staff completion report submitted",
            message: `${guard.session.user.name || "A staff member"} submitted a completion report for booking ${assignment.booking.bookingNumber}.`,
            type: "STAFF_REPORT_SUBMITTED",
          },
        });
      }

      await writeAudit(tx, {
        actorId: guard.session.user.id,
        action:
          assignment.status === "CHANGES_REQUESTED"
            ? "STAFF_COMPLETION_RESUBMITTED"
            : "STAFF_COMPLETION_SUBMITTED",
        entityType: "BOOKING_ASSIGNMENT",
        entityId: assignment.id,
        changes: {
          bookingId: assignment.booking.id,
          bookingNumber: assignment.booking.bookingNumber,
          submissionId: submission.id,
          allSubmittedOrApproved,
        },
      });

      return {
        submission,
        assignment: updatedAssignment,
        allSubmittedOrApproved,
      };
    });

    return apiSuccess(
      result.allSubmittedOrApproved
        ? `Completion report submitted for ${assignment.booking.bookingNumber}. Ready for supervisor review.`
        : `Your completion report for ${assignment.booking.bookingNumber} has been submitted.`,
      result,
      201
    );
  } catch (error) {
    if (uploadedPhotos.length > 0) {
      await deleteEvidencePhotos(uploadedPhotos.map((p) => p.storagePath));
    }

    console.error("Submit completion report error:", error);
    const message =
      error instanceof Error &&
      (error.message.includes("5 MB") ||
        error.message.includes("JPEG") ||
        error.message.includes("image"))
        ? error.message
        : "Unable to submit your completion report right now.";

    return apiError(500, "SUBMISSION_FAILED", message);
  }
}
