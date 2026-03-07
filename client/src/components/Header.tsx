// Medicare Advantage Quote Engine — Header Component
// Design: Chapter-style | Navy #1B365D | Red #C41E3A | White background

import { Phone, Shield, ChevronDown, Menu, X, Sparkles, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";

// ── Dropdown menu definitions ────────────────────────────────────────────────
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

// ── NavDropdown ──────────────────────────────────────────────────────────────
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
        className="flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-all"
        style={{
          fontWeight: isActive ? 700 : 500,
          color: isActive ? "#C41E3A" : "#1B365D",
          backgroundColor: isActive ? "#FDEEF1" : "transparent",
          fontFamily: "'Inter', sans-serif",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.color = "#C41E3A";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FDEEF1";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.color = "#1B365D";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }
        }}
      >
        {label}
        <ChevronDown
          size={13}
          className="transition-transform duration-200"
          style={{
            opacity: 0.7,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
          style={{ borderTop: "3px solid #C41E3A" }}
        >
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="block px-4 py-2.5 text-sm transition-colors no-underline"
              style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#E8F0FE";
                (e.currentTarget as HTMLAnchorElement).style.color = "#C41E3A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "";
                (e.currentTarget as HTMLAnchorElement).style.color = "#1B365D";
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MobileNavSection ─────────────────────────────────────────────────────────
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
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
        style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8F0FE";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
        }}
      >
        {label}
        <ChevronDown
          size={13}
          className="opacity-60 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="ml-3 mt-0.5 border-l-2 pl-3 space-y-0.5" style={{ borderColor: "#E8F0FE" }}>
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="block py-2 text-sm no-underline transition-colors"
              style={{ color: "#333333", fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#C41E3A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#333333";
              }}
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
    <header className="bg-white sticky top-0 z-50" style={{ boxShadow: "0 1px 12px rgba(27,54,93,0.10)" }}>
      {/* Top utility bar — Navy */}
      <div style={{ backgroundColor: "#1B365D" }} className="text-white py-1.5">
        <div className="container flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Shield size={11} />
              <span>Licensed in all 50 states</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-blue-200">
              <span>2026 Medicare Advantage Plans Available</span>
            </span>
          </div>
          <a
            href="tel:1-800-555-0100"
            className="flex items-center gap-1.5 font-semibold transition-colors"
            style={{ color: "white" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#FDEEF1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "white"; }}
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
          <Link href="/" className="flex items-center gap-2.5 no-underline" onClick={closeDropdown}>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: "#1B365D" }}
            >
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>M</span>
            </div>
            <div>
              <div
                className="text-lg font-bold leading-tight"
                style={{ color: "#1B365D", fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
              >
                MedicarePlan
              </div>
              <div className="text-[10px] font-semibold tracking-widest uppercase leading-tight" style={{ color: "#C41E3A" }}>
                FINDER
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
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

            {/* Plan Lookup */}
            <Link
              href="/plan-lookup"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all no-underline"
              style={{
                color: location === "/plan-lookup" ? "white" : "#1B365D",
                backgroundColor: location === "/plan-lookup" ? "#1B365D" : "#E8F0FE",
                fontFamily: "'Inter', sans-serif",
              }}
              onClick={closeDropdown}
            >
              <Search size={13} />
              Plan Lookup
            </Link>

            {/* AI Compare */}
            <Link
              href="/ai-compare"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all no-underline"
              style={{
                color: location === "/ai-compare" ? "white" : "#C41E3A",
                backgroundColor: location === "/ai-compare" ? "#C41E3A" : "#FDEEF1",
                fontFamily: "'Inter', sans-serif",
              }}
              onClick={closeDropdown}
            >
              <Sparkles size={13} />
              AI Compare
            </Link>

            {/* Plan Recommender */}
            <Link
              href="/plan-recommender"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all no-underline"
              style={{
                color: location === "/plan-recommender" ? "white" : "#7C3AED",
                backgroundColor: location === "/plan-recommender" ? "#7C3AED" : "#F5F3FF",
                fontFamily: "'Inter', sans-serif",
              }}
              onClick={closeDropdown}
            >
              <Sparkles size={13} />
              Plan Recommender
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              className="hidden sm:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border-2 transition-all"
              style={{ borderColor: "#1B365D", color: "#1B365D", fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1B365D";
                (e.currentTarget as HTMLButtonElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#1B365D";
              }}
            >
              Sign In
            </button>
            <a
              href="tel:1-800-555-0100"
              className="hidden md:flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg text-white transition-all"
              style={{ backgroundColor: "#C41E3A", fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#A01830";
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 12px rgba(196,30,58,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#C41E3A";
                (e.currentTarget as HTMLAnchorElement).style.transform = "";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
              }}
            >
              <Phone size={14} />
              Talk to an Agent
            </a>
            <button
              className="lg:hidden p-2 rounded-md transition-colors"
              style={{ color: "#1B365D" }}
              onClick={() => setMobileOpen(!mobileOpen)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8F0FE"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""; }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white" style={{ borderColor: "#E8F0FE" }}>
          <div className="container py-3 space-y-1">
            {NAV_DROPDOWNS.map((nav) => (
              <MobileNavSection
                key={nav.label}
                label={nav.label}
                items={nav.items}
                onClose={() => setMobileOpen(false)}
              />
            ))}

            <Link
              href="/plan-lookup"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold rounded-md no-underline"
              style={{ color: "#1B365D", backgroundColor: "#E8F0FE", fontFamily: "'Inter', sans-serif" }}
              onClick={() => setMobileOpen(false)}
            >
              <Search size={14} />
              Plan Lookup
            </Link>

            <Link
              href="/ai-compare"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold rounded-md no-underline"
              style={{ color: "#C41E3A", backgroundColor: "#FDEEF1", fontFamily: "'Inter', sans-serif" }}
              onClick={() => setMobileOpen(false)}
            >
              <Sparkles size={14} />
              AI Compare
            </Link>

            <Link
              href="/plan-recommender"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold rounded-md no-underline"
              style={{ color: "#7C3AED", backgroundColor: "#F5F3FF", fontFamily: "'Inter', sans-serif" }}
              onClick={() => setMobileOpen(false)}
            >
              <Sparkles size={14} />
              Plan Recommender
            </Link>

            <div className="pt-2 border-t flex gap-2" style={{ borderColor: "#E8F0FE" }}>
              <button
                className="flex-1 py-2 text-sm font-semibold rounded-lg border-2 transition-all"
                style={{ borderColor: "#1B365D", color: "#1B365D", fontFamily: "'Inter', sans-serif" }}
              >
                Sign In
              </button>
              <a
                href="tel:1-800-555-0100"
                className="flex-1 py-2 text-sm font-bold rounded-lg text-white text-center"
                style={{ backgroundColor: "#C41E3A", fontFamily: "'Inter', sans-serif" }}
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
