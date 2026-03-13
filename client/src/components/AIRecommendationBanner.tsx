import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, Info, Star } from 'lucide-react';
import { useState } from 'react';
import type { MedicarePlan } from '@/lib/types';
import type { PlanScore, ScoringModel } from '@/lib/aiRecommendationEngine';

interface Props {
  plan: MedicarePlan;
  score: PlanScore;
  model: ScoringModel;
  onViewPlan?: () => void;
}

export default function AIRecommendationBanner({ plan, score, model, onViewPlan }: Props) {
  const [expanded, setExpanded] = useState(false);

  const eb = plan.extraBenefits;
  const benefitCount = Object.values(eb).filter(b => b?.covered).length;
  const totalCost = plan.premium * 12 + ((plan as any).estAnnualDrugCost ?? 0);

  const carrierInitials = plan.carrier
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const stars = plan.starRating.overall;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1B365D 0%, #2a4a7a 100%)',
        borderRadius: '16px',
        marginBottom: '24px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(27,54,93,0.18)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Header bar */}
      <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Sparkles size={14} style={{ color: '#FCD34D' }} />
        <span style={{ color: '#FCD34D', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>
          AI Recommended Plan
        </span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginLeft: 'auto', fontFamily: "'DM Sans', sans-serif" }}>
          Powered by {model.name} Model · Score {score.score.toFixed(1)}/100
        </span>
      </div>

      {/* Main content */}
      <div style={{ padding: '20px 24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Carrier logo */}
        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: plan.carrierLogoColor || '#C41E3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: plan.carrierLogoTextColor || 'white', fontWeight: 900, fontSize: '14px', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.5px' }}>{carrierInitials}</span>
        </div>

        {/* Plan info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {plan.carrier}
          </div>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 800, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2, marginBottom: '6px' }}>
            {plan.planName}
          </div>
          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={12} style={{ color: s <= Math.round(stars) ? '#FCD34D' : 'rgba(255,255,255,0.3)', fill: s <= Math.round(stars) ? '#FCD34D' : 'transparent' }} />
            ))}
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginLeft: '4px', fontFamily: "'DM Sans', sans-serif" }}>{stars} CMS Stars</span>
            <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', fontFamily: "'DM Sans', sans-serif" }}>
              {plan.planType}
            </span>
          </div>
          {/* Reasons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {score.reasons.map((reason, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <CheckCircle2 size={13} style={{ color: '#34D399', marginTop: '1px', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key numbers */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Monthly Premium', value: plan.premium === 0 ? '$0' : `$${plan.premium}/mo` },
            { label: 'Est. Annual Cost', value: `$${totalCost.toLocaleString()}/yr` },
            { label: 'Max Out-of-Pocket', value: `$${plan.maxOutOfPocket.toLocaleString()}` },
            { label: 'Extra Benefits', value: `${benefitCount}/8` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', minWidth: '110px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          {onViewPlan && (
            <button
              onClick={onViewPlan}
              style={{ background: '#C41E3A', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 20px', fontWeight: 800, fontSize: '14px', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              View Plan
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '10px 16px', fontWeight: 600, fontSize: '12px', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide' : 'Why this plan?'}
          </button>
        </div>
      </div>

      {/* Score breakdown (expanded) */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '16px 24px' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: "'DM Sans', sans-serif" }}>
            AI Score Breakdown &mdash; {model.name} Model
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '12px' }}>
            {score.breakdown.filter(b => b.weight > 0).map(b => {
              const pct = b.weight > 0 ? (b.contribution / b.weight) * 100 : 0;
              return (
                <div key={b.factor} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '120px', flexShrink: 0 }}>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif", marginBottom: '2px' }}>{b.factor}</div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: pct >= 70 ? '#34D399' : pct >= 40 ? '#FCD34D' : '#F87171', borderRadius: '2px', width: `${Math.min(100, pct)}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>{b.weight}% weight</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px' }}>
            <Info size={13} style={{ color: 'rgba(255,255,255,0.5)', marginTop: '1px', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
              This recommendation is based on your entered doctors and medications. Model weights can be adjusted in the Admin panel. This is not a substitute for advice from a licensed insurance agent.
            </span>
          </div>
          {model.sources.length > 0 && (
            <div style={{ marginTop: '8px', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontFamily: "'DM Sans', sans-serif" }}>
              Research sources: {model.sources.slice(0, 3).join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
