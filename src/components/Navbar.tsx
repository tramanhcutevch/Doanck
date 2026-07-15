import React, { useEffect, useState } from "react";
import {
  Bell,
  Bot,
  CheckCheck,
  Globe2,
  Leaf,
  Library,
  LogOut,
  Menu,
  MessageSquare,
  Microscope,
  PanelTop,
  Shield,
  Sparkles,
  Sprout,
  Store,
  Stethoscope,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AppUser, CommunityNotification, View } from "../types";
import {
  listCommunityNotifications,
  markAllCommunityNotificationsRead,
  markCommunityNotificationRead,
  subscribeToUserNotifications,
  unsubscribeFromCommunityChanges,
} from "../services/communityService";
import { languages, useI18n } from "../i18n";

interface NavbarProps {
  user: AppUser | null;
  currentView: View;
  setView: (v: View) => void;
  onLogin: () => void | Promise<void>;
  onLogout: () => void;
  canAccessAdmin: boolean;
}

const menuItems: { id: View; labelKey: string; icon: React.ElementType; tag?: string }[] = [
  { id: "diagnosis", labelKey: "nav.diagnosis", icon: Microscope, tag: "Vision" },
  { id: "chat", labelKey: "nav.chat", icon: MessageSquare },
  { id: "growth", labelKey: "nav.growth", icon: Sprout, tag: "Ops" },
  { id: "recommendations", labelKey: "nav.recommendations", icon: Stethoscope },
  { id: "pesticides", labelKey: "nav.pesticides", icon: Shield },
  { id: "forum", labelKey: "nav.forum", icon: Users },
  { id: "library", labelKey: "nav.library", icon: Library },
  { id: "shop", labelKey: "nav.shop", icon: Store },
];

const Navbar = ({ user, currentView, setView, onLogin, onLogout, canAccessAdmin }: NavbarProps) => {
  const { language, setLanguage, t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHiddenByOverlay, setIsHiddenByOverlay] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const userLabel = user?.displayName || user?.email || t("nav.user");
  const userInitial = userLabel.trim().charAt(0).toUpperCase() || "U";
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const desktopMenuItems: { id: View; labelKey: string; icon: React.ElementType; tag?: string; tone?: "default" | "emerald" | "sky" }[] = menuItems;
  const utilityMenuItems: { id: View; labelKey: string; icon: React.ElementType; tone: "emerald" | "sky" }[] = [
    { id: "userPortal", labelKey: "nav.user", icon: UserRound, tone: "emerald" },
    { id: "admin", labelKey: "nav.admin", icon: PanelTop, tone: "sky" },
  ];
  const currentMenuLabel =
    [...menuItems, ...utilityMenuItems].find((item) => item.id === currentView)?.labelKey || "nav.navigation";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentView, user?.uid]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [currentView]);

  useEffect(() => {
    const handleOverlayChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ hideNavbar?: boolean }>;
      setIsHiddenByOverlay(Boolean(customEvent.detail?.hideNavbar));
    };

    window.addEventListener("app-overlay-change", handleOverlayChange as EventListener);
    return () => {
      window.removeEventListener("app-overlay-change", handleOverlayChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        const nextNotifications = await listCommunityNotifications(user.uid);
        setNotifications(nextNotifications);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    void loadNotifications();

    const channel = subscribeToUserNotifications(user.uid, () => {
      void loadNotifications();
    });

    return () => {
      void unsubscribeFromCommunityChanges(channel);
    };
  }, [user?.uid]);

  const handleOpenNotifications = async () => {
    setNotificationsOpen((current) => !current);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!user?.uid) return;
    await markAllCommunityNotificationsRead(user.uid);
    const nextNotifications = await listCommunityNotifications(user.uid);
    setNotifications(nextNotifications);
  };

  const handleNotificationClick = async (notificationId: string, postId: string | null) => {
    try {
      await markCommunityNotificationRead(notificationId);
      if (user?.uid) {
        const nextNotifications = await listCommunityNotifications(user.uid);
        setNotifications(nextNotifications);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }

    setNotificationsOpen(false);
    if (postId) {
      setView("forum");
    }
  };

  return (
    <nav className={`fixed inset-x-0 top-0 z-[100] px-2 pt-0 transition-all duration-200 md:px-4 ${isHiddenByOverlay ? "pointer-events-none -translate-y-6 opacity-0" : "translate-y-0 opacity-100"}`}>
      <div
        className={`mx-auto w-full max-w-[1760px] border transition-all duration-500 ${
          isScrolled || currentView !== "home"
            ? "rounded-b-[24px] border-white/8 bg-[#252321]/90 shadow-[0_20px_50px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
            : "rounded-b-[24px] border-white/10 bg-[#2e2b28]/82 backdrop-blur-xl"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-5">
          <button onClick={() => setView("home")} className="flex shrink-0 items-center gap-3 text-left">
            <div className="ai-ring flex h-11 w-11 items-center justify-center rounded-[18px] bg-emerald-500/14 shadow-[0_10px_30px_rgba(16,185,129,0.16)]">
              <Leaf className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="whitespace-nowrap font-[var(--font-headline)] text-lg font-bold tracking-tight text-white sm:text-xl">Terraform Flora</span>
                <span className="hidden rounded-full border border-emerald-400/18 bg-emerald-400/8 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-300 sm:inline-flex">
                  AI Native
                </span>
              </div>
              <p className="hidden max-w-[240px] text-[11px] leading-relaxed text-white/38">{t("nav.subtitle")}</p>
            </div>
          </button>

          <div className="hidden items-center gap-1">
            {desktopMenuItems.map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              const toneClass =
                item.tone === "emerald"
                  ? active
                    ? "bg-emerald-500/14 text-white"
                    : "text-emerald-100/85 hover:bg-emerald-500/8 hover:text-white"
                  : item.tone === "sky"
                    ? active
                      ? "bg-sky-500/14 text-white"
                      : "text-sky-100/80 hover:bg-sky-500/8 hover:text-white"
                    : active
                      ? "bg-emerald-500/14 text-white"
                      : "text-white/60 hover:bg-white/6 hover:text-white";
              const iconToneClass =
                item.tone === "sky"
                  ? active
                    ? "text-sky-200"
                    : "text-white/35 group-hover:text-sky-200"
                  : active
                    ? "text-emerald-300"
                    : "text-white/35 group-hover:text-emerald-300";
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`group flex items-center gap-1.5 rounded-[14px] px-2.5 py-2 transition-all ${toneClass}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${iconToneClass}`} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{t(item.labelKey)}</span>
                  {item.tag && (
                    <span className="hidden rounded-full border border-white/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-white/35 2xl:inline-flex">
                      {item.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="hidden shrink-0 items-center gap-2 rounded-[20px] border border-white/8 bg-white/[0.04] px-4 py-2.5 text-left text-white/70 transition hover:border-emerald-400/25 hover:bg-white/[0.07] sm:flex"
          >
            <Menu className="h-4 w-4 text-emerald-300" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/28">{t("nav.navigation")}</p>
              <p className="text-sm font-semibold leading-none text-white">{t(currentMenuLabel)}</p>
            </div>
          </button>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/12">
                <Bot className="h-4 w-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">{t("nav.aiStatus")}</p>
                <p className="text-sm font-semibold text-white">{t("nav.ready")}</p>
              </div>
            </div>

            <div className="hidden items-center gap-1 rounded-[18px] border border-white/8 bg-white/[0.04] p-1 lg:flex">
              <Globe2 className="ml-2 h-4 w-4 text-emerald-300" />
              {languages.map((item) => (
                <button
                  key={item.code}
                  title={`${t("nav.language")}: ${item.label}`}
                  onClick={() => setLanguage(item.code)}
                  className={`rounded-[12px] px-2.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
                    language === item.code ? "bg-emerald-400 text-slate-950" : "text-white/45 hover:text-white"
                  }`}
                >
                  {item.shortLabel}
                </button>
              ))}
            </div>

            {user ? (
              <div className="relative flex items-center gap-2.5">
                <div className="hidden items-center gap-2">
                  {utilityMenuItems.map((item) => {
                    const Icon = item.icon;
                    const active = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={`group flex items-center gap-2 rounded-[14px] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
                          item.tone === "emerald"
                            ? active
                              ? "bg-emerald-500/14 text-white"
                              : "text-emerald-100/85 hover:bg-emerald-500/8 hover:text-white"
                            : active
                              ? "bg-sky-500/14 text-white"
                              : "text-sky-100/80 hover:bg-sky-500/8 hover:text-white"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${item.tone === "emerald" ? "text-emerald-300" : "text-sky-200"}`} />
                        {t(item.labelKey)}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <button
                    onClick={() => void handleOpenNotifications()}
                    className="relative inline-flex h-12 items-center gap-2 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 text-white/70 transition-all hover:border-emerald-500/30 hover:text-white"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] xl:inline">{t("nav.notifications")}</span>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-14 z-50 w-[340px] overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950/96 shadow-2xl shadow-black/40 backdrop-blur-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-white/8 px-4 py-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">{t("nav.notifications")}</p>
                            <p className="mt-1 text-sm text-white">{unreadCount} {t("nav.unread")}</p>
                          </div>
                          <button
                            onClick={() => void handleMarkAllNotificationsRead()}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70"
                          >
                            <CheckCheck className="h-3.5 w-3.5" /> {t("nav.markAllRead")}
                          </button>
                        </div>

                        <div className="max-h-[360px] overflow-y-auto p-3">
                          {notifications.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                              {t("nav.noNotifications")}
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <button
                                key={notification.id}
                                onClick={() => void handleNotificationClick(notification.id, notification.postId)}
                                className={`mb-2 w-full rounded-2xl border px-4 py-3 text-left transition ${
                                  notification.isRead
                                    ? "border-white/8 bg-white/5 text-white/55"
                                    : "border-emerald-400/20 bg-emerald-500/10 text-white"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-bold">{notification.title}</p>
                                    <p className="mt-1 text-xs leading-6">{notification.message}</p>
                                  </div>
                                  {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />}
                                </div>
                                <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                                  {new Date(notification.createdAt).toLocaleString(language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US")}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="hidden text-right">
                  <p className="text-sm font-bold text-white">{userLabel}</p>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-emerald-300">{t("nav.workspaceActive")}</p>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="h-11 w-11 rounded-[16px] border border-white/10 object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04] text-sm font-bold text-emerald-300">
                    {userInitial}
                  </div>
                )}
                <button onClick={onLogout} className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/8 bg-white/[0.04] text-white/55 transition-all hover:border-red-500/30 hover:text-red-300">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => void onLogin()}
                className="inline-flex h-12 items-center gap-2 rounded-[18px] bg-emerald-500 px-5 text-xs font-bold uppercase tracking-[0.24em] text-slate-950 transition-all hover:bg-emerald-400"
              >
                <Sparkles className="h-4 w-4" /> {t("nav.loginSignup")}
              </button>
            )}

            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-12 items-center gap-2 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 text-white"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] xl:inline">{t("nav.menu")}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-white/8"
            >
              <div className="grid gap-3 p-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-[24px] border border-white/8 bg-black/25 p-4 md:col-span-2 lg:hidden">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                      <Globe2 className="h-5 w-5 text-emerald-300" />
                    </div>
                    <p className="text-sm font-bold text-white">{t("nav.language")}</p>
                  </div>
                  <div className="flex gap-1 rounded-2xl bg-white/5 p-1">
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        onClick={() => setLanguage(item.code)}
                        className={`rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          language === item.code ? "bg-emerald-400 text-slate-950" : "text-white/55"
                        }`}
                      >
                        {item.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
                {!user && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      void onLogin();
                    }}
                    className="flex items-center justify-between rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4 text-left transition-all md:col-span-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/20">
                        <UserRound className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{t("nav.loginSignup")}</p>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{t("nav.oneGateway")}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-white/25">{t("nav.open")}</span>
                  </button>
                )}
                {user && (
                  <>
                    <button
                      onClick={() => setView("userPortal")}
                      className={`flex items-center justify-between rounded-[24px] border p-4 text-left transition-all ${
                        currentView === "userPortal"
                          ? "border-emerald-400/20 bg-emerald-500/10"
                          : "border-white/8 bg-black/25 hover:border-white/15 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                          <UserRound className={`h-5 w-5 ${currentView === "userPortal" ? "text-emerald-300" : "text-white/60"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{t("nav.user")}</p>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{t("nav.workspace")}</p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-white/25">{t("nav.open")}</span>
                    </button>
                    <button
                      onClick={() => setView("admin")}
                      className={`flex items-center justify-between rounded-[24px] border p-4 text-left transition-all ${
                        currentView === "admin"
                          ? "border-sky-400/20 bg-sky-500/10"
                          : "border-white/8 bg-black/25 hover:border-white/15 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                          <PanelTop className={`h-5 w-5 ${currentView === "admin" ? "text-sky-200" : "text-white/60"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{t("nav.admin")}</p>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{canAccessAdmin ? t("nav.dashboard") : t("nav.restricted")}</p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-white/25">{t("nav.open")}</span>
                    </button>
                  </>
                )}
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`flex items-center justify-between rounded-[24px] border p-4 text-left transition-all ${
                        active
                          ? "border-emerald-400/20 bg-emerald-500/10"
                          : "border-white/8 bg-black/25 hover:border-white/15 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5">
                          <Icon className={`h-5 w-5 ${active ? "text-emerald-300" : "text-white/60"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{t(item.labelKey)}</p>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{item.tag || t("nav.module")}</p>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-white/25">{t("nav.open")}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
