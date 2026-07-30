import { NextRequest, NextResponse } from "next/server";

const ML_API_BASE_URL = process.env.ML_API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const response = await fetch(`${ML_API_BASE_URL}/api/v1/lstm-hybrid-price/predict/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses request prediksi harga";
    return NextResponse.json({ detail: message, results: [] }, { status: 500 });
  }
}