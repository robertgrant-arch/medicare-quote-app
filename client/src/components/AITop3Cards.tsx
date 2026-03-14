import { useState } from 'react';
import { Sparkles, Star, CheckCircle2, XCircle, ChevronDown, ChevronUp, X, DollarSign, Shield, UserRound, Pill, Info } from 'lucide-react';
import type { MedicarePlan, PlanDoctorNetworkStatus } from '@/lib/types';
import type { PlanScore, ScoringModel } from '@/lib/aiRecommendationEngine';

interface Props {
  scores: PlanScore[];
  model: ScoringModel;
  doctorNetworkMap: Record<string, PlanDoctorNetworkStatus>;
  doctors: { name: string }[];
  onEnroll: (plan: MedicarePlan) => void;
}

export default function AITop3Cards({ scores, model, doctorNetworkMap, doctors, onEnroll }: Props) {
  const top3 = scores.slice(0, 3);
  const [detailPlan, setDetailPlan] = useState<PlanScore | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const RANK_LABELS = ['#1 Best Match', '#2 Runner Up', '#3 Top Pick'];
  const RANK_COLORS = ['#FCD34D', '#C0C0C0', '#CD7F32'];

  if (top3.length === 0) return null;

  return (
    <>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1B365D 0%, #2a4a7a 100%)', borderRadius: '16px 16px 0 0', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 0 }}>
        <Sparkles size={16} style={{ color: '#FCD34D' }} />
        <span style={{ color: '#FCD34D', fontSize: '13px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, fontFamily: "'DM Sans', sans-serif" }}>AI Top 3 Recommended Plans</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginLeft: 'auto', fontFamily: "'DM Sans', sans-serif" }}>Powered by {model.name} Model</span>
      </div>
            {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', background: '#f0f4f8', borderRadius: '0 0 16px 16px', border: '2px solid #1B365D', borderTop: 'none', overflow: 'hidden', marginBottom: '24px' }}>
        {top3.map((s, idx) => {
          const plan = s.plan;
          const eb = plan.extraBenefits || ({} as any);
          const benefitCount = Object.values(eb).filter((b: any) => b?.covered).length;
          const drugCost = (plan as any).estimatedAnnualDrugCost ?? 0;
          const net = doctorNetworkMap[plan.planId];
          const stars = plan.starRating.overall;
          const initials = plan.carrier.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();
          const isExpanded = expandedIdx === idx;
          return (
            <div key={plan.id} style={{ padding: '16px', borderRight: idx < 2 ? '1px solid #d1d9e6' : 'none', background: idx === 0 ? '#fffef5' : 'white', position: 'relative' }}>
              {/* Rank badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ background: RANK_COLORS[idx], color: idx === 0 ? '#1B365D' : 'white', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' as const }}>{RANK_LABELS[idx]}</span>
                <span style={{ fontSize: '10px', color: '#6B7280', marginLeft: 'auto' }}>Score {s.score.toFixed(0)}/100</span>
              </div>
                            {/* Carrier + Plan name */}
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '2px' }}>{plan.carrier}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B365D', marginBottom: '6px', lineHeight: 1.3 }}>{plan.planName}</div>
              {/* Stars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '10px' }}>
                {[1,2,3,4,5].map(st => <Star key={st} size={12} fill={st <= stars ? '#FCD34D' : 'transparent'} stroke={st <= stars ? '#FCD34D' : '#d1d5db'} />)}
                <span style={{ fontSize: '10px', color: '#6B7280', marginLeft: '4px' }}>{stars}</span>
                <span style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: '4px' }}>{plan.planType}</span>
              </div>
                            {/* Key numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                <div style={{ background: '#f0f4f8', borderRadius: '8px', padding: '8px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B365D' }}>{plan.premium === 0 ? '$0' : `$${plan.premium}`}</div>
                  <div style={{ fontSize: '9px', color: '#6B7280' }}>Monthly Premium</div>
                </div>
                <div style={{ background: '#f0f4f8', borderRadius: '8px', padding: '8px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B365D' }}>${plan.maxOutOfPocket.toLocaleString()}</div>
                  <div style={{ fontSize: '9px', color: '#6B7280' }}>Max Out-of-Pocket</div>
                </div>
                <div style={{ background: '#f0f4f8', borderRadius: '8px', padding: '8px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: drugCost > 0 ? '#C41E3A' : '#059669' }}>{drugCost === 0 ? 'N/A' : `$${drugCost.toLocaleString()}`}</div>
                  <div style={{ fontSize: '9px', color: '#6B7280' }}>Est. Drug Cost/yr</div>
                </div>
                <div style={{ background: '#f0f4f8', borderRadius: '8px', padding: '8px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B365D' }}>{benefitCount}/8</div>
                  <div style={{ fontSize: '9px', color: '#6B7280' }}>Extra Benefits</div>
                </div>
              </div>
                            {/* Doctor Network */}
              {doctors.length > 0 && (
                <div style={{ background: net?.allInNetwork ? '#ecfdf5' : '#fef2f2', border: `1px solid ${net?.allInNetwork ? '#a7f3d0' : '#fecaca'}`, borderRadius: '8px', padding: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#374151', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserRound size={11} /> Your Doctors
                  </div>
                  {net ? net.doctors.map((d, di) => (
                    <div key={di} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0' }}>
                      <span style={{ color: '#374151' }}>{d.doctorName}</span>
                      {d.inNetwork ? <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle2 size={10} /> In Network</span> : <span style={{ color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}><XCircle size={10} /> Out of Network</span>}
                    </div>
                  )) : <div style={{ fontSize: '10px', color: '#6B7280' }}>Checking network...</div>}
                  {net && <div style={{ fontSize: '10px', fontWeight: 700, color: net.allInNetwork ? '#059669' : '#DC2626', marginTop: '4px', textAlign: 'right' as const }}>{net.inNetworkCount}/{net.inNetworkCount + net.outOfNetworkCount} In Network</div>}
                </div>
              )}
                            {/* AI Reasons */}
              {s.reasons.slice(0, 2).map((r, ri) => (
                <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#374151', marginBottom: '3px' }}>
                  <CheckCircle2 size={10} style={{ color: '#059669', flexShrink: 0 }} /> {r}
                </div>
              ))}
                            {/* Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                <button onClick={() => onEnroll(plan)} style={{ flex: 1, background: '#C41E3A', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Enroll Now</button>
                <button onClick={() => setDetailPlan(detailPlan?.plan.id === plan.id ? null : s)} style={{ flex: 1, background: 'white', color: '#1B365D', border: '1px solid #1B365D', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Details</button>
              </div>
              <button onClick={() => setExpandedIdx(isExpanded ? null : idx)} style={{ width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: '10px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {isExpanded ? 'Hide score' : 'Why this plan?'}
              </button>
                            {/* Expanded score breakdown */}
              {isExpanded && (
                <div style={{ marginTop: '8px', background: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#1B365D', marginBottom: '8px' }}>AI Score Breakdown</div>
                  {(s.breakdown || []).filter(b => b.weight > 0).map(b => {
                    const pct = b.weight > 0 ? (b.contribution / b.weight) * 100 : 0;
                    return (
                      <div key={b.factor} style={{ marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '2px' }}>
                          <span style={{ color: '#374151' }}>{b.factor}</span>
                          <span style={{ color: '#9CA3AF' }}>{b.weight}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px' }}>
                          <div style={{ height: '100%', background: pct >= 70 ? '#34D399' : pct >= 40 ? '#FCD34D' : '#F87171', borderRadius: '2px', width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
            {/* Details Modal */}
      {detailPlan && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={() => setDetailPlan(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'relative', background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            {/* Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #1B365D, #2a4a7a)', padding: '20px', borderRadius: '16px 16px 0 0', color: 'white' }}>
              <button onClick={() => setDetailPlan(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'white', fontSize: '16px' }}>&times;</button>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>{detailPlan.plan.carrier}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>{detailPlan.plan.planName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[1,2,3,4,5].map(st => <Star key={st} size={14} fill={st <= detailPlan.plan.starRating.overall ? '#FCD34D' : 'transparent'} stroke={st <= detailPlan.plan.starRating.overall ? '#FCD34D' : 'rgba(255,255,255,0.3)'} />)}
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginLeft: '6px' }}>{detailPlan.plan.starRating.overall} Stars &middot; {detailPlan.plan.planType}</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#FCD34D' }}>AI Score: {detailPlan.score.toFixed(1)}/100</div>
            </div>
                        {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {/* Cost Summary */}
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1B365D', marginBottom: '10px' }}>Cost Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                {[
                  { label: 'Monthly Premium', val: detailPlan.plan.premium === 0 ? '$0' : `$${detailPlan.plan.premium}/mo` },
                  { label: 'Deductible', val: `$${detailPlan.plan.deductible}` },
                  { label: 'Max Out-of-Pocket', val: `$${detailPlan.plan.maxOutOfPocket.toLocaleString()}` },
                  { label: 'Est. Drug Cost', val: ((detailPlan.plan as any).estimatedAnnualDrugCost ?? 0) === 0 ? 'N/A' : `$${((detailPlan.plan as any).estimatedAnnualDrugCost).toLocaleString()}/yr` },
                  { label: 'Drug Deductible', val: detailPlan.plan.rxDrugs?.deductible || '$0' },
                  { label: 'Extra Benefits', val: `${Object.values(detailPlan.plan.extraBenefits || {}).filter((b: any) => b?.covered).length}/8` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B365D' }}>{val}</div>
                    <div style={{ fontSize: '10px', color: '#6B7280' }}>{label}</div>
                  </div>
                ))}
              </div>
                            {/* Copays */}
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1B365D', marginBottom: '10px' }}>Copays</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '20px' }}>
                {Object.entries(detailPlan.plan.copays || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ color: '#6B7280' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span style={{ fontWeight: 600, color: '#1B365D' }}>{v as string}</span>
                  </div>
                ))}
              </div>
                            {/* Rx Drug Tiers */}
              {detailPlan.plan.rxDrugs && (
                <>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1B365D', marginBottom: '10px' }}>Rx Drug Coverage</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '20px' }}>
                    {(['tier1', 'tier2', 'tier3', 'tier4'] as const).map((t, i) => (
                      <div key={t} style={{ background: '#f8fafc', borderRadius: '6px', padding: '8px', textAlign: 'center' as const }}>
                        <div style={{ fontSize: '9px', color: '#6B7280' }}>Tier {i + 1}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B365D' }}>{(detailPlan.plan.rxDrugs as any)?.[t] || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
                            {/* Doctor Network in modal */}
              {doctors.length > 0 && (() => {
                const netM = doctorNetworkMap[detailPlan.plan.planId];
                return (
                  <>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1B365D', marginBottom: '10px' }}>Doctor Network</h3>
                    <div style={{ background: netM?.allInNetwork ? '#ecfdf5' : '#fef2f2', border: `1px solid ${netM?.allInNetwork ? '#a7f3d0' : '#fecaca'}`, borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
                      {netM ? netM.doctors.map((d, di) => (
                        <div key={di} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                          <span>{d.doctorName}</span>
                          {d.inNetwork ? <span style={{ color: '#059669', fontWeight: 600 }}>In Network</span> : <span style={{ color: '#DC2626', fontWeight: 600 }}>Out of Network</span>}
                        </div>
                      )) : <div style={{ fontSize: '12px', color: '#6B7280' }}>Checking network status...</div>}
                      {netM && <div style={{ marginTop: '6px', fontWeight: 700, fontSize: '13px', color: netM.allInNetwork ? '#059669' : '#DC2626' }}>{netM.inNetworkCount}/{netM.inNetworkCount + netM.outOfNetworkCount} Doctors In Network</div>}
                    </div>
                  </>
                );
              })()}
                            {/* Extra Benefits */}
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1B365D', marginBottom: '10px' }}>Extra Benefits</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '20px' }}>
                {Object.entries(detailPlan.plan.extraBenefits || {}).map(([key, val]) => (
                  <span key={key} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', background: (val as any)?.covered ? '#ecfdf5' : '#f3f4f6', color: (val as any)?.covered ? '#059669' : '#9CA3AF', fontWeight: 600, border: `1px solid ${(val as any)?.covered ? '#a7f3d0' : '#e5e7eb'}` }}>
                    {(val as any)?.covered ? '\u2713' : '\u2717'} {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                ))}
              </div>
              {/* Enroll Button */}
              <button onClick={() => { setDetailPlan(null); onEnroll(detailPlan.plan); }} style={{ width: '100%', background: '#C41E3A', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>Enroll Now</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
