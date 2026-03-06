// Shared layout for all informational placeholder pages
// Renders a consistent hero + content card + CTA section with the site header/footer

import { Link } from "wouter";
import { ChevronRight, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

export interface InfoPageProps {
  /** Breadcrumb label for the parent section, e.g. "Medicare Advantage" */
  section: string;
  /** Route of the parent section, e.g. "/plans" */
  sectionHref: string;
  /** Page title shown in the hero */
  title: string;
  /** One-sentence subtitle */
  subtitle: string;
  /** Hero accent color (defaults to brand green) */
  accentColor?: string;
  /** Main body content rendered inside the content card */
  children: React.ReactNode;
}

export default function InfoPage({
  section,
  sectionHref,
  title,
  subtitle,
  accentColor = "#006B3F",
  children,
}: InfoPageProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAF9" }}>
      <Header />

      {/* Hero */}
      <section
        className="py-12 text-white"
        style={{ background: `linear-gradient(135deg, #004D2C 0%, ${accentColor} 60%, #00A651 100%)` }}
      >
        <div className="container">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors no-underline text-white/70">
              Home
            </Link>
            <ChevronRight size={13} />
            <Link
              href={sectionHref}
              className="hover:text-white transition-colors no-underline text-white/70"
            >
              {section}
            </Link>
            <ChevronRight size={13} />
            <span className="text-white font-medium">{title}</span>
          </nav>

          <h1
            className="text-3xl lg:text-4xl font-bold mb-3"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {title}
          </h1>
          <p className="text-white/85 text-lg max-w-2xl">{subtitle}</p>
        </div>
      </section>

      {/* Content */}
      <div className="container py-12">
        <div className="max-w-3xl">
          {/* Back link */}
          <Link
            href={sectionHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 no-underline transition-colors"
            style={{ color: accentColor }}
          >
            <ArrowLeft size={14} />
            Back to {section}
          </Link>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {children}
          </div>

          {/* CTA */}
          <div
            className="mt-8 rounded-2xl p-8 text-white text-center"
            style={{ background: `linear-gradient(135deg, #004D2C 0%, ${accentColor} 100%)` }}
          >
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Ready to Compare Plans?
            </h2>
            <p className="text-white/80 mb-5">
              Enter your ZIP code to see all available plans in your area — free, with no obligation.
            </p>
            <Link
              href="/plans?zip=64106"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold no-underline transition-all"
              style={{ backgroundColor: "#F47920", color: "white" }}
            >
              See Plans Near You
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Minimal footer */}
      <footer className="bg-gray-900 text-gray-500 py-6 text-center text-xs">
        <p>
          We are not affiliated with or endorsed by the U.S. government or the federal Medicare
          program. This is a mock demonstration application for educational purposes only.
        </p>
        <p className="mt-1">© 2025 MedicarePlan Finder. All rights reserved.</p>
      </footer>
    </div>
  );
}
