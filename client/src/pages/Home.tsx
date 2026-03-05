// Medicare Advantage Quote Engine — Landing Page
// Design: Bold Civic Design | Primary: #006B3F | CTA: #F47920
// Layout: Full-width hero with centered search, stats row below, features section

import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, Search, Shield, Star, Users, ChevronRight, CheckCircle2, Phone, Award } from "lucide-react";
import Header from "@/components/Header";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663319810046/5TY7JcF275WMujMHZWWJT8/medicare-hero-bg-iaggTZnD46X48m7fSJxiUw.webp";
const STATS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663319810046/5TY7JcF275WMujMHZWWJT8/medicare-stats-bg-7JivUgRLmv4zeASo4jWb2d.webp";
const DOCTOR_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663319810046/5TY7JcF275WMujMHZWWJT8/medicare-doctor-network-UbrpVenqJHVZiygzeBgcKi.webp";

const POPULAR_ZIPS = [
  { zip: "64106", city: "Kansas City, MO" },
  { zip: "64111", city: "Westport, MO" },
  { zip: "64114", city: "South KC, MO" },
  { zip: "64030", city: "Grandview, MO" },
];

const CARRIERS = [
  { name: "UnitedHealthcare", color: "#002677" },
  { name: "Humana", color: "#006D9D" },
  { name: "Aetna", color: "#7D2248" },
  { name: "Cigna", color: "#E8002D" },
  { name: "WellCare", color: "#00A651" },
  { name: "Blue KC", color: "#003087" },
];

const FEATURES = [
  {
    icon: Search,
    title: "Compare All Plans Side-by-Side",
    desc: "See every Medicare Advantage plan available in your ZIP code with detailed benefits, copays, and drug coverage.",
  },
  {
    icon: Shield,
    title: "No Cost, No Obligation",
    desc: "Our service is 100% free. We're paid by insurance carriers, never by you. Compare plans without any pressure.",
  },
  {
    icon: Star,
    title: "CMS Star Ratings Included",
    desc: "Every plan shows its official CMS quality star rating so you can choose a plan with proven performance.",
  },
  {
    icon: Users,
    title: "Check Your Doctors & Drugs",
    desc: "Add your doctors and prescriptions to see which plans cover them and estimate your total annual costs.",
  },
];

export default function Home() {
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = () => {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }
    setError("");
    navigate(`/plans?zip=${trimmed}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAF9" }}>
      <Header />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: "580px" }}>
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        {/* Gradient overlay — left side darker for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(0,77,44,0.88) 0%, rgba(0,107,63,0.75) 40%, rgba(0,107,63,0.25) 70%, rgba(0,0,0,0) 100%)",
          }}
        />

        <div className="relative container py-16 lg:py-24">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-white/20">
              <Award size={12} />
              2025 Medicare Advantage Open Enrollment
            </div>

            {/* Headline */}
            <h1
              className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Find the Best
              <br />
              <span style={{ color: "#FFA040" }}>Medicare Advantage</span>
              <br />
              Plans Near You
            </h1>

            <p className="text-white/85 text-lg mb-8 leading-relaxed max-w-xl">
              Compare plans from top carriers — including{" "}
              <strong className="text-white">$0 premium options</strong> with dental, vision, and
              prescription drug coverage.
            </p>

            {/* ZIP Search Box */}
            <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-lg">
              <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin size={15} style={{ color: "#006B3F" }} />
                Enter your ZIP code to see plans in your area
              </div>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="e.g. 64106"
                    value={zip}
                    onChange={(e) => {
                      setZip(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3.5 text-lg font-semibold border-2 rounded-xl outline-none transition-all text-gray-800 placeholder-gray-400"
                    style={{
                      borderColor: error ? "#EF4444" : "#E5E7EB",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onFocus={(e) => {
                      if (!error) e.currentTarget.style.borderColor = "#006B3F";
                    }}
                    onBlur={(e) => {
                      if (!error) e.currentTarget.style.borderColor = "#E5E7EB";
                    }}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="btn-cta px-6 py-3.5 rounded-xl text-base font-bold flex items-center gap-2 whitespace-nowrap shadow-lg"
                  style={{ backgroundColor: "#F47920", color: "white" }}
                >
                  <Search size={18} />
                  See Plans
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <span>⚠</span> {error}
                </p>
              )}

              {/* Popular ZIPs */}
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-400 font-medium">Popular:</span>
                {POPULAR_ZIPS.map((z) => (
                  <button
                    key={z.zip}
                    onClick={() => {
                      setZip(z.zip);
                      navigate(`/plans?zip=${z.zip}`);
                    }}
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-700 hover:bg-green-50 transition-colors font-medium"
                  >
                    {z.zip} – {z.city}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-4 mt-6">
              {[
                "No cost to compare",
                "Licensed agents available",
                "All major carriers",
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-white/90 text-sm">
                  <CheckCircle2 size={14} className="text-green-300" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <section
        className="relative py-8"
        style={{
          backgroundImage: `url(${STATS_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-white/90" />
        <div className="relative container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "24", label: "Plans Available", sub: "in Jackson County, MO" },
              { value: "$0", label: "Lowest Premium", sub: "many plans available" },
              { value: "6", label: "Top Carriers", sub: "UHC, Humana, Aetna & more" },
              { value: "4.5★", label: "Top Rated Plans", sub: "CMS quality ratings" },
            ].map((stat) => (
              <div key={stat.label} className="py-2">
                <div
                  className="text-3xl font-bold mb-0.5"
                  style={{ color: "#006B3F", fontFamily: "'DM Serif Display', serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-gray-800">{stat.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Carrier Logos ─────────────────────────────────────────────────── */}
      <section className="py-10 bg-white border-y border-gray-100">
        <div className="container">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
            Compare plans from these top carriers
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            {CARRIERS.map((c) => (
              <div
                key={c.name}
                className="px-5 py-2.5 rounded-lg text-white text-sm font-bold shadow-sm"
                style={{ backgroundColor: c.color, fontFamily: "'DM Sans', sans-serif" }}
              >
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#F8FAF9" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              Why Compare Plans With Us?
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              We make it easy to find the right Medicare Advantage plan for your health needs and
              budget.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#E8F5EE" }}
                >
                  <f.icon size={22} style={{ color: "#006B3F" }} />
                </div>
                <h3
                  className="text-base font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Doctor Network CTA ────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
                style={{ backgroundColor: "#E8F5EE", color: "#006B3F" }}
              >
                <Shield size={12} />
                Doctor & Drug Coverage Check
              </div>
              <h2
                className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                Make Sure Your Doctors
                <br />
                <span style={{ color: "#006B3F" }}>Are In-Network</span>
              </h2>
              <p className="text-gray-500 text-lg mb-6 leading-relaxed">
                Add your current doctors and prescription drugs to instantly see which plans cover
                them — and estimate your total out-of-pocket costs for the year.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Check if your doctors accept the plan",
                  "See exact drug costs for your medications",
                  "Compare total annual cost estimates",
                  "Find plans with the lowest out-of-pocket maximum",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 text-sm">
                    <CheckCircle2 size={16} style={{ color: "#006B3F" }} className="shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/plans?zip=64106")}
                className="btn-cta inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold shadow-lg"
                style={{ backgroundColor: "#F47920", color: "white" }}
              >
                Compare Plans Now
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={DOCTOR_IMG}
                  alt="Doctor network"
                  className="w-full h-80 object-cover object-top"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,77,44,0.6) 0%, transparent 60%)",
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-sm font-semibold">4,200+ In-Network Providers</div>
                  <div className="text-xs text-white/80">in Jackson County, MO</div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#E8F5EE" }}
                  >
                    <Star size={16} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800">Top Rated</div>
                    <div className="text-xs text-gray-500">4.5★ Plans Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-16 text-white text-center"
        style={{
          background: "linear-gradient(135deg, #004D2C 0%, #006B3F 50%, #00A651 100%)",
        }}
      >
        <div className="container max-w-2xl">
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Ready to Find Your Plan?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Enter your ZIP code to compare all available Medicare Advantage plans in your area —
            free, with no obligation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="Enter ZIP code"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
              onKeyDown={handleKeyDown}
              className="flex-1 px-5 py-3.5 rounded-xl text-gray-800 font-semibold text-lg outline-none border-2 border-transparent focus:border-green-300"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              onClick={handleSearch}
              className="btn-cta px-6 py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-xl"
              style={{ backgroundColor: "#F47920", color: "white" }}
            >
              <Search size={18} />
              See Plans
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-white/70 text-sm">
            <Phone size={14} />
            <span>
              Or call{" "}
              <a href="tel:1-800-555-0100" className="text-white font-semibold underline">
                1-800-555-0100
              </a>{" "}
              to speak with a licensed agent
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div
                className="text-white font-bold text-lg mb-3"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                MedicarePlan Finder
              </div>
              <p className="text-sm leading-relaxed">
                Helping Americans find the right Medicare Advantage plan since 2010. Licensed in all
                50 states.
              </p>
            </div>
            {[
              {
                title: "Plans",
                links: ["Medicare Advantage", "Medicare Supplement", "Part D Drug Plans", "Dual Eligible"],
              },
              {
                title: "Resources",
                links: ["Medicare 101", "Enrollment Periods", "Star Ratings Guide", "Compare Plans"],
              },
              {
                title: "Company",
                links: ["About Us", "Licensed Agents", "Contact Us", "Privacy Policy"],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">
                  {col.title}
                </div>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 text-xs text-gray-600">
            <p className="mb-2">
              We are not affiliated with or endorsed by the U.S. government or the federal Medicare
              program. This is a mock demonstration application for educational purposes only. Plan
              data shown is fictitious.
            </p>
            <p>© 2025 MedicarePlan Finder. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
