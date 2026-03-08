"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step = 1, unit = "", onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono text-green-400">
          {unit === "$" ? `$${value}` : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-green-500"
      />
    </div>
  );
}

interface Props {
  startupId: string;
  baselineValuationUSD: number;
}

export function ScenarioSimulator({ startupId, baselineValuationUSD }: Props) {
  const [carbonPrice, setCarbonPrice] = useState(50);
  const [policyStrictness, setPolicyStrictness] = useState(50);
  const [adoptionRate, setAdoptionRate] = useState(50);
  const [weatherFreq, setWeatherFreq] = useState(30);
  const [result, setResult] = useState<null | {
    projectedValuation: number;
    impactMultiplier: number;
    riskScore: number;
    narrative: string;
  }>(null);
  const [loading, setLoading] = useState(false);

  async function runSimulation() {
    setLoading(true);
    try {
      const res = await fetch(`/api/scenario/${startupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carbon_price_usd: carbonPrice,
          policy_strictness: policyStrictness,
          technology_adoption_rate: adoptionRate,
          extreme_weather_frequency: weatherFreq,
        }),
      });
      const data = await res.json();
      const proj = data.projections[0];
      setResult({
        projectedValuation: proj.projected_valuation_usd,
        impactMultiplier: proj.projected_impact_multiplier,
        riskScore: proj.risk_score,
        narrative: proj.narrative ?? "",
      });
    } finally {
      setLoading(false);
    }
  }

  const valuationChange = result
    ? ((result.projectedValuation - baselineValuationUSD) / baselineValuationUSD) * 100
    : null;

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6">
      <h2 className="mb-6 text-xl font-semibold text-green-400">
        Climate Scenario Stress-Test
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Slider label="Carbon Price" value={carbonPrice} min={0} max={500} step={5} unit="$" onChange={setCarbonPrice} />
          <Slider label="Policy Strictness" value={policyStrictness} min={0} max={100} unit="%" onChange={setPolicyStrictness} />
          <Slider label="Technology Adoption Rate" value={adoptionRate} min={0} max={100} unit="%" onChange={setAdoptionRate} />
          <Slider label="Extreme Weather Frequency" value={weatherFreq} min={0} max={100} unit="%" onChange={setWeatherFreq} />

          <button
            onClick={runSimulation}
            disabled={loading}
            className="mt-2 rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Simulation"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {result && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Valuation"
                  value={`$${(result.projectedValuation / 1_000_000).toFixed(1)}M`}
                  sub={valuationChange !== null ? `${valuationChange >= 0 ? "+" : ""}${valuationChange.toFixed(1)}%` : ""}
                  positive={valuationChange !== null ? valuationChange >= 0 : true}
                />
                <MetricCard
                  label="Impact"
                  value={`${result.impactMultiplier.toFixed(2)}x`}
                  sub="multiplier"
                  positive={result.impactMultiplier >= 1}
                />
                <MetricCard
                  label="Risk Score"
                  value={`${result.riskScore}`}
                  sub="/ 100"
                  positive={result.riskScore < 50}
                />
              </div>
              {result.narrative && (
                <p className="rounded-lg bg-gray-800 p-4 text-sm leading-relaxed text-gray-300">
                  {result.narrative}
                </p>
              )}
            </>
          )}

          {!result && (
            <div className="flex h-full items-center justify-center text-gray-600">
              Adjust parameters and run the simulation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${positive ? "text-green-400" : "text-red-400"}`}>
        {value}
      </p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  );
}
