import type { Metadata } from "next";
import Terms from "@/components/Terms-Privacy/Terms";

export const metadata: Metadata = {
  title: "Terms of Service | SAMB's Laundry & Klinin Services",
  description: "Read the Terms of Service for SAMB's Laundry and Klinin Services.",
};

export default function TermsPage() {
  return <Terms />;
}
