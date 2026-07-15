import React, { useState, useEffect } from "react";
import { db, doc, serverTimestamp, setDoc } from "./lib/localDb";
import { Diagnosis, View } from "./types";

// Components
import AuthModal from "./components/AuthModal";
import Navbar from "./components/Navbar";
import OrderSupportMessenger from "./components/OrderSupportMessenger";

// Views
import HomeView from "./views/HomeView";
import DiagnosisView from "./views/DiagnosisView";
import PesticidesView from "./views/PesticidesView";
import RecommendationsView from "./views/RecommendationsView";
import GrowthView from "./views/GrowthView";
import ForumView from "./views/ForumView";
import ChatView from "./views/ChatView";
import LibraryView from "./views/LibraryView";
import ShopView from "./views/ShopView";
import UserPortalView from "./views/UserPortalView";
import AdminView from "./views/AdminView";
import { AuthMode, AuthPayload, getCurrentAppUser, getUserProfile, onAppAuthStateChange, signInWithSupabasePassword, signOutFromSupabase, signUpWithSupabasePassword, upsertUserProfile } from "./services/authService";
import { getEffectiveUserRole, isAdminUser } from "./services/roleService";
import { AppUser } from "./types";
import { useI18n } from "./i18n";

const App = () => {
  const { t } = useI18n();
  const [currentView, setCurrentView] = useState<View>('home');
  const [protocolDiagnosis, setProtocolDiagnosis] = useState<Diagnosis | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const canAccessAdmin = isAdminUser(user);
  const isLightView = currentView === "library";

  useEffect(() => {
    const viewParam = new URLSearchParams(window.location.search).get("view") as View | null;
    if (viewParam) {
      setCurrentView(viewParam);
    }

    void getCurrentAppUser().then((initialUser) => {
      setUser(initialUser);
      setIsAuthReady(true);
    });

    const unsubscribe = onAppAuthStateChange((nextUser) => {
      setUser(nextUser);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);

  const navigateToView = (view: View) => {
    if (view === "recommendations") {
      setProtocolDiagnosis(null);
    }
    setCurrentView(view);
  };

  const openTreatmentProtocol = (diagnosis: Diagnosis) => {
    setProtocolDiagnosis(diagnosis);
    setCurrentView("recommendations");
  };

  const handleAuthSubmit = async (payload: AuthPayload) => {
    try {
      const submitMode: AuthMode = payload.mode;
      const result =
        submitMode === "signup"
          ? await signUpWithSupabasePassword(payload)
          : await signInWithSupabasePassword(payload);
      const signedInUser = result.user;
      const appUser: AppUser | null = signedInUser
        ? {
            uid: signedInUser.id,
            email: signedInUser.email ?? null,
            displayName:
              (signedInUser.user_metadata?.full_name as string | undefined) ||
              (signedInUser.user_metadata?.name as string | undefined) ||
              null,
            photoURL: (signedInUser.user_metadata?.avatar_url as string | undefined) || null,
            role: "user",
            isActive: true,
          }
        : null;

      if (signedInUser) {
        const profile =
          submitMode === "signup"
            ? await upsertUserProfile({
                id: signedInUser.id,
                email: signedInUser.email || null,
                fullName:
                  (signedInUser.user_metadata?.full_name as string | undefined) ||
                  (signedInUser.user_metadata?.name as string | undefined) ||
                  payload.fullName,
              })
            : (await getUserProfile(signedInUser.id)) ||
              (await upsertUserProfile({
                id: signedInUser.id,
                email: signedInUser.email || null,
                fullName:
                  (signedInUser.user_metadata?.full_name as string | undefined) ||
                  (signedInUser.user_metadata?.name as string | undefined) ||
                  null,
              }));

        const effectiveRole = profile?.role ?? "user";
        const effectiveUser: AppUser = {
          uid: signedInUser.id,
          email: profile?.email ?? signedInUser.email ?? null,
          displayName:
            profile?.full_name ||
            (signedInUser.user_metadata?.full_name as string | undefined) ||
            (signedInUser.user_metadata?.name as string | undefined) ||
            null,
          photoURL: (signedInUser.user_metadata?.avatar_url as string | undefined) || null,
          role: effectiveRole,
          isActive: profile?.is_active ?? true,
        };

        try {
          await setDoc(
            doc(db, "userProfiles", signedInUser.id),
            {
              uid: signedInUser.id,
              email: effectiveUser.email,
              displayName: effectiveUser.displayName || t("app.newUser"),
              photoURL: effectiveUser.photoURL,
              role: effectiveRole,
              authProvider: "supabase",
              lastLoginAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (firestoreError) {
          console.warn("Skipped Firebase userProfiles sync after Supabase auth:", firestoreError);
        }

        setUser(effectiveUser);
        setIsAuthModalOpen(false);
        setCurrentView(effectiveRole === "admin" ? "admin" : "userPortal");
        return;
      }

      const effectiveRole = getEffectiveUserRole(appUser);
      setUser(appUser);
      setIsAuthModalOpen(false);
      setCurrentView(effectiveRole === "admin" ? "admin" : "userPortal");
    } catch (error) {
      console.error("Auth failed:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await signOutFromSupabase();
      setCurrentView("home");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView setView={navigateToView} />;
      case 'diagnosis': return <DiagnosisView user={user} setView={navigateToView} onOpenProtocol={openTreatmentProtocol} />;
      case 'pesticides': return <PesticidesView user={user} setView={navigateToView} />;
      case 'recommendations': return <RecommendationsView user={user} diagnosis={protocolDiagnosis} setView={navigateToView} onClearDiagnosis={() => setProtocolDiagnosis(null)} />;
      case 'growth': return <GrowthView user={user} onLogin={openAuthModal} />;
      case 'forum': return <ForumView user={user} onLogin={openAuthModal} />;
      case 'chat': return <ChatView user={user} />;
      case 'library': return <LibraryView />;
      case 'shop': return <ShopView user={user} />;
      case 'userPortal': return <UserPortalView user={user} onLogin={openAuthModal} setView={navigateToView} />;
      case 'admin': return <AdminView user={user} onLogin={openAuthModal} />;
      default: return <HomeView setView={navigateToView} />;
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen selection:bg-emerald-500/30 selection:text-emerald-700 ${isLightView ? "bg-[#f8fbf6] text-slate-900" : "bg-black text-white"}`}>
      <Navbar 
        currentView={currentView} 
        setView={navigateToView} 
        user={user} 
        onLogin={openAuthModal} 
        onLogout={handleLogout} 
        canAccessAdmin={canAccessAdmin}
      />
      
      <main>
        {renderView()}
      </main>

      <OrderSupportMessenger user={user} setView={navigateToView} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSubmit={handleAuthSubmit}
      />

      <footer className={`py-24 border-t ${isLightView ? "border-emerald-950/10 bg-white text-slate-900" : "border-white/5 bg-zinc-950"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-600/20">
                  <span className="text-white font-black text-2xl">T</span>
                </div>
                <span className={`text-2xl font-black tracking-tighter uppercase ${isLightView ? "text-slate-950" : "text-white"}`}>Terraform Flora</span>
              </div>
              <p className={`max-w-sm leading-relaxed mb-8 ${isLightView ? "text-slate-600" : "text-white/40"}`}>{t("footer.description")}</p>
              <div className="flex gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all cursor-pointer ${isLightView ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"}`} />
                ))}
              </div>
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-8 ${isLightView ? "text-slate-950" : "text-white"}`}>{t("footer.products")}</h4>
              <ul className="space-y-4">
                {["nav.diagnosis", "footer.pesticideManagement", "footer.growthCycle", "footer.knowledgeLibrary"].map(item => (
                  <li key={item} className={`text-sm hover:text-emerald-500 transition-colors cursor-pointer ${isLightView ? "text-slate-500" : "text-white/40"}`}>{t(item)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-[0.2em] mb-8 ${isLightView ? "text-slate-950" : "text-white"}`}>{t("footer.support")}</h4>
              <ul className="space-y-4">
                {["footer.helpCenter", "nav.forum", "footer.contact", "footer.terms"].map(item => (
                  <li key={item} className={`text-sm hover:text-emerald-500 transition-colors cursor-pointer ${isLightView ? "text-slate-500" : "text-white/40"}`}>{t(item)}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className={`mt-24 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-8 ${isLightView ? "border-slate-200" : "border-white/5"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isLightView ? "text-slate-400" : "text-white/20"}`}>{t("footer.rights")}</p>
            <div className="flex gap-8">
              <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${isLightView ? "text-slate-400 hover:text-slate-900" : "text-white/20 hover:text-white"}`}>{t("footer.privacy")}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${isLightView ? "text-slate-400 hover:text-slate-900" : "text-white/20 hover:text-white"}`}>{t("footer.termsService")}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
