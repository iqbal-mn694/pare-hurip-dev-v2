"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-950">
      <hr className="my-6 border-gray-200 dark:border-slate-800 sm:mx-auto lg:my-8" />
      <div className="w-full h-auto px-4 py-6 lg:pt-8">
        <div className="flex flex-wrap justify-center sm:flex sm:justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center">
              <Image
                src="/images/logo.png"
                width={100}
                height={100}
                alt="Pare Hurip"
                className="sm:ml-8 mr-8 sm:mr-3"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-center sm:text-left sm:gap-6">
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 dark:text-slate-100 uppercase">Navigasi</h2>
              <ul className="text-gray-500 dark:text-slate-400 font-medium">
                <li className="mb-4">
                  <Link href="/" className="hover:underline">Beranda</Link>
                </li>
                <li className="mb-4">
                  <Link href="/ksa-visualization" className="hover:underline">Fase Tanam KSA</Link>
                </li>
                <li>
                  <Link href="/compare" className="hover:underline">Harga Beras</Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-6 text-sm font-semibold text-gray-900 dark:text-slate-100 uppercase">Akun</h2>
              <ul className="text-gray-500 dark:text-slate-400 font-medium">
                <li>
                  <Link href="/admin" className="hover:underline">Dashboard Admin</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <hr className="my-6 border-gray-200 dark:border-slate-800 sm:mx-auto lg:my-8" />
        <div className="text-center">
          <span className="block text-sm text-gray-500 dark:text-slate-400" suppressHydrationWarning>
            © {new Date().getFullYear()} Badan Pusat Statistik Kota Tasikmalaya. Hak cipta dilindungi.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
