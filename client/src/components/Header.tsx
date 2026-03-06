// Medicare Advantage Quote Engine — Header Component
// Design: Bold Civic Design | Primary: #006B3F | CTA: #F47920
// DM Serif Display + DM Sans typography

import { Phone, Shield, ChevronDown, Menu, X, Sparkles, Search } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

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
            {[
              { label: "Medicare Advantage", href: "#" },
              { label: "Medicare Supplement", href: "#" },
              { label: "Part D Drug Plans", href: "#" },
              { label: "Resources", href: "#" },
            ].map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-800 rounded-md hover:bg-green-50 transition-colors"
                onClick={() => {}}
              >
                {item.label}
                <ChevronDown size={13} className="opacity-60" />
              </button>
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
            >
              <Sparkles size={13} />
              AI Compare
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
            {["Medicare Advantage", "Medicare Supplement", "Part D Drug Plans", "Resources"].map(
              (item) => (
                <button
                  key={item}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-800 rounded-md transition-colors"
                >
                  {item}
                </button>
              )
            )}
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
