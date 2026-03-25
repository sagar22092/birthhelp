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

const SERVICES_CACHE_KEY = "nav-services-cache-v2";
const SERVICES_CACHE_TTL_MS = 5 * 60 * 1000;

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
    setExpandedCategories((previous) => ({
      ...previous,
      [categoryId]: !previous[categoryId],
    }));
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
    <div className="flex flex-col h-screen w-screen">
      {/* HEADER */}
      <Toaster position="top-center" reverseOrder={false} />
      {isLoggedIn && telegramPopupKey ? (
        <TelegramPopup storageKeyPart={telegramPopupKey} />
      ) : null}
      <UpdateWhatsAppPopup isOpen={!user.whatsapp && isLoggedIn} />
      <header
        className="w-full h-16 bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 
        flex items-center justify-between px-4 shadow-md"
      >
        <div className="flex items-center">
          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white md:hidden mr-3"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-2 rounded-md hover:bg-indigo-400/30 
              dark:hover:bg-teal-700/40 transition-colors duration-300 mr-3 text-white"
          >
            {collapsed ? (
              <ArrowRightToLine size={20} />
            ) : (
              <ArrowLeftToLine size={20} />
            )}
          </button>

          <h1 className="text-lg font-semibold text-white">BDRIS</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Balance Display */}
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Wallet size={16} className="text-white" />
            <span className="text-white font-medium text-sm">
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
          className={`hidden overflow-y-auto pt-1 md:flex flex-col transition-all duration-300 ease-in-out 
            bg-gradient-to-b from-slate-100 to-slate-50 
            dark:from-slate-900 dark:to-slate-800
            text-gray-900 dark:text-gray-100 shadow-lg
            ${collapsed ? "w-20" : "w-64"}`}
        >
          {menuItemsd.map((item) => (
            <Link
              key={item?.href}
              href={item?.href}
              className={`flex  ${collapsed ? "justify-center" : "justify-start"
                } ${pathname === item?.href
                  ? "bg-blue-200/70 dark:bg-blue-700/50"
                  : ""
                } p-4 mx-2 my-1 rounded-lg 
                hover:bg-indigo-200/70 dark:hover:bg-teal-700/50 group relative transition-all duration-300 ease-in-out`}
            >
              <span className="group-hover:block">{item?.icon}</span>
              <span
                className={`ml-3 font-medium transition-all duration-300 ${collapsed ? "opacity-0 absolute left-14" : "opacity-100"
                  }`}
              >
                {item?.label}
              </span>
            </Link>
          ))}

          {!collapsed && serviceCategories.length > 0 && (
            <div className="mt-2 px-2">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Service Categories
              </div>
              {serviceCategories.map((category) => {
                const isExpanded = expandedCategories[category.id] ?? false;

                return (
                  <div key={category.id} className="mb-1">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-200/70 dark:hover:bg-teal-700/50 transition-all"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {category.icon}
                        {category.label}
                      </span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {isExpanded && (
                      <div className="ml-3 mt-1 space-y-1 border-l border-gray-300 dark:border-gray-700 pl-2">
                        {category.items.map((service) => (
                          <Link
                            key={service.href}
                            href={service.href}
                            className={`flex items-center p-2 rounded-md text-sm transition-all ${pathname === service.href
                                ? "bg-blue-200/70 dark:bg-blue-700/50 font-semibold"
                                : "hover:bg-indigo-200/70 dark:hover:bg-teal-700/50"
                              }`}
                          >
                            <ArrowBigRight size={16} />
                            <span className="ml-2">{service.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-auto mb-4">
            <Link
              href="/profile"
              className={`flex  ${collapsed ? "justify-center" : "justify-start"
                }  p-4 mx-2 my-1 rounded-lg group relative transition-all duration-300 ease-in-out`}
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
                className={`ml-3 font-medium transition-all duration-300 ${collapsed ? "opacity-0 absolute left-14" : "opacity-100"
                  }`}
              >
                {user?.name}
              </span>
            </Link>
          </div>
        </aside>

        {/* SIDEBAR (mobile) */}
        <div
          className={`md:hidden overflow-y-auto fixed top-16 left-0 h-[calc(100%-4rem)] w-64 
              bg-gradient-to-b from-slate-100 to-slate-50 
              dark:from-slate-900 dark:to-slate-800
              text-gray-900 dark:text-gray-100 shadow-lg z-40 transform transition-transform duration-300 
              ${mobileOpen ? "translate-x-0" : "-translate-x-64"
            } flex flex-col`}
        >
          <div className="flex-1 m-2">
            {menuItemsd.map((item) => (
              <Link
                key={item?.href}
                href={item?.href}
                onClick={() => setMobileOpen(false)}
                className={`
                flex items-center p-4 mb-2 rounded-lg transition-all
                ${pathname === item?.href
                    ? "bg-indigo-300/80 dark:bg-blue-700/60 font-semibold"
                    : "hover:bg-indigo-200/70 dark:hover:bg-teal-700/50"
                  }
      `}
              >
                {item?.icon}
                <span className="ml-3 font-medium">{item?.label}</span>
              </Link>
            ))}

            {serviceCategories.length > 0 && (
              <div className="mt-3 px-2">
                <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Service Categories
                </div>

                {serviceCategories.map((category) => {
                  const isExpanded = expandedCategories[category.id] ?? false;

                  return (
                    <div key={category.id} className="mb-1">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-200/70 dark:hover:bg-teal-700/50 transition-all"
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {category.icon}
                          {category.label}
                        </span>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      {isExpanded && (
                        <div className="ml-3 mt-1 space-y-1 border-l border-gray-300 dark:border-gray-700 pl-2">
                          {category.items.map((service) => (
                            <Link
                              key={service.href}
                              href={service.href}
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center p-2 rounded-md text-sm transition-all ${pathname === service.href
                                  ? "bg-indigo-300/80 dark:bg-blue-700/60 font-semibold"
                                  : "hover:bg-indigo-200/70 dark:hover:bg-teal-700/50"
                                }`}
                            >
                              <ArrowBigRight size={16} />
                              <span className="ml-2">{service.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <Link
              href="/profile"
              className="flex items-center p-4 rounded-lg 
               hover:bg-indigo-200/70 dark:hover:bg-teal-700/50 transition-all"
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
            text-gray-900 dark:text-gray-100 
            bg-gradient-to-b from-white to-slate-50 
            dark:from-slate-950 dark:to-slate-900 relative"
        >
          {children}

          {/* Fixed Support Button */}
          {pathname !== "/support" && (
            <Link
              href="/support"
              className="fixed bottom-6 right-6 z-50 flex items-center justify-center 
              w-14 h-14 rounded-full shadow-lg 
              bg-gradient-to-r from-indigo-500 to-teal-500 
              hover:from-indigo-600 hover:to-teal-600 
              dark:from-indigo-600 dark:to-teal-600 
              dark:hover:from-indigo-700 dark:hover:to-teal-700 
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
