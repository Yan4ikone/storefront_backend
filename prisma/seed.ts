// Наполняет БД тем же тестовым набором, что сейчас используется на фронтенде
// (frontend/lib/mock-data.ts), чтобы после переключения витрины на API картинка
// не поменялась. Когда появятся реальные поставщики — этот файл заменится
// импортом из прайс-листов (см. раздел 2.1 плана архитектуры).

import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
// process — глобальный объект Node.js, его типы даёт @types/node (см.
// devDependencies). Раньше здесь стоял явный `import process from "node:process"`
// как обходной путь: тогда в проекте была несовместимая связка ts-node@10 +
// typescript@6.0, из-за которой процесс не компилировался (см. историю чата).
// После фиксации typescript на 5.x explicit-импорт стал не нужен и даже вреден:
// без esModuleInterop в tsconfig.json он резолвится в undefined в рантайме.

const prisma = new PrismaClient();

const categories = [
  {
    slug: "batteries",
    name: "Аккумуляторы",
    icon: "BatteryCharging",
    items: ["Для iPhone", "Для Samsung", "Для Xiaomi", "Универсальные"],
  },
  {
    slug: "displays",
    name: "Дисплеи",
    icon: "MonitorSmartphone",
    items: ["Для iPhone", "Для Samsung", "Для Xiaomi", "OLED / IPS модули"],
  },
  {
    slug: "parts",
    name: "Запчасти",
    icon: "Cpu",
    items: ["Камеры", "Шлейфы", "Разъёмы", "Микросхемы"],
  },
  {
    slug: "glass",
    name: "Защитные стёкла и плёнки",
    icon: "ShieldCheck",
    items: ["2.5D стёкла", "Полноклеевые", "Плёнки", "Универсальные"],
  },
  {
    slug: "housings",
    name: "Корпусные части",
    icon: "PackageOpen",
    items: ["Задние крышки", "Рамки", "Винты и скотчи", "Наклейки"],
  },
  {
    slug: "accessories",
    name: "Аксессуары",
    icon: "Headphones",
    items: ["Наушники", "Power bank", "Кабели", "Держатели"],
  },
  {
    slug: "tools",
    name: "Инструменты и оборудование",
    icon: "Wrench",
    items: ["Наборы для вскрытия", "Паяльное оборудование", "Расходники"],
  },
  {
    slug: "laptop-parts",
    name: "Запчасти для ноутбуков и ПК",
    icon: "Laptop",
    items: ["Матрицы", "Клавиатуры", "Аккумуляторы для ноутбуков"],
  },
];

// Модели устройств для фильтра "Совместимость" (см. schema.prisma
// CompatibilityModel) — общепринятая номенклатура рынка, не привязана к
// конкретному поставщику. "Универсальные" товары (compatibility вроде
// "Универсальный (по модели)") сознательно не привязываются ни к одной модели —
// это и есть корректное поведение фильтра: они не относятся к конкретному устройству.
interface SeedCompatibilityModel {
  slug: string;
  brand: string;
  series: string;
  model: string;
}

const compatibilityModels: SeedCompatibilityModel[] = [
  { slug: "iphone-11", brand: "Apple", series: "iPhone", model: "iPhone 11" },
  { slug: "iphone-12", brand: "Apple", series: "iPhone", model: "iPhone 12" },
  { slug: "iphone-13", brand: "Apple", series: "iPhone", model: "iPhone 13" },
  { slug: "iphone-xr", brand: "Apple", series: "iPhone", model: "iPhone XR" },
  { slug: "galaxy-a53", brand: "Samsung", series: "Galaxy", model: "Galaxy A53" },
  { slug: "galaxy-s21", brand: "Samsung", series: "Galaxy", model: "Galaxy S21" },
  { slug: "redmi-note-11", brand: "Xiaomi", series: "Redmi", model: "Redmi Note 11" },
];

interface SeedProduct {
  slug: string;
  name: string;
  categorySlug: string;
  compatibility: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  // Условный внутренний код (не привязан к реальному прайс-листу поставщика —
  // см. комментарий в schema.prisma). Схема: <категория>-<номер>.
  article?: string;
  description: string;
  specs: { label: string; value: string }[];
  // Не задано — считается true (см. @default(true) в schema.prisma). false —
  // для демонстрации бейджа "Под заказ" на нескольких товарах.
  inStock?: boolean;
  // Slug'и из compatibilityModels выше — с какими моделями устройств связать товар
  // (для фильтра). Не задано/пусто — товар универсальный, в фильтр по модели не попадает.
  compatibilityModelSlugs?: string[];
}

const products: SeedProduct[] = [
  // Аккумуляторы
  {
    slug: "battery-iphone-xr",
    name: "Аккумулятор",
    categorySlug: "batteries",
    compatibility: "iPhone XR",
    price: 1190,
    badge: "Хит",
    article: "BAT-001",
    description:
      "Аккумулятор для замены штатной батареи. Совместим с iPhone XR, поддерживает корректное отображение износа в системе.",
    compatibilityModelSlugs: ["iphone-xr"],
    specs: [
      { label: "Совместимость", value: "iPhone XR" },
      { label: "Ёмкость", value: "2942 мАч" },
      { label: "Тип", value: "Li-Ion" },
      { label: "Гарантия", value: "6 месяцев" },
    ],
  },
  {
    slug: "battery-samsung-a53",
    name: "Аккумулятор",
    categorySlug: "batteries",
    compatibility: "Samsung Galaxy A53",
    price: 1390,
    article: "BAT-002",
    description: "Аккумулятор для Samsung Galaxy A53 с заводскими параметрами ёмкости.",
    compatibilityModelSlugs: ["galaxy-a53"],
    specs: [
      { label: "Совместимость", value: "Samsung Galaxy A53" },
      { label: "Ёмкость", value: "5000 мАч" },
      { label: "Тип", value: "Li-Po" },
      { label: "Гарантия", value: "6 месяцев" },
    ],
  },
  {
    slug: "battery-universal-power",
    name: "Аккумулятор повышенной ёмкости",
    categorySlug: "batteries",
    compatibility: "Универсальный (по модели)",
    price: 1590,
    oldPrice: 1890,
    badge: "Новинка",
    article: "BAT-003",
    description: "Батарея с увеличенной ёмкостью для моделей, где важна автономность.",
    specs: [
      { label: "Ёмкость", value: "до +20% к оригиналу" },
      { label: "Тип", value: "Li-Po" },
      { label: "Гарантия", value: "6 месяцев" },
    ],
  },

  // Дисплеи
  {
    slug: "display-iphone-13",
    name: "Дисплей в сборе",
    categorySlug: "displays",
    compatibility: "iPhone 13",
    price: 6490,
    oldPrice: 7290,
    badge: "Хит",
    article: "DIS-001",
    description:
      "Дисплейный модуль в сборе с тачскрином для iPhone 13. Проверяется перед отправкой в отделе контроля качества.",
    compatibilityModelSlugs: ["iphone-13"],
    specs: [
      { label: "Совместимость", value: "iPhone 13" },
      { label: "Тип матрицы", value: "OLED" },
      { label: "В комплекте", value: "Дисплей + тачскрин" },
      { label: "Гарантия", value: "6 месяцев" },
    ],
  },
  {
    slug: "display-samsung-a53",
    name: "Дисплей в сборе",
    categorySlug: "displays",
    compatibility: "Samsung Galaxy A53",
    price: 5290,
    article: "DIS-002",
    description: "OLED-дисплей в сборе с рамкой для Samsung Galaxy A53.",
    compatibilityModelSlugs: ["galaxy-a53"],
    specs: [
      { label: "Совместимость", value: "Samsung Galaxy A53" },
      { label: "Тип матрицы", value: "Super AMOLED" },
      { label: "Гарантия", value: "6 месяцев" },
    ],
  },
  {
    slug: "display-xiaomi-note-11",
    name: "Дисплей в сборе",
    categorySlug: "displays",
    compatibility: "Xiaomi Redmi Note 11",
    price: 3190,
    badge: "Новинка",
    article: "DIS-003",
    description: "Дисплейный модуль для Xiaomi Redmi Note 11, IPS-матрица.",
    // Для демонстрации бейджа "Под заказ" на витрине.
    inStock: false,
    compatibilityModelSlugs: ["redmi-note-11"],
    specs: [
      { label: "Совместимость", value: "Xiaomi Redmi Note 11" },
      { label: "Тип матрицы", value: "IPS" },
      { label: "Гарантия", value: "6 месяцев" },
    ],
  },

  // Запчасти
  {
    slug: "charging-port-iphone-11",
    name: "Шлейф разъёма зарядки",
    categorySlug: "parts",
    compatibility: "iPhone 11",
    price: 890,
    article: "PRT-001",
    description: "Шлейф с разъёмом Lightning и микрофоном для iPhone 11.",
    compatibilityModelSlugs: ["iphone-11"],
    specs: [
      { label: "Совместимость", value: "iPhone 11" },
      { label: "В комплекте", value: "Шлейф, разъём, микрофон" },
      { label: "Гарантия", value: "3 месяца" },
    ],
  },
  {
    slug: "camera-main-iphone-12",
    name: "Основная камера",
    categorySlug: "parts",
    compatibility: "iPhone 12",
    price: 1990,
    article: "PRT-002",
    description: "Модуль основной камеры для iPhone 12.",
    compatibilityModelSlugs: ["iphone-12"],
    specs: [
      { label: "Совместимость", value: "iPhone 12" },
      { label: "Тип", value: "Основная камера" },
      { label: "Гарантия", value: "3 месяца" },
    ],
  },
  {
    slug: "motherboard-connector-samsung-s21",
    name: "Межплатный шлейф",
    categorySlug: "parts",
    compatibility: "Samsung Galaxy S21",
    price: 690,
    article: "PRT-003",
    description: "Соединительный шлейф материнской платы для Samsung Galaxy S21.",
    compatibilityModelSlugs: ["galaxy-s21"],
    specs: [
      { label: "Совместимость", value: "Samsung Galaxy S21" },
      { label: "Гарантия", value: "3 месяца" },
    ],
  },

  // Защитные стёкла и плёнки
  {
    slug: "glass-2.5d-universal",
    name: "Защитное стекло 2.5D",
    categorySlug: "glass",
    compatibility: "Универсальное (по модели)",
    price: 190,
    badge: "Новинка",
    article: "GLS-001",
    description: "Закалённое защитное стекло 2.5D с олеофобным покрытием.",
    specs: [
      { label: "Тип", value: "2.5D" },
      { label: "Твёрдость", value: "9H" },
    ],
  },
  {
    slug: "glass-full-glue-iphone-13",
    name: "Полноклеевое защитное стекло",
    categorySlug: "glass",
    compatibility: "iPhone 13",
    price: 350,
    article: "GLS-002",
    description: "Полноклеевое стекло с чёрной рамкой для iPhone 13.",
    compatibilityModelSlugs: ["iphone-13"],
    specs: [
      { label: "Совместимость", value: "iPhone 13" },
      { label: "Тип", value: "Full glue" },
      { label: "Твёрдость", value: "9H" },
    ],
  },
  {
    slug: "hydrogel-film-universal",
    name: "Гидрогелевая плёнка",
    categorySlug: "glass",
    compatibility: "Универсальная (по размеру)",
    price: 150,
    article: "GLS-003",
    description: "Гидрогелевая защитная плёнка на экран, самовосстанавливающаяся.",
    specs: [{ label: "Тип", value: "Гидрогель" }],
  },

  // Корпусные части
  {
    slug: "back-cover-xiaomi-note-11",
    name: "Задняя крышка",
    categorySlug: "housings",
    compatibility: "Xiaomi Redmi Note 11",
    price: 990,
    article: "HSG-001",
    description: "Задняя крышка корпуса для Xiaomi Redmi Note 11.",
    compatibilityModelSlugs: ["redmi-note-11"],
    specs: [{ label: "Совместимость", value: "Xiaomi Redmi Note 11" }],
  },
  {
    slug: "frame-iphone-xr",
    name: "Рамка дисплея",
    categorySlug: "housings",
    compatibility: "iPhone XR",
    price: 590,
    article: "HSG-002",
    description: "Средняя рамка корпуса для iPhone XR.",
    compatibilityModelSlugs: ["iphone-xr"],
    specs: [{ label: "Совместимость", value: "iPhone XR" }],
  },
  {
    slug: "adhesive-tape-set",
    name: "Набор скотчей для проклейки корпуса",
    categorySlug: "housings",
    compatibility: "Универсальный (по модели)",
    price: 290,
    article: "HSG-003",
    description: "Комплект проклеечных скотчей для сборки корпуса после ремонта.",
    specs: [{ label: "Комплектация", value: "Скотч дисплея + скотч батареи" }],
  },

  // Аксессуары
  {
    slug: "power-bank-10000",
    name: "Power Bank 10000 мАч",
    categorySlug: "accessories",
    compatibility: "Универсальный",
    price: 1790,
    oldPrice: 2190,
    article: "ACC-001",
    description: "Портативный аккумулятор 10000 мАч с двумя портами USB.",
    specs: [
      { label: "Ёмкость", value: "10000 мАч" },
      { label: "Выходы", value: "2 × USB-A" },
    ],
  },
  {
    slug: "headphones-wired-universal",
    name: "Проводные наушники",
    categorySlug: "accessories",
    compatibility: "Универсальные (3.5 мм / USB-C)",
    price: 490,
    article: "ACC-002",
    description: "Проводные наушники с микрофоном, разъём на выбор при заказе.",
    specs: [{ label: "Разъём", value: "3.5 мм или USB-C" }],
  },
  {
    slug: "usb-c-cable-1m",
    name: "Кабель USB-C, 1 м",
    categorySlug: "accessories",
    compatibility: "Универсальный",
    price: 290,
    article: "ACC-003",
    description: "Кабель для зарядки и передачи данных USB-C, длина 1 м.",
    specs: [{ label: "Длина", value: "1 м" }],
  },

  // Инструменты и оборудование
  {
    slug: "opening-tool-kit",
    name: "Набор инструментов для вскрытия",
    categorySlug: "tools",
    compatibility: "Универсальный",
    price: 1290,
    article: "TLS-001",
    description: "Базовый набор для разборки смартфонов: лопатки, присоска, отвёртки.",
    specs: [{ label: "Комплектация", value: "12 предметов" }],
  },
  {
    slug: "soldering-station",
    name: "Паяльная станция",
    categorySlug: "tools",
    compatibility: "Универсальная",
    price: 4990,
    badge: "Хит",
    article: "TLS-002",
    description: "Компактная паяльная станция для ремонта плат.",
    specs: [{ label: "Мощность", value: "60 Вт" }],
  },
  {
    slug: "screwdriver-set-precision",
    name: "Набор прецизионных отвёрток",
    categorySlug: "tools",
    compatibility: "Универсальный",
    price: 890,
    article: "TLS-003",
    description: "Набор отвёрток для разборки корпусов смартфонов и ноутбуков.",
    specs: [{ label: "Комплектация", value: "24 биты" }],
  },

  // Запчасти для ноутбуков и ПК
  {
    slug: "laptop-matrix-15-6",
    name: "Матрица 15.6″",
    categorySlug: "laptop-parts",
    compatibility: "Универсальная (по разрешению)",
    price: 4590,
    article: "LPT-001",
    description: "Матрица для ноутбука 15.6 дюймов, разъём и разрешение уточняются по модели.",
    // Для демонстрации бейджа "Под заказ" на витрине.
    inStock: false,
    specs: [{ label: "Диагональ", value: "15.6″" }],
  },
  {
    slug: "laptop-keyboard-universal",
    name: "Клавиатура для ноутбука",
    categorySlug: "laptop-parts",
    compatibility: "Универсальная (по модели)",
    price: 1490,
    article: "LPT-002",
    description: "Клавиатура для ноутбука, раскладка и крепление уточняются по модели.",
    specs: [{ label: "Раскладка", value: "RU/EN" }],
  },
  {
    slug: "laptop-battery-universal",
    name: "Аккумулятор для ноутбука",
    categorySlug: "laptop-parts",
    compatibility: "Универсальный (по модели)",
    price: 2990,
    article: "LPT-003",
    description: "Аккумулятор для ноутбука, ёмкость и разъём уточняются по модели.",
    specs: [{ label: "Тип", value: "Li-Ion" }],
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const model of compatibilityModels) {
    await prisma.compatibilityModel.upsert({
      where: { slug: model.slug },
      update: model,
      create: model,
    });
  }

  for (const product of products) {
    const { specs, compatibilityModelSlugs, ...rest } = product;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...rest, specs: specs as unknown as Prisma.InputJsonValue },
      create: { ...rest, specs: specs as unknown as Prisma.InputJsonValue },
    });

    // Пересобираем связи с моделями устройств заново при каждом запуске сида —
    // проще и надёжнее, чем сравнивать старый/новый набор построчно.
    await prisma.productCompatibility.deleteMany({ where: { productSlug: product.slug } });
    if (compatibilityModelSlugs?.length) {
      await prisma.productCompatibility.createMany({
        data: compatibilityModelSlugs.map((compatibilityModelSlug) => ({
          productSlug: product.slug,
          compatibilityModelSlug,
        })),
      });
    }
  }

  console.log(`Засеяно: ${categories.length} категорий, ${compatibilityModels.length} моделей устройств, ${products.length} товаров`);

  // Первый администратор — создаётся/обновляется из .env, чтобы сразу было
  // кем войти в /admin. Данные берутся из SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD,
  // если они не заданы — просто пропускаем этот шаг (см. .env.example).
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL;
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (seedAdminEmail && seedAdminPassword) {
    const passwordHash = await bcrypt.hash(seedAdminPassword, 10);
    await prisma.user.upsert({
      where: { email: seedAdminEmail },
      update: { passwordHash, role: "admin" },
      create: { email: seedAdminEmail, passwordHash, role: "admin", name: "Администратор" },
    });
    console.log(`Администратор готов: ${seedAdminEmail} (пароль — из SEED_ADMIN_PASSWORD в .env)`);
  } else {
    console.log(
      "SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD не заданы в .env — аккаунт администратора не создан. " +
        "Задайте их и повторите `npm run seed`, либо зарегистрируйте пользователя через " +
        "POST /auth/register и вручную поставьте ему role=admin в БД (Prisma Studio/Adminer)."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
