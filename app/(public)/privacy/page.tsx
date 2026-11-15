import type { Metadata } from "next";
import Privacy from "@/components/Terms-Privacy/Privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | SAMB's Laundry & Klinin Services",
  description: "Read the Privacy Policy for SAMB's Laundry and Klinin Services.",
};

export default function PrivacyPage() {
  return <Privacy />;
}
