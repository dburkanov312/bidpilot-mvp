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
    year: "2022",
    make: "",
    model: "",
    mileage: "45000",
    market: "30000",
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

  const set = (key) => (e) =>
    setV({ ...v, [key]: key === "vin" ? e.target.value.toUpperCase() : e.target.value });

  const num = (key) => Number(v[key]) || 0;

  const result = useMemo(() => {
    const costs = num("repair") + num("fees") + num("transport");
    const maxBid = Math.max(0, num("market") - costs - num("profit"));
    const safeBid = Math.max(0, maxBid - num("reserve"));
    const expectedProfit = num("market") - safeBid - costs;
    return { costs, maxBid, safeBid, expectedProfit };
  }, [v]);

  async function decodeVin() {
    const vin = v.vin.trim().toUpperCase();

    if (vin.length !== 17) {
      setVinState({ loading: false, error: "VIN must contain exactly 17 characters.", decoded: null });
      return;
    }

    if (/[IOQ]/.test(vin)) {
      setVinState({ loading: false, error: "VINs do not use the letters I, O or Q.", decoded: null });
      return;
    }

    setVinState({ loading: true, error: "", decoded: null });

    try {
      const response = await fetch(`/api/decode-vin?vin=${encodeURIComponent(vin)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to decode VIN.");
      }

      setV((current) => ({
        ...current,
        vin,
        year: data.year || current.year,
        make: data.make || current.make,
        model: data.model || current.model,
      }));

      setVinState({ loading: false, error: "", decoded: data });
    } catch (error) {
      setVinState({
        loading: false,
        error: error.message || "Unable to decode VIN.",
        decoded: null,
      });
    }
  }

  return (
    <main>
      <header>
        <div className="brand">
          <span className="logo">B</span>
          <b>BidPilot</b>
        </div>
        <span className="beta">312 AUTO GROUP · PRIVATE BETA</span>
      </header>

      <section className="hero">
        <span className="eyebrow">DEALER DECISION ENGINE</span>
        <h1>
          Know your number <em>before</em> you bid.
        </h1>
        <p>
          Vehicle underwriting built around dealer economics: market value,
          repairs, fees, risk and target profit.
        </p>
      </section>

      <div className="grid">
        <section className="card">
          <h2>Vehicle</h2>

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
                  {vinState.decoded.year} {vinState.decoded.make} {vinState.decoded.model}
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
              <input type="number" value={v.year} onChange={set("year")} />
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

          <h2 className="section">Underwriting assumptions</h2>
          <Money label="Expected resale / market value" k="market" v={v.market} set={set} />
          <Money label="Repair estimate" k="repair" v={v.repair} set={set} />

          <div className="row">
            <Money label="Auction fees" k="fees" v={v.fees} set={set} />
            <Money label="Transport" k="transport" v={v.transport} set={set} />
          </div>

          <div className="row">
            <Money label="Target profit" k="profit" v={v.profit} set={set} />
            <Money label="Risk reserve" k="reserve" v={v.reserve} set={set} />
          </div>
        </section>

        <aside className="card result">
          <span className="eyebrow">BID RECOMMENDATION</span>

          <div className="metric safe">
            <span>SAFE BID</span>
            <b>{usd.format(result.safeBid)}</b>
            <small>Preferred purchase ceiling</small>
          </div>

          <div className="metric">
            <span>MAX BID</span>
            <b>{usd.format(result.maxBid)}</b>
            <small>Do not exceed</small>
          </div>

          <div className="summary">
            <p>
              <span>Market value</span>
              <b>{usd.format(num("market"))}</b>
            </p>
            <p>
              <span>Repair + fees + transport</span>
              <b>-{usd.format(result.costs)}</b>
            </p>
            <p>
              <span>Profit at SAFE BID</span>
              <b>{usd.format(result.expectedProfit)}</b>
            </p>
          </div>

          <div className="room">
            <span>Bidding room</span>
            <b>{usd.format(result.maxBid - result.safeBid)}</b>
            <small>between SAFE BID and MAX BID</small>
          </div>

          <p className="note">
            VIN data is decoded through NHTSA vPIC. Market value, vehicle history,
            condition-report analysis and parts pricing will be layered on next.
          </p>
        </aside>
      </div>
    </main>
  );
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
