/**
 * Admin Dashboard — /admin
 * -------------------------
 * Password-protected admin panel with:
 *   1. Carrier Management — enable/disable carriers
 *   2. Plan Management — enable/disable plans, flag non-commissionable
 *   3. Non-Commissionable Plans — dedicated view + seed button
 *   4. Data Sync Status — CMS pipeline status, history, manual trigger
 */

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc"; import AdminAIModels from "@/components/AdminAIModels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Building2,
  FileText,
  DollarSignIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
Sparkles, } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = "carriers" | "plans" | "noncomm" | "sync" | "ai-models";

// ─── Login Screen ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyMutation = trpc.admin.verifyPassword.useMutation({
    onSuccess: () => {
      onLogin(password);
    },
    onError: () => {
      setError("Invalid password. Please try again.");
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError("");
    setLoading(true);
    verifyMutation.mutate({ password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-red-700 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Shield className="text-white" size={24} />
          </div>
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <CardDescription>Medicare Quote Engine — Internal Admin Panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Admin Password
              </label>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                autoFocus
              />
              {error && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <XCircle size={14} /> {error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full bg-red-700 hover:bg-red-800" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Sign In to Admin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// US states list for the state dropdown
const US_STATES: Array<{ abbr: string; name: string }> = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DC", name: "District of Columbia" },
  { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" },
  { abbr: "ID", name: "Idaho" }, { abbr: "IL", name: "Illinois" },
  { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" },
  { abbr: "LA", name: "Louisiana" }, { abbr: "ME", name: "Maine" },
  { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" },
  { abbr: "MS", name: "Mississippi" }, { abbr: "MO", name: "Missouri" },
  { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" },
  { abbr: "NJ", name: "New Jersey" }, { abbr: "NM", name: "New Mexico" },
  { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" },
  { abbr: "OK", name: "Oklahoma" }, { abbr: "OR", name: "Oregon" },
  { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" },
  { abbr: "TN", name: "Tennessee" }, { abbr: "TX", name: "Texas" },
  { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" },
  { abbr: "WV", name: "West Virginia" }, { abbr: "WI", name: "Wisconsin" },
  { abbr: "WY", name: "Wyoming" },
];

// --- Carrier Management Tab ---
function CarrierManagement({ adminPassword }: { adminPassword: string }) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>([]);
  const [nonCommOnly, setNonCommOnly] = useState(false);
  const utils = trpc.useUtils();

  const { data: carriersData, isLoading: carriersLoading } = trpc.admin.getStateCarriers.useQuery(
    { adminPassword, state: selectedState },
    { enabled: selectedState.length === 2 }
  );

  const { data: plansData, isLoading: plansLoading } = trpc.admin.getStatePlans.useQuery(
    {
      adminPassword,
      state: selectedState,
      carriers: selectedCarriers.length > 0 ? selectedCarriers : undefined,
      nonCommOnly,
    },
    { enabled: selectedState.length === 2 }
  );

  const toggleCarrierMutation = trpc.admin.toggleCarrier.useMutation({
    onSuccess: () => utils.admin.getStateCarriers.invalidate(),
  });

  const togglePlanMutation = trpc.admin.togglePlan.useMutation({
    onSuccess: () => utils.admin.getStatePlans.invalidate(),
  });

  const carriers = carriersData?.carriers ?? [];
  const plans = plansData?.plans ?? [];

  const handleCarrierCheckbox = (carrierName: string, checked: boolean) => {
    setSelectedCarriers((prev) =>
      checked ? [...prev, carrierName] : prev.filter((c) => c !== carrierName)
    );
  };

  const handleSelectAllCarriers = () => {
    if (selectedCarriers.length === carriers.length) {
      setSelectedCarriers([]);
    } else {
      setSelectedCarriers(carriers.map((c) => c.name));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Carrier & Plan Management</h2>
          <p className="text-sm text-gray-500">
            Select a state to view all carriers and plans from CMS data. Disable carriers to hide their plans from public results.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">State:</label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedCarriers([]);
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[200px]"
          >
            <option value="">-- Select a State --</option>
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.name} ({s.abbr})
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={nonCommOnly}
            onChange={(e) => setNonCommOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm font-medium text-gray-700">Non-Commissionable Plans Only</span>
        </label>

        {selectedState && (
          <span className="text-xs text-gray-500 ml-auto">
            {carriersLoading ? "Loading..." : `${carriers.length} carriers in ${selectedState}`}
          </span>
        )}
      </div>

      {!selectedState ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-base font-medium text-gray-500">Select a state to get started</p>
          <p className="text-sm mt-1">Choose a state from the dropdown above to view carriers and plans.</p>
        </div>
      ) : carriersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={24} />
          <span className="ml-2 text-gray-500">Loading carriers for {selectedState}...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carrier Checkboxes */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Carriers in {selectedState}</CardTitle>
                  <button
                    onClick={handleSelectAllCarriers}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    {selectedCarriers.length === carriers.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <CardDescription className="text-xs">
                  Check carriers to filter plans. Toggle the switch to enable/disable.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                  {carriers.map((carrier) => (
                    <div
                      key={carrier.name}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        id={`carrier-${carrier.name}`}
                        checked={selectedCarriers.includes(carrier.name)}
                        onChange={(e) => handleCarrierCheckbox(carrier.name, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 shrink-0"
                      />
                      <label
                        htmlFor={`carrier-${carrier.name}`}
                        className="flex-1 text-sm font-medium text-gray-800 cursor-pointer leading-tight"
                      >
                        {carrier.name}
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {carrier.isEnabled ? (
                          <span className="text-xs text-green-600 font-medium">On</span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium">Off</span>
                        )}
                        <Switch
                          checked={carrier.isEnabled}
                          onCheckedChange={(checked) =>
                            toggleCarrierMutation.mutate({
                              adminPassword,
                              carrierName: carrier.name,
                              isEnabled: checked,
                            })
                          }
                          disabled={toggleCarrierMutation.isPending}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plans List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Plans
                    {selectedCarriers.length > 0
                      ? ` — ${selectedCarriers.slice(0, 2).join(", ")}${selectedCarriers.length > 2 ? ` +${selectedCarriers.length - 2} more` : ""}`
                      : ` — All Carriers in ${selectedState}`}
                  </CardTitle>
                  {plansData && (
                    <span className="text-xs text-gray-500">{plansData.total} plans</span>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {nonCommOnly
                    ? "Showing non-commissionable plans only."
                    : "Showing all plans. Check Non-Commissionable Only to filter."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {plansLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                    <span className="ml-2 text-sm text-gray-500">Loading plans...</span>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText size={32} className="mx-auto mb-3 text-gray-200" />
                    <p className="text-sm font-medium text-gray-500">
                      {nonCommOnly ? "No non-commissionable plans found" : "No plans found"}
                    </p>
                    {selectedCarriers.length > 0 && (
                      <p className="text-xs mt-1">Try deselecting some carriers or removing filters.</p>
                    )}
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 sticky top-0">
                          <TableHead className="text-xs">Plan Name</TableHead>
                          <TableHead className="text-xs">Carrier</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Premium</TableHead>
                          <TableHead className="text-xs">MOOP</TableHead>
                          <TableHead className="text-xs">Flags</TableHead>
                          <TableHead className="text-xs text-center">Enable</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.map((plan, idx) => {
                          const p = plan as Record<string, unknown>;
                          const planName = String(p.planName ?? p.name ?? "Unknown Plan");
                          const carrier = String(p.carrier ?? p.organization ?? "");
                          const planType = String(p.planType ?? p.type ?? "");
                          const premium = p.monthlyPremium ?? p.premium;
                          const moop = p.maxOutOfPocket ?? p.moop;
                          const isNonComm = Boolean(p.isNonCommissionable);
                          const planId = String(p.id ?? p.planId ?? "");
                          const isPlanEnabled = p.isEnabled !== false; // default true

                          return (
                            <TableRow key={`${planId}-${idx}`} className={`${isNonComm ? "bg-amber-50" : ""} ${!isPlanEnabled ? "opacity-50" : ""}`}>
                              <TableCell className="text-xs font-medium max-w-[200px]">
                                <div className="truncate" title={planName}>{planName}</div>
                                {planId && <div className="text-gray-400 text-[10px] font-mono truncate">{planId}</div>}
                              </TableCell>
                              <TableCell className="text-xs text-gray-600">{carrier}</TableCell>
                              <TableCell className="text-xs">
                                {planType && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {planType}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {premium !== undefined && premium !== null
                                  ? `$${Number(premium).toFixed(0)}/mo`
                                  : <span className="text-gray-400">—</span>}
                              </TableCell>
                              <TableCell className="text-xs">
                                {moop !== undefined && moop !== null
                                  ? `$${Number(moop).toLocaleString()}`
                                  : <span className="text-gray-400">—</span>}
                              </TableCell>
                              <TableCell className="text-xs">
                                {isNonComm && (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-1.5 py-0">
                                    <DollarSignIcon size={9} className="mr-0.5" /> Non-Comm
                                  </Badge>
                                )}
                                {!isPlanEnabled && (
                                  <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] px-1.5 py-0 ml-1">
                                    Hidden
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Switch
                                    checked={isPlanEnabled}
                                    onCheckedChange={(checked) => {
                                      if (!planId) return;
                                      togglePlanMutation.mutate({
                                        adminPassword,
                                        planId,
                                        planName,
                                        carrierName: carrier,
                                        isEnabled: checked,
                                      });
                                    }}
                                    disabled={!planId || togglePlanMutation.isPending}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <AlertTriangle size={16} className="inline mr-2" />
        <strong>Note:</strong> Toggle a carrier's switch to enable or disable all their plans from public results.
        Plans shown here come directly from CMS data. Non-commissionable flags are managed in the Non-Comm tab.
      </div>
    </div>
  );
}


// ─── Plan Management Tab ───────────────────────────────────────────────────────
function PlanManagement({
  adminPassword,
  nonCommOnly = false,
}: {
  adminPassword: string;
  nonCommOnly?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [carrier, setCarrier] = useState("");
  const [page, setPage] = useState(1);
  const [disabledOnly, setDisabledOnly] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.admin.getPlans.useQuery(
    {
      adminPassword,
      page,
      pageSize: 25,
      search: search || undefined,
      carrier: carrier || undefined,
      nonCommOnly: nonCommOnly || undefined,
      disabledOnly: disabledOnly || undefined,
    },
    { refetchInterval: 30000 }
  );

  const toggleMutation = trpc.admin.togglePlan.useMutation({
    onSuccess: () => utils.admin.getPlans.invalidate(),
  });

  const setNonCommMutation = trpc.admin.setNonCommissionable.useMutation({
    onSuccess: () => utils.admin.getPlans.invalidate(),
  });

  const plans = data?.plans ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {nonCommOnly ? "Non-Commissionable Plans" : "Plan Management"}
          </h2>
          <p className="text-sm text-gray-500">
            {nonCommOnly
              ? "Plans flagged as non-commissionable. Agents can see these but won't earn commission."
              : "Enable/disable individual plans and manage commission status."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search plans..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 w-56"
          />
        </div>
        <Input
          placeholder="Filter by carrier..."
          value={carrier}
          onChange={(e) => { setCarrier(e.target.value); setPage(1); }}
          className="w-48"
        />
        {!nonCommOnly && (
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={disabledOnly}
              onChange={(e) => { setDisabledOnly(e.target.checked); setPage(1); }}
              className="rounded"
            />
            Disabled only
          </label>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No plan overrides found</p>
          <p className="text-sm mt-1">
            {nonCommOnly
              ? "No non-commissionable plans loaded yet. Use the Seed button to load 2026 data."
              : "Plans appear here once they've been individually overridden."}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Plan ID</TableHead>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-xs text-gray-500">{plan.planId}</TableCell>
                    <TableCell className="font-medium max-w-48 truncate">{plan.planName ?? "—"}</TableCell>
                    <TableCell className="text-sm">{plan.carrierName ?? "—"}</TableCell>
                    <TableCell>
                      {plan.isNonCommissionable ? (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                          <DollarSignIcon size={11} className="mr-1" /> Non-Comm
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Commissionable
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.isEnabled ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                          Disabled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={plan.isEnabled}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({
                              adminPassword,
                              planId: plan.planId,
                              isEnabled: checked,
                            })
                          }
                          disabled={toggleMutation.isPending}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-xs ${plan.isNonCommissionable ? "text-green-700" : "text-orange-700"}`}
                          onClick={() =>
                            setNonCommMutation.mutate({
                              adminPassword,
                              planId: plan.planId,
                              isNonCommissionable: !plan.isNonCommissionable,
                            })
                          }
                          disabled={setNonCommMutation.isPending}
                        >
                          {plan.isNonCommissionable ? "Clear Flag" : "Flag Non-Comm"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total} plans
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Non-Commissionable Tab ────────────────────────────────────────────────────
function NonCommissionableTab({ adminPassword }: { adminPassword: string }) {
  const utils = trpc.useUtils();
  const [seedResult, setSeedResult] = useState<{
    inserted: number;
    updated: number;
    total: number;
  } | null>(null);

  const seedMutation = trpc.admin.seedNonCommPlans.useMutation({
    onSuccess: (data) => {
      setSeedResult(data);
      utils.admin.getPlans.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      {/* Seed Panel */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-orange-900">
            <DollarSignIcon size={18} />
            2026 Non-Commissionable Plan Seed Data
          </CardTitle>
          <CardDescription className="text-orange-700">
            Load pre-configured 2026 non-commissionable plan flags for Aetna, BCBS/HCSC,
            HealthSpring (Cigna), Humana, Medica, WellCare, UnitedHealthcare, Elevance/Anthem,
            and Highmark. This is safe to run multiple times — it upserts existing records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="bg-orange-700 hover:bg-orange-800 text-white"
                  disabled={seedMutation.isPending}
                >
                  {seedMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <Database size={16} className="mr-2" />
                  )}
                  Seed 2026 Non-Comm Plans (17 plans)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Seed Non-Commissionable Plans?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will insert or update 17 pre-configured non-commissionable plan records
                    for the 2026 plan year. Existing records will be updated, not deleted. This
                    action is safe to run multiple times.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-orange-700 hover:bg-orange-800"
                    onClick={() => seedMutation.mutate({ adminPassword })}
                  >
                    Seed Plans
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {seedResult && (
              <div className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 size={16} />
                Seeded: {seedResult.inserted} inserted, {seedResult.updated} updated (
                {seedResult.total} total)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan list filtered to non-comm only */}
      <PlanManagement adminPassword={adminPassword} nonCommOnly />
    </div>
  );
}

// ─── Sync Status Tab ───────────────────────────────────────────────────────────
function SyncStatusTab({ adminPassword }: { adminPassword: string }) {
  const utils = trpc.useUtils();
  const [syncStarted, setSyncStarted] = useState(false);

  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } =
    trpc.admin.getSyncStatus.useQuery(
      { adminPassword },
      { refetchInterval: 15000 }
    );

  const { data: historyData, isLoading: historyLoading } =
    trpc.admin.getSyncHistory.useQuery(
      { adminPassword, page: 1, pageSize: 10 },
      { refetchInterval: 15000 }
    );

  const triggerMutation = trpc.admin.triggerSync.useMutation({
    onSuccess: () => {
      setSyncStarted(true);
      setTimeout(() => {
        refetchStatus();
        utils.admin.getSyncHistory.invalidate();
      }, 2000);
    },
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 size={16} className="text-green-600" />;
      case "partial": return <AlertTriangle size={16} className="text-amber-600" />;
      case "error": return <XCircle size={16} className="text-red-600" />;
      case "running": return <Loader2 size={16} className="text-blue-600 animate-spin" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: "bg-green-100 text-green-800 border-green-200",
      partial: "bg-amber-100 text-amber-800 border-amber-200",
      error: "bg-red-100 text-red-800 border-red-200",
      running: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
      <Badge className={`${variants[status] ?? "bg-gray-100 text-gray-800"} text-xs capitalize`}>
        {statusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Loader2 className="animate-spin text-gray-400" size={20} />
            ) : statusData?.lastSync ? (
              <div>
                <div className="font-semibold text-gray-900">
                  {new Date(statusData.lastSync.completedAt!).toLocaleString()}
                </div>
                <div className="mt-1">{statusBadge(statusData.lastSync.status)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {statusData.lastSync.sourcesUpdated}/{statusData.lastSync.sourcesChecked} sources updated
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No sync run yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Next Scheduled Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold text-gray-900">
              {statusData ? new Date(statusData.nextScheduledRun).toLocaleString() : "—"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Daily at 2:00 AM CT</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Manual Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="bg-red-700 hover:bg-red-800 text-white w-full"
                  disabled={triggerMutation.isPending}
                >
                  {triggerMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <RefreshCw size={16} className="mr-2" />
                  )}
                  Sync Now
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Trigger Manual CMS Sync?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately check all CMS data sources for updates and process any
                    new files. The sync runs in the background — check the history log for results.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-700 hover:bg-red-800"
                    onClick={() => triggerMutation.mutate({ adminPassword })}
                  >
                    Start Sync
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {syncStarted && (
              <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} /> Sync started — check history below
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Sources */}
      {statusData?.sources && statusData.sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CMS Data Sources</CardTitle>
            <CardDescription>
              {statusData.sources.length} monitored data sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Source Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statusData.sources.map((source) => (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium text-sm">{source.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {source.category.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {source.lastCheckedAt
                          ? new Date(source.lastCheckedAt).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {source.lastUpdatedAt
                          ? new Date(source.lastUpdatedAt).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {source.isActive ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
          <CardDescription>Last 10 sync runs</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : (historyData?.logs ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No sync history yet</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Started</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sources</TableHead>
                    <TableHead>Plans</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(historyData?.logs ?? []).map((log) => {
                    const duration =
                      log.completedAt && log.startedAt
                        ? Math.round(
                            (new Date(log.completedAt).getTime() -
                              new Date(log.startedAt).getTime()) /
                              1000
                          )
                        : null;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {new Date(log.startedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              log.triggerType === "manual"
                                ? "border-blue-300 text-blue-700"
                                : "border-gray-300 text-gray-600"
                            }`}
                          >
                            {log.triggerType}
                          </Badge>
                        </TableCell>
                        <TableCell>{statusBadge(log.status)}</TableCell>
                        <TableCell className="text-sm">
                          {log.sourcesUpdated}/{log.sourcesChecked}
                        </TableCell>
                        <TableCell className="text-sm">{log.plansProcessed}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {duration !== null ? `${duration}s` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("carriers");

  const handleLogout = useCallback(() => {
    setAdminPassword(null);
  }, []);

  if (!adminPassword) {
    return <AdminLogin onLogin={setAdminPassword} />;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "carriers", label: "Carriers", icon: <Building2 size={16} /> },
    { id: "plans", label: "Plans", icon: <FileText size={16} /> },
    { id: "noncomm", label: "Non-Commissionable", icon: <DollarSignIcon size={16} /> },
    { id: "sync", label: "Data Sync", icon: <Database size={16} /> },
    { id: "ai-models", label: "AI Models", icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-700 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={22} />
            <div>
              <h1 className="font-bold text-lg leading-tight">Admin Dashboard</h1>
              <p className="text-red-200 text-xs">Medicare Quote Engine — Internal Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-100 hover:text-white hover:bg-red-600"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-1" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-red-700 text-red-700"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "carriers" && <CarrierManagement adminPassword={adminPassword} />}
        {activeTab === "plans" && <PlanManagement adminPassword={adminPassword} />}
        {activeTab === "noncomm" && <NonCommissionableTab adminPassword={adminPassword} />}
        {activeTab === "sync" && <SyncStatusTab adminPassword={adminPassword} />}
                {activeTab === "ai-models" && <div className="p-6 bg-white rounded-xl shadow-sm max-w-2xl"><AdminAIModels plans={[]} /></div>}
</main>
    </div>
  );
}
