// ============================================================
//  GastroExperience — config.js
//  ⚠️  ESTE ES EL ÚNICO ARCHIVO QUE CAMBIA POR CADA CLIENTE
// ============================================================

const APP_CONFIG = {

  // ── 1. IDENTIDAD DEL NEGOCIO ────────────────────────────
  barName:    "MI RESTAURANTE",          // ← Nombre del bar/restaurante
  barTagline: "Gastrobar · Terraza",     // ← Subtítulo que aparece debajo del logo
  barAddress: "Calle Example, 1",
  barCity:    "Ciudad",
  barPhone:   "000 000 000",
  barPhone2:  "",                        // Segundo teléfono (dejar "" si no hay)

  // ── 2. REDES SOCIALES (dejar "" si no aplica) ───────────
  instagram:    "",
  facebook:     "",
  googleReviews:"",
  whatsapp:     "",

  // ── 3. URL PÚBLICA DEL SITIO (para el QR) ──────────────
  siteUrl: "https://mirestaurante.tudominio.com",

  // ── 4. BASE DE DATOS SUPABASE ──────────────────────────
  supabaseUrl: "https://xornvhqqjovcucpuqgoo.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvcm52aHFxam92Y3VjcHVxZ29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzMzNTcsImV4cCI6MjA5MzQwOTM1N30.h_BtfKYbUF31nlgLJMRsEHK28tne9chq7bhYnM5uwFA",

  // ── 5. ID ÚNICO DEL RESTAURANTE ────────────────────────
  //  ⚠️  CAMBIA ESTO POR CADA CLIENTE — sin espacios, solo letras/números/guiones
  //  Ejemplos: "bar-pepe-madrid", "cafe-luna-sevilla", "restaurante-sol"
  restaurantId: "demo-restaurante",

  // ── 6. ZONAS DEL LOCAL ─────────────────────────────────
  zones: [
    { id: "interior", title: "INTERIOR",  capacity: 20 },
    { id: "terraza",  title: "TERRAZA",   capacity: 30 },
  ],

  // ── 7. CATEGORÍAS DE LA CARTA (base — el admin puede añadir más) ──
  menuCategories: [
    { id: "entrantes",    label: "Entrantes",     page: "entrantes.html",    img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=800" },
    { id: "principales",  label: "Principales",   page: "principales.html",  img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800" },
    { id: "postres",      label: "Postres",        page: "postres.html",      img: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?q=80&w=800" },
    { id: "bebidas",      label: "Bebidas",        page: "bebidas.html",      img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800" },
  ],

  // ── 8. CONTRASEÑA DEL PANEL DE ADMIN ──────────────────
  //  ⚠️  CAMBIA ESTO antes de entregar al cliente
  adminPasswords: ["admin1234"],

};

// No modificar nada debajo de esta línea
if (typeof module !== 'undefined') module.exports = APP_CONFIG;
