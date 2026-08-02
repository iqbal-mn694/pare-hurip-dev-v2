import { NextRequest, NextResponse } from "next/server";
import { ML_API_BASE_URL } from "@/lib/ml-api";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const response = await fetch(`${ML_API_BASE_URL}/api/v1/random-forest/predict/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    const message = error instanceof Error ? error.message : "Gagal memproses request batch";
    return NextResponse.json({ detail: message, results: [] }, { status: 500 });
  }
}
