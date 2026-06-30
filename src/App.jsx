import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Heart, X, MapPin, GraduationCap, BadgeCheck, Building2,
  Sparkles, Coffee, Wrench, Briefcase, RotateCcw, User, Star,
  ChevronLeft, ArrowRight, Mail, Lock, Phone, Eye, EyeOff, CheckCircle2,
  Layers, MessageCircle, Send, Paperclip, MoreVertical,
  Video, Building, PhoneCall, Calendar, Link, ExternalLink,
  SlidersHorizontal, Zap, ShieldCheck, Clock, AlertCircle,
  FileText, Plus, Upload, Trash2, Package, ShoppingBag,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
// Шаг отступов: 4px (sp1=4, sp2=8, sp3=12, sp4=16, sp6=24, sp8=32)
// Радиусы: r-sm=8, r-md=12, r-lg=16, r-xl=20, r-full=9999
const C_LIGHT = {
  paper:    "#FBFAF7",
  ink:      "#16141C",
  muted:    "#6F6A7A",
  line:     "#ECE8E1",
  apply:    "#13B17C",
  applyDark:"#0E8E63",
  skip:     "#8A8F99",
  brand:    "#6C5CE7",
  shell:    "#101018",
  err:      "#E53E3E",
  card:     "#FFFFFF",
  nav:      "#FFFFFF",
};

const C_DARK = {
  paper:    "#0F0E15",
  ink:      "#EEEAF8",
  muted:    "#9590A4",
  line:     "#252232",
  apply:    "#16CF8C",
  applyDark:"#13B17C",
  skip:     "#6B7080",
  brand:    "#8B7FF5",
  shell:    "#040310",
  err:      "#FC7171",
  card:     "#1C1929",
  nav:      "#151320",
};

// Мутируемый объект токенов — все компоненты читают из него напрямую
const C = { ...C_LIGHT };

function applyTheme(tokens) {
  Object.assign(C, tokens);
  const root = document.documentElement;
  Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(`--c-${k}`, v));
}

// ─── Справочники (Dictionary) ─────────────────────────────────────────────────
const DICT_SKILLS = [
  { id: "manicure",    name: "Маникюр" },
  { id: "gel",         name: "Гель-лак" },
  { id: "nail_design", name: "Nail-дизайн" },
  { id: "barista",     name: "Бариста" },
  { id: "latte_art",   name: "Латте-арт" },
  { id: "specialty",   name: "Specialty-кофе" },
  { id: "office_mgmt", name: "Офис-менеджмент" },
  { id: "doc_flow",    name: "Документооборот" },
  { id: "english_b2",  name: "Английский B2" },
  { id: "mechanic",    name: "Автомеханик" },
  { id: "diagnostics", name: "Диагностика авто" },
  { id: "1c",          name: "1С" },
];

const DICT_AREAS = [
  { id: "moscow",  name: "Москва" },
  { id: "spb",     name: "Санкт-Петербург" },
  { id: "kazan",   name: "Казань" },
  { id: "remote",  name: "Удалённо" },
];

const skillName = (id) => DICT_SKILLS.find((s) => s.id === id)?.name ?? id;

// ─── Категории вакансий (раздел 2 брифа) ──────────────────────────────────────
const CATEGORIES = [
  { id: "pvz",      label: "ПВЗ и склад",   emoji: "📦", color: "#3B5BDB" },
  { id: "food",     label: "Общепит",        emoji: "☕", color: "#C2873E" },
  { id: "beauty",   label: "Красота",        emoji: "💅", color: "#E879A8" },
  { id: "edu",      label: "Образование",    emoji: "📚", color: "#6C5CE7" },
  { id: "retail",   label: "Магазины",       emoji: "🛍", color: "#16A06A" },
  { id: "services", label: "Услуги",         emoji: "🧹", color: "#1098AD" },
];
const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? null;

// доступность по времени (лёгкий профиль соискателя)
const AVAILABILITY = [
  { id: "weekday_day", label: "Будни днём" },
  { id: "weekday_eve", label: "Будни вечером" },
  { id: "weekends",    label: "Выходные" },
  { id: "anytime",     label: "В любое время" },
  { id: "parttime_only", label: "Только подработка" },
];
const availabilityLabel = (id) => AVAILABILITY.find((a) => a.id === id)?.label ?? id;

// тип оплаты → крупная сумма + подпись
function payParts(item) {
  const v = item.payValue;
  const map = {
    hour:  { unit: "в час" },
    shift: { unit: "за смену" },
    day:   { unit: "за выход" },
    month: { unit: "в месяц" },
  };
  if (item.payType && map[item.payType] && v != null) {
    return { big: `${v.toLocaleString("ru")} ₽`, unit: map[item.payType].unit };
  }
  // service / процент / прочее — берём текст из salary
  return { big: item.salary ?? "", unit: "" };
}

// требования вакансии → набор чипов
function requirementChips(req) {
  if (!req) return [];
  const chips = [];
  if (req.needsMedBook) chips.push("Медкнижка");
  if (req.age18)        chips.push("18+");
  if (req.license)      chips.push(`Права ${req.license}`);
  if (req.ownTools)     chips.push("Свой инструмент");
  return chips;
}

// ─── Гео: районы с координатами (моки) ────────────────────────────────────────
const DISTRICTS = [
  { id: "sokol",        name: "Сокол",            lat: 55.8050, lng: 37.5150 },
  { id: "aeroport",     name: "Аэропорт",         lat: 55.8000, lng: 37.5330 },
  { id: "voykovskaya",  name: "Войковская",       lat: 55.8190, lng: 37.4980 },
  { id: "begovaya",     name: "Беговая",          lat: 55.7730, lng: 37.5560 },
  { id: "presnensky",   name: "Пресня · Сити",    lat: 55.7490, lng: 37.5400 },
  { id: "khamovniki",   name: "Хамовники",        lat: 55.7310, lng: 37.5850 },
  { id: "tverskoy",     name: "Тверской",         lat: 55.7660, lng: 37.6050 },
  { id: "sokolniki",    name: "Сокольники",       lat: 55.7890, lng: 37.6740 },
];

const districtName = (id) => DISTRICTS.find((d) => d.id === id)?.name ?? id;
const districtById  = (id) => DISTRICTS.find((d) => d.id === id) ?? null;

// расстояние по гаверсинусу, км
function distanceKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const walkMin = (km) => Math.max(1, Math.round((km / 5) * 60)); // ~5 км/ч
const fmtKm = (km) =>
  km == null ? "" : km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1).replace(".", ",")} км`;

// ближайший район к произвольным координатам (для подписи дома по геолокации)
function nearestDistrict(coords) {
  let best = DISTRICTS[0], bestD = Infinity;
  for (const d of DISTRICTS) {
    const dist = distanceKm(coords, d);
    if (dist != null && dist < bestD) { bestD = dist; best = d; }
  }
  return best;
}

// варианты радиуса в шапке ленты
const RADIUS_OPTIONS = [
  { key: "nearby", label: "Рядом",      sub: "~2 км",  km: 2 },
  { key: "min15",  label: "15 мин",     sub: "пешком", km: 1.25 },
  { key: "min30",  label: "30 мин",     sub: "пешком", km: 2.5 },
  { key: "city",   label: "Весь город", sub: "",       km: Infinity },
];
const radiusKm = (key) => RADIUS_OPTIONS.find((r) => r.key === key)?.km ?? Infinity;

// ─── mock data ───────────────────────────────────────────────────────────────
// геопозиция вакансии берётся по району (districtById); поле geo добавляется в withGeo()
const COMPANIES_RAW = [
  {
    company: "Пункт выдачи Ozon", logo: "OZ", logoBg: "#0F4FFF",
    role: "Оператор ПВЗ", districtId: "sokol", areaId: "moscow",
    category: "pvz", payType: "hour", payValue: 180, schedule: "2/2",
    employmentType: "part", urgency: "normal",
    requirements: { noExperienceOk: true, age18: true },
    salary: "от 180 ₽/час", salaryFrom: 35000, icon: Package,
    photoLabel: "Зал выдачи", photo: ["#BFD0FF", "#3B5BDB"], placePhoto: null,
    blurb: "Выдаём заказы рядом с метро. Сменный график 2/2, можно совмещать с учёбой. Научим всему на месте.",
    tags: ["Рядом с метро"],
    skills: [],
    moderation: "approved", verified: true,
  },
  {
    company: "Кофейня «Тёплый угол»", logo: "ТУ", logoBg: "#C08457",
    role: "Бариста", districtId: "aeroport", areaId: "moscow",
    category: "food", payType: "hour", payValue: 220, schedule: "гибкий",
    employmentType: "part", urgency: "normal",
    requirements: { noExperienceOk: true },
    salary: "от 220 ₽/час", salaryFrom: 42000, icon: Coffee,
    photoLabel: "Барная стойка", photo: ["#E7CBA9", "#9B6B43"], placePhoto: null,
    blurb: "Маленькая кофейня у дома. Обучим латте-арту, кофе бариста — бесплатно. Чаевые ваши.",
    tags: ["Чаевые", "Обучение"],
    skills: ["barista", "latte_art"],
    moderation: "approved", verified: true,
  },
  {
    company: "Салон «Лак&Шик»", logo: "ЛШ", logoBg: "#E879A8",
    role: "Мастер маникюра", districtId: "voykovskaya", areaId: "moscow",
    category: "beauty", payType: "service", payValue: null, schedule: "2/2",
    employmentType: "full", urgency: "normal",
    requirements: { noExperienceOk: false, ownTools: true },
    salary: "50% с услуги", salaryFrom: 80000, icon: Sparkles,
    photoLabel: "Рабочее место мастера", photo: ["#F7C5DE", "#E879A8"], placePhoto: null,
    blurb: "Уютный салон, своё кресло и витрина гель-лаков. График 2/2, аренда кресла или процент.",
    tags: ["Своё кресло", "Премии за отзывы"],
    skills: ["manicure", "gel", "nail_design"],
    moderation: "approved", verified: true,
  },
  {
    company: "Склад «БыстроЛогистик»", logo: "БЛ", logoBg: "#3FB28B",
    role: "Комплектовщик", districtId: "voykovskaya", areaId: "moscow",
    category: "pvz", payType: "shift", payValue: 2400, schedule: "сменный",
    employmentType: "part", urgency: "tomorrow",
    requirements: { noExperienceOk: true, age18: true },
    salary: "от 2400 ₽/смена", salaryFrom: 45000, icon: Package,
    photoLabel: "Складская зона", photo: ["#BCE3D4", "#2E8C6A"], placePhoto: null,
    blurb: "Собираем заказы на тёплом складе. Можно выйти уже завтра, оплата еженедельно.",
    tags: ["Оплата раз в неделю"],
    skills: [],
    moderation: "approved", verified: true,
  },
  {
    company: "Пекарня «Корка»", logo: "К", logoBg: "#D98E3A",
    role: "Продавец-кассир", districtId: "sokol", areaId: "moscow",
    category: "retail", payType: "hour", payValue: 190, schedule: "вечерние смены",
    employmentType: "part", urgency: "normal",
    requirements: { noExperienceOk: true, needsMedBook: true },
    salary: "от 190 ₽/час", salaryFrom: 38000, icon: ShoppingBag,
    photoLabel: "Витрина пекарни", photo: ["#F1D9B5", "#C2873E"], placePhoto: null,
    blurb: "Продаём свежий хлеб и выпечку. Утренние или вечерние смены — выбирайте сами.",
    tags: ["Скидки сотрудникам"],
    skills: [],
    moderation: "approved", verified: false,
  },
  {
    company: "Студия «Растишка»", logo: "Р", logoBg: "#7C6FF0",
    role: "Педагог-вожатый", districtId: "begovaya", areaId: "moscow",
    category: "edu", payType: "day", payValue: 600, schedule: "выходные",
    employmentType: "oneoff", urgency: "normal",
    requirements: { noExperienceOk: true },
    salary: "от 600 ₽/занятие", salaryFrom: 40000, icon: GraduationCap,
    photoLabel: "Игровая комната", photo: ["#D6CFFA", "#6C5CE7"], placePhoto: null,
    blurb: "Детский клуб ищет вожатого на выходные. Любите детей — научим программе.",
    tags: ["Подработка"],
    skills: [],
    moderation: "approved", verified: true,
  },
  {
    company: "Автосервис «Гараж 24»", logo: "Г24", logoBg: "#5B8DEF",
    role: "Автомойщик", districtId: "begovaya", areaId: "moscow",
    category: "services", payType: "hour", payValue: 210, schedule: "сменный",
    employmentType: "part", urgency: "normal",
    requirements: { noExperienceOk: true },
    salary: "от 210 ₽/час", salaryFrom: 46000, icon: Wrench,
    photoLabel: "Моечный пост", photo: ["#BFD4F2", "#3F6FCB"], placePhoto: null,
    blurb: "Моем авто рядом с ТТК. Сдельная оплата + процент, можно без опыта.",
    tags: ["Сдельно", "Парковка"],
    skills: [],
    moderation: "approved", verified: false,
  },
  {
    company: "Магазин «У дома»", logo: "УД", logoBg: "#16A06A",
    role: "Продавец-консультант", districtId: "presnensky", areaId: "moscow",
    category: "retail", payType: "hour", payValue: 195, schedule: "5/2",
    employmentType: "full", urgency: "normal",
    requirements: { noExperienceOk: true },
    salary: "от 195 ₽/час", salaryFrom: 41000, icon: ShoppingBag,
    photoLabel: "Торговый зал", photo: ["#BCEBD6", "#159E68"], placePhoto: null,
    blurb: "Продукты у дома. Смены по 8 часов, дружный коллектив, обеды за счёт магазина.",
    tags: ["Обеды"],
    skills: [],
    moderation: "pending", verified: false,
  },
  {
    company: "Клининг «Чисто и Точка»", logo: "ЧТ", logoBg: "#22B8CF",
    role: "Уборщик-курьер", districtId: "tverskoy", areaId: "moscow",
    category: "services", payType: "shift", payValue: 1800, schedule: "гибкий",
    employmentType: "oneoff", urgency: "urgent", boosted: true,
    requirements: { noExperienceOk: true },
    salary: "от 1800 ₽/смена", salaryFrom: 44000, icon: Wrench,
    photoLabel: "Объект уборки", photo: ["#C2ECF2", "#1098AD"], placePhoto: null,
    blurb: "Уборка офисов в центре. Разовые выходы и постоянные смены, оплата в день выхода.",
    tags: ["Оплата в день"],
    skills: [],
    moderation: "approved", verified: true,
  },
  {
    company: "Бар «На углу»", logo: "НУ", logoBg: "#9B59B6",
    role: "Официант", districtId: "khamovniki", areaId: "moscow",
    category: "food", payType: "hour", payValue: 200, schedule: "вечерние смены",
    employmentType: "part", urgency: "normal",
    requirements: { noExperienceOk: true, age18: true },
    salary: "от 200 ₽/час + чай", salaryFrom: 43000, icon: Coffee,
    photoLabel: "Зал бара", photo: ["#E0CCEF", "#8E44AD"], placePhoto: null,
    blurb: "Вечерние смены в баре. Чаевые делим поровну, кормим перед сменой.",
    tags: ["Чаевые"],
    skills: [],
    moderation: "approved", verified: false,
  },
  // дальние — для демонстрации фильтра по радиусу
  {
    company: "Кофейня «Пар»", logo: "ПР", logoBg: "#C08457",
    role: "Бариста", districtId: null, areaId: "spb",
    geo: { lat: 59.9343, lng: 30.3351, district: "Центр" },
    category: "food", payType: "hour", payValue: 210, schedule: "гибкий",
    employmentType: "part", urgency: "normal",
    requirements: { noExperienceOk: true },
    salary: "от 210 ₽/час", salaryFrom: 60000, icon: Coffee,
    photoLabel: "Барная стойка", photo: ["#E7CBA9", "#9B6B43"], placePhoto: null,
    blurb: "Specialty-кофейня у канала в Санкт-Петербурге.",
    tags: ["Чаевые", "Обучение"],
    skills: ["barista", "latte_art", "specialty"],
    moderation: "approved", verified: false,
  },
  {
    company: "Автосервис «Гараж 24»", logo: "Г24", logoBg: "#3FB28B",
    role: "Автомеханик", districtId: null, areaId: "kazan",
    geo: { lat: 55.7963, lng: 49.1088, district: "Казань" },
    category: "services", payType: "hour", payValue: 280, schedule: "5/2",
    employmentType: "full", urgency: "normal",
    requirements: { noExperienceOk: false, license: "B", ownTools: true },
    salary: "от 280 ₽/час", salaryFrom: 90000, icon: Wrench,
    photoLabel: "Рабочий бокс", photo: ["#BCE3D4", "#2E8C6A"], placePhoto: null,
    blurb: "4 поста, современный инструмент. Казань.",
    tags: ["Сдельно+оклад", "Парковка"],
    skills: ["mechanic", "diagnostics"],
    moderation: "approved", verified: false,
  },
];

// точные адреса по районам (раскрываются только после мэтча)
const ADDRESSES = {
  sokol:       "ул. Алабяна, 12",
  aeroport:    "Ленинградский пр-т, 62",
  voykovskaya: "Старопетровский пр-д, 7А",
  begovaya:    "ул. Поликарпова, 21",
  presnensky:  "Пресненская наб., 8с1",
  khamovniki:  "Комсомольский пр-т, 28",
  tverskoy:    "ул. Тверская, 18",
  sokolniki:   "ул. Стромынка, 19",
};

// проставляем geo + точный адрес по району
const withGeo = (item) => {
  if (item.geo) return {
    ...item, city: `${item.geo.district}`, district: item.geo.district,
    address: item.address ?? `${item.geo.district}, точный адрес после мэтча`,
  };
  const d = districtById(item.districtId);
  return d
    ? {
        ...item,
        geo: { lat: d.lat, lng: d.lng, district: d.name },
        city: `Москва · ${d.name}`, district: d.name,
        address: `Москва, ${ADDRESSES[item.districtId] ?? d.name}`,
      }
    : item;
};

// вакансия публикуется только при наличии фото места и одобренной модерации
const isPublishable = (v) => v.moderation === "approved" && (v.placePhoto || (v.photo && v.photo.length > 0));

const COMPANIES = COMPANIES_RAW.map(withGeo);

const CANDIDATES = [
  {
    name: "Анна К.", role: "Мастер маникюра", city: "Москва", areaId: "moscow",
    icon: Sparkles, photo: ["#F7C5DE", "#D45C95"], exp: "5 лет опыта", expYears: 5,
    blurb: "Аппаратный и комбинированный маникюр, дизайн. Своя база клиентов.",
    documents: [
      { kind: "diploma",     title: "Диплом колледжа",            issuer: "Колледж сферы услуг", verified: true },
      { kind: "certificate", title: "Аппаратный маникюр",         issuer: "Школа Nail Pro",      verified: true },
      { kind: "certificate", title: "Курс «Дизайн ногтей 2.0»",   issuer: "OnlineNail",          verified: false },
    ],
    skills: ["manicure", "gel", "nail_design"],
    moderation: "approved", verified: true,
  },
  {
    name: "Игорь П.", role: "Офис-менеджер", city: "Москва", areaId: "moscow",
    icon: Building2, photo: ["#BFD4F2", "#3F6FCB"], exp: "3 года опыта", expYears: 3,
    blurb: "Документооборот, закупки, travel-поддержка руководителя. Английский B2.",
    documents: [
      { kind: "certificate", title: "1С: Документооборот",        issuer: "1С-Учебный центр", verified: true },
      { kind: "certificate", title: "Курс делопроизводства",      issuer: "Нетология",        verified: false },
      { kind: "certificate", title: "Английский B2",              issuer: "EF SET",           verified: true },
    ],
    skills: ["office_mgmt", "doc_flow", "english_b2", "1c"],
    moderation: "approved", verified: false,
  },
  {
    name: "Марина С.", role: "Бариста", city: "Санкт-Петербург", areaId: "spb",
    icon: Coffee, photo: ["#E7CBA9", "#8A5A33"], exp: "4 года опыта", expYears: 4,
    blurb: "Specialty-кофе, латте-арт, работа на потоке. Открывала точку с нуля.",
    documents: [
      { kind: "certificate", title: "SCA Barista Skills (Foundation)", issuer: "SCA",        verified: true },
      { kind: "certificate", title: "Курс по альтернативе",            issuer: "Tasty Coffee", verified: false },
      { kind: "diploma",     title: "Медкнижка (санкнижка)",           issuer: "ЦГиЭ",         verified: true },
    ],
    skills: ["barista", "latte_art", "specialty"],
    moderation: "pending", verified: true,
  },
];

// сортировка колоды по совпадению навыков с профилем пользователя
function sortedDeck(deck, userSkills) {
  if (!userSkills?.length) return deck;
  return [...deck].sort((a, b) => {
    const scoreA = (a.skills ?? []).filter((s) => userSkills.includes(s)).length;
    const scoreB = (b.skills ?? []).filter((s) => userSkills.includes(s)).length;
    return scoreB - scoreA;
  });
}

// гео-колода: считает расстояние от дома, фильтрует по радиусу, сортирует по близости
function geoDeck(list, home, radiusKey) {
  const r = radiusKm(radiusKey);
  return list
    .map((it) => ({ ...it, _dist: distanceKm(home, it.geo) }))
    .filter((it) => {
      if (!home) return true;             // нет дома — не фильтруем
      if (it._dist == null) return r === Infinity; // вакансия без гео — только в «Весь город»
      return it._dist <= r;
    })
    .sort((a, b) => {
      // проплаченный буст («Срочно») поднимается выше
      if (!!a.boosted !== !!b.boosted) return a.boosted ? -1 : 1;
      if (a._dist == null) return 1;
      if (b._dist == null) return -1;
      return a._dist - b._dist;
    });
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validPhone = (v) => /^\+?[\d\s\-()]{7,15}$/.test(v);

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // screens: "pick" | "geo" | "guestFeed" | "register" | "profileSetup" | "app"
  const [screen, setScreen] = useState("pick");
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [, forceUpdate] = useState(0);
  // item that triggered registration gate (so we can process the like after sign-up)
  const [pendingLike, setPendingLike] = useState(null);
  // дом соискателя: { lat, lng, district }
  const [home, setHome] = useState(null);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next ? C_DARK : C_LIGHT);
    forceUpdate((n) => n + 1);
  };

  const handleRolePick = (r) => {
    setRole(r);
    if (r === "seeker") {
      setScreen("geo"); // сначала спрашиваем геолокацию, потом гостевая лента
    } else {
      setScreen("register"); // hr must register first
    }
  };

  const handleGeoDone = (h) => { setHome(h); setScreen("guestFeed"); };

  // called when guest seeker likes or clicks "respond"
  const handleGuestLike = (item) => {
    setPendingLike(item);
    setScreen("register");
  };

  const handleRegistered = (u) => {
    setUser(u);
    if (role === "seeker") {
      setScreen("profileSetup"); // seeker fills profile after sign-up
    } else {
      setScreen("app");
    }
  };

  const handleProfileDone = (profile) => {
    setUser((prev) => ({ ...prev, ...profile }));
    setScreen("app");
  };

  const handleBack = () => setScreen("pick");
  const handleLogout = () => {
    setUser(null); setRole(null); setPendingLike(null); setHome(null); setScreen("pick");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: isDark
        ? "radial-gradient(120% 120% at 50% 0%, #0a0915 0%, #04030a 60%)"
        : "radial-gradient(120% 120% at 50% 0%, #1c1b29 0%, #0c0c12 60%)",
      padding: "24px 12px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      <div style={{
        width: 392, maxWidth: "100%", height: 760, background: C.paper,
        borderRadius: 40, overflow: "hidden", position: "relative",
        boxShadow: "0 30px 80px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.04)",
        border: `10px solid ${C.shell}`, display: "flex", flexDirection: "column",
      }}>
        {screen === "pick" && (
          <div style={{ flex: 1, overflow: "hidden" }}><RolePick onPick={handleRolePick} /></div>
        )}
        {screen === "geo" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <GeoOnboardingScreen onBack={handleBack} onDone={handleGeoDone} />
          </div>
        )}
        {screen === "guestFeed" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <GuestFeedScreen home={home} onLike={handleGuestLike} onRegister={() => setScreen("register")} />
          </div>
        )}
        {screen === "register" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <RegisterScreen
              role={role}
              onBack={role === "seeker" ? () => setScreen("guestFeed") : handleBack}
              onDone={handleRegistered}
            />
          </div>
        )}
        {screen === "profileSetup" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <ProfileSetupScreen user={user} home={home} onDone={handleProfileDone} />
          </div>
        )}
        {screen === "app" && (
          <MainApp
            role={role} user={user} home={home}
            onLogout={handleLogout}
            isDark={isDark} onToggleTheme={toggleTheme}
            initialLike={pendingLike}
          />
        )}
      </div>
    </div>
  );
}

// ─── GeoOnboardingScreen ──────────────────────────────────────────────────────
function GeoOnboardingScreen({ onBack, onDone }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);

  const useBrowserGeo = () => {
    setError("");
    if (!navigator.geolocation) { setManual(true); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const d = nearestDistrict(coords);
        onDone({ lat: coords.lat, lng: coords.lng, district: d.name });
      },
      () => {
        setLoading(false);
        setError("Не удалось определить местоположение. Выберите район вручную.");
        setManual(true);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const pickDistrict = (d) => onDone({ lat: d.lat, lng: d.lng, district: d.name });

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "40px 24px 30px", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 11, border: `1.5px solid ${C.line}`,
          background: "#fff", cursor: "pointer", display: "grid", placeItems: "center", color: C.muted,
        }}>
          <ChevronLeft size={18} />
        </button>
      </div>

      <div style={{
        width: 64, height: 64, borderRadius: 20, background: `${C.brand}14`,
        display: "grid", placeItems: "center", marginBottom: 20,
      }}>
        <MapPin size={32} color={C.brand} />
      </div>

      <h2 style={{ margin: "0 0 6px", fontSize: 23, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
        Работа рядом с домом
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 14.5, color: C.muted, lineHeight: 1.5 }}>
        Покажем вакансии в пешей доступности. Укажите, где вы находитесь —
        мы отсортируем ленту по близости.
      </p>

      {!manual ? (
        <>
          <button onClick={useBrowserGeo} disabled={loading} style={{
            width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
            background: loading ? "#C4BFF0" : C.brand, color: "#fff",
            fontSize: 15.5, fontWeight: 800, cursor: loading ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <MapPin size={18} />
            {loading ? "Определяем…" : "Определить автоматически"}
          </button>

          <button onClick={() => setManual(true)} style={{
            marginTop: 12, width: "100%", padding: "13px 0", borderRadius: 14,
            border: `1.5px solid ${C.line}`, background: "#fff",
            color: C.ink, fontSize: 14.5, fontWeight: 700, cursor: "pointer",
          }}>
            Выбрать район вручную
          </button>

          <p style={{ marginTop: "auto", paddingTop: 24, fontSize: 11.5, color: "#B0ACBA", textAlign: "center", lineHeight: 1.6 }}>
            Мы не показываем ваш точный адрес работодателям —
            только район и расстояние до вакансии.
          </p>
        </>
      ) : (
        <>
          {error && (
            <p style={{ margin: "0 0 14px", fontSize: 13, color: C.err, fontWeight: 600 }}>{error}</p>
          )}
          <p style={{ margin: "0 0 12px", fontSize: 12.5, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>
            Ваш район
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DISTRICTS.map((d) => (
              <button key={d.id} onClick={() => pickDistrict(d)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 16px", borderRadius: 14, cursor: "pointer",
                border: `1.5px solid ${C.line}`, background: "#fff", textAlign: "left",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3EF"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                <MapPin size={16} color={C.brand} />
                <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{d.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── RadiusSelector ───────────────────────────────────────────────────────────
function RadiusSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
      {RADIUS_OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <button key={opt.key} onClick={() => onChange(opt.key)} style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 20, cursor: "pointer",
            border: `1.5px solid ${active ? C.brand : C.line}`,
            background: active ? C.brand : "rgba(255,255,255,.85)",
            color: active ? "#fff" : C.muted,
            whiteSpace: "nowrap", transition: "all .15s",
          }}>
            {opt.label}
            {opt.sub && (
              <span style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.8 }}>{opt.sub}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── CategoryChips ────────────────────────────────────────────────────────────
function CategoryChips({ active, onToggle }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
      {CATEGORIES.map((cat) => {
        const on = active.includes(cat.id);
        return (
          <button key={cat.id} onClick={() => onToggle(cat.id)} style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 20, cursor: "pointer",
            border: `1.5px solid ${on ? cat.color : C.line}`,
            background: on ? `${cat.color}1a` : "rgba(255,255,255,.85)",
            color: on ? cat.color : C.muted,
            whiteSpace: "nowrap", transition: "all .15s",
          }}>
            <span>{cat.emoji}</span> {cat.label}
          </button>
        );
      })}
    </div>
  );
}

// фильтр по выбранным категориям + мягкая сортировка по интересам соискателя
function categoryDeck(deck, activeCats, interestedCats) {
  let out = deck;
  if (activeCats?.length) out = out.filter((it) => activeCats.includes(it.category));
  if (interestedCats?.length) {
    out = [...out].sort((a, b) => {
      const am = interestedCats.includes(a.category) ? 0 : 1;
      const bm = interestedCats.includes(b.category) ? 0 : 1;
      return am - bm; // совпадающие категории — выше (стабильно к гео-порядку)
    });
  }
  return out;
}

// ─── Карта (L1+) ──────────────────────────────────────────────────────────────
// приблизительная точка вакансии (до мэтча) — детерминированный сдвиг ~300–400 м
function jitterLatLng(seed, base, amp = 0.0035) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const da = (((h % 1000) / 1000) - 0.5) * 2 * amp;
  const db = ((((h >> 10) % 1000) / 1000) - 0.5) * 2 * amp;
  return [base.lat + da, base.lng + db];
}
const approxLatLng = (item) => jitterLatLng((item.company ?? "") + (item.role ?? ""), item.geo);

const radiusZoom = (key) => (key === "city" ? 11 : key === "min30" ? 13 : 14);

// контроллер вида карты — реагирует на смену дома/радиуса
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom, { animate: true });
  }, [center[0], center[1], zoom]); // eslint-disable-line
  return null;
}

function MapView({ home, deck, radiusKey, onPick }) {
  const center = home ? [home.lat, home.lng] : [55.805, 37.515];
  const rMeters = radiusKm(radiusKey) * 1000;
  const showCircle = home && isFinite(rMeters);
  return (
    <MapContainer
      center={center} zoom={radiusZoom(radiusKey)}
      style={{ position: "absolute", inset: 0, zIndex: 1 }}
      zoomControl={false} attributionControl={false}
    >
      <MapController center={center} zoom={radiusZoom(radiusKey)} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {showCircle && (
        <Circle center={center} radius={rMeters}
          pathOptions={{ color: C.brand, fillColor: C.brand, fillOpacity: 0.08, weight: 1.5 }} />
      )}
      {home && (
        <CircleMarker center={center} radius={8}
          pathOptions={{ color: "#fff", fillColor: C.brand, fillOpacity: 1, weight: 3 }}>
          <Tooltip direction="top">Вы здесь · {home.district}</Tooltip>
        </CircleMarker>
      )}
      {deck.map((it, i) => (
        <CircleMarker key={i} center={approxLatLng(it)} radius={10}
          pathOptions={{ color: "#fff", fillColor: C.apply, fillOpacity: 0.95, weight: 2 }}
          eventHandlers={{ click: () => onPick(it) }}>
          <Tooltip direction="top">
            {it.role} · {it._dist != null ? fmtKm(it._dist) : it.district}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

// карточка-превью вакансии при тапе по маркеру (низ экрана)
function MapPreview({ item, onClose, onLike }) {
  const [reported, setReported] = useState(false);
  if (!item) return null;
  const cat = categoryById(item.category);
  const pay = payParts(item);
  return (
    <div style={{ position: "absolute", left: 12, right: 12, bottom: 86, zIndex: 20 }}>
      <div style={{
        background: C.card, borderRadius: 18, padding: "14px 14px 12px",
        boxShadow: "0 10px 40px rgba(0,0,0,.25)", border: `1px solid ${C.line}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: item.logoBg, color: "#fff", display: "grid", placeItems: "center",
            fontWeight: 800, fontSize: 15,
          }}>
            {item.logo}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.role}
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.company}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "grid", placeItems: "center", padding: 4, flexShrink: 0,
          }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {cat && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: cat.color, background: `${cat.color}14`, padding: "3px 9px", borderRadius: 20 }}>
              {cat.emoji} {cat.label}
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: C.muted }}>
            <MapPin size={12} /> {item.district}{item._dist != null ? ` · ${fmtKm(item._dist)}` : ""}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 16, fontWeight: 900, color: C.ink }}>
            {pay.big}{pay.unit ? <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}> {pay.unit}</span> : null}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0 0" }}>
          {item.verified && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: C.apply }}>
              <ShieldCheck size={12} /> Проверенный работодатель
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>
            Точный адрес — после мэтча
          </span>
        </div>

        <button onClick={() => onLike(item)} style={{
          marginTop: 10, width: "100%", padding: "11px 0", borderRadius: 12, border: "none",
          background: C.apply, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        }}>
          <Heart size={16} fill="#fff" strokeWidth={0} /> Откликнуться
        </button>

        <button onClick={() => setReported(true)} disabled={reported} style={{
          marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 10,
          border: "none", background: "none", cursor: reported ? "default" : "pointer",
          color: reported ? C.apply : C.muted, fontSize: 12, fontWeight: 600,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <AlertCircle size={13} /> {reported ? "Жалоба отправлена" : "Пожаловаться"}
        </button>
      </div>
    </div>
  );
}

// переключатель «Список ⇄ Карта»
function ViewToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", background: C.line, borderRadius: 10, padding: 2 }}>
      {[
        { key: "list", label: "Список", Icon: Layers },
        { key: "map",  label: "Карта",  Icon: MapPin },
      ].map(({ key, label, Icon }) => {
        const on = value === key;
        return (
          <button key={key} onClick={() => onChange(key)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700,
            background: on ? C.card : "transparent",
            color: on ? C.ink : C.muted,
            boxShadow: on ? "0 1px 4px rgba(0,0,0,.12)" : "none",
          }}>
            <Icon size={13} /> {label}
          </button>
        );
      })}
    </div>
  );
}

const GUEST_SWIPE_LIMIT = 25;
const guestKey = () => `swipr_guest_${new Date().toISOString().slice(0, 10)}`;

// ─── GuestFeedScreen ──────────────────────────────────────────────────────────
function GuestFeedScreen({ home, onLike, onRegister }) {
  const [si, setSi] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exit, setExit] = useState(null);
  const [radius, setRadius] = useState("nearby");
  const [activeCats, setActiveCats] = useState([]);
  const [view, setView] = useState("list");
  const [mapPick, setMapPick] = useState(null);
  const [guestSwipes, setGuestSwipes] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(guestKey()) || "{}");
      return s.count ?? 0;
    } catch { return 0; }
  });
  const startRef = useRef(null);

  const toggleCat = (id) => {
    setSi(0);
    setActiveCats((p) => p.includes(id) ? p.filter((c) => c !== id) : [...p, id]);
  };

  const approved = COMPANIES.filter(isPublishable);
  const rawDeck = categoryDeck(geoDeck(approved, home, radius), activeCats, null);
  const current = rawDeck[si];
  const next = rawDeck[si + 1];
  const swipesLeft = Math.max(0, GUEST_SWIPE_LIMIT - guestSwipes);
  const limitReached = swipesLeft === 0;

  const saveGuest = (n) => {
    setGuestSwipes(n);
    localStorage.setItem(guestKey(), JSON.stringify({ count: n }));
  };

  const commit = (dir) => {
    if (exit || limitReached) return;
    setExit(dir);
    saveGuest(guestSwipes + 1);
    if (dir === "like" && current) {
      setTimeout(() => { onLike(current); }, 200);
      return;
    }
    setTimeout(() => { setSi((v) => v + 1); setDrag({ x: 0, y: 0, active: false }); setExit(null); }, 280);
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

  let tx = drag.x, ty = drag.y, rot = drag.x / 18;
  let trans = drag.active ? "none" : "transform .28s cubic-bezier(.2,.7,.3,1)";
  if (exit === "like") { tx = 640; rot = 22; }
  if (exit === "skip") { tx = -640; rot = -22; }

  const likeOpacity = Math.min(Math.max(drag.x / 110, 0), 1);
  const skipOpacity = Math.min(Math.max(-drag.x / 110, 0), 1);
  const dragDist = Math.sqrt(drag.x ** 2 + drag.y ** 2);
  const btnOpacity = drag.active ? Math.max(0, 1 - dragDist / 60) : 1;

  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      {/* Шапка */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        padding: "14px 16px 10px",
        background: "linear-gradient(to bottom, rgba(251,250,247,.96) 70%, transparent)",
        pointerEvents: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: C.brand,
            display: "grid", placeItems: "center", color: "#fff", flexShrink: 0,
          }}>
            <Briefcase size={15} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: C.ink, letterSpacing: -0.3 }}>
            Свайп<span style={{ color: C.brand }}>Джоб</span>
          </span>

          {/* счётчик гостевых свайпов */}
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
            background: swipesLeft <= 5 ? "#FFF3E0" : "rgba(255,255,255,.8)",
            border: `1px solid ${swipesLeft <= 5 ? "#ED8936" : C.line}`,
            borderRadius: 20, padding: "3px 10px 3px 8px",
          }}>
            <Zap size={12} color={swipesLeft <= 5 ? "#ED8936" : C.muted} fill={swipesLeft <= 5 ? "#ED8936" : "none"} />
            <span style={{ fontSize: 11, fontWeight: 700, color: swipesLeft <= 5 ? "#ED8936" : C.muted }}>
              {swipesLeft} из {GUEST_SWIPE_LIMIT}
            </span>
          </div>

          <button onClick={onRegister} style={{
            fontSize: 11, fontWeight: 700, color: "#fff", background: C.brand,
            border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer",
          }}>Войти</button>
        </div>

        {/* Гео-строка: район дома + кол-во рядом + переключатель вида */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, pointerEvents: "auto" }}>
          {home && (
            <>
              <MapPin size={13} color={C.brand} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{home.district}</span>
              <span style={{ fontSize: 12.5, color: C.muted }}>
                · {rawDeck.length} {rawDeck.length === 1 ? "вакансия" : "вакансий"} рядом
              </span>
            </>
          )}
          <div style={{ marginLeft: "auto" }}>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>

        {/* Селектор радиуса */}
        <div style={{ pointerEvents: "auto", marginTop: 8 }}>
          <RadiusSelector value={radius} onChange={(v) => { setRadius(v); setSi(0); }} />
        </div>

        {/* Чипы-категории */}
        <div style={{ pointerEvents: "auto", marginTop: 7 }}>
          <CategoryChips active={activeCats} onToggle={toggleCat} />
        </div>
      </div>

      {/* ── Карта ── */}
      {view === "map" && (
        <>
          <MapView home={home} deck={rawDeck} radiusKey={radius} onPick={setMapPick} />
          <MapPreview item={mapPick} onClose={() => setMapPick(null)} onLike={(it) => { setMapPick(null); onLike(it); }} />
        </>
      )}

      {/* Колода (только режим списка) */}
      {view === "list" && (
      <div style={{ position: "absolute", inset: 0, paddingTop: 0 }}>
        {(!current || si >= rawDeck.length) ? (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center",
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: `${C.brand}14`, display: "grid", placeItems: "center", marginBottom: 16 }}>
              {rawDeck.length === 0 ? <MapPin size={30} color={C.brand} /> : <Star size={30} color={C.brand} />}
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>
              {rawDeck.length === 0 ? "Рядом пока пусто" : "Пока всё просмотрено"}
            </h3>
            <p style={{ margin: "8px 0 20px", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
              {rawDeck.length === 0 && radius !== "city"
                ? "В этом радиусе нет вакансий. Расширьте радиус поиска."
                : "Зарегистрируйтесь, чтобы видеть все вакансии и откликаться"}
            </p>
            {rawDeck.length === 0 && radius !== "city" ? (
              <button onClick={() => { setRadius("city"); setSi(0); }} style={{
                background: C.brand, color: "#fff", border: "none", borderRadius: 14,
                padding: "13px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer",
              }}>
                Показать весь город
              </button>
            ) : (
              <button onClick={onRegister} style={{
                background: C.brand, color: "#fff", border: "none", borderRadius: 14,
                padding: "13px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer",
              }}>
                Зарегистрироваться
              </button>
            )}
          </div>
        ) : (
          <>
            {next && (
              <div style={{ position: "absolute", inset: 0 }}>
                <CardBody item={next} mode="seeker" dim fullscreen distance={next._dist} />
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
              <CardBody item={current} mode="seeker" fullscreen distance={current._dist} />
            </div>
          </>
        )}
      </div>
      )}

      {/* Кнопки */}
      {view === "list" && current && si < rawDeck.length && (
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
          <ActionBtn onClick={() => setSi(0)} bg="rgba(255,255,255,.92)" ring={C.line} color={C.brand} size={60}>
            <RotateCcw size={20} strokeWidth={2.5} />
          </ActionBtn>
        </div>
      )}

      {/* Баннер-подсказка внизу */}
      <div style={{
        position: "absolute", bottom: 102, left: 16, right: 16, zIndex: 10,
        background: `${C.brand}ee`, borderRadius: 14, padding: "10px 16px",
        display: view === "list" ? "flex" : "none", alignItems: "center", gap: 10,
        boxShadow: "0 4px 20px rgba(108,92,231,.3)",
        pointerEvents: "none",
        opacity: guestSwipes === 0 ? 1 : 0,
        transition: "opacity .4s",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
          Листайте вакансии. Для отклика — зарегистрируйтесь бесплатно.
        </span>
      </div>

      {/* Лимит исчерпан */}
      {limitReached && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30,
          background: "rgba(251,250,247,.96)", backdropFilter: "blur(6px)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 32, gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: `${C.brand}14`,
            display: "grid", placeItems: "center",
          }}>
            <Briefcase size={32} color={C.brand} />
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.ink, textAlign: "center" }}>
            Вы просмотрели {GUEST_SWIPE_LIMIT} вакансий
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>
            Зарегистрируйтесь бесплатно, чтобы видеть все предложения и откликаться
          </p>
          <button onClick={onRegister} style={{
            width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
            background: C.brand, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
          }}>
            Зарегистрироваться бесплатно
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ProfileSetupScreen (лёгкий профиль) ──────────────────────────────────────
function ProfileSetupScreen({ user, home, onDone }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [experience, setExperience] = useState(null); // 'none' | 'some'
  const [cats, setCats] = useState([]);
  const [avail, setAvail] = useState([]);
  const [about, setAbout] = useState("");
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const toggle = (arr, set, id) => set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const handleNextStep = () => {
    const e = {};
    if (!name.trim()) e.name = "Введите имя";
    if (!experience) e.experience = "Выберите уровень опыта";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(2);
  };

  const handleDone = () => {
    onDone({
      name, age: age ? Number(age) : null,
      district: home?.district ?? null, geo: home,
      experienceLevel: experience,
      interestedCategories: cats,
      availability: avail,
      about,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "32px 24px 30px", minHeight: "100%" }}>
      {/* Заголовок + прогресс */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: `${C.brand}14`, display: "grid", placeItems: "center" }}>
            <User size={18} color={C.brand} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.brand }}>Шаг {step} из 2</div>
            <div style={{ height: 4, background: C.line, borderRadius: 2, marginTop: 4 }}>
              <div style={{ height: "100%", borderRadius: 2, background: C.brand, width: step === 1 ? "50%" : "100%", transition: "width .3s" }} />
            </div>
          </div>
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
          {step === 1 ? "Коротко о себе" : "Что и когда ищете"}
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: C.muted }}>
          {step === 1 ? "Без длинных анкет — пара строк" : "Подберём вакансии рядом под вас"}
        </p>
      </div>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Имя" error={errors.name}
            input={<input placeholder="Как вас зовут?" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle(!!errors.name)} />}
          />
          <Field label="Возраст (необязательно)"
            input={<input type="number" placeholder="Например: 22" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle(false)} />}
          />

          {/* Опыт */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
              Опыт работы
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ id: "none", label: "Без опыта" }, { id: "some", label: "Есть опыт" }].map((o) => {
                const on = experience === o.id;
                return (
                  <button key={o.id} onClick={() => setExperience(o.id)} style={{
                    flex: 1, padding: "11px 0", borderRadius: 12, cursor: "pointer",
                    border: `1.5px solid ${on ? C.brand : C.line}`,
                    background: on ? `${C.brand}14` : "#fff", color: on ? C.brand : C.muted,
                    fontSize: 14, fontWeight: 700, transition: "all .15s",
                  }}>
                    {o.label}
                  </button>
                );
              })}
            </div>
            {errors.experience && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.err, fontWeight: 600 }}>{errors.experience}</p>}
          </div>

          {/* Район из геолокации */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
              Ваш район
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: `${C.brand}08` }}>
              <MapPin size={16} color={C.brand} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{home?.district ?? "Не указан"}</span>
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: C.muted }}>из геолокации</span>
            </div>
          </div>

          <button onClick={handleNextStep} style={{
            marginTop: 8, width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
            background: C.brand, color: "#fff", fontSize: 15.5, fontWeight: 800, cursor: "pointer",
          }}>
            Далее →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Категории интересов */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
              Что ищете
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const on = cats.includes(cat.id);
                return (
                  <button key={cat.id} onClick={() => toggle(cats, setCats, cat.id)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 20, cursor: "pointer",
                    border: `1.5px solid ${on ? cat.color : C.line}`,
                    background: on ? `${cat.color}14` : "#fff", color: on ? cat.color : C.muted,
                    transition: "all .15s",
                  }}>
                    {cat.emoji} {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Доступность */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
              Когда удобно работать
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AVAILABILITY.map((a) => {
                const on = avail.includes(a.id);
                return (
                  <button key={a.id} onClick={() => toggle(avail, setAvail, a.id)} style={{
                    fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 20, cursor: "pointer",
                    border: `1.5px solid ${on ? C.brand : C.line}`,
                    background: on ? `${C.brand}14` : "#fff", color: on ? C.brand : C.muted,
                    transition: "all .15s",
                  }}>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* О себе */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
              О себе (1–2 строки, необязательно)
            </label>
            <textarea
              rows={2} value={about} onChange={(e) => setAbout(e.target.value)}
              placeholder="Например: ответственная, быстро учусь, ищу подработку рядом с домом"
              style={{ ...inputStyle(false), resize: "none", fontFamily: "inherit", lineHeight: 1.4 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={() => setStep(1)} style={{
              padding: "13px 0", borderRadius: 14, border: `1.5px solid ${C.line}`,
              background: "#fff", color: C.muted, fontSize: 14, fontWeight: 700, cursor: "pointer",
              width: 52, flexShrink: 0,
            }}>
              ←
            </button>
            <button onClick={handleDone} style={{
              flex: 1, padding: "13px 0", borderRadius: 14, border: "none",
              background: C.brand, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
            }}>
              {cats.length > 0 ? "Готово — в ленту!" : "Пропустить и войти"}
            </button>
          </div>
        </div>
      )}
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

  // обе роли: вход через e-mail или телефон
  const [loginTab, setLoginTab] = useState("email");
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
    if (loginTab === "email") {
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
      const login = loginTab === "email" ? email : phone;
      setTimeout(() => onDone({ login, role }), 1200);
    }, 900);
  };

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
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: C.ink }}>
          {isSeeker ? "Почти готово!" : "Готово!"}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: C.muted, textAlign: "center" }}>
          {isSeeker ? "Аккаунт создан. Заполним профиль…" : "Аккаунт создан, входим…"}
        </p>
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
          flex: 1, height: 36, borderRadius: 11, background: `${roleBg}14`,
          display: "flex", alignItems: "center", paddingLeft: 12, gap: 8,
        }}>
          {isSeeker ? <User size={15} color={roleBg} /> : <Building2 size={15} color={roleBg} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: roleBg }}>
            {isSeeker ? "Регистрация соискателя" : "Регистрация нанимателя"}
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
          <button key={key} onClick={() => { setLoginTab(key); setErrors({}); }} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13.5,
            background: loginTab === key ? "#fff" : "transparent",
            color: loginTab === key ? C.ink : C.muted,
            boxShadow: loginTab === key ? "0 2px 8px rgba(0,0,0,.08)" : "none",
            transition: "all .18s",
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Login field */}
        {loginTab === "email" ? (
          <Field
            label="E-mail"
            error={errors.login}
            input={
              <input
                type="email"
                placeholder="example@mail.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle(!!errors.login)}
              />
            }
          />
        ) : (
          <Field
            label="Номер телефона"
            error={errors.login}
            input={
              <input
                type="tel"
                placeholder="+7 900 000-00-00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle(!!errors.login)}
              />
            }
          />
        )}

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
    // данные вакансии для раскрытия после мэтча (приватность L4)
    employerVerified: role === "seeker" ? !!item.verified : false,
    vacancyDistrict:  role === "seeker" ? item.district : null,
    vacancyAddress:   role === "seeker" ? item.address : null,
    state: "matched",
    unread: 0,
    lastMessageAt: now(),
    hidden: false,
    messages: [],
  };
}

// ─── MainApp ──────────────────────────────────────────────────────────────────
function MainApp({ role, user, home, onLogout, isDark, onToggleTheme, initialLike }) {
  const mode = role;
  const [tab, setTab] = useState("feed");
  const [negotiations, setNegotiations] = useState([]);
  const [matchModal, setMatchModal] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [userSkills, setUserSkills] = useState(user?.skills ?? []);
  const [userCats, setUserCats] = useState(user?.interestedCategories ?? []);
  const [userAvail, setUserAvail] = useState(user?.availability ?? []);
  const [ageGate, setAgeGate] = useState(null); // вакансия, ждущая подтверждения 18+
  const age18Ref = useRef(
    (user?.age != null && user.age >= 18) || localStorage.getItem("swipr_age18") === "1"
  );

  const performLike = (item) => {
    const neg = createNegotiation(mode, item);
    setNegotiations((prev) => [neg, ...prev]);
    setMatchModal(neg);
  };

  // process a like that happened before registration
  useEffect(() => {
    if (initialLike) performLike(initialLike);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navCount = negotiations.reduce((s, n) => s + (n.hidden ? 0 : n.unread), 0);

  const handleLike = (item) => {
    // 18+ гейт там, где требуется
    if (mode === "seeker" && item.requirements?.age18 && !age18Ref.current) {
      setAgeGate(item);
      return;
    }
    performLike(item);
  };

  const confirmAge18 = () => {
    age18Ref.current = true;
    localStorage.setItem("swipr_age18", "1");
    const it = ageGate;
    setAgeGate(null);
    if (it) performLike(it);
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
          <FeedTab mode={mode} user={user} home={home} onLogout={onLogout} onLike={handleLike} userSkills={userSkills} userCats={userCats} />
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
        {tab === "profile" && (
          <ProfileScreen
            user={user} role={role}
            userSkills={userSkills} onSkillsChange={setUserSkills}
            userCats={userCats} onCatsChange={setUserCats}
            userAvail={userAvail} onAvailChange={setUserAvail}
            isDark={isDark} onToggleTheme={onToggleTheme}
          />
        )}
      </div>

      {/* Нижний таббар */}
      <TabBar active={tab} onTab={setTab} navCount={navCount} />

      {/* Модалка мэтча */}
      {matchModal && (
        <MatchModal neg={matchModal} role={mode} onClose={closeMatch} onChat={openChat} />
      )}

      {/* 18+ гейт */}
      {ageGate && (
        <AgeGateModal item={ageGate} onConfirm={confirmAge18} onCancel={() => setAgeGate(null)} />
      )}
    </div>
  );
}

// ─── 18+ гейт ─────────────────────────────────────────────────────────────────
function AgeGateModal({ item, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 110,
      background: "rgba(10,8,20,.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 28,
    }}>
      <div style={{
        background: C.card, borderRadius: 20, padding: "26px 22px", width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,.4)",
      }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: "#FFF3E0", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
          <AlertCircle size={30} color="#ED8936" />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800, color: C.ink }}>Только для 18+</h3>
        <p style={{ margin: "0 0 22px", fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
          Для вакансии «{item.role}» требуется возраст 18 лет и старше. Подтвердите, что вам уже есть 18.
        </p>
        <button onClick={onConfirm} style={{
          width: "100%", padding: "13px 0", borderRadius: 13, border: "none",
          background: C.apply, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10,
        }}>
          Мне есть 18 лет
        </button>
        <button onClick={onCancel} style={{
          width: "100%", padding: "12px 0", borderRadius: 13,
          border: `1.5px solid ${C.line}`, background: "transparent",
          color: C.muted, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          Отмена
        </button>
      </div>
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
      borderTop: `1px solid ${C.line}`, background: C.nav,
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

// ─── Free-tier limits ────────────────────────────────────────────────────────
const FREE_SWIPES = 10;
const todayKey = () => new Date().toISOString().slice(0, 10);

// ─── Filter sheet ─────────────────────────────────────────────────────────────
const SALARY_OPTIONS = [
  { label: "Любая",   value: null },
  { label: "60 000+", value: 60000 },
  { label: "80 000+", value: 80000 },
  { label: "100 000+", value: 100000 },
];
const EXP_OPTIONS = [
  { label: "Любой", value: null },
  { label: "1+ год",  value: 1 },
  { label: "3+ года", value: 3 },
  { label: "5+ лет",  value: 5 },
];

function FilterSheet({ open, onClose, filters, onChange, mode }) {
  const isSeeker = mode === "seeker";
  const roleColor = isSeeker ? C.brand : C.apply;

  if (!open) return null;

  const set = (key, val) => onChange({ ...filters, [key]: val });

  const ChipRow = ({ label, options, field }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {options.map(({ label: l, value: v }) => {
          const active = filters[field] === v;
          return (
            <button key={String(v)} onClick={() => set(field, v)} style={{
              fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, cursor: "pointer",
              border: `1.5px solid ${active ? roleColor : C.line}`,
              background: active ? `${roleColor}14` : "#fff",
              color: active ? roleColor : C.muted,
            }}>
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );

  const hasFilters = filters.city || filters.salaryMin || filters.expMin;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 40,
      }} />
      {/* Sheet */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: C.paper, borderRadius: "20px 20px 0 0",
        padding: "0 20px 32px", boxShadow: "0 -8px 40px rgba(0,0,0,.16)",
      }}>
        {/* Ручка */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.line }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Фильтры</span>
          {hasFilters && (
            <button onClick={() => onChange({ city: null, salaryMin: null, expMin: null })} style={{
              marginLeft: "auto", fontSize: 12, fontWeight: 700, color: roleColor,
              background: "none", border: "none", cursor: "pointer",
            }}>
              Сбросить
            </button>
          )}
          <button onClick={onClose} style={{
            marginLeft: hasFilters ? 12 : "auto", background: "none", border: "none", cursor: "pointer",
            color: C.muted, display: "grid", placeItems: "center",
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Город */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
            Город
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {[{ label: "Все", value: null }, ...DICT_AREAS].map(({ id, name, label, value }) => {
              const v = value !== undefined ? value : id;
              const l = label || name;
              const active = filters.city === v;
              return (
                <button key={String(v)} onClick={() => set("city", v)} style={{
                  fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                  border: `1.5px solid ${active ? roleColor : C.line}`,
                  background: active ? `${roleColor}14` : "#fff",
                  color: active ? roleColor : C.muted,
                }}>
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {isSeeker && <ChipRow label="Зарплата от" options={SALARY_OPTIONS} field="salaryMin" />}
        {!isSeeker && <ChipRow label="Опыт" options={EXP_OPTIONS} field="expMin" />}

        <button onClick={onClose} style={{
          width: "100%", padding: "14px", background: roleColor, color: "#fff",
          borderRadius: 14, border: "none", cursor: "pointer",
          fontSize: 15, fontWeight: 800, marginTop: 4,
        }}>
          Применить
        </button>
      </div>
    </>
  );
}

function applyFilters(deck, filters, mode) {
  return deck.filter((item) => {
    // вакансия без фото места / не одобренная — не публикуется
    if (mode === "seeker" && !isPublishable(item)) return false;
    if (item.moderation && item.moderation !== "approved") return false;
    if (filters.city && item.areaId !== filters.city) return false;
    if (mode === "seeker" && filters.salaryMin && (item.salaryFrom ?? 0) < filters.salaryMin) return false;
    if (mode !== "seeker" && filters.expMin && (item.expYears ?? 0) < filters.expMin) return false;
    return true;
  });
}

// ─── Feed tab (свайп-лента) ───────────────────────────────────────────────────
function FeedTab({ mode, user, home, onLogout, onLike, userSkills, userCats }) {
  const [si, setSi] = useState(0);
  const [hi, setHi] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exit, setExit] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [radius, setRadius] = useState("nearby");
  const [activeCats, setActiveCats] = useState([]);
  const [view, setView] = useState("list");
  const [mapPick, setMapPick] = useState(null);
  const [filters, setFilters] = useState({ city: null, salaryMin: null, expMin: null });

  const toggleCat = (id) => {
    setSi(0);
    setActiveCats((p) => p.includes(id) ? p.filter((c) => c !== id) : [...p, id]);
  };
  const [swipesUsed, setSwipesUsed] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("swipr_swipes") || "{}");
      return saved.date === todayKey() ? (saved.count ?? 0) : 0;
    } catch { return 0; }
  });
  const startRef = useRef(null);

  const saveSwipes = (n) => {
    setSwipesUsed(n);
    localStorage.setItem("swipr_swipes", JSON.stringify({ date: todayKey(), count: n }));
  };

  // гео-сортировка только в режиме соискателя (у нанимателя дома нет)
  const useGeo = mode === "seeker" && !!home;
  const rawDeck = mode === "seeker" ? COMPANIES : CANDIDATES;
  const filteredDeck = applyFilters(rawDeck, filters, mode);
  const deck = useGeo
    ? categoryDeck(geoDeck(filteredDeck, home, radius), activeCats, userCats)
    : sortedDeck(filteredDeck, userSkills);
  const idx = mode === "seeker" ? si : hi;
  const setIdx = mode === "seeker" ? setSi : setHi;
  const current = deck[idx];
  const next = deck[idx + 1];

  const swipesLeft = Math.max(0, FREE_SWIPES - swipesUsed);
  const limitReached = swipesLeft === 0;

  const hasFilters = filters.city || filters.salaryMin || filters.expMin;

  const flashToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1600); };

  const commit = (dir) => {
    if (exit || limitReached) return;
    setExit(dir);
    if (dir === "like" && current) onLike(current);
    saveSwipes(swipesUsed + 1);
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, background: C.brand,
            display: "grid", placeItems: "center", color: "#fff", flexShrink: 0,
          }}>
            <Briefcase size={15} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: C.ink, letterSpacing: -0.3 }}>
            Свайп<span style={{ color: C.brand }}>Джоб</span>
          </span>

          {/* Счётчик свайпов */}
          <div style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
            background: swipesLeft <= 3 ? "#FFF3E0" : "rgba(255,255,255,.8)",
            border: `1px solid ${swipesLeft <= 3 ? "#ED8936" : C.line}`,
            borderRadius: 20, padding: "3px 10px 3px 8px",
          }}>
            <Zap size={12} color={swipesLeft <= 3 ? "#ED8936" : C.muted} fill={swipesLeft <= 3 ? "#ED8936" : "none"} />
            <span style={{ fontSize: 11, fontWeight: 700, color: swipesLeft <= 3 ? "#ED8936" : C.muted }}>
              {swipesLeft} / {FREE_SWIPES}
            </span>
          </div>

          {/* Фильтры */}
          <button onClick={() => setFilterOpen(true)} style={{
            width: 32, height: 32, borderRadius: 10, cursor: "pointer",
            background: hasFilters ? `${roleColor}18` : "rgba(255,255,255,.8)",
            border: `1.5px solid ${hasFilters ? roleColor : C.line}`,
            display: "grid", placeItems: "center",
          }}>
            <SlidersHorizontal size={15} color={hasFilters ? roleColor : C.muted} />
          </button>

          <button onClick={onLogout} style={{
            fontSize: 11, fontWeight: 700, color: C.muted, background: "rgba(255,255,255,.8)",
            border: `1px solid ${C.line}`, borderRadius: 8, padding: "4px 9px", cursor: "pointer",
          }}>Выйти</button>
        </div>

        {/* Гео-строка + селектор радиуса (только соискатель) */}
        {useGeo && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, pointerEvents: "auto" }}>
              <MapPin size={13} color={roleColor} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{home.district}</span>
              <span style={{ fontSize: 12.5, color: C.muted }}>
                · {deck.length} {deck.length === 1 ? "вакансия" : "вакансий"} рядом
              </span>
              <div style={{ marginLeft: "auto" }}>
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>
            <div style={{ pointerEvents: "auto", marginTop: 8 }}>
              <RadiusSelector value={radius} onChange={(v) => { setRadius(v); setIdx(0); }} />
            </div>
            <div style={{ pointerEvents: "auto", marginTop: 7 }}>
              <CategoryChips active={activeCats} onToggle={toggleCat} />
            </div>
          </>
        )}
      </div>

      {/* ── Карта (только соискатель) ── */}
      {useGeo && view === "map" && (
        <>
          <MapView home={home} deck={deck} radiusKey={radius} onPick={setMapPick} />
          <MapPreview item={mapPick} onClose={() => setMapPick(null)}
            onLike={(it) => { setMapPick(null); if (!limitReached) { onLike(it); saveSwipes(swipesUsed + 1); } }} />
        </>
      )}

      {/* Колода карточек — на весь экран */}
      {!(useGeo && view === "map") && (
      <div style={{ position: "absolute", inset: 0 }}>
        {!current ? (
          (useGeo && deck.length === 0 && radius !== "city") ? (
            <RadiusEmpty onExpand={() => { setRadius("city"); setIdx(0); }} />
          ) : (
            <EmptyState onReset={reset} mode={mode} />
          )
        ) : (
          <>
            {next && (
              <div style={{ position: "absolute", inset: 0 }}>
                <CardBody item={next} mode={mode} dim fullscreen distance={useGeo ? next._dist : undefined} />
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
              <CardBody item={current} mode={mode} fullscreen distance={useGeo ? current._dist : undefined} />
            </div>
          </>
        )}
      </div>
      )}

      {/* Кнопки действий поверх карточки */}
      {!(useGeo && view === "map") && current && (
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

      {/* Paywall — лимит исчерпан */}
      {limitReached && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30,
          background: "rgba(251,250,247,.95)", backdropFilter: "blur(6px)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 32, gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: "#FFF3E0",
            display: "grid", placeItems: "center",
          }}>
            <Zap size={32} color="#ED8936" fill="#ED8936" />
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.ink, textAlign: "center" }}>
            Лимит свайпов на сегодня
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 1.5 }}>
            В бесплатном тарифе доступно {FREE_SWIPES} свайпов в день.
            Обновление — завтра в 00:00.
          </p>
          <div style={{
            background: `linear-gradient(135deg, ${C.brand}, #9B59B6)`,
            borderRadius: 16, padding: "18px 24px", width: "100%",
            display: "flex", flexDirection: "column", gap: 10, alignItems: "center",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.7)", textTransform: "uppercase", letterSpacing: 1 }}>
              SwipeJob Plus
            </span>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
              Безлимитные свайпы
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,.8)", textAlign: "center" }}>
              + Приоритет в ленте · Расширенные фильтры · Аналитика
            </span>
            <button style={{
              marginTop: 4, background: "#fff", color: C.brand,
              border: "none", borderRadius: 12, padding: "12px 28px",
              fontSize: 15, fontWeight: 800, cursor: "pointer",
            }}>
              Попробовать Plus — 490 ₽/мес
            </button>
          </div>
          <button onClick={() => saveSwipes(0)} style={{
            fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer",
          }}>
            Сбросить счётчик (демо)
          </button>
        </div>
      )}

      {/* Фильтры */}
      <FilterSheet
        open={filterOpen} onClose={() => setFilterOpen(false)}
        filters={filters} onChange={setFilters} mode={mode}
      />
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

const stateColor = () => ({
  talking:           C.brand,
  interview_invited: "#ED8936",
  interview_set:     C.apply,
  offer:             "#9B59B6",
  rejected:          C.muted,
});

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

  const chipColor = stateColor()[neg.state] || C.muted;
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

      {/* Раскрытый адрес после мэтча (приватность L4) — только соискателю */}
      {role === "seeker" && neg.vacancyAddress && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
          background: `${C.apply}0e`, borderBottom: `1px solid ${C.line}`, flexShrink: 0,
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `${C.apply}1a`, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <MapPin size={15} color={C.apply} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {neg.vacancyAddress}
            </div>
            <div style={{ fontSize: 11, color: C.apply, fontWeight: 600 }}>
              Точный адрес открыт после мэтча
            </div>
          </div>
          {neg.employerVerified && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: C.apply, background: `${C.apply}14`, padding: "3px 8px", borderRadius: 20, flexShrink: 0 }}>
              <ShieldCheck size={12} /> Проверен
            </span>
          )}
        </div>
      )}

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
        borderTop: `1px solid ${C.line}`, background: C.nav, flexShrink: 0,
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
                const chipColor = stateColor()[neg.state] || C.muted;
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

// ─── Moderation badge ─────────────────────────────────────────────────────────
function ModerationBadge({ status }) {
  const cfg = {
    approved: { label: "Одобрено", color: C.apply,   bg: `${C.apply}14`,   Icon: ShieldCheck },
    pending:  { label: "На проверке", color: "#ED8936", bg: "#FFF3E0",       Icon: Clock },
    rejected: { label: "Отклонено", color: C.err,    bg: `${C.err}14`,     Icon: AlertCircle },
  }[status] ?? null;
  if (!cfg) return null;
  const { label, color, bg, Icon } = cfg;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, fontWeight: 700, color, background: bg,
      padding: "3px 9px", borderRadius: 20,
    }}>
      <Icon size={11} strokeWidth={2.5} /> {label}
    </span>
  );
}

// ─── Profile screen ───────────────────────────────────────────────────────────
function ProfileScreen({ user, role, userSkills, onSkillsChange, userCats, onCatsChange, userAvail, onAvailChange, isDark, onToggleTheme }) {
  const isSeeker = role === "seeker";
  const roleColor = isSeeker ? C.brand : C.apply;
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState([]);
  const fileRef = useRef(null);
  const pendingKind = useRef("certificate");

  const openPicker = (kind) => { pendingKind.current = kind; fileRef.current?.click(); };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setDocs((p) => [...p, { kind: pendingKind.current, title: f.name, issuer: "Загружено вами", verified: false }]);
    e.target.value = "";
  };
  const removeDoc = (i) => setDocs((p) => p.filter((_, idx) => idx !== i));

  const suggestions = query.trim()
    ? DICT_SKILLS.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) && !userSkills.includes(s.id)
      )
    : [];

  const addSkill = (id) => {
    if (!userSkills.includes(id)) onSkillsChange([...userSkills, id]);
    setQuery("");
  };
  const removeSkill = (id) => onSkillsChange(userSkills.filter((s) => s !== id));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.paper, overflowY: "auto", transition: "background .25s" }}>

      {/* Шапка профиля */}
      <div style={{
        background: `linear-gradient(160deg, ${roleColor}22, ${roleColor}08)`,
        padding: "32px 24px 24px", borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 62, height: 62, borderRadius: "50%",
            background: roleColor, display: "grid", placeItems: "center", color: "#fff",
            fontSize: 22, fontWeight: 800,
            boxShadow: `0 0 0 3px #fff, 0 0 0 5px ${roleColor}40`,
          }}>
            {user?.login?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{user?.login}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: roleColor,
                background: `${roleColor}14`, padding: "3px 10px", borderRadius: 20,
              }}>
                {isSeeker ? "Соискатель" : "Наниматель"}
              </span>
              {/* Статус модерации анкеты */}
              <ModerationBadge status="approved" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 20px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Дипломы и сертификаты (только соискатель, после фото) ── */}
        {isSeeker && (
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: C.ink }}>
              Дипломы и сертификаты
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: C.muted }}>
              Загрузите документы — они повышают шанс приглашения на собеседование
            </p>

            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={onFile} style={{ display: "none" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {docs.length === 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "14px 14px",
                  borderRadius: 12, border: `1.5px dashed ${C.line}`, background: C.card,
                }}>
                  <FileText size={18} color={C.muted} />
                  <span style={{ fontSize: 13, color: C.muted }}>Пока ничего не загружено</span>
                </div>
              )}
              {docs.map((doc, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
                  borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: doc.kind === "diploma" ? `${C.brand}18` : `${C.apply}18`,
                    display: "grid", placeItems: "center",
                  }}>
                    {doc.kind === "diploma"
                      ? <GraduationCap size={16} color={C.brand} />
                      : <FileText size={16} color={C.apply} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {doc.kind === "diploma" ? "Диплом" : "Сертификат"} · на проверке
                    </div>
                  </div>
                  <button onClick={() => removeDoc(i)} style={{
                    background: "none", border: "none", cursor: "pointer", color: C.muted,
                    display: "grid", placeItems: "center", padding: 4, flexShrink: 0,
                  }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openPicker("diploma")} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 0", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${C.brand}40`, background: `${C.brand}0e`, color: C.brand,
                fontSize: 13, fontWeight: 700,
              }}>
                <GraduationCap size={15} /> Диплом
              </button>
              <button onClick={() => openPicker("certificate")} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 0", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${C.apply}40`, background: `${C.apply}0e`, color: C.apply,
                fontSize: 13, fontWeight: 700,
              }}>
                <Upload size={15} /> Сертификат
              </button>
            </div>
          </div>
        )}

        {/* ── Соискатель: лёгкий профиль (категории + доступность + район) ── */}
        {isSeeker && (
          <>
            {/* Уровень опыта */}
            {user?.experienceLevel && (
              <div>
                <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: C.ink }}>Опыт</h3>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: roleColor,
                  background: `${roleColor}14`, padding: "6px 14px", borderRadius: 20,
                }}>
                  {user.experienceLevel === "none" ? "Без опыта" : "Есть опыт"}
                </span>
              </div>
            )}

            {/* Интересные категории */}
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: C.ink }}>Что ищу</h3>
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: C.muted }}>
                Вакансии этих категорий будут выше в ленте
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((cat) => {
                  const on = userCats.includes(cat.id);
                  return (
                    <button key={cat.id} onClick={() => onCatsChange(on ? userCats.filter((c) => c !== cat.id) : [...userCats, cat.id])} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 20, cursor: "pointer",
                      border: `1.5px solid ${on ? cat.color : C.line}`,
                      background: on ? `${cat.color}14` : "#fff", color: on ? cat.color : C.muted,
                      transition: "all .15s",
                    }}>
                      {cat.emoji} {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Доступность */}
            <div>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: C.ink }}>Когда удобно работать</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {AVAILABILITY.map((a) => {
                  const on = userAvail.includes(a.id);
                  return (
                    <button key={a.id} onClick={() => onAvailChange(on ? userAvail.filter((x) => x !== a.id) : [...userAvail, a.id])} style={{
                      fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 20, cursor: "pointer",
                      border: `1.5px solid ${on ? roleColor : C.line}`,
                      background: on ? `${roleColor}14` : "#fff", color: on ? roleColor : C.muted,
                      transition: "all .15s",
                    }}>
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Район */}
            <div>
              <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: C.ink }}>Район</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card }}>
                <MapPin size={16} color={roleColor} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                  {user?.district ?? "Не указан"}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── Наниматель: навыки, которые ищет ── */}
        {!isSeeker && (
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: C.ink }}>Ищу навыки</h3>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: C.muted }}>
              Кандидаты с совпадающими навыками будут выше в ленте
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {userSkills.length === 0 && (
                <span style={{ fontSize: 13, color: C.muted }}>Навыки не выбраны</span>
              )}
              {userSkills.map((id) => (
                <span key={id} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 700, color: roleColor,
                  background: `${roleColor}14`, border: `1.5px solid ${roleColor}30`,
                  padding: "5px 10px 5px 12px", borderRadius: 20,
                }}>
                  {skillName(id)}
                  <button onClick={() => removeSkill(id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: roleColor, display: "grid", placeItems: "center", padding: 0,
                  }}>
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DICT_SKILLS.map((s) => {
                const selected = userSkills.includes(s.id);
                return (
                  <button key={s.id} onClick={() => selected ? removeSkill(s.id) : addSkill(s.id)} style={{
                    fontSize: 13, fontWeight: 600, padding: "6px 13px", borderRadius: 20, cursor: "pointer",
                    border: `1.5px solid ${selected ? roleColor : C.line}`,
                    background: selected ? `${roleColor}14` : "#fff",
                    color: selected ? roleColor : C.muted,
                    transition: "all .15s",
                  }}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Монетизация нанимателя (заглушки) ── */}
        {!isSeeker && (
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: C.ink }}>Тариф и продвижение</h3>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: C.muted }}>
              1 активная вакансия — бесплатно. Больше слотов и продвижение — платно.
            </p>

            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, marginBottom: 10,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${C.apply}18`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <CheckCircle2 size={16} color={C.apply} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Бесплатный тариф</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>1 активная вакансия · базовый показ</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.apply, background: `${C.apply}14`, padding: "3px 9px", borderRadius: 20 }}>
                Активен
              </span>
            </div>

            <div style={{
              background: `linear-gradient(135deg, ${C.brand}, #9B59B6)`,
              borderRadius: 14, padding: "16px 16px", color: "#fff",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Продвижение
              </div>
              {[
                { t: "🚀 Буст «Срочно» — в топ ленты рядом", p: "от 299 ₽" },
                { t: "➕ Доп. слоты вакансий", p: "199 ₽/мес" },
                { t: "📍 Расширенный радиус показа", p: "149 ₽/мес" },
              ].map((o) => (
                <div key={o.t} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: "1px solid rgba(255,255,255,.18)" }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{o.t}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800 }}>{o.p}</span>
                </div>
              ))}
              <button style={{
                marginTop: 12, width: "100%", padding: "11px 0", borderRadius: 11, border: "none",
                background: "#fff", color: C.brand, fontSize: 14, fontWeight: 800, cursor: "pointer",
              }}>
                Подключить продвижение
              </button>
            </div>
          </div>
        )}

        {/* Оформление */}
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: C.ink }}>Оформление</h3>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", background: C.card,
            borderRadius: 14, border: `1.5px solid ${C.line}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{isDark ? "🌙" : "☀️"}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                  {isDark ? "Тёмная тема" : "Светлая тема"}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {isDark ? "Включена тёмная тема" : "Включена светлая тема"}
                </div>
              </div>
            </div>
            {/* Toggle switch */}
            <button onClick={onToggleTheme} style={{
              width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
              background: isDark ? C.brand : C.line,
              position: "relative", transition: "background .2s", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute", top: 3, left: isDark ? 23 : 3,
                width: 22, height: 22, borderRadius: "50%", background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,.25)",
                transition: "left .2s",
              }} />
            </button>
          </div>
        </div>
      </div>
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

function CardBody({ item, mode, dim, fullscreen, distance }) {
  const Icon = item.icon;
  const cat = categoryById(item.category);
  const pay = payParts(item);
  const reqChips = requirementChips(item.requirements);
  const noExp = item.requirements?.noExperienceOk;
  const urgent = item.urgency === "urgent";
  const tomorrow = item.urgency === "tomorrow";
  const distLabel = distance != null
    ? `${item.district ?? item.city} · ${fmtKm(distance)} · ~${walkMin(distance)} мин пешком`
    : item.city;

  if (fullscreen) {
    return (
      <div style={{
        position: "absolute", inset: 0, opacity: dim ? 0.45 : 1,
        background: item.placePhoto
          ? `url(${item.placePhoto}) center/cover`
          : `linear-gradient(150deg, ${item.photo[0]}, ${item.photo[1]})`,
        overflow: "hidden",
      }}>
        {/* фоновая иконка места / категории (только если нет реального фото) */}
        {!item.placePhoto && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: .25 }}>
            {mode === "seeker"
              ? <Icon size={180} color="#fff" strokeWidth={0.8} />
              : <User size={180} color="#fff" strokeWidth={0.8} />}
          </div>
        )}

        {/* градиент снизу для текста */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "62%",
          background: "linear-gradient(to top, rgba(10,8,20,.9) 0%, rgba(10,8,20,.45) 58%, transparent 100%)",
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


        {/* лого компании + бейдж верификации */}
        {mode === "seeker" && (
          <div style={{ position: "absolute", right: 16, bottom: 148 }}>
            <div style={{
              width: 50, height: 50, borderRadius: 13,
              background: item.logoBg, color: "#fff", display: "grid", placeItems: "center",
              fontWeight: 800, fontSize: 15, border: "2.5px solid rgba(255,255,255,.5)",
              boxShadow: "0 4px 14px rgba(0,0,0,.35)", position: "relative",
            }}>
              {item.logo}
              {item.verified && (
                <div style={{
                  position: "absolute", bottom: -6, right: -6,
                  width: 20, height: 20, borderRadius: "50%",
                  background: C.apply, border: "2px solid #fff",
                  display: "grid", placeItems: "center",
                }}>
                  <ShieldCheck size={11} color="#fff" strokeWidth={2.5} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* текст внизу карточки */}
        <div style={{ position: "absolute", bottom: 96, left: 16, right: 16 }}>
          {/* категория + срочность + буст — над заголовком (только вакансия) */}
          {mode === "seeker" && (cat || urgent || tomorrow || item.boosted) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {item.boosted && (
                <span style={{
                  fontSize: 11.5, fontWeight: 800, color: "#fff",
                  background: `linear-gradient(135deg, ${C.brand}, #9B59B6)`,
                  padding: "4px 11px", borderRadius: 20,
                }}>
                  🚀 В топе
                </span>
              )}
              {cat && (
                <span style={{
                  fontSize: 11.5, fontWeight: 700, color: "#fff",
                  background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)",
                  padding: "4px 11px", borderRadius: 20, border: "1px solid rgba(255,255,255,.2)",
                }}>
                  {cat.emoji} {cat.label}
                </span>
              )}
              {urgent && (
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#fff", background: "#ED8936", padding: "4px 11px", borderRadius: 20 }}>
                  ⚡ Срочно
                </span>
              )}
              {tomorrow && (
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "#fff", background: "#E53E3E", padding: "4px 11px", borderRadius: 20 }}>
                  🔥 Выйти завтра
                </span>
              )}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.4, lineHeight: 1.2 }}>
              {mode === "seeker" ? item.role : item.name}
            </h3>
            {item.verified && mode !== "seeker" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                background: `${C.apply}cc`, borderRadius: 20, padding: "3px 9px",
                border: "1px solid rgba(255,255,255,.3)",
              }}>
                <ShieldCheck size={12} color="#fff" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Проверен</span>
              </div>
            )}
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.75)" }}>
            {mode === "seeker" ? item.company : item.role}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, color: "rgba(255,255,255,.7)", fontSize: 13, flexWrap: "wrap" }}>
            <MapPin size={13} />
            <span style={{ fontWeight: distance != null ? 700 : 400 }}>{distLabel}</span>
            {mode !== "seeker" && (
              <span style={{ marginLeft: 8, color: "rgba(255,255,255,.65)" }}>{item.exp}</span>
            )}
          </div>

          {/* ── ВАКАНСИЯ: оплата + условия ── */}
          {mode === "seeker" && (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                  {pay.big}
                </span>
                {pay.unit && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.7)" }}>{pay.unit}</span>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {item.schedule && (
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, color: "#fff",
                    background: "rgba(255,255,255,.18)", backdropFilter: "blur(4px)",
                    padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,.22)",
                  }}>
                    🕘 {item.schedule}
                  </span>
                )}
                {noExp && (
                  <span style={{
                    fontSize: 11.5, fontWeight: 800, color: "#fff",
                    background: `${C.apply}dd`, padding: "4px 10px", borderRadius: 20,
                    border: "1px solid rgba(255,255,255,.25)",
                  }}>
                    Без опыта
                  </span>
                )}
                {reqChips.map((c) => (
                  <span key={c} style={{
                    fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,.85)",
                    background: "rgba(255,255,255,.1)", backdropFilter: "blur(4px)",
                    padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,.15)",
                  }}>{c}</span>
                ))}
              </div>
            </>
          )}

          <p style={{ margin: "8px 0 0", fontSize: 12.5, lineHeight: 1.4, color: "rgba(255,255,255,.72)",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.blurb}
          </p>

          {/* навыки */}
          {item.skills?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {item.skills.map((sid) => (
                <span key={sid} style={{
                  fontSize: 11.5, fontWeight: 700, color: "#fff",
                  background: "rgba(255,255,255,.22)", backdropFilter: "blur(4px)",
                  padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,.25)",
                }}>
                  {skillName(sid)}
                </span>
              ))}
            </div>
          )}

          {/* ── КАНДИДАТ: дипломы и сертификаты (после фото) ── */}
          {mode !== "seeker" && item.documents?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.85)",
                textTransform: "uppercase", letterSpacing: 0.6,
              }}>
                <FileText size={12} /> Дипломы и сертификаты
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {item.documents.slice(0, 3).map((doc, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "rgba(255,255,255,.12)", backdropFilter: "blur(6px)",
                    borderRadius: 10, padding: "7px 10px",
                    border: `1px solid ${doc.verified ? `${C.apply}80` : "rgba(255,255,255,.18)"}`,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: doc.kind === "diploma" ? "rgba(108,92,231,.7)" : "rgba(255,255,255,.2)",
                      display: "grid", placeItems: "center",
                    }}>
                      {doc.kind === "diploma" ? <GraduationCap size={13} color="#fff" /> : <FileText size={13} color="#fff" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {doc.kind === "diploma" ? "Диплом" : "Сертификат"} · {doc.issuer}
                      </div>
                    </div>
                    {doc.verified && <BadgeCheck size={15} color={C.apply} style={{ flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
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

function RadiusEmpty({ onExpand }) {
  return (
    <div style={{
      position: "absolute", inset: 0, background: "#fff", borderRadius: 26,
      border: `1px dashed ${C.line}`, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18, background: `${C.brand}14`,
        display: "grid", placeItems: "center", marginBottom: 16,
      }}>
        <MapPin size={30} color={C.brand} />
      </div>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>Рядом пока пусто</h3>
      <p style={{ margin: "8px 0 18px", fontSize: 13.5, color: C.muted, maxWidth: 240, lineHeight: 1.5 }}>
        В этом радиусе нет подходящих вакансий. Попробуйте расширить зону поиска.
      </p>
      <button onClick={onExpand} style={{
        background: C.brand, color: "#fff", border: "none", cursor: "pointer",
        padding: "11px 22px", borderRadius: 12, fontSize: 14, fontWeight: 700,
      }}>
        Показать весь город
      </button>
    </div>
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
