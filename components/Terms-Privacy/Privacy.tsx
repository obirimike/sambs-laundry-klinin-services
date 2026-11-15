import React from "react";
import Link from "next/link";
import { Lock, ArrowLeft, Mail, Phone } from "lucide-react";



export default function Privacy() {
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
            <Lock size={14} />
            <span>Privacy &amp; Data Protection</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Privacy Policy
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
              At SAMB&apos;s Laundry and Klinin Services, we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data when you use our services.
            </p>
          </div>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                1
              </span>
              Information We Collect
            </h2>
            <p className="text-slate-600">
              We may collect personal information such as your name, email address, phone number, and payment details when you register for our services or make a purchase. Additionally, we may collect non-personal information such as your IP address, browser type, and usage patterns to improve our services.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                2
              </span>
              How We Use Your Information
            </h2>
            <p className="text-slate-600">
              The information we collect is used to provide and improve our services, process transactions, communicate with you regarding your account or services, and for marketing purposes. We may also use your information to comply with legal obligations or protect our rights.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                3
              </span>
              Data Sharing and Disclosure
            </h2>
            <p className="text-slate-600">
              We do not sell or rent your personal information to third parties. However, we may share your information with trusted service providers who assist us in operating our business, such as payment processors and marketing partners. We may also disclose your information if required by law or to protect our rights.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                4
              </span>
              Data Security
            </h2>
            <p className="text-slate-600">
              We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, please note that no method of transmission over the internet or electronic storage is 100% secure.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                5
              </span>
              Your Rights
            </h2>
            <p className="text-slate-600">
              You have the right to access, correct, or delete your personal information. You may also opt-out of receiving marketing communications from us. To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                6
              </span>
              Changes to This Privacy Policy
            </h2>
            <p className="text-slate-600">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page, and the updated policy will be effective immediately upon posting. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
            </p>
          </section>

          <section className="space-y-3 pt-6 border-t border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs">
                7
              </span>
              Contact Information
            </h2>
            <p className="text-slate-600">
              If you have any questions or concerns regarding this Privacy Policy, please contact us at:
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
