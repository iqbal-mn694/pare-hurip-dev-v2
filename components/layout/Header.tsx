"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation"; 
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";

const Header = () => {
  const [nav, setNav] = useState(false);
  const [color, setColor] = useState("transparent");
  const [textColor, setTextColor] = useState("white");

  const pathname = usePathname(); 

  const handleNav = () => {
    setNav(!nav);
  };

  useEffect(() => {
    
    if (pathname === "/") {
      const changeColor = () => {
        if (window.scrollY >= 90) {
          setColor("#ffffff");
          setTextColor("#000000");
        } else {
          setColor("transparent");
          setTextColor("#ffffff");
        }
      };
      
      changeColor(); 
      window.addEventListener("scroll", changeColor);
      

      return () => window.removeEventListener("scroll", changeColor);
    } else {

      setColor("#ffffff");
      setTextColor("#000000");
    }
  }, [pathname]); 

  return (
    <div
      style={{ backgroundColor: `${color}` }}
      className="fixed left-0 top-0 w-full z-[999] ease-in duration-300"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-2">
        <Link href="/" className="flex items-center">
          <div className="flex items-center">
            <Image
              src="/images/logo.png"
              width={40}
              height={40}
              alt="Logo Pare Hurip"
            />
            <div
              className="hidden sm:block ml-3 text-center text-sm tracking-[2.5px]"
              style={{ color: `${textColor}` }}
            >
              <h2 className="font-bold">PARE</h2>
              <h2 className="font-bold">HURIP</h2>
            </div>
          </div>
        </Link>

        {/* Navigasi Desktop */}
        <ul
          style={{ color: `${textColor}` }}
          className="hidden sm:flex font-semibold space-x-4 items-center"
        >
          {/* Menggunakan ID section untuk navigasi di halaman utama */}
          <li className="p-2 hover:text-green-600 transition-colors duration-200">
            <Link href="/#about-ksa">Beranda</Link>
          </li>
          <li className="p-2 hover:text-green-600 transition-colors duration-200">
            <Link href="/visualisasi-ksa">Fase Tanam</Link>
          </li>
          <li className="p-2 hover:text-green-600 transition-colors duration-200">
            <Link href="/compare">Luas Panen & Harga Beras</Link>
          </li>
          <li className="p-2">
            <Link href="/prediction">
                <button className="bg-green-700 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-800 transition-all duration-300">
                    Coba Sekarang
                </button>
            </Link>
          </li>
        </ul>

        {/* Hamburger Mobile */}
        <div className="sm:hidden z-20" onClick={handleNav}>
          {nav ? (
            <AiOutlineClose size={28} style={{ color: textColor }} />
          ) : (
            <AiOutlineMenu size={28} style={{ color: textColor }} />
          )}
        </div>

        {/* Mobile Menu */}
        <div
          className={`sm:hidden absolute top-0 left-0 w-full h-screen bg-black text-white flex justify-center items-center transition-transform duration-300 ease-in-out ${
            nav ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ul className="space-y-8 text-center text-2xl font-bold">
            <li onClick={handleNav}>
              <Link href="/#about-ksa">Beranda</Link>
            </li>
            <li onClick={handleNav}>
              <Link href="/visualisasi-ksa">Fase Tanam</Link>
            </li>
            <li onClick={handleNav}>
              <Link href="/compare">Luas Panen & Harga Beras</Link>
            </li>
            <li onClick={handleNav}>
              <Link href="/prediction">Coba Sekarang</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;