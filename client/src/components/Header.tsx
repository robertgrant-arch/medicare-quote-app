// Medicare Advantage Quote Engine — Header Component
// Design: Bold Civic Design | Primary: #006B3F | CTA: #F47920
// DM Serif Display + DM Sans typography

import { Phone, Shield, ChevronDown, Menu, X, Sparkles, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";

// ── Dropdown menu definitions ────────────────────────────────────────────────
// activeRoutes: list of path prefixes that mark this section as "active"
const NAV_DROPDOWNS = [
  {
    label: "Medicare Advantage",
    activeRoutes: ["/plans", "/medicare-advantage"],
    items: [
      { label: "MA HMO Plans", href: "/medicare-advantage/hmo-plans" },
      { label: "MA PPO Plans", href: "/medicare-advantage/ppo-plans" },
      { label: "MA Special Needs Plans", href: "/medicare-advantage/special-needs-plans" },
      { label: "MA with Drug Coverage", href: "/medicare-advantage/drug-coverage" },
    ],
  },
  {
    label: "Medicare Supplement",
    activeRoutes: ["/medicare-supplement", "/medigap"],
    items: [
      { label: "Medigap Plan F", href: "/medicare-supplement/plan-f" },
      { label: "Medigap Plan G", href: "/medicare-supplement/plan-g" },
      { label: "Medigap Plan N", href: "/medicare-supplement/plan-n" },
      { label: "Compare Supplement Plans", href: "/medicare-supplement/compare" },
    ],
  },
  {
    label: "Part D Drug Plans",
    activeRoutes: ["/part-d", "/drug-plans"],
    items: [
      { label: "Compare Drug Plans", href: "/part-d/compare" },
      { label: "Drug Formulary Search", href: "/part-d/formulary-search" },
      { label: "Extra Help Programs", href: "/part-d/extra-help" },
      { label: "Part D Enrollment", href: "/part-d/enrollment" },
    ],
  },
  {
    label: "Resources",
    activeRoutes: ["/resources", "/medicare-101", "/faq"],
    items: [
      { label: "Medicare Guide", href: "/resources/medicare-guide" },
      { label: "Medicare 101", href: "/resources/medicare-101" },
      { label: "Enrollment Periods", href: "/resources/enrollment-periods" },
      { label: "Star Ratings Guide", href: "/resources/star-ratings" },
      { label: "FAQ", href: "/resources/faq" },
    ],
  },
];

// ── NavDropdown: single desktop dropdown button + panel ──────────────────
interface NavDropdownProps {
  label: string;
  items: { label: string; href: string }[];
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function NavDropdown({ label, items, isOpen, isActive, onToggle, onClose }: NavDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors"
        style={{
          fontWeight: isActive ? 700 : 500,
          color: isActive ? "#006B3F" : undefined,
          backgroundColor: isActive ? "#E8F5EE" : undefined,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.color = "#14532d";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f0fdf4";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.color = "";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
          }
        }}
      >
        {label}
        <ChevronDown
          size={13}
          className="transition-transform duration-200"
          style={{
            opacity: isActive ? 0.8 : 0.6,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50"
          style={{ borderTop: "3px solid #006B3F" }}
        >
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:text-green-800 hover:bg-green-50 transition-colors no-underline"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MobileNavSection: expandable section in mobile menu ─────────────────────
interface MobileNavSectionProps {
  label: string;
  items: { label: string; href: string }[];
  onClose: () => void;
}

function MobileNavSection({ label, items, onClose }: MobileNavSectionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 rounded-md transition-colors"
      >
        {label}
        <ChevronDown
          size={13}
          className="opacity-60 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="ml-3 mt-0.5 border-l-2 border-green-100 pl-3 space-y-0.5">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="block py-2 text-sm text-gray-600 hover:text-green-800 no-underline"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [location] = useLocation();

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  const closeDropdown = () => setOpenDropdown(null);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      {/* Top utility bar */}
      <div style={{ backgroundColor: "#006B3F" }} className="text-white py-1.5">
        <div className="container flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield size={11} />
              <span>Licensed in all 50 states</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <span>2025 Medicare Advantage Plans Available</span>
            </span>
          </div>
          <a
            href="tel:1-800-555-0100"
            className="flex items-center gap-1.5 font-semibold hover:text-green-200 transition-colors"
          >
            <Phone size={11} />
            <span>1-800-555-0100 (TTY 711)</span>
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: "#006B3F" }}
            >
              <span style={{ fontFamily: "'DM Serif Display', serif" }}>M</span>
            </div>
            <div>
              <div
                className="text-lg font-bold leading-tight"
                style={{ color: "#006B3F", fontFamily: "'DM Serif Display', serif" }}
              >
                MedicarePlan
              </div>
              <div className="text-[10px] text-gray-500 font-medium tracking-wide uppercase leading-tight">
                Finder
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_DROPDOWNS.map((nav) => (
              <NavDropdown
                key={nav.label}
                label={nav.label}
                items={nav.items}
                isOpen={openDropdown === nav.label}
                isActive={nav.activeRoutes.some((r) => location.startsWith(r))}
                onToggle={() => toggleDropdown(nav.label)}
                onClose={closeDropdown}
              />
            ))}

            {/* Plan Lookup — nav link */}
            <Link
              href="/plan-lookup"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md transition-all no-underline"
              style={{
                color: location === "/plan-lookup" ? "white" : "#006B3F",
                backgroundColor: location === "/plan-lookup" ? "#006B3F" : "#E8F5EE",
                border: `1.5px solid #006B3F30`,
              }}
              onClick={closeDropdown}
            >
              <Search size={13} />
              Plan Lookup
            </Link>

            {/* AI Compare — highlighted link */}
            <Link
              href="/ai-compare"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md transition-all no-underline"
              style={{
                color: location === "/ai-compare" ? "#006B3F" : "#F47920",
                backgroundColor: location === "/ai-compare" ? "#E8F5EE" : "#FFF3E8",
                border: `1.5px solid ${location === "/ai-compare" ? "#006B3F" : "#F47920"}30`,
              }}
              onClick={closeDropdown}
            >
              <Sparkles size={13} />
              AI Compare
            </Link>

            {/* Plan Recommender — highlighted link */}
            <Link
              href="/plan-recommender"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md transition-all no-underline"
              style={{
                color: location === "/plan-recommender" ? "white" : "#7C3AED",
                backgroundColor: location === "/plan-recommender" ? "#7C3AED" : "#F5F3FF",
                border: `1.5px solid ${location === "/plan-recommender" ? "#7C3AED" : "#7C3AED"}30`,
              }}
              onClick={closeDropdown}
            >
              <Sparkles size={13} />
              Plan Recommender
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border-2 transition-colors"
              style={{ borderColor: "#006B3F", color: "#006B3F" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8F5EE";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              Sign In
            </button>
            <a
              href="tel:1-800-555-0100"
              className="hidden md:flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg text-white transition-all"
              style={{ backgroundColor: "#F47920" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#D4650F";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#F47920";
              }}
            >
              <Phone size={14} />
              Talk to an Agent
            </a>
            <button
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="container py-3 space-y-1">
            {NAV_DROPDOWNS.map((nav) => (
              <MobileNavSection
                key={nav.label}
                label={nav.label}
                items={nav.items}
                onClose={() => setMobileOpen(false)}
              />
            ))}

            {/* Plan Lookup mobile link */}
            <Link
              href="/plan-lookup"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-bold rounded-md no-underline transition-colors"
              style={{ color: "#006B3F", backgroundColor: "#E8F5EE" }}
              onClick={() => setMobileOpen(false)}
            >
              <Search size={14} />
              Plan Lookup
            </Link>

            {/* AI Compare mobile link */}
            <Link
              href="/ai-compare"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-bold rounded-md no-underline transition-colors"
              style={{ color: "#F47920", backgroundColor: "#FFF3E8" }}
              onClick={() => setMobileOpen(false)}
            >
              <Sparkles size={14} />
              AI Compare
            </Link>

            {/* Plan Recommender mobile link */}
            <Link
              href="/plan-recommender"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-bold rounded-md no-underline transition-colors"
              style={{ color: "#7C3AED", backgroundColor: "#F5F3FF" }}
              onClick={() => setMobileOpen(false)}
            >
              <Sparkles size={14} />
              Plan Recommender
            </Link>

            <div className="pt-2 border-t border-gray-100 flex gap-2">
              <button
                className="flex-1 py-2 text-sm font-semibold rounded-lg border-2 transition-colors"
                style={{ borderColor: "#006B3F", color: "#006B3F" }}
              >
                Sign In
              </button>
              <a
                href="tel:1-800-555-0100"
                className="flex-1 py-2 text-sm font-bold rounded-lg text-white text-center transition-all"
                style={{ backgroundColor: "#F47920" }}
              >
                Call an Agent
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
