"use client";

import { useMemo, useState } from "react";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function Home() {
  const [v, setV] = useState({
    vin: "",
    year: "",
    make: "",
    model: "",
    mileage: "45000",
    market: "30000",
    currentBid: "18000",
    conditionGrade: "4.0",
    repair: "2500",
    fees: "900",
    transport: "500",
    profit: "3500",
    reserve: "1500",
  });

  const [vinState, setVinState] = useState({
    loading: false,
    error: "",
    decoded: null,
  });

  const [analysis, setAnalysis] = useState(null);

  const set = (key) => (e) => {
    const value = key === "vin" ? e.target.value.toUpperCase() : e.target.value;
    setV((current) => ({ ...current, [key]: value }));
    setAnalysis(null);
  };

  const n = (key) => Number(v[key]) || 0;

  const live = useMemo(() => calculate(v), [v]);

  async function decodeVin() {
    const vin = v.vin.trim().toUpperCase();

    if (vin.length !== 17) {
      setVinState({
        loading: false,
        error: "VIN must contain exactly 17 characters.",
        decoded: null,
      });
      return;
    }

    if (/[IOQ]/.test(vin)) {
      setVinState({
        loading: false,
        error: "VINs do not use the letters I, O or Q.",
        decoded: null,
      });
      return;
    }

    setVinState({ loading: true, error: "", decoded: null });

    try {
      const response = await fetch(`/api/decode-vin?vin=${encodeURIComponent(vin)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Unable to decode VIN.");

      setV((current) => ({
        ...current,
        vin,
        year: data.year || current.year,
        make: data.make || current.make,
        model: data.model || current.model,
      }));

      setVinState({ loading: false, error: "", decoded: data });
      setAnalysis(null);
    } catch (error) {
      setVinState({
        loading: false,
        error: error.message || "Unable to decode VIN.",
        decoded: null,
      });
    }
  }

  function analyzeVehicle() {
    setAnalysis({
      ...live,
      timestamp: new Date().toISOString(),
    });
  }

  const shown = analysis || live;

  return (
    <main>
      <header>
        <div className="brand">
          <span className="logo">B</span>
          <div>
            <b>BidPilot</b>
            <small>Dealer underwriting</small>
          </div>
        </div>
        <span className="beta">312 AUTO GROUP · PRIVATE BETA</span>
      </header>

      <section className="hero">
        <span className="eyebrow">DEALER DECISION ENGINE</span>
        <h1>
          Know your number <em>before</em> you bid.
        </h1>
        <p>
          Decode the VIN, enter the auction facts, and get a disciplined
          dealer-side BUY / CAUTION / PASS decision.
        </p>
      </section>

      <div className="grid">
        <section className="card">
          <div className="sectionTitle">
            <div>
              <span className="step">01</span>
              <h2>Vehicle</h2>
            </div>
            <span className="muted">VIN + auction data</span>
          </div>

          <label>
            VIN
            <div className="vinRow">
              <input
                maxLength="17"
                value={v.vin}
                onChange={set("vin")}
                placeholder="17-character VIN"
                onKeyDown={(e) => {
                  if (e.key === "Enter") decodeVin();
                }}
              />
              <button
                className="decodeButton"
                onClick={decodeVin}
                disabled={vinState.loading}
              >
                {vinState.loading ? "Decoding…" : "Decode VIN"}
              </button>
            </div>
          </label>

          {vinState.error && <div className="vinError">{vinState.error}</div>}

          {vinState.decoded && (
            <div className="vinSuccess">
              <div>
                <span>VIN decoded</span>
                <b>
                  {vinState.decoded.year} {vinState.decoded.make}{" "}
                  {vinState.decoded.model}
                  {vinState.decoded.trim ? ` ${vinState.decoded.trim}` : ""}
                </b>
              </div>

              <div className="decodedGrid">
                <Info label="Engine" value={vinState.decoded.engine} />
                <Info label="Drive" value={vinState.decoded.driveType} />
                <Info label="Body" value={vinState.decoded.bodyClass} />
                <Info label="Plant" value={vinState.decoded.plant} />
              </div>
            </div>
          )}

          <div className="row">
            <label>
              Year
              <input value={v.year} onChange={set("year")} placeholder="2023" />
            </label>
            <label>
              Make
              <input value={v.make} onChange={set("make")} placeholder="RAM" />
            </label>
          </div>

          <div className="row">
            <label>
              Model
              <input value={v.model} onChange={set("model")} placeholder="1500" />
            </label>
            <label>
              Mileage
              <input type="number" value={v.mileage} onChange={set("mileage")} />
            </label>
          </div>

          <div className="sectionTitle divider">
            <div>
              <span className="step">02</span>
              <h2>Auction</h2>
            </div>
            <span className="muted">What the lane is telling you</span>
          </div>

          <div className="row">
            <Money
              label="Current bid / auction price"
              k="currentBid"
              v={v.currentBid}
              set={set}
            />
            <label>
              Condition grade
              <select value={v.conditionGrade} onChange={set("conditionGrade")}>
                <option value="5.0">5.0 — Excellent</option>
                <option value="4.5">4.5 — Very Good</option>
                <option value="4.0">4.0 — Good</option>
                <option value="3.5">3.5 — Average+</option>
                <option value="3.0">3.0 — Average</option>
                <option value="2.5">2.5 — Below Average</option>
                <option value="2.0">2.0 — Rough</option>
              </select>
            </label>
          </div>

          <div className="sectionTitle divider">
            <div>
              <span className="step">03</span>
              <h2>Underwriting</h2>
            </div>
            <span className="muted">Dealer economics</span>
          </div>

          <Money
            label="Expected resale / market value"
            k="market"
            v={v.market}
            set={set}
          />
          <Money label="Estimated repairs" k="repair" v={v.repair} set={set} />

          <div className="row">
            <Money label="Auction fees" k="fees" v={v.fees} set={set} />
            <Money label="Transport" k="transport" v={v.transport} set={set} />
          </div>

          <div className="row">
            <Money label="Target profit" k="profit" v={v.profit} set={set} />
            <Money label="Base risk reserve" k="reserve" v={v.reserve} set={set} />
          </div>

          <button className="analyzeButton" onClick={analyzeVehicle}>
            Analyze Vehicle
          </button>

          <p className="finePrint">
            BidPilot v0.3 uses your market-value and repair assumptions, then
            adds risk for mileage and condition. Automated market comps and
            condition-report analysis come next.
          </p>
        </section>

        <aside className="card result">
          <div className="resultTop">
            <span className="eyebrow">BIDPILOT VERDICT</span>
            <span className={`verdict ${shown.verdict.toLowerCase()}`}>
              {shown.verdict}
            </span>
          </div>

          <div className="vehicleLine">
            {vehicleName(v) || "Vehicle not decoded yet"}
          </div>

          <div className="metric safe">
            <span>SAFE BID</span>
            <b>{usd.format(shown.safeBid)}</b>
            <small>Preferred purchase ceiling</small>
          </div>

          <div className="metric">
            <span>MAX BID</span>
            <b>{usd.format(shown.maxBid)}</b>
            <small>Hard ceiling for this deal</small>
          </div>

          <div className="bidStatus">
            <div>
              <span>Current bid</span>
              <b>{usd.format(n("currentBid"))}</b>
            </div>
            <div>
              <span>Room to SAFE BID</span>
              <b className={shown.roomToSafe >= 0 ? "positive" : "negative"}>
                {shown.roomToSafe >= 0 ? "+" : ""}
                {usd.format(shown.roomToSafe)}
              </b>
            </div>
          </div>

          <div className="summary">
            <p>
              <span>Market value</span>
              <b>{usd.format(n("market"))}</b>
            </p>
            <p>
              <span>Repairs + fees + transport</span>
              <b>-{usd.format(shown.costs)}</b>
            </p>
            <p>
              <span>Risk adjustment</span>
              <b>-{usd.format(shown.adjustedReserve)}</b>
            </p>
            <p>
              <span>Profit at current bid</span>
              <b className={shown.profitAtCurrent >= 0 ? "positive" : "negative"}>
                {usd.format(shown.profitAtCurrent)}
              </b>
            </p>
          </div>

          <div className="riskBox">
            <span>Risk profile</span>
            <div className="riskLine">
              <span>Condition adjustment</span>
              <b>{usd.format(shown.conditionRisk)}</b>
            </div>
            <div className="riskLine">
              <span>Mileage adjustment</span>
              <b>{usd.format(shown.mileageRisk)}</b>
            </div>
            <div className="riskLine">
              <span>Total reserve</span>
              <b>{usd.format(shown.adjustedReserve)}</b>
            </div>
          </div>

          <div className="decisionText">
            <b>{shown.headline}</b>
            <p>{shown.explanation}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function calculate(v) {
  const market = Number(v.market) || 0;
  const currentBid = Number(v.currentBid) || 0;
  const repair = Number(v.repair) || 0;
  const fees = Number(v.fees) || 0;
  const transport = Number(v.transport) || 0;
  const targetProfit = Number(v.profit) || 0;
  const baseReserve = Number(v.reserve) || 0;
  const mileage = Number(v.mileage) || 0;
  const grade = Number(v.conditionGrade) || 4;

  const costs = repair + fees + transport;

  const conditionRiskTable = {
    5: 0,
    4.5: 250,
    4: 500,
    3.5: 1000,
    3: 1500,
    2.5: 2250,
    2: 3000,
  };

  const conditionRisk = conditionRiskTable[grade] ?? 1000;
  const mileageRisk =
    mileage <= 50000
      ? 0
      : Math.min(2500, Math.ceil((mileage - 50000) / 25000) * 350);

  const adjustedReserve = baseReserve + conditionRisk + mileageRisk;
  const maxBid = Math.max(0, market - costs - targetProfit);
  const safeBid = Math.max(0, maxBid - adjustedReserve);
  const profitAtCurrent = market - currentBid - costs;
  const roomToSafe = safeBid - currentBid;

  let verdict = "BUY";
  let headline = "The numbers are inside the preferred buy zone.";
  let explanation =
    "Current bid is at or below SAFE BID. You still have room for the target profit and the risk reserve.";

  if (currentBid > safeBid && currentBid <= maxBid) {
    verdict = "CAUTION";
    headline = "You are above SAFE BID but still below MAX BID.";
    explanation =
      "The deal can still work, but you are spending part of the risk cushion. Bid only if the condition and market value are well supported.";
  }

  if (currentBid > maxBid) {
    verdict = "PASS";
    headline = "Current bid is above the hard ceiling.";
    explanation =
      "At this price the deal falls below the target economics. Unless market value or repair assumptions improve materially, stop bidding.";
  }

  return {
    costs,
    conditionRisk,
    mileageRisk,
    adjustedReserve,
    maxBid,
    safeBid,
    profitAtCurrent,
    roomToSafe,
    verdict,
    headline,
    explanation,
  };
}

function vehicleName(v) {
  return [v.year, v.make, v.model].filter(Boolean).join(" ");
}

function Money({ label, k, v, set }) {
  return (
    <label>
      {label}
      <div className="money">
        <span>$</span>
        <input type="number" value={v} onChange={set(k)} />
      </div>
    </label>
  );
}

function Info({ label, value }) {
  if (!value) return null;
  return (
    <div className="info">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
