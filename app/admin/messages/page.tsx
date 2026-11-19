import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ContactMessageManager from "@/components/admin/ContactMessageManager";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const session = await auth();

  if (!session?.user) redirect("/login?callbackUrl=%2Fadmin%2Fmessages");
  if (session.user.role !== "ADMIN") redirect("/account");

  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
      status: true,
      createdAt: true,
    },
  });

  const serializedMessages = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
    status: m.status as "NEW" | "READ" | "RESOLVED" | "ARCHIVED",
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} /> Dashboard
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <MessageSquare size={26} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Customer communication
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Contact messages &amp; inquiries
          </h1>
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Review customer inquiries submitted through the contact form, mark them
        as resolved, or archive them once addressed.
      </p>

      <div className="mt-7">
        <ContactMessageManager initialMessages={serializedMessages} />
      </div>
    </main>
  );
}
