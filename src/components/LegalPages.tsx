import React from 'react';
import { ArrowLeft, Mail, ShieldAlert } from 'lucide-react';

export function LegalPages({
  section,
  contactEmail,
  onBack,
  onSwitch
}: {
  section: 'terms' | 'privacy' | 'aup' | 'cookies';
  contactEmail: string;
  onBack: () => void;
  onSwitch: (s: 'terms' | 'privacy' | 'aup' | 'cookies') => void;
}) {
  const tabs: { id: 'terms' | 'privacy' | 'aup' | 'cookies'; label: string }[] = [
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'aup', label: 'Acceptable Use (AUP)' },
    { id: 'cookies', label: 'Cookie Policy' }
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px 80px' }}>
      <button className="btn-outline" onClick={onBack} style={{ padding: '8px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to Abli Code
      </button>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onSwitch(t.id)} style={{
            padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: section === t.id ? '#ff1e38' : '#0b0b0e', color: '#fff', border: '1px solid #27272e'
          }}>{t.label}</button>
        ))}
      </div>

      <div className="card-bwr" style={{ padding: 32, lineHeight: 1.7, color: '#d4d4d8', fontSize: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff1e38', fontWeight: 800, fontSize: 12, marginBottom: 8 }}>
          <ShieldAlert size={15} /> EFFECTIVE NOVEMBER 21, 2026 · ABLI CODE (MIT OPEN SOURCE + STRIPE BILLING)
        </div>

        {section === 'terms' && (
          <>
            <h1 style={{ color: '#fff', marginTop: 0 }}>Terms of Service &amp; Liability Disclaimer</h1>
            <p><strong>1. Service Scope.</strong> Abli Code is MIT-licensed open-source software paired with an optional hosted AI routing gateway, Stripe billing, Supabase auth, Electron desktop IDE, terminal CLI, and Stock REA MCP server.</p>
            <p><strong>2. Subscriptions, 150% Spend Cap &amp; Stripe Top-Ups.</strong> Paid plans (Plus $20/mo, Pro $50/mo, Max $100/mo) enforce a strict hard spend cap equal to <strong>150% of subscription price</strong> ($30, $75, and $150 respectively). Once metered spend reaches 150%, requests stop automatically until you upgrade or purchase Stripe Credit Top-Ups. Free DeepSeek Abliterated usage hard-stops at <strong>1,500,000 tokens per UTC day</strong>. Digital subscriptions and consumed credits are final and non-refundable except as required by law.</p>
            <p><strong>3. "AS-IS" AI &amp; Computer Control Disclaimer.</strong> ALL ABLITERATED MODEL OUTPUTS, REVERSE-ENGINEERING REPORTS, GENERATED CODE, AND COMPUTER CONTROL ACTIONS ARE PROVIDED "AS IS" WITHOUT WARRANTY. YOU ARE SOLELY RESPONSIBLE FOR REVIEWING AND AUTHORIZING ANY CODE, BINARY ANALYSIS, OR SHELL ACTION.</p>
            <p><strong>4. Limitation of Liability &amp; Indemnification.</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, ABLI CODE AND ITS MAINTAINER (<a href={`mailto:${contactEmail}`} style={{ color: '#ff1e38' }}>{contactEmail}</a>) SHALL NOT BE LIABLE FOR INDIRECT OR CONSEQUENTIAL DAMAGES. TOTAL LIABILITY IS STRICTLY CAPPED AT FEES PAID IN THE PRECEDING 30 DAYS. YOU INDEMNIFY THE OPERATOR AGAINST CLAIMS ARISING FROM YOUR PROMPTS, AUTOMATION ACTIONS, OR UNLAWFUL USE.</p>
          </>
        )}

        {section === 'privacy' && (
          <>
            <h1 style={{ color: '#fff', marginTop: 0 }}>Privacy Policy</h1>
            <p><strong>Data Collected:</strong> Account email, hashed password or OAuth identifier (Supabase Auth), 6-digit verification records, Stripe checkout/customer IDs, subscription plan, and token usage counters.</p>
            <p><strong>Local Execution:</strong> Desktop Computer Control and Stock REA MCP inspect files locally on your machine unless you explicitly include snippets in a prompt to a third-party model API platform. We never sell personal data.</p>
            <p><strong>Deletion &amp; Requests:</strong> Contact <a href={`mailto:${contactEmail}`} style={{ color: '#ff1e38' }}>{contactEmail}</a> anytime.</p>
          </>
        )}

        {section === 'aup' && (
          <>
            <h1 style={{ color: '#fff', marginTop: 0 }}>Acceptable Use Policy (AUP)</h1>
            <p><strong>Permitted:</strong> Software development, authorized security testing, clean-room interoperability &amp; rebuild research via Stock REA MCP, and open-source engineering.</p>
            <p><strong>Prohibited:</strong> CSAM, non-consensual imagery, self-harm facilitation, unauthorized intrusion, malware distribution, credential theft, or quota bypass. Violations result in immediate termination. Report abuse or DMCA claims to <a href={`mailto:${contactEmail}`} style={{ color: '#ff1e38' }}>{contactEmail}</a>.</p>
          </>
        )}

        {section === 'cookies' && (
          <>
            <h1 style={{ color: '#fff', marginTop: 0 }}>Cookie Policy</h1>
            <p>Strictly necessary cookies (`abli_cookie_consent` and auth session tokens) preserve login, Stripe checkout verification, and quota state. Optional analytics/preferences require consent via Cookie Controls.</p>
          </>
        )}

        <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid #232329', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <Mail size={16} color="#ff1e38" />
          <span>Legal, DMCA &amp; Support Contact: <a href={`mailto:${contactEmail}`} style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>{contactEmail}</a></span>
        </div>
      </div>
    </div>
  );
}
