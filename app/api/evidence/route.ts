import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEvidencePhotoBytes } from "@/lib/evidence-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  const storagePath = searchParams.get("path");

  if (!bookingId || !storagePath) {
    return NextResponse.json({ message: "Missing parameters." }, { status: 400 });
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      assignments: {
        where: { isActive: true },
        select: { staffId: true },
      },
      submissions: {
        select: { photos: true },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isSupervisor =
    session.user.role === "SUPERVISOR" &&
    booking.supervisorId === session.user.id;
  const isAssignedStaff =
    session.user.role === "STAFF" &&
    booking.assignments.some(
      (a: { staffId: string }) => a.staffId === session.user.id
    );

  if (!isAdmin && !isSupervisor && !isAssignedStaff) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const photoExistsOnBooking = booking.submissions.some(
    (sub: { photos: unknown }) => {
      if (!Array.isArray(sub.photos)) return false;
      return sub.photos.some(
        (p) =>
          typeof p === "object" &&
          p !== null &&
          (p as { storagePath?: string }).storagePath === storagePath
      );
    }
  );

  if (!photoExistsOnBooking) {
    return NextResponse.json({ message: "Photo not found" }, { status: 404 });
  }

  const file = await getEvidencePhotoBytes(storagePath);
  if (!file) {
    return NextResponse.json({ message: "File unavailable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": `inline; filename="${file.fileName}"`,
    },
  });
}
