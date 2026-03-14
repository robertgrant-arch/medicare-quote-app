import { useState } from 'react';
import { Sparkles, Star, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { MedicarePlan, PlanDoctorNetworkStatus } from '@/lib/types';
import type { PlanScore, ScoringModel } from '@/lib/aiRecommendationEngine';

interface Props {
  scores: PlanScore[];
  model: ScoringModel;
  doctorNetworkMap: Record<string, PlanDoctorNetworkStatus>;
  doctors: { name: string }[];
  onEnroll: (plan: MedicarePlan) => void;
  onOpenDetails: (plans: PlanScore[], index: number) => void;
}

export default function AITop3Cards({ scores, model, doctorNetworkMap, doctors, onEnroll, onOpenDetails }: Props) {
  const top3 = scores.slice(0, 3);
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', background: '#f0f4f8', border: '2px solid #1B365D', borderTop: 'none', overflow: 'hidden', marginBottom: '24px' }}>
        {top3.map((s, idx) => {
          const plan = s.plan;
          const eb = plan.extraBenefits || ({} as Record<string, { covered?: boolean }>);
          const benefitCount = Object.values(eb).filter((b: any) => b?.covered).length;
          const drugCost = plan.estimatedAnnualDrugCost ?? 0;
          const net = doctorNetworkMap[plan.planId];
          const stars = plan.starRating.overall;
          const isExpanded = expandedIdx === idx;

          return (
            <div key={plan.id} style={{ padding: '16px', borderRight: idx < 2 ? '1px solid #d1d9e6' : 'none', background: idx === 0 ? '#fffff5' : 'white', position: 'relative' }}>
              {/* Rank badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ background: RANK_COLORS[idx], color: idx === 0 ? '#1B365D' : 'white', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' as const }}>
                  {RANK_LABELS[idx]}
                </span>
                <span style={{ fontSize: '10px', color: '#6B7280', marginLeft: 'auto' }}>Score {s.score.toFixed(0)}/100</span>
              </div>

              {/* Carrier + Plan name */}
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '2px' }}>{plan.carrier}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1B365D', marginBottom: '8px', lineHeight: 1.3 }}>{plan.planName}</div>

              {/* Stars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                {[1,2,3,4,5].map(st => <Star key={st} size={10} style={{ color: st <= Math.round(stars) ? '#FCD34D' : '#E5E7EB' }} fill={st <= Math.round(stars) ? '#FCD34D' : 'none'} />)}
                <span style={{ fontSize: '10px', color: '#6B7280', marginLeft: '2px' }}>{stars}</span>
                <span style={{ fontSize: '9px', color: '#9CA3AF', marginLeft: '4px', background: '#F3F4F6', padding: '1px 5px', borderRadius: '4px' }}>{plan.planType}</span>
              </div>

              {/* Key numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: plan.premium === 0 ? '#059669' : '#1B365D' }}>{plan.premium === 0 ? '$0' : `$${plan.premium}`}</div>
                  <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>Monthly Premium</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1B365D' }}>${plan.maxOutOfPocket.toLocaleString()}</div>
                  <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>Max Out-of-Pocket</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: drugCost >= 70 ? '#C41E3A' : '#059669' }}>{drugCost === 0 ? 'N/A' : `$${drugCost.toLocaleString()}`}</div>
                  <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>Est. Drug Cost/yr</div>
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '8px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1B365D' }}>{benefitCount}/8</div>
                  <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '2px' }}>Extra Benefits</div>
                </div>
              </div>

              {/* Doctor Network */}
              {doctors.length > 0 && (
                <div style={{ background: '#F0F9FF', borderRadius: '8px', padding: '8px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#1B365D', marginBottom: '6px' }}>Your Doctors</div>
                  {net ? net.doctors.map((d, di) => (
                    <div key={di} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                      <span style={{ color: '#374151', fontWeight: 500 }}>{d.doctorName}</span>
                      {d.inNetwork
                        ? <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle2 size={10} /> In Network</span>
                        : <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '2px' }}><XCircle size={10} /> Out of Network</span>}
                    </div>
                  )) : <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Checking network...</div>}
                  {net && <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>{net.inNetworkCount}/{net.inNetworkCount + net.outOfNetworkCount} In Network</div>}
                </div>
              )}

              {/* AI Reasons */}
              {s.reasons.slice(0, 2).map((r, ri) => (
                <div key={ri} style={{ fontSize: '10px', color: '#374151', marginBottom: '4px', paddingLeft: '8px', borderLeft: '2px solid #1B365D' }}>{r}</div>
              ))}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                <button onClick={() => onEnroll(plan)} style={{ flex: 1, background: '#C41E3A', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Enroll Now</button>
                <button
                  onClick={() => onOpenDetails(top3, idx)}
                  style={{ flex: 1, background: 'white', color: '#1B365D', border: '1px solid #1B365D', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >Details</button>
              </div>

              <button onClick={() => setExpandedIdx(isExpanded ? null : idx)} style={{ width: '100%', background: 'none', border: 'none', color: '#6B7280', fontSize: '10px', cursor: 'pointer', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {isExpanded ? 'Hide score' : 'Why this plan?'}
              </button>

              {/* Expanded score breakdown */}
              {isExpanded && (
                <div style={{ marginTop: '8px', background: '#F8FAFC', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#1B365D', marginBottom: '8px' }}>AI Score Breakdown</div>
                  {(s.breakdown || []).filter(b => b.weight > 0).map(b => {
                    const pct = b.weight > 0 ? (b.contribution / b.weight) * 100 : 0;
                    return (
                      <div key={b.factor} style={{ marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                          <span style={{ color: '#374151' }}>{b.factor}</span>
                          <span style={{ color: '#6B7280' }}>{b.weight}%</span>
                        </div>
                        <div style={{ height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
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
    </>
  );
}
