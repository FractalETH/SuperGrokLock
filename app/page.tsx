"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { StatusCard } from "@/components/StatusCard";
import { LockForm } from "@/components/LockForm";
import { LOCKER_ADDRESS } from "@/lib/contracts";

export default function Home() {
  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>SuperGrok Locker</h1>
          <p>Lock LP → Genesis NFT whitelist + TG access</p>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </header>

      <StatusCard />
      <LockForm />

      <div className="card">
        <h2>How it works</h2>
        <ol
          style={{
            paddingLeft: "1.25rem",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          <li style={{ marginBottom: "0.5rem" }}>
            Enter SUPERGROK and ETH to provide as liquidity.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Choose a lock duration of at least 6 months to qualify.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Approve SUPERGROK, then click Add liquidity & lock.
          </li>
          <li>
            While the qualifying lock is active you stay eligible for TG and the
            Genesis NFT whitelist.
          </li>
        </ol>
      </div>

      <footer className="footer">
        Contract:{" "}
        <a
          href={`https://etherscan.io/address/${LOCKER_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
        >
          {LOCKER_ADDRESS.slice(0, 6)}…{LOCKER_ADDRESS.slice(-4)}
        </a>
        {" · "}
        Mainnet
      </footer>
    </div>
  );
}