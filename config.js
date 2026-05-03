// ============================================================
//  GastroExperience — config.js
//  ⚠️  ESTE ES EL ÚNICO ARCHIVO QUE CAMBIA POR CADA CLIENTE
// ============================================================

const APP_CONFIG = {

  // ── 1. IDENTIDAD DEL NEGOCIO ────────────────────────────
  barName:    "MI RESTAURANTE",
  barTagline: "Gastrobar · Cocina de Mercado",
  barAddress: "Calle Ejemplo, 1",
  barCity:    "Madrid",
  barPhone:   "600 000 000",
  barPhone2:  "",

  // ── 2. REDES SOCIALES (dejar "" si no aplica) ───────────
  instagram:    "",
  facebook:     "",
  googleReviews:"",
  whatsapp:     "",

  // ── 3. URL PÚBLICA DEL SITIO (para el QR) ──────────────
  siteUrl: "https://gastroexperience.es",

  // ── 4. BASE DE DATOS SUPABASE ──────────────────────────
  supabaseUrl: "https://xornvhqqjovcucpuqgoo.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvcm52aHFxam92Y3VjcHVxZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzMzNTcsImV4cCI6MjA5MzQwOTM1N30.h_BtfKYbUF31nlgLJMRsEHK28tne9chq7bhYnM5uwFA",

  // ── 5. ID ÚNICO DEL RESTAURANTE ────────────────────────
  restaurantId: "demo-restaurante",

  // ── 6. ZONAS DEL LOCAL ─────────────────────────────────
  zones: [
    { id: "interior", title: "Interior",  capacity: 20 },
    { id: "terraza",  title: "Terraza",   capacity: 30 },
  ],

  // ── 7. CATEGORÍAS DE LA CARTA ──────────────────────────
  menuCategories: [
    { id: "raciones",     label: "Raciones",     page: "raciones.html",     img: "images/cat-raciones.png"     },
    { id: "hamburguesas", label: "Hamburguesas",  page: "hamburguesas.html",  img: "images/cat-hamburguesas.png" },
    { id: "bebidas",      label: "Bebidas",       page: "bebidas.html",       img: "images/cat-bebidas.png"      },
    { id: "postres",      label: "Postres",        page: "postres.html",       img: "images/cat-postres.png"      },
  ],

  // ── 8. CONTRASEÑA DEL PANEL DE ADMIN ──────────────────
  adminPasswords: ["admin1234"],

};

if (typeof module !== 'undefined') module.exports = APP_CONFIG;
