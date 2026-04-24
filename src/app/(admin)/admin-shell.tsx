"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  ClipboardList,
  Users,
  Settings,
  ChevronLeft,
  Menu,
  X,
  LogOut,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Commandes" },
  { href: "/admin/reports", icon: ClipboardList, label: "Historique" },
  { href: "/admin/customers", icon: Users, label: "Clients" },
  { href: "/admin/menu", icon: UtensilsCrossed, label: "Menu" },
  { href: "/admin/stock", icon: Package, label: "Gestion stock" },
  { href: "/admin/settings", icon: Settings, label: "Parametres" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-[#f5f5f7] flex">
      {/* Sidebar — Apple clean */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[#e5e5ea] transition-all duration-300",
          sidebarCollapsed ? "w-[68px]" : "w-56",
          "hidden lg:flex"
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#e5e5ea]">
          {!sidebarCollapsed && (
            <span className="font-bold text-[15px] text-[#1d1d1f] tracking-tight">
              SSF Manager
            </span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="shrink-0 p-1.5 rounded-lg hover:bg-[#f5f5f7] transition-colors cursor-pointer"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 text-[#86868b] transition-transform",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-[#1d1d1f] text-white"
                    : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-[#e5e5ea]">
          <Link
            href="/kitchen"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!sidebarCollapsed && <span>Vue Cuisine</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-12 border-b border-[#e5e5ea] bg-white/80 backdrop-blur-xl flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 cursor-pointer"
        >
          <Menu className="h-5 w-5 text-[#1d1d1f]" />
        </button>
        <span className="font-bold text-[15px] text-[#1d1d1f]">SSF Manager</span>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white p-4">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-[15px] text-[#1d1d1f]">SSF Manager</span>
              <button onClick={() => setMobileOpen(false)} className="cursor-pointer">
                <X className="h-5 w-5 text-[#86868b]" />
              </button>
            </div>
            <nav className="space-y-0.5">
              {sidebarItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all",
                      isActive
                        ? "bg-[#1d1d1f] text-white"
                        : "text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-56",
          "mt-12 lg:mt-0"
        )}
      >
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
