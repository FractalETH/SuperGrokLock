"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { LOCKER_ADDRESS, lockerAbi } from "@/lib/contracts";

const TIER_LABELS: Record<number, string> = {
  0: "None",
  1: "Tier 1 (100k+)",
  2: "Tier 2 (1M+)",
  3: "Tier 3 (5M+)",
};

export function StatusCard() {
  const { address, isConnected } = useAccount();

  const { data: tier, refetch: refetchTier } = useReadContract({
    address: LOCKER_ADDRESS,
    abi: lockerAbi,
    functionName: "getTier",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: eligible, refetch: refetchEligible } = useReadContract({
    address: LOCKER_ADDRESS,
    abi: lockerAbi,
    functionName: "isEligible",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: underlying, refetch: refetchUnderlying } = useReadContract({
    address: LOCKER_ADDRESS,
    abi: lockerAbi,
    functionName: "getQualifyingUnderlyingSuperGrok",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (!isConnected) {
    return (
      <div className="card">
        <h2>Your status</h2>
        <p className="hint">Connect a wallet to see eligibility and tier.</p>
      </div>
    );
  }

  const tierNum = tier !== undefined ? Number(tier) : 0;
  const underlyingFmt =
    underlying !== undefined
      ? Number(formatUnits(underlying, 18)).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      : "—";

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ marginBottom: 0 }}>Your status</h2>
        <button
          className="btn btn-secondary"
          style={{ width: "auto", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
          onClick={() => {
            refetchTier();
            refetchEligible();
            refetchUnderlying();
          }}
        >
          Refresh
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">Eligibility</div>
          <div className="value">
            {eligible ? (
              <span className="badge badge-eligible">Eligible</span>
            ) : (
              <span className="badge badge-ineligible">Not eligible</span>
            )}
          </div>
        </div>
        <div className="stat">
          <div className="label">Tier</div>
          <div className="value">
            <span className="badge badge-tier">{TIER_LABELS[tierNum]}</span>
          </div>
        </div>
      </div>

      <div className="stat" style={{ marginTop: "0.75rem" }}>
        <div className="label">Qualifying SUPERGROK (underlying)</div>
        <div className="value">{underlyingFmt}</div>
      </div>

      <p className="hint">
        Eligibility requires a lock committed for ≥ 6 months. Tier is based on
        current underlying SUPERGROK in those locks.
      </p>
    </div>
  );
}