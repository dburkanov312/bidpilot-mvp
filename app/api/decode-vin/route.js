import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const vin = (searchParams.get("vin") || "").trim().toUpperCase();

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return NextResponse.json(
      { error: "Enter a valid 17-character VIN." },
      { status: 400 }
    );
  }

  try {
    const url =
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/` +
      `${encodeURIComponent(vin)}?format=json`;

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json(
        { error: "NHTSA VIN service is temporarily unavailable." },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const r = payload?.Results?.[0];

    if (!r || (!r.Make && !r.Model && !r.ModelYear)) {
      return NextResponse.json(
        { error: r?.ErrorText || "VIN could not be decoded." },
        { status: 404 }
      );
    }

    const engineParts = [
      r.DisplacementL ? `${Number(r.DisplacementL).toFixed(1)}L` : "",
      r.EngineCylinders ? `${r.EngineCylinders}-cyl` : "",
      r.EngineModel || "",
      r.FuelTypePrimary || "",
    ].filter(Boolean);

    const plantParts = [r.PlantCity, r.PlantState, r.PlantCountry].filter(Boolean);

    return NextResponse.json({
      vin,
      year: r.ModelYear || "",
      make: r.Make || "",
      model: r.Model || "",
      trim: r.Trim || r.Series || "",
      engine: engineParts.join(" · "),
      driveType: r.DriveType || "",
      bodyClass: r.BodyClass || "",
      plant: plantParts.join(", "),
      manufacturer: r.Manufacturer || "",
      vehicleType: r.VehicleType || "",
      errorCode: r.ErrorCode || "",
      errorText: r.ErrorText || "",
      source: "NHTSA vPIC",
    });
  } catch {
    return NextResponse.json(
      { error: "VIN lookup failed. Please try again." },
      { status: 500 }
    );
  }
}
