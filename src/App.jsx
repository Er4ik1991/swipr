import React, { useState, useRef, useEffect } from "react";
import {
  Heart, X, MapPin, GraduationCap, BadgeCheck, Building2,
  Sparkles, Coffee, Wrench, Briefcase, RotateCcw, User, Star,
  ChevronLeft, ArrowRight, Mail, Lock, Phone, Eye, EyeOff, CheckCircle2,
  Layers, MessageCircle, Send, Paperclip, MoreVertical,
  Video, Building, PhoneCall, Calendar, Link, ExternalLink,
} from "lucide-react";

const C = {
  paper: "#FBFAF7",
  ink: "#16141C",
  muted: "#6F6A7A",
  line: "#ECE8E1",
  apply: "#13B17C",
  applyDark: "#0E8E63",
  skip: "#8A8F99",
  brand: "#6C5CE7",
  shell: "#101018",
  err: "#E53E3E",
};

// ─── mock data ───────────────────────────────────────────────────────────────
const COMPANIES = [
  {
    company: "Лак&Шик", logo: "ЛШ", logoBg: "#E879A8",
    role: "Мастер маникюра", city: "Москва · Хамовники",
    salary: "80 000 – 120 000 ₽", icon: Sparkles,
    photoLabel: "Рабочее место мастера", photo: ["#F7C5DE", "#E879A8"],
    blurb: "Уютный салон, своё кресло и витрина гель-лаков. График 2/2, чай и печеньки за счёт салона.",
    tags: ["Своё кресло", "График 2/2", "Премии за отзывы"],
  },
  {
    company: "Кофейня «Пар»", logo: "ПР", logoBg: "#C08457",
    role: "Бариста", city: "Санкт-Петербург · Центр",
    salary: "60 000 – 90 000 ₽", icon: Coffee,
    photoLabel: "Барная стойка", photo: ["#E7CBA9", "#9B6B43"],
    blurb: "Specialty-кофейня у канала. Обучим латте-арту, кофе для бариста — бесплатно и без лимита.",
    tags: ["Чаевые", "Гибкий график", "Обучение"],
  },
  {
    company: "IT-студия «Контур»", logo: "К", logoBg: "#5B8DEF",
    role: "Офис-менеджер", city: "Москва · Сити",
    salary: "70 000 – 95 000 ₽", icon: Building2,
    photoLabel: "Наш офис", photo: ["#BFD4F2", "#5B8DEF"],
    blurb: "Светлый open-space на 23 этаже, кухня с панорамой, ДМС с первого дня.",
    tags: ["ДМС", "5/2", "Удалёнка по пятницам"],
  },
  {
    company: "Автосервис «Гараж 24»", logo: "Г24", logoBg: "#3FB28B",
    role: "Автомеханик", city: "Казань",
    salary: "90 000 – 140 000 ₽", icon: Wrench,
    photoLabel: "Рабочий бокс", photo: ["#BCE3D4", "#2E8C6A"],
    blurb: "4 поста, современный инструмент и подъёмники. Сдельная оплата + оклад.",
    tags: ["Сдельно+оклад", "Новый инструмент", "Парковка"],
  },
];

const CANDIDATES = [
  {
    name: "Анна К.", role: "Мастер маникюра", city: "Москва",
    icon: Sparkles, photo: ["#F7C5DE", "#D45C95"], exp: "5 лет опыта",
    blurb: "Аппаратный и комбинированный маникюр, дизайн. Своя база клиентов.",
    creds: ["Сертификат: аппаратный маникюр", "Курс «Дизайн ногтей 2.0»", "Диплом колледжа"],
  },
  {
    name: "Игорь П.", role: "Офис-менеджер", city: "Москва",
    icon: Building2, photo: ["#BFD4F2", "#3F6FCB"], exp: "3 года опыта",
    blurb: "Документооборот, закупки, travel-поддержка руководителя. Английский B2.",
    creds: ["1С: Документооборот", "Курс делопроизводства", "Английский B2"],
  },
  {
    name: "Марина С.", role: "Бариста", city: "Санкт-Петербург",
    icon: Coffee, photo: ["#E7CBA9", "#8A5A33"], exp: "4 года опыта",
    blurb: "Specialty-кофе, латте-арт, работа на потоке. Открывала точку с нуля.",
    creds: ["SCA Barista Skills (Foundation)", "Курс по альтернативе", "Санкнижка"],
  },
];

// ─── helpers ─────────────────────────────────────────────────────────────────
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = (v) => /^\+?[\d\s\-()]{7,15}$/.test(v);

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // screen: 'pick' | 'register' | 'app'
  const [screen, setScreen] = useState("pick");
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  const handleRolePick = (r) => { setRole(r); setScreen("register"); };
  const handleRegistered = (u) => { setUser(u); setScreen("app"); };
  const handleBack = () => setScreen("pick");
  const handleLogout = () => { setUser(null); setRole(null); setScreen("pick"); };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(120% 120% at 50% 0%, #1c1b29 0%, #0c0c12 60%)",
      padding: "24px 12px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      <div style={{
        width: 392, maxWidth: "100%", height: 760, background: C.paper,
        borderRadius: 40, overflow: "hidden", position: "relative",
        boxShadow: "0 30px 80px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.04)",
        border: "10px solid #0a0a10", display: "flex", flexDirection: "column",
      }}>
        {screen === "pick" && <div style={{ flex: 1, overflow: "hidden" }}><RolePick onPick={handleRolePick} /></div>}
        {screen === "register" && <div style={{ flex: 1, overflowY: "auto" }}><RegisterScreen role={role} onBack={handleBack} onDone={handleRegistered} /></div>}
        {screen === "app" && <MainApp role={role} user={user} onLogout={handleLogout} />}
      </div>
    </div>
  );
}

// ─── RolePick ────────────────────────────────────────────────────────────────
function RolePick({ onPick }) {
  const roles = [
    {
      key: "seeker", title: "Ищу работу", Icon: User,
      desc: "Листайте компании, смотрите фото рабочих мест и откликайтесь свайпом.",
      grad: ["#7C6FF0", "#6C5CE7"],
    },
    {
      key: "hr", title: "Ищу сотрудника", Icon: Building2,
      desc: "Листайте кандидатов с их дипломами и сертификатами и приглашайте свайпом.",
      grad: ["#16C58C", "#0E9E6E"],
    },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "44px 24px 30px" }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13, background: C.brand,
          display: "grid", placeItems: "center", color: "#fff",
        }}>
          <Briefcase size={24} />
        </div>
        <span style={{ fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: -0.6 }}>
          Свайп<span style={{ color: C.brand }}>Джоб</span>
        </span>
      </div>

      <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
        Добро пожаловать
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 14.5, color: C.muted, lineHeight: 1.5 }}>
        Выберите, как вы будете пользоваться приложением
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {roles.map(({ key, title, desc, Icon, grad }) => (
          <button key={key} onClick={() => onPick(key)} style={{
            textAlign: "left", border: `1.5px solid ${C.line}`, background: "#fff",
            borderRadius: 20, padding: "18px 20px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 16,
            transition: "transform .12s, box-shadow .12s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 10px 28px rgba(20,16,30,.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: `linear-gradient(145deg, ${grad[0]}, ${grad[1]})`,
              display: "grid", placeItems: "center", color: "#fff",
            }}>
              <Icon size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{title}</div>
              <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.45, marginTop: 3 }}>{desc}</div>
            </div>
            <ArrowRight size={20} color={C.muted} style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      <p style={{ marginTop: "auto", paddingTop: 24, fontSize: 11.5, color: "#B0ACBA", textAlign: "center" }}>
        Регистрируясь, вы принимаете условия использования сервиса
      </p>
    </div>
  );
}

// ─── RegisterScreen ───────────────────────────────────────────────────────────
function RegisterScreen({ role, onBack, onDone }) {
  const isSeeker = role === "seeker";

  // tab: 'email' | 'phone'
  const [tab, setTab] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const e = {};
    if (tab === "email") {
      if (!email) e.login = "Введите e-mail";
      else if (!validEmail(email)) e.login = "Некорректный e-mail";
    } else {
      if (!phone) e.login = "Введите номер телефона";
      else if (!validPhone(phone)) e.login = "Некорректный номер";
    }
    if (!password) e.password = "Введите пароль";
    else if (password.length < 6) e.password = "Минимум 6 символов";
    if (!confirm) e.confirm = "Подтвердите пароль";
    else if (confirm !== password) e.confirm = "Пароли не совпадают";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(() => onDone({ login: tab === "email" ? email : phone, role }), 1200);
    }, 900);
  };

  const roleLabel = isSeeker ? "соискателя" : "нанимателя";
  const roleBg = isSeeker ? C.brand : C.apply;

  if (done) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `${roleBg}18`, display: "grid", placeItems: "center", marginBottom: 20,
        }}>
          <CheckCircle2 size={40} color={roleBg} />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: C.ink }}>Готово!</h2>
        <p style={{ margin: 0, fontSize: 14, color: C.muted, textAlign: "center" }}>Аккаунт создан, входим…</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "36px 24px 30px", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 11, border: `1.5px solid ${C.line}`,
          background: "#fff", cursor: "pointer", display: "grid", placeItems: "center", color: C.muted,
        }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{
          flex: 1, height: 36, borderRadius: 11,
          background: `${roleBg}14`,
          display: "flex", alignItems: "center", paddingLeft: 12, gap: 8,
        }}>
          {isSeeker ? <User size={15} color={roleBg} /> : <Building2 size={15} color={roleBg} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: roleBg }}>
            Регистрация {roleLabel}
          </span>
        </div>
      </div>

      <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
        Создайте аккаунт
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: 13.5, color: C.muted }}>
        Войдите через почту или номер телефона
      </p>

      {/* Login-method tabs */}
      <div style={{
        display: "flex", gap: 0, background: C.line, borderRadius: 12, padding: 3, marginBottom: 20,
      }}>
        {[
          { key: "email", label: "E-mail", Icon: Mail },
          { key: "phone", label: "Телефон", Icon: Phone },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => { setTab(key); setErrors({}); }} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13.5,
            background: tab === key ? "#fff" : "transparent",
            color: tab === key ? C.ink : C.muted,
            boxShadow: tab === key ? "0 2px 8px rgba(0,0,0,.08)" : "none",
            transition: "all .18s",
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Login field */}
        <Field
          label={tab === "email" ? "E-mail" : "Номер телефона"}
          error={errors.login}
          input={
            <input
              type={tab === "email" ? "email" : "tel"}
              placeholder={tab === "email" ? "example@mail.ru" : "+7 900 000-00-00"}
              value={tab === "email" ? email : phone}
              onChange={(e) => tab === "email" ? setEmail(e.target.value) : setPhone(e.target.value)}
              style={inputStyle(!!errors.login)}
            />
          }
        />

        {/* Password */}
        <Field
          label="Пароль"
          error={errors.password}
          input={
            <div style={{ position: "relative" }}>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle(!!errors.password), paddingRight: 44 }}
              />
              <button onClick={() => setShowPwd((v) => !v)} style={eyeBtn}>
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          }
        />

        {/* Confirm */}
        <Field
          label="Подтвердите пароль"
          error={errors.confirm}
          input={
            <div style={{ position: "relative" }}>
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Повторите пароль"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{ ...inputStyle(!!errors.confirm), paddingRight: 44 }}
              />
              <button onClick={() => setShowConfirm((v) => !v)} style={eyeBtn}>
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          }
        />

        {/* Password strength */}
        {password.length > 0 && <PasswordStrength pwd={password} />}
      </div>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={loading}
        style={{
          marginTop: 26, width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
          background: loading ? "#C4BFF0" : roleBg, color: "#fff", cursor: loading ? "default" : "pointer",
          fontSize: 15.5, fontWeight: 800, letterSpacing: 0.1,
          transition: "background .2s, transform .1s",
        }}
        onMouseDown={(e) => !loading && (e.currentTarget.style.transform = "scale(.98)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
      </button>

      <p style={{ marginTop: 16, fontSize: 11.5, color: "#B0ACBA", textAlign: "center", lineHeight: 1.6 }}>
        Нажимая кнопку, вы соглашаетесь с{" "}
        <span style={{ color: roleBg, fontWeight: 600 }}>условиями использования</span>
        {" "}и{" "}
        <span style={{ color: roleBg, fontWeight: 600 }}>политикой конфиденциальности</span>
      </p>
    </div>
  );
}

// ─── small UI helpers ─────────────────────────────────────────────────────────
function Field({ label, error, input }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
        {label}
      </label>
      {input}
      {error && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.err, fontWeight: 600 }}>{error}</p>}
    </div>
  );
}

function PasswordStrength({ pwd }) {
  const score = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)]
    .filter(Boolean).length;
  const labels = ["Слабый", "Средний", "Хороший", "Отличный"];
  const colors = ["#E53E3E", "#ED8936", "#ECC94B", "#13B17C"];
  return (
    <div>
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: i < score ? colors[score - 1] : C.line,
            transition: "background .3s",
          }} />
        ))}
      </div>
      <p style={{ margin: "4px 0 0", fontSize: 11.5, color: colors[score - 1] || C.muted, fontWeight: 600 }}>
        {score > 0 ? labels[score - 1] : ""}
      </p>
    </div>
  );
}

const inputStyle = (hasErr) => ({
  width: "100%", boxSizing: "border-box",
  padding: "12px 14px", borderRadius: 12, fontSize: 14.5,
  border: `1.5px solid ${hasErr ? C.err : C.line}`,
  background: hasErr ? "#FFF5F5" : "#fff",
  color: C.ink, outline: "none",
  fontFamily: "inherit",
});

const eyeBtn = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer", color: C.muted,
  display: "grid", placeItems: "center", padding: 0,
};

// ─── Tab bar height constant ──────────────────────────────────────────────────
const TAB_H = 64;

// ─── helpers ─────────────────────────────────────────────────────────────────
let _negId = 1;
const makeId = () => String(_negId++);

const now = () => new Date().toISOString();

function createNegotiation(role, item) {
  return {
    id: makeId(),
    initiator: role === "seeker" ? "seeker" : "employer",
    // для прототипа используем имя/компанию как id
    seekerId:   role === "seeker" ? "me"      : item.name,
    employerId: role === "seeker" ? item.company : "me",
    vacancyId:  role === "seeker" ? item.role    : item.role,
    // данные для отображения в чатах
    displayName: role === "seeker" ? item.company : item.name,
    displayRole: role === "seeker" ? item.role    : item.role,
    avatarBg:   role === "seeker" ? item.logoBg  : item.photo[1],
    avatarLabel:role === "seeker" ? item.logo     : item.name?.[0] ?? "?",
    state: "matched",
    unread: 0,
    lastMessageAt: now(),
    hidden: false,
    messages: [],
  };
}

// ─── MainApp ──────────────────────────────────────────────────────────────────
function MainApp({ role, user, onLogout }) {
  const mode = role;
  const [tab, setTab] = useState("feed");
  const [negotiations, setNegotiations] = useState([]);
  const [matchModal, setMatchModal] = useState(null); // negotiation | null
  const [activeChat, setActiveChat] = useState(null); // negotiation id | null

  const navCount = negotiations.reduce((s, n) => s + (n.hidden ? 0 : n.unread), 0);

  const handleLike = (item) => {
    const neg = createNegotiation(mode, item);
    setNegotiations((prev) => [neg, ...prev]);
    setMatchModal(neg);
  };

  const closeMatch = () => setMatchModal(null);

  const openChat = (neg) => {
    setNegotiations((prev) =>
      prev.map((n) => n.id === neg.id ? { ...n, unread: 0 } : n)
    );
    setMatchModal(null);
    setActiveChat(neg.id);
    setTab("chats");
  };

  const updateNeg = (id, patch) =>
    setNegotiations((prev) => prev.map((n) => n.id === id ? { ...n, ...patch } : n));

  const sendMessage = (negId, text) => {
    setNegotiations((prev) => prev.map((n) => {
      if (n.id !== negId) return n;
      const isFirst = n.state === "matched";
      const msgs = [...n.messages];
      if (isFirst) {
        msgs.push({ id: makeId(), authorId: "system", text: "", createdAt: now(), systemState: "talking" });
      }
      msgs.push({ id: makeId(), authorId: "me", text, createdAt: now(), systemState: null });
      return { ...n, state: isFirst ? "talking" : n.state, messages: msgs, lastMessageAt: now(), unread: 0 };
    }));
  };

  const sendInterview = (negId, interview) => {
    setNegotiations((prev) => prev.map((n) => {
      if (n.id !== negId) return n;
      const msgs = [
        ...n.messages,
        { id: makeId(), authorId: "system", text: "", createdAt: now(), systemState: "interview_invited" },
        { id: makeId(), authorId: "me",     text: "", createdAt: now(), systemState: null, interview: { ...interview, status: "proposed" } },
      ];
      return { ...n, state: "interview_invited", messages: msgs, lastMessageAt: now(), unread: 0 };
    }));
  };

  const respondInterview = (negId, msgId, response) => {
    const nextState = response === "accepted" ? "interview_set" : response === "declined" ? "rejected" : "talking";
    setNegotiations((prev) => prev.map((n) => {
      if (n.id !== negId) return n;
      const msgs = n.messages.map((m) =>
        m.id === msgId ? { ...m, interview: { ...m.interview, status: response } } : m
      );
      msgs.push({ id: makeId(), authorId: "system", text: "", createdAt: now(), systemState: nextState });
      return { ...n, state: nextState, messages: msgs, lastMessageAt: now(), unread: 0 };
    }));
  };

  const sendOffer = (negId) => {
    setNegotiations((prev) => prev.map((n) => {
      if (n.id !== negId) return n;
      const msgs = [
        ...n.messages,
        { id: makeId(), authorId: "system", text: "", createdAt: now(), systemState: "offer" },
      ];
      return { ...n, state: "offer", messages: msgs, lastMessageAt: now(), unread: 0 };
    }));
  };

  const activeChatNeg = negotiations.find((n) => n.id === activeChat) ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", position: "relative" }}>
      {/* Контент активной вкладки */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {tab === "feed" && (
          <FeedTab mode={mode} user={user} onLogout={onLogout} onLike={handleLike} />
        )}
        {tab === "chats" && !activeChatNeg && (
          <ChatsPlaceholder negotiations={negotiations} onOpenChat={openChat} />
        )}
        {tab === "chats" && activeChatNeg && (
          <ChatScreen
            neg={activeChatNeg}
            role={mode}
            onBack={() => setActiveChat(null)}
            onSend={(text) => sendMessage(activeChatNeg.id, text)}
            onInterview={(inv) => sendInterview(activeChatNeg.id, inv)}
            onInterviewResponse={(msgId, resp) => respondInterview(activeChatNeg.id, msgId, resp)}
            onOffer={() => sendOffer(activeChatNeg.id)}
            onAction={(action) => {
              if (action === "hide")   updateNeg(activeChatNeg.id, { hidden: true, state: "hidden" });
              if (action === "reject") updateNeg(activeChatNeg.id, { state: "rejected" });
              setActiveChat(null);
            }}
          />
        )}
        {tab === "profile" && <ProfilePlaceholder user={user} role={role} />}
      </div>

      {/* Нижний таббар */}
      <TabBar active={tab} onTab={setTab} navCount={navCount} />

      {/* Модалка мэтча */}
      {matchModal && (
        <MatchModal neg={matchModal} role={mode} onClose={closeMatch} onChat={openChat} />
      )}
    </div>
  );
}

// ─── Модалка мэтча ────────────────────────────────────────────────────────────
function MatchModal({ neg, role, onClose, onChat }) {
  const isSeeker = role === "seeker";
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      background: "rgba(10,8,20,.92)", backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 28, textAlign: "center",
    }}>
      {/* аватар */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%", marginBottom: 20,
        background: neg.avatarBg,
        display: "grid", placeItems: "center",
        fontSize: 22, fontWeight: 800, color: "#fff",
        boxShadow: `0 0 0 4px rgba(255,255,255,.15), 0 0 0 8px rgba(255,255,255,.06)`,
      }}>
        {neg.avatarLabel}
      </div>

      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: 2,
        color: C.apply, textTransform: "uppercase", marginBottom: 10,
      }}>
        Это мэтч!
      </div>
      <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#fff" }}>
        {neg.displayName}
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,.6)" }}>
        {neg.displayRole}
      </p>

      <button onClick={() => onChat(neg)} style={{
        width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
        background: C.apply, color: "#fff", fontSize: 15, fontWeight: 800,
        cursor: "pointer", marginBottom: 12,
      }}>
        Написать сообщение
      </button>
      <button onClick={onClose} style={{
        width: "100%", padding: "13px 0", borderRadius: 14,
        border: "1.5px solid rgba(255,255,255,.2)", background: "transparent",
        color: "rgba(255,255,255,.7)", fontSize: 14, fontWeight: 600, cursor: "pointer",
      }}>
        Продолжить листать
      </button>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: "feed",    label: "Лента",   Icon: Layers },
  { key: "chats",   label: "Чаты",    Icon: MessageCircle },
  { key: "profile", label: "Профиль", Icon: User },
];

function TabBar({ active, onTab, navCount }) {
  return (
    <div style={{
      height: TAB_H, flexShrink: 0,
      display: "flex", alignItems: "stretch",
      borderTop: `1px solid ${C.line}`, background: "#fff",
    }}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        const showBadge = key === "chats" && navCount > 0;
        return (
          <button key={key} onClick={() => onTab(key)} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer",
            color: isActive ? C.brand : C.muted,
            transition: "color .15s",
            position: "relative",
          }}>
            {/* active indicator */}
            {isActive && (
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 28, height: 3, borderRadius: "0 0 3px 3px", background: C.brand,
              }} />
            )}
            <div style={{ position: "relative" }}>
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              {showBadge && (
                <div style={{
                  position: "absolute", top: -5, right: -7,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: C.err, color: "#fff",
                  fontSize: 10, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 3px", border: "2px solid #fff",
                }}>
                  {navCount > 9 ? "9+" : navCount}
                </div>
              )}
            </div>
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Feed tab (свайп-лента) ───────────────────────────────────────────────────
function FeedTab({ mode, user, onLogout, onLike }) {
  const [si, setSi] = useState(0);
  const [hi, setHi] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exit, setExit] = useState(null);
  const [toast, setToast] = useState(null);
  const startRef = useRef(null);

  const deck = mode === "seeker" ? COMPANIES : CANDIDATES;
  const idx = mode === "seeker" ? si : hi;
  const setIdx = mode === "seeker" ? setSi : setHi;
  const current = deck[idx];
  const next = deck[idx + 1];

  const flashToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1600); };

  const commit = (dir) => {
    if (exit) return;
    setExit(dir);
    if (dir === "like" && current) onLike(current);
    setTimeout(() => { setIdx((v) => v + 1); setDrag({ x: 0, y: 0, active: false }); setExit(null); }, 280);
  };

  const onDown = (e) => {
    if (exit) return;
    const p = e.touches ? e.touches[0] : e;
    startRef.current = { x: p.clientX, y: p.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };
  const onMove = (e) => {
    if (!drag.active || !startRef.current) return;
    const p = e.touches ? e.touches[0] : e;
    setDrag({ x: p.clientX - startRef.current.x, y: p.clientY - startRef.current.y, active: true });
  };
  const onUp = () => {
    if (!drag.active) return;
    if (drag.x > 110) return commit("like");
    if (drag.x < -110) return commit("skip");
    setDrag({ x: 0, y: 0, active: false });
  };

  const reset = () => { setIdx(0); setDrag({ x: 0, y: 0, active: false }); setExit(null); };

  let tx = drag.x, ty = drag.y, rot = drag.x / 18;
  let trans = drag.active ? "none" : "transform .28s cubic-bezier(.2,.7,.3,1)";
  if (exit === "like") { tx = 640; rot = 22; }
  if (exit === "skip") { tx = -640; rot = -22; }

  const likeOpacity = Math.min(Math.max(drag.x / 110, 0), 1);
  const skipOpacity = Math.min(Math.max(-drag.x / 110, 0), 1);

  // кнопки исчезают при перетаскивании
  const dragDist = Math.sqrt(drag.x ** 2 + drag.y ** 2);
  const btnOpacity = drag.active ? Math.max(0, 1 - dragDist / 60) : 1;

  const isSeeker = mode === "seeker";
  const roleColor = isSeeker ? C.brand : C.apply;

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>

      {/* Шапка поверх карточки */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        padding: "14px 16px 10px",
        background: "linear-gradient(to bottom, rgba(251,250,247,.96) 70%, transparent)",
        pointerEvents: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, pointerEvents: "auto" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: C.brand,
            display: "grid", placeItems: "center", color: "#fff",
          }}>
            <Briefcase size={15} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: C.ink, letterSpacing: -0.3 }}>
            Свайп<span style={{ color: C.brand }}>Джоб</span>
          </span>
          <span style={{
            marginLeft: "auto", fontSize: 11, fontWeight: 700, color: roleColor,
            background: `${roleColor}18`, padding: "4px 10px", borderRadius: 20,
          }}>
            {isSeeker ? "Соискатель" : "Наниматель"}
          </span>
          <button onClick={onLogout} style={{
            fontSize: 11, fontWeight: 700, color: C.muted, background: "rgba(255,255,255,.8)",
            border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 9px", cursor: "pointer",
          }}>Выйти</button>
        </div>
      </div>

      {/* Колода карточек — на весь экран */}
      <div style={{ position: "absolute", inset: 0 }}>
        {!current ? (
          <EmptyState onReset={reset} mode={mode} />
        ) : (
          <>
            {next && (
              <div style={{ position: "absolute", inset: 0 }}>
                <CardBody item={next} mode={mode} dim fullscreen />
              </div>
            )}
            <div
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
              onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
              style={{
                position: "absolute", inset: 0,
                cursor: drag.active ? "grabbing" : "grab",
                transform: `translate(${tx}px,${ty}px) rotate(${rot}deg)`,
                transition: trans, touchAction: "none", zIndex: 2,
              }}
            >
              <Stamp text="ОТКЛИК" color={C.apply} opacity={likeOpacity} side="left" />
              <Stamp text="ПРОПУСК" color={C.skip} opacity={skipOpacity} side="right" />
              <CardBody item={current} mode={mode} fullscreen />
            </div>
          </>
        )}
      </div>

      {/* Кнопки действий поверх карточки */}
      {current && (
        <div style={{
          position: "absolute", bottom: 24, left: 0, right: 0, zIndex: 10,
          display: "flex", justifyContent: "center", alignItems: "center", gap: 22,
          opacity: btnOpacity, transition: drag.active ? "none" : "opacity .2s",
          pointerEvents: btnOpacity < 0.1 ? "none" : "auto",
        }}>
          <ActionBtn onClick={() => commit("skip")} bg="rgba(255,255,255,.92)" ring={C.line} color={C.skip} size={60}>
            <X size={26} strokeWidth={2.5} />
          </ActionBtn>
          <ActionBtn onClick={() => commit("like")} bg={C.apply} ring={C.apply} color="#fff" size={70}>
            <Heart size={28} fill="#fff" strokeWidth={0} />
          </ActionBtn>
          <ActionBtn onClick={reset} bg="rgba(255,255,255,.92)" ring={C.line} color={C.brand} size={60}>
            <RotateCcw size={20} strokeWidth={2.5} />
          </ActionBtn>
        </div>
      )}

      {toast && (
        <div style={{
          position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)",
          background: C.ink, color: "#fff", padding: "10px 18px", borderRadius: 12,
          fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,.3)", zIndex: 20,
        }}>{toast}</div>
      )}
    </div>
  );
}

// ─── State machine labels / colors ───────────────────────────────────────────
const STATE_LABEL = {
  matched:           null,
  talking:           "Общаемся",
  interview_invited: "Приглашение на собеседование",
  interview_set:     "Собеседование назначено",
  offer:             "Оффер",
  rejected:          "Отказ",
  hidden:            null,
};

const STATE_COLOR = {
  talking:           C.brand,
  interview_invited: "#ED8936",
  interview_set:     C.apply,
  offer:             "#9B59B6",
  rejected:          C.muted,
};

// ─── Chat screen ─────────────────────────────────────────────────────────────
const QUICK_REPLIES = ["Расскажите подробнее", "Когда удобно созвониться?", "Спасибо за ответ!"];

const SYSTEM_TEXT = {
  talking:           "Вы начали общение",
  interview_invited: "Приглашение на собеседование отправлено",
  interview_set:     "Собеседование подтверждено",
  offer:             "Оффер отправлен",
  rejected:          "Отказ",
  hidden:            "Тред скрыт",
};

function ChatScreen({ neg, role, onBack, onSend, onInterview, onInterviewResponse, onOffer, onAction }) {
  const [text, setText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachToast, setAttachToast] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [neg.messages.length]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const handleAttach = () => {
    setAttachToast(true);
    setTimeout(() => setAttachToast(false), 1800);
  };

  const handleMenu = (action) => {
    setMenuOpen(false);
    onAction(action);
  };

  const chipColor = STATE_COLOR[neg.state] || C.muted;
  const chipLabel = STATE_LABEL[neg.state];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.paper, position: "relative" }}>

      {/* Шапка */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${C.line}`, background: "#fff", flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${C.line}`,
          background: "none", cursor: "pointer", display: "grid", placeItems: "center",
          color: C.muted, flexShrink: 0,
        }}>
          <ChevronLeft size={18} />
        </button>

        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: neg.avatarBg, display: "grid", placeItems: "center",
          fontSize: 13, fontWeight: 800, color: "#fff",
        }}>
          {neg.avatarLabel}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14.5, fontWeight: 800, color: C.ink,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {neg.displayName}
          </div>
          {chipLabel ? (
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: chipColor,
              background: `${chipColor}14`, padding: "2px 8px", borderRadius: 20,
              display: "inline-block", marginTop: 2,
            }}>
              {chipLabel}
            </span>
          ) : (
            <div style={{ fontSize: 12, color: C.muted }}>{neg.displayRole}</div>
          )}
        </div>

        {/* Кнопка меню ⋮ */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen((v) => !v)} style={{
            width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${C.line}`,
            background: "none", cursor: "pointer", display: "grid", placeItems: "center",
            color: C.muted,
          }}>
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <>
              {/* backdrop */}
              <div onClick={() => setMenuOpen(false)} style={{
                position: "fixed", inset: 0, zIndex: 50,
              }} />
              <div style={{
                position: "absolute", top: 40, right: 0, zIndex: 51,
                background: "#fff", borderRadius: 14, padding: "6px 0",
                boxShadow: "0 8px 28px rgba(0,0,0,.14)", border: `1px solid ${C.line}`,
                minWidth: 210,
              }}>
                {role === "hr" && ["talking", "interview_set"].includes(neg.state) && (
                  <button onClick={() => { setMenuOpen(false); setShowInviteForm(true); }} style={{
                    width: "100%", display: "block", padding: "11px 18px",
                    background: "none", border: "none", cursor: "pointer",
                    textAlign: "left", fontSize: 14, fontWeight: 600, color: C.brand,
                    borderBottom: neg.state === "interview_set" ? "none" : `1px solid ${C.line}`,
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3EF"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    Пригласить на собеседование
                  </button>
                )}
                {role === "hr" && neg.state === "interview_set" && (
                  <button onClick={() => { setMenuOpen(false); onOffer(); }} style={{
                    width: "100%", display: "block", padding: "11px 18px",
                    background: "none", border: "none", cursor: "pointer",
                    textAlign: "left", fontSize: 14, fontWeight: 600, color: "#9B59B6",
                    borderBottom: `1px solid ${C.line}`,
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3EF"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    Сделать оффер
                  </button>
                )}
                {[
                  { key: "hide",   label: "Скрыть тред",  color: C.ink },
                  { key: "reject", label: "Отклонить",     color: C.err },
                  { key: "report", label: "Пожаловаться",  color: C.muted },
                ].map(({ key, label, color }) => (
                  <button key={key} onClick={() => key === "report" ? setMenuOpen(false) : handleMenu(key)} style={{
                    width: "100%", display: "block", padding: "11px 18px",
                    background: "none", border: "none", cursor: "pointer",
                    textAlign: "left", fontSize: 14, fontWeight: 600, color,
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3EF"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    {label}{key === "report" ? " (заглушка)" : ""}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Лента сообщений */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 16px 8px",
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {neg.messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: neg.avatarBg,
              display: "grid", placeItems: "center", margin: "0 auto 12px",
              fontSize: 17, fontWeight: 800, color: "#fff",
            }}>
              {neg.avatarLabel}
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.ink }}>{neg.displayName}</p>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: C.muted }}>{neg.displayRole}</p>
            <p style={{ margin: "14px 0 0", fontSize: 12.5, color: C.muted }}>
              Напишите первым — это ваш новый мэтч!
            </p>
          </div>
        )}

        {neg.messages.map((msg) => {
          if (msg.authorId === "system") {
            const isOffer = msg.systemState === "offer";
            return (
              <div key={msg.id} style={{ textAlign: "center", margin: "10px 0" }}>
                <span style={{
                  fontSize: isOffer ? 13 : 11.5,
                  fontWeight: isOffer ? 800 : 600,
                  color:      isOffer ? "#9B59B6" : C.muted,
                  background: isOffer ? "#9B59B614" : C.line,
                  border:     isOffer ? "1.5px solid #9B59B630" : "none",
                  padding: isOffer ? "6px 16px" : "4px 14px",
                  borderRadius: 20,
                  display: "inline-block",
                }}>
                  {isOffer ? "🎉 " : ""}{SYSTEM_TEXT[msg.systemState] ?? msg.text}
                </span>
              </div>
            );
          }

          // карточка-приглашение на собеседование
          if (msg.interview) {
            return (
              <InterviewCard
                key={msg.id}
                msg={msg}
                role={role}
                onRespond={(resp) => onInterviewResponse(msg.id, resp)}
              />
            );
          }

          // вложение-заглушка
          if (msg.attachment) {
            const isMe = msg.authorId === "me";
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", borderRadius: 14,
                  background: isMe ? C.brand : "#fff",
                  border: isMe ? "none" : `1.5px solid ${C.line}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                }}>
                  <Paperclip size={15} color={isMe ? "rgba(255,255,255,.8)" : C.muted} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: isMe ? "#fff" : C.ink }}>
                    {msg.text}
                  </span>
                </div>
              </div>
            );
          }

          const isMe = msg.authorId === "me";
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "72%", padding: "9px 13px",
                borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: isMe ? C.brand : "#fff",
                border: isMe ? "none" : `1.5px solid ${C.line}`,
                boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              }}>
                <p style={{ margin: 0, fontSize: 14, color: isMe ? "#fff" : C.ink, lineHeight: 1.45 }}>
                  {msg.text}
                </p>
                <p style={{
                  margin: "4px 0 0", fontSize: 10.5,
                  color: isMe ? "rgba(255,255,255,.55)" : C.muted, textAlign: "right",
                }}>
                  {new Date(msg.createdAt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Быстрые ответы — пока поле пустое */}
      {!text && (
        <div style={{ display: "flex", gap: 8, padding: "0 16px 10px", overflowX: "auto", flexShrink: 0 }}>
          {QUICK_REPLIES.map((r) => (
            <button key={r} onClick={() => setText(r)} style={{
              flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: C.brand,
              background: `${C.brand}10`, border: `1px solid ${C.brand}28`,
              padding: "6px 12px", borderRadius: 20, cursor: "pointer", whiteSpace: "nowrap",
            }}>
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Поле ввода */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 8,
        padding: "10px 16px 14px",
        borderTop: `1px solid ${C.line}`, background: "#fff", flexShrink: 0,
      }}>
        {/* кнопка вложения */}
        <button onClick={handleAttach} style={{
          width: 42, height: 42, borderRadius: 13, border: `1.5px solid ${C.line}`,
          background: "none", cursor: "pointer", display: "grid", placeItems: "center",
          color: C.muted, flexShrink: 0,
        }}>
          <Paperclip size={18} />
        </button>

        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Напишите сообщение…"
          style={{
            flex: 1, resize: "none", border: `1.5px solid ${C.line}`,
            borderRadius: 14, padding: "10px 14px", fontSize: 14,
            fontFamily: "inherit", color: C.ink, outline: "none",
            background: "#FAFAF8", lineHeight: 1.4, maxHeight: 96, overflowY: "auto",
          }}
        />

        <button onClick={submit} disabled={!text.trim()} style={{
          width: 42, height: 42, borderRadius: 13, border: "none",
          background: text.trim() ? C.brand : C.line,
          color: "#fff", cursor: text.trim() ? "pointer" : "default",
          display: "grid", placeItems: "center", flexShrink: 0,
          transition: "background .15s",
        }}>
          <Send size={18} />
        </button>
      </div>

      {/* Тост — вложение */}
      {attachToast && (
        <div style={{
          position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: C.ink, color: "#fff", padding: "9px 16px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", zIndex: 20,
          boxShadow: "0 6px 20px rgba(0,0,0,.25)",
        }}>
          Вложение прикреплено (заглушка)
        </div>
      )}

      {/* Форма приглашения на собеседование */}
      {showInviteForm && (
        <InterviewForm
          onClose={() => setShowInviteForm(false)}
          onSubmit={(inv) => { setShowInviteForm(false); onInterview(inv); }}
        />
      )}
    </div>
  );
}

// ─── Interview form ───────────────────────────────────────────────────────────
const FORMATS = [
  { key: "video",  label: "Видеозвонок", Icon: Video },
  { key: "office", label: "Офис",        Icon: Building },
  { key: "phone",  label: "Телефон",     Icon: PhoneCall },
];

function InterviewForm({ onClose, onSubmit }) {
  const [fmt, setFmt]   = useState("video");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [place, setPlace] = useState("");
  const [err, setErr]   = useState("");

  const submit = () => {
    if (!date || !time) { setErr("Укажите дату и время"); return; }
    if (fmt === "video"  && !link)  { setErr("Укажите ссылку на звонок"); return; }
    if (fmt === "office" && !place) { setErr("Укажите адрес офиса"); return; }
    onSubmit({ format: fmt, datetime: `${date}T${time}`, link, place });
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 60,
      background: "rgba(10,8,20,.55)", backdropFilter: "blur(4px)",
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
    }}>
      <div style={{
        background: "#fff", borderRadius: "24px 24px 0 0",
        padding: "24px 20px 32px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.ink }}>
            Приглашение на собеседование
          </h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "grid", placeItems: "center",
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Формат */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {FORMATS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setFmt(key)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 5, padding: "10px 6px", borderRadius: 12, cursor: "pointer",
              border: `2px solid ${fmt === key ? C.brand : C.line}`,
              background: fmt === key ? `${C.brand}0e` : "#fff",
              color: fmt === key ? C.brand : C.muted,
              transition: "all .15s",
            }}>
              <Icon size={18} />
              <span style={{ fontSize: 11.5, fontWeight: 700 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Дата и время */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.ink, display: "block", marginBottom: 5 }}>
              Дата
            </label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ ...inputStyle(false), padding: "10px 12px" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.ink, display: "block", marginBottom: 5 }}>
              Время
            </label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              style={{ ...inputStyle(false), padding: "10px 12px" }} />
          </div>
        </div>

        {/* Ссылка (видео) */}
        {fmt === "video" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.ink, display: "block", marginBottom: 5 }}>
              Ссылка на звонок
            </label>
            <input
              type="url" placeholder="https://meet.google.com/..."
              value={link} onChange={(e) => setLink(e.target.value)}
              style={{ ...inputStyle(false), padding: "10px 12px" }}
            />
            <button onClick={() => setLink(`https://meet.google.com/swipr-${Math.random().toString(36).slice(2,8)}`)}
              style={{
                marginTop: 6, fontSize: 12, fontWeight: 600, color: C.brand,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}>
              Сгенерировать ссылку-заглушку
            </button>
          </div>
        )}

        {/* Адрес (офис) */}
        {fmt === "office" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.ink, display: "block", marginBottom: 5 }}>
              Адрес офиса
            </label>
            <input
              type="text" placeholder="ул. Пушкина, д. 1, офис 305"
              value={place} onChange={(e) => setPlace(e.target.value)}
              style={{ ...inputStyle(false), padding: "10px 12px" }}
            />
          </div>
        )}

        {err && <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.err, fontWeight: 600 }}>{err}</p>}

        <button onClick={submit} style={{
          width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
          background: C.brand, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
        }}>
          Отправить приглашение
        </button>
      </div>
    </div>
  );
}

// ─── Interview card (в ленте сообщений) ──────────────────────────────────────
function InterviewCard({ msg, role, onRespond }) {
  const inv = msg.interview;
  const fmtObj = FORMATS.find((f) => f.key === inv.format) ?? FORMATS[0];
  const Icon = fmtObj.Icon;
  const isPending  = inv.status === "proposed";
  const isAccepted = inv.status === "accepted";
  const isDeclined = inv.status === "declined";

  const dt = inv.datetime ? new Date(inv.datetime) : null;
  const dtStr = dt
    ? dt.toLocaleString("ru", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : "";

  const statusColor = isAccepted ? C.apply : isDeclined ? C.err : "#ED8936";
  const statusLabel = isAccepted ? "Принято" : isDeclined ? "Отклонено" : "Ожидает ответа";

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
      <div style={{
        width: "88%", background: "#fff",
        border: `1.5px solid ${C.line}`, borderRadius: 16,
        overflow: "hidden", boxShadow: "0 3px 12px rgba(0,0,0,.07)",
      }}>
        {/* Шапка карточки */}
        <div style={{
          background: `linear-gradient(135deg, ${C.brand}18, ${C.brand}08)`,
          padding: "12px 14px 10px",
          borderBottom: `1px solid ${C.line}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: C.brand, display: "grid", placeItems: "center", color: "#fff",
          }}>
            <Icon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>
              Приглашение на собеседование
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.brand }}>
              {fmtObj.label}
            </div>
          </div>
          <span style={{
            marginLeft: "auto", fontSize: 10.5, fontWeight: 700,
            color: statusColor, background: `${statusColor}14`,
            padding: "3px 9px", borderRadius: 20,
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Тело карточки */}
        <div style={{ padding: "12px 14px" }}>
          {dtStr && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Calendar size={14} color={C.muted} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{dtStr}</span>
            </div>
          )}

          {inv.format === "video" && inv.link && (
            <a href={inv.link} target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 700, color: C.brand, textDecoration: "none",
              background: `${C.brand}0e`, border: `1px solid ${C.brand}28`,
              padding: "8px 12px", borderRadius: 10, marginBottom: 8,
            }}>
              <ExternalLink size={14} /> Присоединиться
            </a>
          )}

          {inv.format === "office" && inv.place && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <MapPin size={14} color={C.muted} />
              <span style={{ fontSize: 13, color: C.ink }}>{inv.place}</span>
            </div>
          )}

          {/* Кнопки — только соискателю и только если ожидает */}
          {role === "seeker" && isPending && (
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={() => onRespond("accepted")} style={{
                flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
                background: C.apply, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                Принять
              </button>
              <button onClick={() => onRespond("rescheduled")} style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                border: `1.5px solid ${C.line}`, background: "#fff",
                color: C.ink, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                Другое время
              </button>
              <button onClick={() => onRespond("declined")} style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                border: `1.5px solid ${C.err}30`, background: `${C.err}08`,
                color: C.err, fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                Отклонить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now - d) / 3600000;
  if (diffH < 24) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
}

// ─── Chats tab ────────────────────────────────────────────────────────────────
function ChatsPlaceholder({ negotiations = [], onOpenChat }) {
  const newMatches  = negotiations.filter((n) => n.state === "matched" && !n.hidden);
  const dialogList  = negotiations.filter((n) =>
    ["talking", "interview_invited", "interview_set", "offer"].includes(n.state) && !n.hidden
  ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
  const archivedList = negotiations.filter((n) =>
    n.state === "rejected" || n.hidden
  );

  const isEmpty = newMatches.length === 0 && dialogList.length === 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.paper }}>
      {/* Шапка */}
      <div style={{ padding: "18px 20px 10px", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
          Чаты
        </h2>
      </div>

      {isEmpty ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12, padding: 32,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: `${C.brand}14`,
            display: "grid", placeItems: "center",
          }}>
            <MessageCircle size={30} color={C.brand} />
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
            Здесь появятся ваши мэтчи и переписка.<br />Свайпните вправо, чтобы начать.
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* ── Ряд «Новые мэтчи» ── */}
          {newMatches.length > 0 && (
            <div style={{ padding: "4px 20px 16px" }}>
              <p style={{
                margin: "0 0 12px", fontSize: 11.5, fontWeight: 700,
                color: C.muted, textTransform: "uppercase", letterSpacing: 0.8,
              }}>
                Новые мэтчи
              </p>
              <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
                {newMatches.map((neg) => (
                  <button key={neg.id} onClick={() => onOpenChat(neg)} style={{
                    flexShrink: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 6, background: "none",
                    border: "none", cursor: "pointer", padding: 0,
                  }}>
                    {/* аватар с кольцом */}
                    <div style={{
                      width: 58, height: 58, borderRadius: "50%",
                      background: neg.avatarBg,
                      display: "grid", placeItems: "center",
                      fontSize: 17, fontWeight: 800, color: "#fff",
                      boxShadow: `0 0 0 2.5px #fff, 0 0 0 4.5px ${C.apply}`,
                    }}>
                      {neg.avatarLabel}
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: C.ink,
                      maxWidth: 60, textAlign: "center",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {neg.displayName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Разделитель ── */}
          {newMatches.length > 0 && dialogList.length > 0 && (
            <div style={{ height: 1, background: C.line, margin: "0 20px 4px" }} />
          )}

          {/* ── Список диалогов ── */}
          {dialogList.length > 0 && (
            <div style={{ padding: "8px 0" }}>
              {dialogList.map((neg) => {
                const lastMsg = neg.messages[neg.messages.length - 1];
                const chipColor = STATE_COLOR[neg.state] || C.muted;
                const chipLabel = STATE_LABEL[neg.state];
                return (
                  <button key={neg.id} onClick={() => onOpenChat(neg)} style={{
                    width: "100%", display: "flex", alignItems: "center",
                    gap: 14, padding: "12px 20px", background: "none",
                    border: "none", cursor: "pointer", textAlign: "left",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3EF"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    {/* аватар */}
                    <div style={{
                      width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
                      background: neg.avatarBg,
                      display: "grid", placeItems: "center",
                      fontSize: 15, fontWeight: 800, color: "#fff",
                    }}>
                      {neg.avatarLabel}
                    </div>

                    {/* текст */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: C.ink,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {neg.displayName}
                        </span>
                        <span style={{ fontSize: 11.5, color: C.muted, flexShrink: 0 }}>
                          {fmtTime(neg.lastMessageAt)}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        {chipLabel && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 700, color: chipColor,
                            background: `${chipColor}14`,
                            padding: "2px 7px", borderRadius: 20, flexShrink: 0,
                          }}>
                            {chipLabel}
                          </span>
                        )}
                        <span style={{
                          fontSize: 12.5, color: C.muted,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          flex: 1,
                        }}>
                          {lastMsg
                            ? (lastMsg.systemState ? `• ${STATE_LABEL[lastMsg.systemState] || lastMsg.text}` : lastMsg.text)
                            : neg.displayRole}
                        </span>
                      </div>
                    </div>

                    {/* бейдж непрочитанных */}
                    {neg.unread > 0 && (
                      <div style={{
                        minWidth: 20, height: 20, borderRadius: 10,
                        background: C.brand, color: "#fff",
                        fontSize: 11, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 5px", flexShrink: 0,
                      }}>
                        {neg.unread > 9 ? "9+" : neg.unread}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Архив (rejected/hidden) ── */}
          {archivedList.length > 0 && (
            <div style={{ padding: "8px 20px 16px" }}>
              <p style={{
                margin: "0 0 8px", fontSize: 11.5, fontWeight: 700,
                color: C.muted, textTransform: "uppercase", letterSpacing: 0.8,
              }}>
                Архив
              </p>
              {archivedList.map((neg) => (
                <div key={neg.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0", opacity: 0.5,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: neg.avatarBg, flexShrink: 0,
                    display: "grid", placeItems: "center",
                    fontSize: 13, fontWeight: 800, color: "#fff",
                  }}>
                    {neg.avatarLabel}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{neg.displayName}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>
                      {neg.hidden ? "Скрыт" : "Отказ"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Profile placeholder (Фаза 3) ────────────────────────────────────────────
function ProfilePlaceholder({ user, role }) {
  const isSeeker = role === "seeker";
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12, padding: 32,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%", background: `${C.brand}14`,
        display: "grid", placeItems: "center",
      }}>
        <User size={30} color={C.brand} />
      </div>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.ink }}>
        {user?.login}
      </h3>
      <span style={{
        fontSize: 12, fontWeight: 700, color: isSeeker ? C.brand : C.apply,
        background: isSeeker ? `${C.brand}14` : `${C.apply}14`,
        padding: "4px 12px", borderRadius: 20,
      }}>
        {isSeeker ? "Соискатель" : "Наниматель"}
      </span>
      <p style={{ margin: 0, fontSize: 13, color: C.muted, textAlign: "center" }}>
        Профиль появится в Фазе 3
      </p>
    </div>
  );
}

// ─── Reusable card components ─────────────────────────────────────────────────
function CardShell({ children }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "#fff", borderRadius: 26,
      overflow: "hidden", boxShadow: "0 14px 40px rgba(20,16,30,.16)",
      border: `1px solid ${C.line}`,
    }}>{children}</div>
  );
}

function CardBody({ item, mode, dim, fullscreen }) {
  const Icon = item.icon;

  if (fullscreen) {
    return (
      <div style={{
        position: "absolute", inset: 0, opacity: dim ? 0.45 : 1,
        background: `linear-gradient(150deg, ${item.photo[0]}, ${item.photo[1]})`,
        overflow: "hidden",
      }}>
        {/* фоновая иконка */}
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: .25 }}>
          {mode === "seeker"
            ? <Icon size={180} color="#fff" strokeWidth={0.8} />
            : <User size={180} color="#fff" strokeWidth={0.8} />}
        </div>

        {/* градиент снизу для текста */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to top, rgba(10,8,20,.88) 0%, rgba(10,8,20,.4) 60%, transparent 100%)",
        }} />

        {/* галерея-точки */}
        <div style={{ position: "absolute", top: 56, left: 14, right: 14, display: "flex", gap: 5 }}>
          {[0, 1, 2].map((d) => (
            <div key={d} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: d === 0 ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.3)",
            }} />
          ))}
        </div>

        {/* лого компании */}
        {mode === "seeker" && (
          <div style={{
            position: "absolute", right: 16, bottom: 148, width: 50, height: 50, borderRadius: 13,
            background: item.logoBg, color: "#fff", display: "grid", placeItems: "center",
            fontWeight: 800, fontSize: 15, border: "2.5px solid rgba(255,255,255,.5)",
            boxShadow: "0 4px 14px rgba(0,0,0,.35)",
          }}>{item.logo}</div>
        )}

        {/* текст внизу карточки */}
        <div style={{ position: "absolute", bottom: 100, left: 16, right: 16 }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.4, lineHeight: 1.2 }}>
            {mode === "seeker" ? item.role : item.name}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.75)" }}>
            {mode === "seeker" ? item.company : item.role}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: "rgba(255,255,255,.65)", fontSize: 13 }}>
            <MapPin size={13} /> {item.city}
            {mode === "seeker" && (
              <span style={{ marginLeft: 10, fontWeight: 800, color: "rgba(255,255,255,.9)", fontSize: 14 }}>
                {item.salary}
              </span>
            )}
            {mode !== "seeker" && (
              <span style={{ marginLeft: 8, color: "rgba(255,255,255,.65)" }}>{item.exp}</span>
            )}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,.75)" }}>
            {item.blurb}
          </p>
          {/* теги / документы */}
          {mode === "seeker" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {item.tags.map((t) => (
                <span key={t} style={{
                  fontSize: 11.5, fontWeight: 600, color: "#fff",
                  background: "rgba(255,255,255,.18)", backdropFilter: "blur(4px)",
                  padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,.2)",
                }}>{t}</span>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {item.creds.map((c) => (
                <span key={c} style={{
                  fontSize: 11.5, fontWeight: 600, color: "#fff",
                  background: "rgba(255,255,255,.18)", backdropFilter: "blur(4px)",
                  padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,.2)",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <BadgeCheck size={12} color={C.apply} /> {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // обычный режим (заглушка на next-карточку без fullscreen больше не используется,
  // но оставим на случай будущего использования)
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", opacity: dim ? 0.5 : 1 }}>
      <div style={{
        position: "relative", height: 230, flexShrink: 0,
        background: `linear-gradient(150deg, ${item.photo[0]}, ${item.photo[1]})`,
      }}>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: .85 }}>
          {mode === "seeker"
            ? <Icon size={64} color="rgba(255,255,255,.9)" strokeWidth={1.4} />
            : <User size={70} color="rgba(255,255,255,.9)" strokeWidth={1.4} />}
        </div>
        <span style={{
          position: "absolute", left: 12, bottom: 12, background: "rgba(0,0,0,.35)",
          color: "#fff", fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
          backdropFilter: "blur(4px)",
        }}>{mode === "seeker" ? item.photoLabel : item.exp}</span>
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", gap: 5 }}>
          {[0, 1, 2].map((d) => (
            <div key={d} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: d === 0 ? "#fff" : "rgba(255,255,255,.4)",
            }} />
          ))}
        </div>
        {mode === "seeker" && (
          <div style={{
            position: "absolute", right: 14, bottom: -22, width: 52, height: 52, borderRadius: 14,
            background: item.logoBg, color: "#fff", display: "grid", placeItems: "center",
            fontWeight: 800, fontSize: 16, border: "3px solid #fff",
            boxShadow: "0 6px 16px rgba(0,0,0,.18)",
          }}>{item.logo}</div>
        )}
      </div>
      <div style={{ padding: "16px 18px 14px", overflowY: "auto", flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
          {mode === "seeker" ? item.role : item.name}
        </h3>
        <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 600, color: C.brand }}>
          {mode === "seeker" ? item.company : item.role}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 5, margin: "10px 0 0", color: C.muted, fontSize: 13 }}>
          <MapPin size={14} /> {item.city}
        </div>
        {mode === "seeker" && (
          <div style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 800, color: C.ink }}>{item.salary}</div>
        )}
        <p style={{ margin: "12px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#4a4754" }}>{item.blurb}</p>
      </div>
    </div>
  );
}

function Stamp({ text, color, opacity, side }) {
  return (
    <div style={{
      position: "absolute", top: 26, [side]: 20, zIndex: 5,
      border: `4px solid ${color}`, color, borderRadius: 10,
      padding: "4px 12px", fontWeight: 900, fontSize: 22, letterSpacing: 1,
      transform: `rotate(${side === "left" ? -16 : 16}deg)`, opacity,
      pointerEvents: "none", background: "rgba(255,255,255,.6)",
    }}>{text}</div>
  );
}

function ActionBtn({ children, onClick, bg, ring, color, size }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      border: `1.5px solid ${ring}`, color, cursor: "pointer",
      display: "grid", placeItems: "center",
      boxShadow: "0 6px 18px rgba(20,16,30,.12)", transition: "transform .12s",
    }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.92)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >{children}</button>
  );
}

function EmptyState({ onReset, mode }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "#fff", borderRadius: 26,
      border: `1px dashed ${C.line}`, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18, background: "#F1EEE8",
        display: "grid", placeItems: "center", marginBottom: 16,
      }}>
        <Star size={30} color={C.brand} />
      </div>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>Пока всё пролистано</h3>
      <p style={{ margin: "8px 0 18px", fontSize: 13.5, color: C.muted, maxWidth: 230, lineHeight: 1.5 }}>
        {mode === "seeker"
          ? "Новые компании появляются каждый день. Загляните позже или начните заново."
          : "Новые кандидаты появляются каждый день. Загляните позже или начните заново."}
      </p>
      <button onClick={onReset} style={{
        background: C.brand, color: "#fff", border: "none", cursor: "pointer",
        padding: "11px 22px", borderRadius: 12, fontSize: 14, fontWeight: 700,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <RotateCcw size={16} /> Начать заново
      </button>
    </div>
  );
}
