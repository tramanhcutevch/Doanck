import React from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronRight,
  Library,
  MessageSquare,
  Microscope,
  PanelTop,
  Shield,
  Sparkles,
  Sprout,
  Stethoscope,
  Store,
  UserRound,
  Users,
  Waves,
} from "lucide-react";
import { motion } from "motion/react";
import { View } from "../types";
import { useI18n } from "../i18n";

interface HomeViewProps {
  setView: (v: View) => void;
}

const featureConfigs = [
  { icon: Microscope, titleKey: "nav.diagnosis", descKey: "home.feature.diagnosis.desc", view: "diagnosis" },
  { icon: MessageSquare, titleKey: "nav.chat", descKey: "home.feature.chat.desc", view: "chat" },
  { icon: Sprout, titleKey: "nav.growth", descKey: "home.feature.growth.desc", view: "growth" },
  { icon: Stethoscope, titleKey: "nav.recommendations", descKey: "home.feature.recommendations.desc", view: "recommendations" },
  { icon: Shield, titleKey: "nav.pesticides", descKey: "home.feature.pesticides.desc", view: "pesticides" },
  { icon: Users, titleKey: "nav.forum", descKey: "home.feature.forum.desc", view: "forum" },
  { icon: Library, titleKey: "nav.library", descKey: "home.feature.library.desc", view: "library" },
  { icon: Store, titleKey: "nav.shop", descKey: "home.feature.shop.desc", view: "shop" },
  { icon: UserRound, titleKey: "nav.user", descKey: "home.feature.user.desc", view: "userPortal" },
  { icon: PanelTop, titleKey: "nav.admin", descKey: "home.feature.admin.desc", view: "admin" },
];

const aiFlowConfigs = [
  { titleKey: "home.flow.collect.title", descKey: "home.flow.collect.desc" },
  { titleKey: "home.flow.analyze.title", descKey: "home.flow.analyze.desc" },
  { titleKey: "home.flow.decide.title", descKey: "home.flow.decide.desc" },
];

const HomeView = ({ setView }: HomeViewProps) => {
  const { t } = useI18n();
  const features = featureConfigs.map((feature) => ({
    ...feature,
    title: t(feature.titleKey),
    desc: t(feature.descKey),
  }));
  const aiFlow = aiFlowConfigs.map((step) => ({ title: t(step.titleKey), desc: t(step.descKey) }));

  return (
    <div className="pt-28">
      <section className="relative overflow-hidden px-4 pb-12 md:px-6">
        <div className="relative mx-auto w-full max-w-[1760px] overflow-hidden rounded-[40px] border border-white/10">
          <div className="relative h-[78vh] min-h-[560px] w-full min-[1800px]:h-[76vh]">
            <img
              src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1800&q=80"
              alt={t("home.heroAlt")}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/55" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

            <div className="absolute left-0 right-0 top-0 p-6 md:p-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/20 bg-black/35 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-200 backdrop-blur-xl">
                <BrainCircuit className="h-3.5 w-3.5" /> {t("home.heroEyebrow")}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="max-w-3xl"
                >
                  <h1 className="font-[var(--font-headline)] text-5xl font-bold leading-[0.92] tracking-tight text-white md:text-7xl">
                    {t("home.heroTitleA")}
                    <span className="text-gradient-ai">{t("home.heroTitleB")}</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/72 md:text-lg">
                    {t("home.heroCopy")}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-4">
                    <button
                      onClick={() => setView("diagnosis")}
                      className="inline-flex items-center gap-3 rounded-2xl bg-emerald-400 px-7 py-4 text-sm font-bold uppercase tracking-[0.22em] text-slate-950 transition-all hover:bg-emerald-300"
                    >
                      {t("home.launchVision")} <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setView("chat")}
                      className="inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-black/25 px-7 py-4 text-sm font-bold uppercase tracking-[0.22em] text-white backdrop-blur-xl transition-all hover:bg-white/10"
                    >
                      {t("home.openAdvisor")} <Sparkles className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setView("userPortal")}
                      className="inline-flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-7 py-4 text-sm font-bold uppercase tracking-[0.22em] text-emerald-100 backdrop-blur-xl transition-all hover:bg-emerald-400/16"
                    >
                      {t("home.openUserPortal")} <UserRound className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setView("admin")}
                      className="inline-flex items-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-7 py-4 text-sm font-bold uppercase tracking-[0.22em] text-sky-100 backdrop-blur-xl transition-all hover:bg-sky-400/16"
                    >
                      {t("home.openAdmin")} <PanelTop className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>

                <div className="glass-panel rounded-[32px] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">{t("home.liveSignal")}</p>
                      <h3 className="mt-2 text-2xl font-bold text-white">{t("home.analysisRunning")}</h3>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/12">
                      <Bot className="h-5 w-5 text-emerald-300" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/30">{t("home.accuracyBand")}</p>
                      <p className="mt-2 text-2xl font-bold text-white">98.2%</p>
                      <p className="mt-2 text-sm text-white/45">{t("home.accuracyCopy")}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/30">{t("home.responseLoop")}</p>
                      <p className="mt-2 text-2xl font-bold text-white">&lt; 8s</p>
                      <p className="mt-2 text-sm text-white/45">{t("home.responseCopy")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6">
        <div className="mx-auto grid w-full max-w-[1760px] gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="section-shell p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">{t("home.aiWorkflow")}</p>
            <h2 className="mt-4 font-[var(--font-headline)] text-3xl font-bold tracking-tight text-white md:text-4xl">
              {t("home.workflowTitle")}
            </h2>
            <p className="mt-4 max-w-xl text-white/55">
              {t("home.workflowCopy")}
            </p>

            <div className="mt-8 space-y-4">
              {aiFlow.map((step, index) => (
                <div key={step.title} className="rounded-[28px] border border-white/8 bg-black/25 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">{t("home.step")} {index + 1}</p>
                  <h3 className="mt-3 text-xl font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: t("home.stat.diagnoses"), value: "2.4M", note: "AI vision" },
                { label: t("home.stat.seasons"), value: "18K+", note: "growth ops" },
                { label: t("home.stat.teams"), value: "500+", note: "agri teams" },
              ].map((item) => (
                <div key={item.label} className="glass-panel rounded-[28px] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">{item.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-white">{item.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-emerald-200/75">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-shell p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">{t("home.modules")}</p>
                <h2 className="mt-4 font-[var(--font-headline)] text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {t("home.modulesTitle")}
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-white/45">
                {t("home.modulesCopy")}
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <motion.button
                  key={feature.title}
                  onClick={() => setView(feature.view as View)}
                  whileHover={{ y: -4 }}
                  className="group rounded-[28px] border border-white/8 bg-black/25 p-5 text-left transition-all hover:border-emerald-300/25 hover:bg-emerald-400/6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                      <feature.icon className="h-5 w-5 text-emerald-300" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20 transition-all group-hover:translate-x-1 group-hover:text-emerald-300" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">{feature.desc}</p>
                </motion.button>
              ))}
            </div>

            <div className="mt-8 glass-panel rounded-[32px] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/12">
                  <Waves className="h-5 w-5 text-sky-200" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">{t("home.decisionStream")}</p>
                  <p className="text-lg font-bold text-white">{t("home.dailyFlow")}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  t("home.signal.early"),
                  t("home.signal.moisture"),
                  t("home.signal.log"),
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/70">
                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: t("nav.user"),
                  desc: t("home.userPortal.desc"),
                  view: "userPortal" as View,
                  icon: UserRound,
                  tone: "emerald",
                },
                {
                  title: "Admin Dashboard",
                  desc: t("home.admin.desc"),
                  view: "admin" as View,
                  icon: PanelTop,
                  tone: "sky",
                },
              ].map((item) => {
                const Icon = item.icon;
                const toneClasses =
                  item.tone === "emerald"
                    ? "hover:border-emerald-300/25 hover:bg-emerald-400/6 text-emerald-300"
                    : "hover:border-sky-300/25 hover:bg-sky-400/6 text-sky-200";

                return (
                  <motion.button
                    key={item.title}
                    onClick={() => setView(item.view)}
                    whileHover={{ y: -4 }}
                    className={`group rounded-[28px] border border-white/8 bg-black/25 p-5 text-left transition-all ${toneClasses}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20 transition-all group-hover:translate-x-1 group-hover:text-white" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{item.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6">
        <div className="mx-auto w-full max-w-[1760px]">
          <div className="section-shell overflow-hidden p-8 md:p-10">
            <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">{t("home.why")}</p>
                <h2 className="mt-4 font-[var(--font-headline)] text-3xl font-bold tracking-tight text-white md:text-4xl">
                  {t("home.whyTitle")}
                </h2>
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {[
                    { title: t("home.polish.visual.title"), text: t("home.polish.visual.text") },
                    { title: t("home.polish.info.title"), text: t("home.polish.info.text") },
                    { title: t("home.polish.ai.title"), text: t("home.polish.ai.text") },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[28px] border border-white/8 bg-black/25 p-5">
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/50">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { value: "15K+", label: t("home.metric.users") },
                  { value: "82%", label: t("home.metric.aiTasks") },
                  { value: "24/7", label: t("home.metric.advisor") },
                  { value: t("home.metric.platformValue"), label: t("home.metric.platform") },
                ].map((item) => (
                  <div key={item.label} className="glass-panel rounded-[28px] p-6">
                    <p className="text-4xl font-black tracking-tight text-white">{item.value}</p>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200/80">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
