"use client";
import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Home,
  ArrowLeftToLine,
  ArrowRightToLine,
  Wallet,
  ShoppingBag,
  MessageCircle,
  ArrowBigRight,
  BarChart3,
  History,
  ChevronDown,
  ChevronRight,
  IdCard,
  Baby,
  Landmark,
  Folder,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "../ThemeMod";
import LogoutButton from "../Logout";
import NotificationBell from "../NotificationBell";
import toast, { Toaster } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { updateUser, userLogout } from "@/lib/userSlice";
import axios from "axios";
import TelegramPopup from "../TelegramPopup";
import UpdateWhatsAppPopup from "../WhatsappAdd";

type MenuItem = {
  label: string;
  icon: React.ReactElement;
  href: string;
};

type ServiceCategoryId = "nid" | "birth" | "land" | "passport" | "other";

type ServicePayloadItem = {
  service: {
    name: string;
    href: string;
    note?: string;
  };
};

type ServiceCategory = {
  id: ServiceCategoryId;
  label: string;
  icon: React.ReactElement;
  items: Array<{
    label: string;
    href: string;
  }>;
};

const menuItemsd: MenuItem[] = [
  { label: "Home", icon: <Home size={20} />, href: "/" },
  {
    label: "Services",
    icon: <ShoppingBag size={20} />,
    href: "/services",
  },
  {
    label: "Order Posts",
    icon: <MessageCircle size={20} />,
    href: "/my-posts",
  },
  {
    label: "Analytics",
    icon: <BarChart3 size={20} />,
    href: "/analytics",
  },
  {
    label: "Wallet",
    icon: <Wallet size={20} />,
    href: "/wallet",
  },
  {
    label: "Recharge History",
    icon: <History size={20} />,
    href: "/recharge-history",
  },
];

const SERVICES_CACHE_KEY = "nav-services-cache-v3";
const SERVICES_CACHE_TTL_MS = 5 * 60 * 1000;
const SPRING_EASE_CLASS = "[transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]";

const categoryMeta: Record<ServiceCategoryId, { label: string; icon: React.ReactElement }> = {
  nid: { label: "NID Services", icon: <IdCard size={16} /> },
  birth: { label: "Birth Registration", icon: <Baby size={16} /> },
  land: { label: "Land Services", icon: <Landmark size={16} /> },
  passport: { label: "Passport Services", icon: <ShieldCheck size={16} /> },
  other: { label: "Other Services", icon: <Folder size={16} /> },
};

const detectCategory = (name: string, href: string, note?: string): ServiceCategoryId => {
  const text = `${name} ${href} ${note || ""}`.toLowerCase();

  if (/\bnid\b|national id|smart card|voter|voter id|nidmake|nid/.test(text)) {
    return "nid";
  }

  if (/birth|bdris|brn|jonmo|janma/.test(text)) {
    return "birth";
  }

  if (/land|ldtax|dakhila|khatian|mutation|bhumi|bhoomi|jom[iy]|plot/.test(text)) {
    return "land";
  }

  if (/passport/.test(text)) {
    return "passport";
  }

  return "other";
};

const buildServiceCategories = (data: ServicePayloadItem[]): ServiceCategory[] => {
  const grouped: Record<ServiceCategoryId, Array<{ label: string; href: string }>> = {
    nid: [],
    birth: [],
    land: [],
    passport: [],
    other: [],
  };

  for (const item of data) {
    if (!item?.service?.name || !item?.service?.href) continue;

    const categoryId = detectCategory(item.service.name, item.service.href, item.service.note);
    grouped[categoryId].push({
      label: item.service.name,
      href: item.service.href,
    });
  }

  return (Object.keys(categoryMeta) as ServiceCategoryId[])
    .map((id) => ({
      id,
      label: categoryMeta[id].label,
      icon: categoryMeta[id].icon,
      items: grouped[id],
    }))
    .filter((category) => category.items.length > 0);
};

export default function Nav({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isLoggedIn } = useAppSelector((state) => state.userAuth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const telegramPopupKey = user?._id || user?.email || user?.username;
  useEffect(() => {
    let prevWidth = window.innerWidth;

    const handleResize = () => {
      const currentWidth = window.innerWidth;

      if (currentWidth > prevWidth) {
        setCollapsed(false);
      } else if (currentWidth < prevWidth) {
        setCollapsed(true);
      }

      prevWidth = currentWidth; // update previous width
    };

    window.addEventListener("resize", handleResize);

    // run once to initialize
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!serviceCategories.length) return;

    setExpandedCategories((previous) => {
      const updated = { ...previous };

      for (const category of serviceCategories) {
        if (updated[category.id] === undefined) {
          updated[category.id] = category.items.some((item) => item.href === pathname);
        }
      }

      return updated;
    });
  }, [serviceCategories, pathname]);

  // Fetch user profile and counts
  useEffect(() => {
    if (pathname.startsWith("/reseller") || pathname === "/login" || pathname.startsWith("/admin")) return;

    async function fetchData() {
      try {
        const cachedRaw = sessionStorage.getItem(SERVICES_CACHE_KEY);
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw) as {
              timestamp: number;
              items: ServicePayloadItem[];
            };
            if (Date.now() - parsed.timestamp < SERVICES_CACHE_TTL_MS) {
              setServiceCategories(buildServiceCategories(parsed.items));
            }
          } catch {
            sessionStorage.removeItem(SERVICES_CACHE_KEY);
          }
        }

        try {
          const [profileResponse, servicesResponse] = await Promise.all([
            axios.get(`/api/profile`, { withCredentials: true }),
            axios.get(`/api/services`, { withCredentials: true }),
          ]);
          dispatch(updateUser(profileResponse.data));

          const data = Array.isArray(servicesResponse.data) ? servicesResponse.data : [];
          setServiceCategories(buildServiceCategories(data));
          sessionStorage.setItem(
            SERVICES_CACHE_KEY,
            JSON.stringify({
              timestamp: Date.now(),
              items: data,
            })
          );
        } catch (error) {
          console.log(error);
        }
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          const err = error as { response?: { status?: number } };
          if (err.response?.status === 401) {
            try {
              await axios.get(`/api/logout`, { withCredentials: true });
            } catch {
              toast.error("Error logging out. Please try again.");
            } finally {
              dispatch(userLogout());
              router.push("/login");
            }
          }
        } else if (error instanceof Error) {
          console.error("Error fetching profile:", error.message);
        } else if (typeof error === "object" && error !== null) {
          console.error("Error fetching profile:", JSON.stringify(error));
        } else {
          console.error("Error fetching profile:", String(error));
        }
      }
    }

    fetchData();
  }, [dispatch, pathname, router]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((previous) => {
      const isCurrentlyOpen = !!previous[categoryId];
      const nextState: Record<string, boolean> = {};

      for (const category of serviceCategories) {
        nextState[category.id] = false;
      }

      // Accordion behavior: opening one closes others; clicking open item closes it.
      nextState[categoryId] = !isCurrentlyOpen;

      return nextState;
    });
  };

  if (!mounted) {
    return null;
  }

  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reseller") ||
    pathname.startsWith("/admin")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="pointer-events-none absolute -top-28 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/10" />
      <div className="pointer-events-none absolute top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/10" />
      {/* HEADER */}
      <Toaster position="top-center" reverseOrder={false} />
      {isLoggedIn && telegramPopupKey ? (
        <TelegramPopup storageKeyPart={telegramPopupKey} />
      ) : null}
      <UpdateWhatsAppPopup isOpen={!user.whatsapp && isLoggedIn} />
      <header
        className="sticky top-0 z-50 w-full h-16 border-b border-white/30 dark:border-slate-700/60 
        bg-gradient-to-r from-slate-900/95 via-indigo-900/95 to-slate-900/95 
        supports-[backdrop-filter]:bg-slate-900/75 supports-[backdrop-filter]:backdrop-blur-2xl
        flex items-center justify-between px-4 shadow-[0_14px_40px_rgba(15,23,42,0.38)]"
      >
        <div className="flex items-center">
          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white md:hidden mr-3 rounded-xl p-1.5 border border-white/20 hover:bg-white/10 transition-colors"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-2 rounded-xl border border-white/15 hover:bg-white/10 
              transition-colors duration-300 mr-3 text-white"
          >
            {collapsed ? (
              <ArrowRightToLine size={20} />
            ) : (
              <ArrowLeftToLine size={20} />
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <Sparkles size={15} />
            </span>
            <div className="leading-tight">
              <h1 className="text-sm sm:text-base font-black tracking-[0.08em] bg-gradient-to-r from-white via-cyan-200 to-indigo-200 bg-clip-text text-transparent">
                BDRIS
              </h1>
              <p className="hidden sm:block text-[10px] uppercase tracking-[0.14em] text-white/60">Operations Panel</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Balance Display */}
          <div className="hidden sm:flex items-center gap-2 bg-white/10 border border-white/25 px-3 py-1 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            <Wallet size={15} className="text-emerald-300" />
            <span className="text-white font-semibold text-sm">
              BDT {user?.balance || "0.00"}
            </span>
          </div>

          <NotificationBell />
          <LogoutButton />
          <ThemeToggle />
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR (desktop) */}
        <aside
          className={`hidden relative overflow-y-auto pt-2 md:flex flex-col transition-all duration-300 ease-in-out 
            border-r border-white/40 dark:border-slate-700/60
            bg-white/65 dark:bg-slate-900/55 backdrop-blur-2xl
            shadow-[8px_0_24px_rgba(15,23,42,0.06)] dark:shadow-[8px_0_24px_rgba(2,6,23,0.25)]
            text-slate-700 dark:text-slate-200
            ${collapsed ? "w-20" : "w-72"}`}
        >
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-cyan-400/10 to-transparent" />

          {menuItemsd.map((item) => {
            const isActive = pathname === item?.href;

            return (
              <Link
                key={item?.href}
                href={item?.href}
                className={`relative overflow-hidden flex ${collapsed ? "justify-center" : "justify-start"
                  } p-3 mx-2 my-1 rounded-xl text-slate-700 dark:text-slate-200
                hover:bg-white/80 dark:hover:bg-slate-800/75 hover:translate-x-0.5 group transition-all duration-300 ease-in-out`}
              >
                <span
                  className={`absolute inset-0 rounded-xl border transition-all duration-500 ${SPRING_EASE_CLASS} ${isActive
                    ? "opacity-100 scale-100 bg-gradient-to-r from-indigo-500/20 to-cyan-500/15 border-indigo-200/80 dark:border-cyan-500/30 shadow-[0_8px_20px_rgba(99,102,241,0.16)]"
                    : "opacity-0 scale-95 border-transparent"
                    }`}
                />
                <span className="relative z-10 group-hover:block text-current">{item?.icon}</span>
                <span
                  className={`relative z-10 ml-3 font-medium transition-all duration-300 ${collapsed ? "opacity-0 absolute left-14" : "opacity-100"
                    }`}
                >
                  {item?.label}
                </span>
                {isActive && !collapsed && (
                  <span className="relative z-10 ml-auto h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                )}
              </Link>
            );
          })}

          {!collapsed && serviceCategories.length > 0 && (
            <div className="mt-2 px-2">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                Service Categories
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                  {serviceCategories.length}
                </span>
              </div>
              {serviceCategories.map((category) => {
                const isExpanded = expandedCategories[category.id] ?? false;

                return (
                  <div key={category.id} className="mb-1">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {category.icon}
                        {category.label}
                      </span>
                      <span className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}>
                        <ChevronDown size={16} />
                      </span>
                    </button>

                    <div
                      className={`grid transition-all duration-500 ${SPRING_EASE_CLASS} ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-3 mt-1 space-y-1 border-l border-slate-300 dark:border-slate-700 pl-2">
                          {category.items.map((service) => {
                            const isServiceActive = pathname === service.href;

                            return (
                              <Link
                                key={service.href}
                                href={service.href}
                                className={`relative overflow-hidden flex items-center p-2 rounded-md text-sm transition-all duration-300 ${isServiceActive
                                  ? "text-indigo-700 dark:text-cyan-300 font-semibold"
                                  : "hover:bg-white/70 dark:hover:bg-slate-800/70"
                                  }`}
                              >
                                <span
                                  className={`absolute inset-0 rounded-md transition-all duration-500 ${SPRING_EASE_CLASS} ${isServiceActive
                                    ? "opacity-100 scale-100 bg-gradient-to-r from-indigo-500/15 to-cyan-500/10"
                                    : "opacity-0 scale-95"
                                    }`}
                                />
                                <ArrowBigRight size={16} className="relative z-10" />
                                <span className="relative z-10 ml-2">{service.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto mb-4">
            <Link
              href="/profile"
              className={`flex  ${collapsed ? "justify-center" : "justify-start"
                }  p-3 mx-2 my-1 rounded-xl border border-white/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/55 backdrop-blur-lg hover:bg-white/80 dark:hover:bg-slate-800 group relative transition-all duration-300 ease-in-out`}
            >
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`
                }
                alt=""
                className="w-8 h-8 rounded-full mr-2"
              />
              <span
                className={`ml-2 font-semibold transition-all duration-300 ${collapsed ? "opacity-0 absolute left-14" : "opacity-100"
                  }`}
              >
                {user?.name}
              </span>
            </Link>
          </div>
        </aside>

        {/* SIDEBAR (mobile) */}
        {mobileOpen && (
          <button
            aria-label="Close mobile menu overlay"
            className="md:hidden fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div
          className={`md:hidden overflow-y-auto fixed top-16 left-0 h-[calc(100%-4rem)] w-72 
              border-r border-white/50 dark:border-slate-700/60
              bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl
              text-slate-800 dark:text-slate-100 shadow-xl z-40 transform transition-transform duration-300 
              ${mobileOpen ? "translate-x-0" : "-translate-x-72"
            } flex flex-col`}
        >
          <div className="flex-1 m-2">
            {menuItemsd.map((item) => {
              const isActive = pathname === item?.href;

              return (
                <Link
                  key={item?.href}
                  href={item?.href}
                  onClick={() => setMobileOpen(false)}
                  className="relative overflow-hidden flex items-center p-3 mb-2 rounded-xl transition-all"
                >
                  <span
                    className={`absolute inset-0 rounded-xl border transition-all duration-500 ${SPRING_EASE_CLASS} ${isActive
                      ? "opacity-100 scale-100 bg-gradient-to-r from-indigo-500/15 to-cyan-500/10 text-indigo-700 dark:text-cyan-300 border-indigo-200/70 dark:border-cyan-500/20"
                      : "opacity-0 scale-95 border-transparent"
                      }`}
                  />
                  <span className={`relative z-10 ${isActive ? "text-indigo-700 dark:text-cyan-300" : "text-slate-700 dark:text-slate-200"}`}>{item?.icon}</span>
                  <span className={`relative z-10 ml-3 font-medium ${isActive ? "text-indigo-700 dark:text-cyan-300" : "text-slate-700 dark:text-slate-200"}`}>{item?.label}</span>
                </Link>
              );
            })}

            {serviceCategories.length > 0 && (
              <div className="mt-3 px-2">
                <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Service Categories
                </div>

                {serviceCategories.map((category) => {
                  const isExpanded = expandedCategories[category.id] ?? false;

                  return (
                    <div key={category.id} className="mb-1">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {category.icon}
                          {category.label}
                        </span>
                        <span className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}>
                          <ChevronDown size={16} />
                        </span>
                      </button>

                      <div
                        className={`grid transition-all duration-500 ${SPRING_EASE_CLASS} ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                      >
                        <div className="overflow-hidden">
                          <div className="ml-3 mt-1 space-y-1 border-l border-slate-300 dark:border-slate-700 pl-2">
                            {category.items.map((service) => {
                              const isServiceActive = pathname === service.href;

                              return (
                                <Link
                                  key={service.href}
                                  href={service.href}
                                  onClick={() => setMobileOpen(false)}
                                  className={`relative overflow-hidden flex items-center p-2 rounded-md text-sm transition-all duration-300 ${isServiceActive
                                    ? "text-indigo-700 dark:text-cyan-300 font-semibold"
                                    : "hover:bg-white/70 dark:hover:bg-slate-800/70"
                                    }`}
                                >
                                  <span
                                    className={`absolute inset-0 rounded-md transition-all duration-500 ${SPRING_EASE_CLASS} ${isServiceActive
                                      ? "opacity-100 scale-100 bg-gradient-to-r from-indigo-500/15 to-cyan-500/10"
                                      : "opacity-0 scale-95"
                                      }`}
                                  />
                                  <ArrowBigRight size={16} className="relative z-10" />
                                  <span className="relative z-10 ml-2">{service.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <Link
              href="/profile"
              className="mx-2 flex items-center p-3 rounded-xl border border-white/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/55 backdrop-blur-lg 
               hover:bg-white/80 dark:hover:bg-slate-800 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`
                }
                alt=""
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="ml-3 font-medium">{user?.name}</span>
            </Link>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main
          className="flex-1 overflow-auto 
            text-slate-900 dark:text-slate-100 
            bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_40%),radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_38%),linear-gradient(to_bottom,#f8fafc,#f1f5f9)]
            dark:from-slate-950 dark:to-slate-900 relative"
        >
          {children}

          {/* Fixed Support Button */}
          {pathname !== "/support" && (
            <Link
              href="/support"
              className="fixed bottom-6 right-6 z-50 flex items-center justify-center 
              w-14 h-14 rounded-2xl shadow-lg 
              bg-gradient-to-r from-indigo-600 to-cyan-500 
              hover:from-indigo-500 hover:to-cyan-400 
              dark:from-indigo-600 dark:to-cyan-500 
              dark:hover:from-indigo-500 dark:hover:to-cyan-400 
              text-white transition-all duration-300 ease-in-out 
              hover:scale-110 hover:shadow-xl 
              group"
            >
              <MessageCircle
                size={24}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="sr-only">Support</span>
            </Link>
          )}
        </main>
      </div>
    </div>
  );
}
