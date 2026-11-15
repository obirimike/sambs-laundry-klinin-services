import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, Mail, Phone } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="bg-[#031c43] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-200 hover:text-white transition mb-6"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 ml-5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-blue-200 mb-4">
            <FileText size={14} />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-slate-300">
            Last Updated: November 2026 • SAMB&apos;s Laundry and Klinin Services
          </p>
        </div>
      </section>

      {/* Main Content Article */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
          <div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Welcome to SAMB&apos;s Laundry and Klinin Services. By accessing or using our services, you agree to comply with and be bound by the following Terms of Service. Please read these terms carefully before using our services.
            </p>
          </div>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                1
              </span>
              Acceptance of Terms
            </h2>
            <p className="text-slate-600">
              By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from using our services.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                2
              </span>
              Use of Services
            </h2>
            <p className="text-slate-600">
              You agree to use our services only for lawful purposes and in accordance with these Terms of Service. You shall not engage in any activity that may disrupt or interfere with the proper functioning of our services or violate any applicable laws or regulations.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                3
              </span>
              Account Registration
            </h2>
            <p className="text-slate-600">
              In order to access certain features of our services, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information during the registration process.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                4
              </span>
              Payment and Billing
            </h2>
            <p className="text-slate-600">
              If you purchase any paid services, you agree to provide accurate payment information and authorize us to charge the applicable fees. All payments are non-refundable unless otherwise stated. We reserve the right to modify our pricing and billing practices at any time.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                5
              </span>
              Intellectual Property
            </h2>
            <p className="text-slate-600">
              All content and materials provided through our services, including but not limited to text, graphics, logos, images, and software, are the property of SAMB&apos;s Laundry and Klinin Services and are protected by intellectual property laws. You may not use, reproduce, or distribute any content without our prior written consent.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                6
              </span>
              Limitation of Liability
            </h2>
            <p className="text-slate-600">
              In no event shall SAMB&apos;s Laundry and Klinin Services be liable for any indirect, incidental, special, or consequential damages arising out of the use or inability to use our services, even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                7
              </span>
              Governing Law
            </h2>
            <p className="text-slate-600">
              These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which SAMB&apos;s Laundry and Klinin Services operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                8
              </span>
              Changes to Terms
            </h2>
            <p className="text-slate-600">
              We reserve the right to modify or update these Terms of Service at any time. Any changes will be effective immediately upon posting on our website. Your continued use of our services after any modifications constitutes your acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                9
              </span>
              Contact Information
            </h2>
            <p className="text-slate-600">
              If you have any questions or concerns regarding these Terms of Service, please contact us at:
            </p>
            <div className="mt-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail size={16} className="text-blue-700 shrink-0" />
                <a href="mailto:info@sambsklining.com" className="font-semibold text-blue-900 hover:underline">
                  info@sambsklining.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone size={16} className="text-blue-700 shrink-0" />
                <span>+233 (0) 54 024 0754 / +233 (0) 54 885 2176</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
