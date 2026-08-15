"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
} from "wagmi";
import { parseEther, parseUnits, formatUnits, maxUint256 } from "viem";
import {
  LOCKER_ADDRESS,
  SUPERGROK_TOKEN,
  lockerAbi,
  erc20Abi,
} from "@/lib/contracts";

const DURATION_OPTIONS = [
  { label: "6 months (minimum for eligibility)", months: 6 },
  { label: "9 months", months: 9 },
  { label: "12 months", months: 12 },
  { label: "18 months", months: 18 },
  { label: "24 months", months: 24 },
];

export function LockForm() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState(6);
  const [slippageBps, setSlippageBps] = useState(100);
  const [ethAmount, setEthAmount] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "locking">("idle");

  const { data: ethBalance } = useBalance({ address });
  const { data: superGrokBalance, refetch: refetchBalance } = useReadContract({
    address: SUPERGROK_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: SUPERGROK_TOKEN,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, LOCKER_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const amountWei = useMemo(() => {
    try {
      if (!amount || Number(amount) <= 0) return 0n;
      return parseUnits(amount, 18);
    } catch {
      return 0n;
    }
  }, [amount]);

  const ethWei = useMemo(() => {
    try {
      if (!ethAmount || Number(ethAmount) <= 0) return 0n;
      return parseEther(ethAmount);
    } catch {
      return 0n;
    }
  }, [ethAmount]);

  const needsApproval =
    amountWei > 0n && (allowance === undefined || allowance < amountWei);

  const unlockTime = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return BigInt(now + Math.floor(months * 30.44 * 24 * 60 * 60));
  }, [months]);

  const deadline = useMemo(() => {
    return BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  }, [step]);

  const amountTokenMin =
    amountWei > 0n
      ? amountWei - (amountWei * BigInt(slippageBps)) / 10000n
      : 0n;
  const amountETHMin =
    ethWei > 0n ? ethWei - (ethWei * BigInt(slippageBps)) / 10000n : 0n;

  const {
    writeContract: writeApprove,
    data: approveHash,
    error: approveError,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  const {
    writeContract: writeLock,
    data: lockHash,
    error: lockError,
    isPending: isLockPending,
    reset: resetLock,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const { isLoading: isLockConfirming, isSuccess: isLockSuccess } =
    useWaitForTransactionReceipt({ hash: lockHash });

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setStep("idle");
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isLockSuccess) {
      refetchBalance();
      refetchAllowance();
      setStep("idle");
    }
  }, [isLockSuccess, refetchBalance, refetchAllowance]);

  const handleApprove = () => {
    if (!address || amountWei === 0n) return;
    setStep("approving");
    resetApprove();
    writeApprove({
      address: SUPERGROK_TOKEN,
      abi: erc20Abi,
      functionName: "approve",
      args: [LOCKER_ADDRESS, maxUint256],
    });
  };

  const handleLock = () => {
    if (!address || amountWei === 0n || ethWei === 0n) return;
    setStep("locking");
    resetLock();
    writeLock({
      address: LOCKER_ADDRESS,
      abi: lockerAbi,
      functionName: "addLiquidityAndLock",
      args: [amountWei, amountTokenMin, amountETHMin, unlockTime, deadline],
      value: ethWei,
    });
  };

  const balanceFmt =
    superGrokBalance !== undefined
      ? Number(formatUnits(superGrokBalance, 18)).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })
      : "—";

  const ethBalFmt =
    ethBalance !== undefined
      ? Number(formatUnits(ethBalance.value, 18)).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })
      : "—";

  if (!isConnected) {
    return (
      <div className="card">
        <h2>Add liquidity & lock</h2>
        <p className="hint">Connect your wallet to continue.</p>
      </div>
    );
  }

  const canLock =
    amountWei > 0n &&
    ethWei > 0n &&
    !needsApproval &&
    !isApprovePending &&
    !isApproveConfirming &&
    !isLockPending &&
    !isLockConfirming;

  return (
    <div className="card">
      <h2>Add liquidity & lock</h2>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        Deposit SUPERGROK + ETH → Uniswap V2 LP is created and locked. Lock ≥ 6
        months to qualify for TG + Genesis NFT whitelist.
      </p>

      <div className="input-row">
        <label className="label">
          SUPERGROK amount{" "}
          <span style={{ float: "right" }}>Balance: {balanceFmt}</span>
        </label>
        <input
          className="input"
          type="number"
          min="0"
          step="any"
          placeholder="e.g. 100000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="input-row">
        <label className="label">
          ETH amount <span style={{ float: "right" }}>Balance: {ethBalFmt}</span>
        </label>
        <input
          className="input"
          type="number"
          min="0"
          step="any"
          placeholder="e.g. 0.05"
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
        />
        <p className="hint">
          Match the pool ratio roughly. Unused ETH is refunded.
        </p>
      </div>

      <div className="input-row">
        <label className="label">Lock duration</label>
        <select
          className="input"
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
        >
          {DURATION_OPTIONS.map((o) => (
            <option key={o.months} value={o.months}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="input-row">
        <label className="label">Slippage tolerance (%)</label>
        <input
          className="input"
          type="number"
          min="0.1"
          max="5"
          step="0.1"
          value={slippageBps / 100}
          onChange={(e) =>
            setSlippageBps(Math.round(Number(e.target.value) * 100))
          }
        />
      </div>

      {needsApproval && amountWei > 0n && (
        <button
          className="btn btn-secondary"
          style={{ marginBottom: "0.75rem" }}
          disabled={isApprovePending || isApproveConfirming}
          onClick={handleApprove}
        >
          {isApprovePending || isApproveConfirming
            ? "Approving SUPERGROK…"
            : "1. Approve SUPERGROK"}
        </button>
      )}

      <button className="btn btn-primary" disabled={!canLock} onClick={handleLock}>
        {isLockPending || isLockConfirming
          ? "Locking…"
          : needsApproval
            ? "2. Add liquidity & lock"
            : "Add liquidity & lock"}
      </button>

      {approveHash && (
        <div className="success-msg">
          Approve tx:{" "}
          <a
            href={`https://etherscan.io/tx/${approveHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {approveHash.slice(0, 10)}…
          </a>
        </div>
      )}

      {lockHash && (
        <div className="success-msg">
          Lock tx:{" "}
          <a
            href={`https://etherscan.io/tx/${lockHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {lockHash.slice(0, 10)}…
          </a>
          {isLockSuccess && " — confirmed! Refresh status above."}
        </div>
      )}

      {(approveError || lockError) && (
        <div className="error-msg">
          {(approveError || lockError)?.message?.slice(0, 200) ||
            "Transaction failed"}
        </div>
      )}
    </div>
  );
}