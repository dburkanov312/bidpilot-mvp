"use client";

import { useMemo, useState } from "react";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 0
});

export default function Home() {
  const [v, setV] = useState({
    vin: "", year: "2022", make: "", model: "", mileage: "45000",
    market: "30000", repair: "2500", fees: "900", transport: "500",
    profit: "3500", reserve: "1500"
  });

  const set = key => e => setV({...v, [key]: e.target.value});
  const num = key => Number(v[key]) || 0;

  const result = useMemo(() => {
    const costs = num("repair") + num("fees") + num("transport");
    const maxBid = Math.max(0, num("market") - costs - num("profit"));
    const safeBid = Math.max(0, maxBid - num("reserve"));
    const expectedProfit = num("market") - safeBid - costs;
    return {costs, maxBid, safeBid, expectedProfit};
  }, [v]);

  return <main>
    <header>
      <div className="brand"><span className="logo">B</span><b>BidPilot</b></div>
      <span className="beta">312 AUTO GROUP · PRIVATE BETA</span>
    </header>

    <section className="hero">
      <span className="eyebrow">DEALER DECISION ENGINE</span>
      <h1>Know your number <em>before</em> you bid.</h1>
      <p>Vehicle underwriting built around dealer economics: market value, repairs, fees, risk and target profit.</p>
    </section>

    <div className="grid">
      <section className="card">
        <h2>Vehicle</h2>
        <label>VIN<input maxLength="17" value={v.vin} onChange={set("vin")} placeholder="17-character VIN"/></label>
        <div className="row">
          <label>Year<input type="number" value={v.year} onChange={set("year")}/></label>
          <label>Make<input value={v.make} onChange={set("make")} placeholder="BMW"/></label>
        </div>
        <div className="row">
          <label>Model<input value={v.model} onChange={set("model")} placeholder="X5"/></label>
          <label>Mileage<input type="number" value={v.mileage} onChange={set("mileage")}/></label>
        </div>

        <h2 className="section">Underwriting assumptions</h2>
        <Money label="Expected resale / market value" k="market" v={v.market} set={set}/>
        <Money label="Repair estimate" k="repair" v={v.repair} set={set}/>
        <div className="row">
          <Money label="Auction fees" k="fees" v={v.fees} set={set}/>
          <Money label="Transport" k="transport" v={v.transport} set={set}/>
        </div>
        <div className="row">
          <Money label="Target profit" k="profit" v={v.profit} set={set}/>
          <Money label="Risk reserve" k="reserve" v={v.reserve} set={set}/>
        </div>
      </section>

      <aside className="card result">
        <span className="eyebrow">BID RECOMMENDATION</span>
        <div className="metric safe"><span>SAFE BID</span><b>{usd.format(result.safeBid)}</b><small>Preferred purchase ceiling</small></div>
        <div className="metric"><span>MAX BID</span><b>{usd.format(result.maxBid)}</b><small>Do not exceed</small></div>
        <div className="summary">
          <p><span>Market value</span><b>{usd.format(num("market"))}</b></p>
          <p><span>Repair + fees + transport</span><b>-{usd.format(result.costs)}</b></p>
          <p><span>Profit at SAFE BID</span><b>{usd.format(result.expectedProfit)}</b></p>
        </div>
        <div className="room"><span>Bidding room</span><b>{usd.format(result.maxBid-result.safeBid)}</b><small>between SAFE BID and MAX BID</small></div>
        <p className="note">MVP uses dealer-entered assumptions. Auction feeds, condition reports, market comps, CARFAX and parts pricing are planned next.</p>
      </aside>
    </div>
  </main>;
}

function Money({label,k,v,set}) {
  return <label>{label}<div className="money"><span>$</span><input type="number" value={v} onChange={set(k)}/></div></label>;
}
