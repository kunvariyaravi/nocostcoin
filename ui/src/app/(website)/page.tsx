import Hero from "@/components/Hero/Hero";
import Features from "@/components/Features/Features";
import FeatureRow from "@/components/FeatureRow/FeatureRow";
import CodeShowcase from "@/components/CodeShowcase/CodeShowcase";
import PreFooter from "@/components/PreFooter/PreFooter";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: '#050505' }}>
      <Hero />

      {/* Proof of Determinism */}
      <FeatureRow
        title="Proof of Determinism"
        description="Eliminate probabilistic forks forever. Our novel consensus mechanism ensures that every slot has one and only one valid leader, mathematically proven through a VRF-based sortition. Experience instant finality without the wait."
        visual={
          <div style={{ width: '100%', maxWidth: '400px', height: '300px', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M12 8v4"></path>
              <path d="M12 16h.01"></path>
            </svg>
          </div>
        }
      />

      {/* Hidden Leader Election */}
      <FeatureRow
        title="Hidden Leader Election"
        description="Protect the network from DDoS attacks. Validators are selected in secret using private VRF keys. The leader's identity is only revealed when they produce a block, making targeted attacks impossible while maintaining total transparency."
        reversed={true}
        visual={
          <div style={{ width: '100%', maxWidth: '400px', height: '300px', background: 'linear-gradient(225deg, rgba(255,255,255,0.05), transparent)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        }
      />

      <CodeShowcase />

      {/* Zero Fees */}
      {/* Native AI Economy */}
      <FeatureRow
        title="Native AI Economy"
        description="Built for the machine age. Nocostcoin creates a first-class environment for AI agents with Native Delegation (manage agent allowances without smart contracts) and Payment Channels for high-frequency streaming payments per-token."
        visual={
          <div style={{ width: '100%', maxWidth: '400px', height: '300px', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
              <path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity="0.5"></path>
              <path d="M2 12a10 10 0 0 1 10-10v10H2z" opacity="0.3"></path>
            </svg>
          </div>
        }
      />

      {/* Native Lending */}
      <FeatureRow
        title="Enshrined DeFi"
        description="Borrow and lend natively. No smart contract risks, no expensive gas fees. Nocostcoin integrates a global liquidity pool directly into the protocol, allowing for secure, high-performance collateralized lending."
        reversed={true}
        visual={
          <div style={{ width: '100%', maxWidth: '400px', height: '300px', background: 'linear-gradient(225deg, rgba(255,255,255,0.05), transparent)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v22"></path>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        }
      />

      <Features />
      <PreFooter />
    </main>
  );
}
