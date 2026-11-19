import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ServiceManager from "@/components/admin/service-manager";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fservices");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const services = await db.service.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      imageUrl: true,
      status: true,
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

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
          <BriefcaseBusiness size={26} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Service management
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Cleaning and laundry services
          </h1>
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Maintain the services customers can request. Changes here affect future
        service listings; existing bookings keep their service references.
      </p>

      <div className="mt-7">
        <ServiceManager services={services} />
      </div>
    </main>
  );
}
