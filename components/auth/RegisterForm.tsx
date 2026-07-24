"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.password !== form.confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || "Gagal mendaftar. Coba lagi.");
      return;
    }

    setSuccess(
      "Akun berhasil dibuat. Akun kamu akan diaktifkan menjadi admin oleh superadmin. Silakan masuk setelah itu."
    );
    setTimeout(() => router.push("/login"), 2500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-green-50 via-white to-white px-4 pt-24 pb-12">
      <Card className="w-full max-w-md shadow-lg border-green-100">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-700/10">
            <UserPlus className="h-6 w-6 text-green-700" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Daftar Akun Staf
          </CardTitle>
          <CardDescription>
            Untuk staf BPS yang akan dipromosikan menjadi admin oleh superadmin
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" placeholder="Nama kamu" value={form.name} onChange={handleChange} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="nama@bpstasik.go.id" value={form.email} onChange={handleChange} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Minimal 8 karakter" value={form.password} onChange={handleChange} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Konfirmasi Password</Label>
              <Input id="confirm" name="confirm" type="password" placeholder="Ulangi password" value={form.confirm} onChange={handleChange} required />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-10"
            >
              {loading ? "Memproses..." : "Daftar"}
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-green-700 font-medium hover:underline">
                Masuk di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}