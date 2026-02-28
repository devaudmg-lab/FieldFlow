"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Statistics", href: "/admin/statistics", icon: BarChart3 },
  ];

  const NavContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
        <div className="bg-blue-600 p-2 rounded-xl">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <span className="font-black text-xl uppercase tracking-tighter text-white">
          Field<span className="text-blue-400">Flow</span>
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center justify-between group p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={20}
                  className={
                    isActive ? "text-white" : "group-hover:text-blue-400"
                  }
                />
                <span className="font-bold text-sm tracking-wide">
                  {item.name}
                </span>
              </div>
              {isActive && <ChevronRight size={14} className="text-blue-200" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
        <SignOutButton />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden lg:flex w-72 bg-slate-950 text-white flex-col sticky top-0 h-screen shadow-2xl shadow-slate-900/20">
        <NavContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 bg-slate-950 text-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-6 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <NavContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (Responsive) */}
        <header className="h-16 lg:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-sm lg:text-base font-black text-slate-900 uppercase tracking-widest">
              {navItems.find((item) => item.href === pathname)?.name ||
                "Admin Portal"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-blue-600 uppercase leading-none">
                Access Level
              </p>
              <p className="text-xs font-bold text-slate-500">
                System Administrator
              </p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold">
              AD
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 lg:p-8 max-w-400 mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
