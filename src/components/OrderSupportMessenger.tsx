import React, { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, MessageSquare, Send, X } from "lucide-react";
import { LocalizedDictionary, useI18n } from "../i18n";
import {
  createOrderSupportMessage,
  ORDER_SUPPORT_OPEN_EVENT,
  OrderSupportMessage,
  subscribeToOrderSupportMessages,
} from "../services/orderSupportService";
import { isAdminUser } from "../services/roleService";
import { getShopBootstrap } from "../services/shopService";
import { AppUser, ShopOrder, View } from "../types";

interface OrderSupportMessengerProps {
  user: AppUser | null;
  setView: (view: View) => void;
}

type SupportThread = {
  orderId: string;
  order: ShopOrder | null;
  messages: OrderSupportMessage[];
  latest: OrderSupportMessage | null;
  updatedAt: string;
};

const messengerText: LocalizedDictionary = {
  inbox: { vi: "Hộp tin nhắn đơn hàng", en: "Order message inbox", ja: "注文メッセージ受信箱" },
  messenger: { vi: "Messenger", en: "Messenger", ja: "メッセンジャー" },
  noThreads: { vi: "Chưa có cuộc trò chuyện nào về đơn hàng.", en: "No order conversations yet.", ja: "注文に関する会話はまだありません。" },
  noMessages: { vi: "Chưa có tin nhắn trong cuộc trò chuyện này. Nhập nội dung bên dưới để bắt đầu.", en: "No messages in this conversation yet. Type below to start.", ja: "この会話にはまだメッセージがありません。下に入力して開始してください。" },
  replyPlaceholderAdmin: { vi: "Nhập phản hồi cho khách về đơn hàng...", en: "Write a reply to the customer about this order...", ja: "この注文について顧客へ返信..." },
  replyPlaceholderUser: { vi: "Nhập nội dung cần hỗ trợ về đơn hàng...", en: "Type what you need help with for this order...", ja: "この注文について相談内容を入力..." },
  send: { vi: "Gửi", en: "Send", ja: "送信" },
  you: { vi: "Bạn", en: "You", ja: "あなた" },
  admin: { vi: "Admin", en: "Admin", ja: "管理者" },
  customer: { vi: "Khách", en: "Customer", ja: "顧客" },
  openOrder: { vi: "Mở đơn", en: "Open order", ja: "注文を開く" },
  newMessageAdmin: { vi: "Khách vừa nhắn về đơn hàng", en: "A customer messaged about an order", ja: "顧客が注文についてメッセージしました" },
  newMessageUser: { vi: "Admin vừa phản hồi đơn hàng", en: "Admin replied to your order", ja: "管理者が注文に返信しました" },
  close: { vi: "Đóng", en: "Close", ja: "閉じる" },
};

const OrderSupportMessenger = ({ user, setView }: OrderSupportMessengerProps) => {
  const { language } = useI18n();
  const tt = (key: string) => messengerText[key]?.[language] ?? messengerText[key]?.vi ?? key;
  const locale = language === "vi" ? "vi-VN" : language === "ja" ? "ja-JP" : "en-US";
  const isAdmin = isAdminUser(user);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [messages, setMessages] = useState<OrderSupportMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<OrderSupportMessage | null>(null);
  const knownMessageIdsRef = useRef<string[]>([]);
  const hasPrimedMessagesRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    const loadOrders = async () => {
      const data = await getShopBootstrap();
      const nextOrders = isAdmin
        ? data.orders
        : data.orders.filter(
            (order) => order.userId === user.uid || (!!user.email && order.customerEmail.toLowerCase() === user.email.toLowerCase())
          );
      setOrders(nextOrders);
    };

    void loadOrders();
  }, [isAdmin, user]);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    return subscribeToOrderSupportMessages((nextMessages) => {
      setMessages(nextMessages);
      if (hasPrimedMessagesRef.current) {
        const incoming = nextMessages
          .filter((message) => !knownMessageIdsRef.current.includes(message.id))
          .filter((message) => (isAdmin ? message.sender === "user" : message.sender === "admin"))
          .filter((message) => {
            if (isAdmin) return true;
            return message.userId === user.uid || (!!user.email && message.customerEmail?.toLowerCase() === user.email.toLowerCase());
          })
          .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];

        if (incoming) {
          setNotification(incoming);
          setActiveOrderId(incoming.orderId);
        }
      }
      knownMessageIdsRef.current = nextMessages.map((message) => message.id);
      hasPrimedMessagesRef.current = true;
    });
  }, [isAdmin, user]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{ orderId?: string | null }>;
      setIsOpen(true);
      if (customEvent.detail?.orderId) {
        setActiveOrderId(customEvent.detail.orderId);
      }
    };

    window.addEventListener(ORDER_SUPPORT_OPEN_EVENT, handleOpen as EventListener);
    return () => {
      window.removeEventListener(ORDER_SUPPORT_OPEN_EVENT, handleOpen as EventListener);
    };
  }, []);

  const threads = useMemo(() => {
    if (!user) return [];

    const relevantMessages = messages.filter((message) => {
      if (isAdmin) return true;
      return message.userId === user.uid || (!!user.email && message.customerEmail?.toLowerCase() === user.email.toLowerCase());
    });

    const grouped = new Map<string, SupportThread>();
    relevantMessages.forEach((message) => {
      const current = grouped.get(message.orderId);
      const order = orders.find((entry) => entry.id === message.orderId) ?? null;
      const nextMessages = current ? [...current.messages, message] : [message];
      const latest = [...nextMessages].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];
      grouped.set(message.orderId, {
        orderId: message.orderId,
        order,
        messages: nextMessages,
        latest,
        updatedAt: latest.createdAt,
      });
    });

    if (activeOrderId && !grouped.has(activeOrderId)) {
      const order = orders.find((entry) => entry.id === activeOrderId) ?? null;
      if (order) {
        grouped.set(activeOrderId, {
          orderId: activeOrderId,
          order,
          messages: [],
          latest: null,
          updatedAt: order.createdAt,
        });
      }
    }

    return [...grouped.values()].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  }, [activeOrderId, isAdmin, messages, orders, user]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.orderId === activeOrderId) ?? threads[0] ?? null,
    [activeOrderId, threads]
  );

  const badgeCount = threads.filter((thread) => thread.latest?.sender === (isAdmin ? "user" : "admin")).length;

  const handleSend = (thread: SupportThread) => {
    if (!user) return;
    const body = drafts[thread.orderId] || "";
    const message = createOrderSupportMessage({
      orderId: thread.orderId,
      orderCode: thread.order?.code || thread.latest?.orderCode || thread.orderId,
      userId: isAdmin ? thread.order?.userId ?? thread.latest?.userId ?? null : user.uid,
      customerName: thread.order?.customerName || thread.latest?.customerName || user.displayName || user.email || tt("customer"),
      customerEmail: thread.order?.customerEmail ?? thread.latest?.customerEmail ?? user.email ?? null,
      sender: isAdmin ? "admin" : "user",
      body,
    });
    if (message) {
      setDrafts((current) => ({ ...current, [thread.orderId]: "" }));
    }
  };

  const handleOpenOrder = (thread: SupportThread) => {
    setNotification(null);
    setIsOpen(false);
    setView(isAdmin ? "admin" : "userPortal");
    window.dispatchEvent(
      new CustomEvent("terraform-flora.order-support.focus-order", {
        detail: {
          orderId: thread.orderId,
          orderCode: thread.order?.code || thread.latest?.orderCode || thread.orderId,
        },
      })
    );
  };

  if (!user) return null;

  return (
    <>
      <div className="fixed right-5 top-28 z-[235] flex flex-col items-end gap-3">
        <button
          onClick={() => {
            setIsOpen((current) => !current);
            if (!activeOrderId && threads[0]) {
              setActiveOrderId(threads[0].orderId);
            }
          }}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-500 text-slate-950 shadow-[0_18px_50px_rgba(16,185,129,0.32)] transition hover:-translate-y-0.5 hover:bg-emerald-400"
          title={tt("inbox")}
        >
          <MessageSquare className="h-7 w-7" />
          {badgeCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-zinc-950 bg-rose-500 px-1 text-[10px] font-black text-white">
              {badgeCount}
            </span>
          ) : null}
        </button>
        {isOpen ? (
          <div className="grid h-[560px] w-[min(calc(100vw-2rem),820px)] overflow-hidden rounded-[30px] border border-white/10 bg-zinc-950/96 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl md:grid-cols-[300px_minmax(0,1fr)]">
            <div className="border-b border-white/8 bg-white/[0.03] p-4 md:border-b-0 md:border-r">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300/70">{tt("inbox")}</p>
                  <h3 className="mt-1 text-xl font-black text-white">{tt("messenger")}</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/65 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {threads.length > 0 ? (
                  threads.map((thread) => {
                    const active = activeThread?.orderId === thread.orderId;
                    const orderCode = thread.order?.code || thread.latest?.orderCode || thread.orderId;
                    const customerName = thread.order?.customerName || thread.latest?.customerName || tt("customer");
                    return (
                      <button
                        key={thread.orderId}
                        onClick={() => setActiveOrderId(thread.orderId)}
                        className={`w-full rounded-[22px] border p-3 text-left transition ${
                          active ? "border-emerald-300/30 bg-emerald-500/14" : "border-white/8 bg-white/[0.035] hover:border-white/16 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${thread.latest?.sender === "user" ? "bg-rose-500 text-white" : "bg-emerald-400 text-slate-950"}`}>
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-white">{orderCode}</p>
                            <p className="truncate text-xs text-white/45">{customerName}</p>
                          </div>
                          {thread.latest?.sender === (isAdmin ? "user" : "admin") ? <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> : null}
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">{thread.latest?.body || tt("noMessages")}</p>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-white/45">
                    {tt("noThreads")}
                  </div>
                )}
              </div>
            </div>
            <div className="flex min-h-0 flex-col">
              {activeThread ? (
                <>
                  <div className="border-b border-white/8 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-black text-white">{activeThread.order?.code || activeThread.latest?.orderCode || activeThread.orderId}</p>
                        <p className="mt-1 truncate text-sm text-white/45">{activeThread.order?.customerName || activeThread.latest?.customerName || tt("customer")}</p>
                      </div>
                      <button
                        onClick={() => handleOpenOrder(activeThread)}
                        className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200"
                      >
                        {tt("openOrder")}
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                    {activeThread.messages
                      .slice()
                      .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
                      .map((message) => {
                        const isOwn = message.sender === (isAdmin ? "admin" : "user");
                        return (
                          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[82%] rounded-[22px] px-4 py-3 ${isOwn ? "bg-emerald-400 text-slate-950" : "bg-white/8 text-white/82"}`}>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-65">
                                {isOwn ? (isAdmin ? tt("admin") : tt("you")) : isAdmin ? tt("customer") : tt("admin")}
                              </p>
                              <p className="mt-1 text-sm leading-6">{message.body}</p>
                              <p className="mt-2 text-[10px] opacity-55">{new Date(message.createdAt).toLocaleString(locale)}</p>
                            </div>
                          </div>
                        );
                      })}
                    {activeThread.messages.length === 0 ? (
                      <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-white/45">
                        {tt("noMessages")}
                      </div>
                    ) : null}
                  </div>
                  <div className="border-t border-white/8 p-4">
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
                      <textarea
                        value={drafts[activeThread.orderId] || ""}
                        onChange={(event) => setDrafts((current) => ({ ...current, [activeThread.orderId]: event.target.value }))}
                        placeholder={isAdmin ? tt("replyPlaceholderAdmin") : tt("replyPlaceholderUser")}
                        rows={2}
                        className="min-h-14 resize-none rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400"
                      />
                      <button
                        onClick={() => handleSend(activeThread)}
                        disabled={!(drafts[activeThread.orderId] || "").trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-emerald-400 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                        {tt("send")}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-sm leading-6 text-white/45">
                  {tt("noThreads")}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {notification ? (
        <div className="fixed bottom-6 right-6 z-[240] w-full max-w-md rounded-[28px] border border-sky-400/20 bg-zinc-900/96 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white">{isAdmin ? tt("newMessageAdmin") : tt("newMessageUser")}</p>
              <p className="mt-2 text-sm text-white/65">{notification.orderCode} • {notification.customerName}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">{notification.body}</p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => {
                    setIsOpen(true);
                    setActiveOrderId(notification.orderId);
                    setNotification(null);
                  }}
                  className="rounded-2xl bg-sky-400 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-950"
                >
                  {tt("openOrder")}
                </button>
                <button
                  onClick={() => setNotification(null)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70"
                >
                  {tt("close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default OrderSupportMessenger;
