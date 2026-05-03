// admin.js — GastroExperience
const RID = APP_CONFIG.restaurantId;
const db  = supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseKey);
const ALLERGENS = ['gluten','crustaceos','huevos','pescado','cacahuetes','soja','lacteos','frutos_cascara','apio','mostaza','sesamo','azufre','altramuces','moluscos','setas'];
const ALLERGEN_NAMES = {gluten:'Gluten',crustaceos:'Crustáceos',huevos:'Huevos',pescado:'Pescado',cacahuetes:'Cacahuetes',soja:'Soja',lacteos:'Lácteos',frutos_cascara:'Frutos secos',apio:'Apio',mostaza:'Mostaza',sesamo:'Sésamo',azufre:'Azufre',altramuces:'Altramuces',moluscos:'Moluscos',setas:'Setas'};

// ── Config UI ────────────────────────────────────────────
document.getElementById('login-bar-name').textContent = APP_CONFIG.barName;
document.getElementById('admin-bar-label').textContent = APP_CONFIG.barName;
document.title = `Admin | ${APP_CONFIG.barName}`;

// Rellenar categorías en selects
const CATEGORIES = APP_CONFIG.menuCategories.map(c => ({ id: c.id, label: c.label }));
['category-filter','p-category'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  CATEGORIES.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.label; el.appendChild(o); });
});

// Allergens grid en modal
const ag = document.getElementById('allergens-grid');
ALLERGENS.forEach(a => {
  ag.innerHTML += `<div class="checkbox-group"><input type="checkbox" id="a-${a}"><label for="a-${a}">${ALLERGEN_NAMES[a]}</label></div>`;
});

// Stat cards para zonas
const zsc = document.getElementById('zone-stats-container');
APP_CONFIG.zones.forEach(z => {
  zsc.innerHTML += `<div class="stat-card"><h3>${z.title}</h3><p id="count-${z.id}">0</p></div>`;
});

// ── Toast ─────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fas fa-${type==='success'?'check-circle':type==='error'?'exclamation-circle':'info-circle'}"></i> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 5000);
}

// ── Login ─────────────────────────────────────────────────
const loginOverlay = document.getElementById('login-overlay');
const pwInput      = document.getElementById('admin-password');
function checkLogin() {
  if (APP_CONFIG.adminPasswords.includes(pwInput.value.trim())) {
    sessionStorage.setItem('admin_auth','true');
    loginOverlay.classList.add('login-hide');
    loadDashboard();
  } else {
    pwInput.classList.add('shake');
    pwInput.value = '';
    setTimeout(() => pwInput.classList.remove('shake'), 500);
  }
}
document.getElementById('login-btn').onclick = checkLogin;
pwInput.onkeydown = e => { if(e.key==='Enter') checkLogin(); };
if (sessionStorage.getItem('admin_auth')==='true') { loginOverlay.classList.add('login-hide'); loadDashboard(); }

// ── Nav tabs ──────────────────────────────────────────────
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active-tab'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active-tab');
    const map = { reservations: loadDashboard, menu: loadProducts, schedule: loadSchedule, categories: loadCategories, config: loadConfigTab, qr: loadQR };
    if (map[tab.dataset.tab]) map[tab.dataset.tab]();
  };
});

// ── RESERVAS ──────────────────────────────────────────────
const dateInput = document.getElementById('admin-date-select');
dateInput.value = new Date().toISOString().split('T')[0];
dateInput.onchange = loadDashboard;

async function loadDashboard() {
  const { data } = await db.from('reservations').select('*').eq('date', dateInput.value).eq('restaurant_id', RID).order('time');
  updateStats(data || []);
  renderTable(data || []);
}

function updateStats(res) {
  document.getElementById('total-count').textContent  = res.length;
  document.getElementById('total-people').textContent = res.reduce((s,r) => s + parseInt(r.people||0), 0);
  APP_CONFIG.zones.forEach(z => {
    const el = document.getElementById(`count-${z.id}`);
    if (el) el.textContent = res.filter(r => r.zone === z.id).length;
  });
}

function renderTable(res) {
  const tbody = document.getElementById('reservations-body');
  const noMsg = document.getElementById('no-data-message');
  tbody.innerHTML = '';
  noMsg.style.display = res.length ? 'none' : 'flex';
  res.forEach(r => {
    const confirmed = r.status === 'confirmed';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.time}</strong></td>
      <td style="font-size:0.8rem;color:var(--text-dim);">${r.date}</td>
      <td><strong>${r.name}</strong></td>
      <td>${r.people}</td>
      <td><span class="zone-tag ${r.zone==='terrace'?'zone-terrace':''}">${r.zonename||r.zone}</span></td>
      <td><div style="font-size:0.85rem;">${r.phone}</div><div style="font-size:0.72rem;color:var(--text-dim);">${r.email}</div></td>
      <td><span class="status-badge ${r.status}">${confirmed?'Confirmada':'Pendiente'}</span></td>
      <td style="text-align:right;display:flex;gap:6px;justify-content:flex-end;">
        ${confirmed
          ? '<button class="action-btn notified" disabled><i class="fas fa-check"></i> Confirmado</button>'
          : `<button class="action-btn confirm-res-btn" onclick="confirmReservation('${r.id}','${r.email}','${r.name}','${r.date}','${r.time}')"><i class="fas fa-check"></i> Confirmar</button>`}
        <button class="action-btn delete-btn" onclick="deleteReservation('${r.id}')"><i class="fas fa-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
}

async function confirmReservation(id, email, name, date, time) {
  if (!confirm(`¿Confirmar reserva de ${name} y enviar email?`)) return;
  const { data: cfg } = await db.from('settings').select('*').eq('restaurant_id', RID);
  const get = k => cfg?.find(s => s.key === k)?.value;
  const pub = get('ejs_public_key'), svc = get('ejs_service_id'), tpl = get('ejs_template_client');
  if (!pub || !svc || !tpl) { toast('Configura EmailJS primero en la pestaña Configuración','error'); return; }
  const { error } = await db.from('reservations').update({ status:'confirmed' }).eq('id', id);
  if (error) { toast('Error BD: '+error.message,'error'); return; }
  try {
    emailjs.init(pub);
    await emailjs.send(svc, tpl, { to_name:name, to_email:email, client_email:email, reservation_date:date, reservation_time:time, bar_name: APP_CONFIG.barName });
    toast('Reserva confirmada y email enviado ✓','success');
  } catch(e) { toast('Reserva confirmada pero email falló: '+e.text,'error'); }
  loadDashboard();
}

window.confirmReservation = confirmReservation;

window.deleteReservation = async id => {
  if (!confirm('¿Eliminar esta reserva?')) return;
  await db.from('reservations').delete().eq('id', id);
  loadDashboard();
  toast('Reserva eliminada','info');
};

document.getElementById('refresh-btn').onclick = () => { loadDashboard(); toast('Actualizado','info'); };

document.getElementById('view-all-btn').onclick = async () => {
  const { data } = await db.from('reservations').select('*').eq('status','pending').eq('restaurant_id', RID).order('date').order('time');
  dateInput.value = '';
  updateStats(data||[]);
  renderTable(data||[]);
};

document.getElementById('view-confirmed-btn').onclick = async () => {
  const { data } = await db.from('reservations').select('*').eq('status','confirmed').eq('restaurant_id', RID).order('date').order('time');
  dateInput.value = '';
  updateStats(data||[]);
  renderTable(data||[]);
};

document.getElementById('clear-btn').onclick = async () => {
  const d = dateInput.value;
  if (!d) { toast('Selecciona una fecha primero','error'); return; }
  if (!confirm(`¿Borrar TODAS las reservas del día ${d}?`)) return;
  if (!confirm('Esta acción es IRREVERSIBLE. ¿Continuar?')) return;
  await db.from('reservations').delete().eq('date', d).eq('restaurant_id', RID);
  loadDashboard();
  toast('Reservas del día eliminadas','info');
};

// ── Exportar CSV ───────────────────────────────────────────
document.getElementById('export-csv-btn').onclick = async () => {
  const { data } = await db.from('reservations').select('*').eq('restaurant_id', RID).order('date').order('time');
  if (!data || !data.length) { toast('No hay reservas para exportar','info'); return; }
  const headers = ['Fecha','Hora','Nombre','Teléfono','Email','Personas','Zona','Estado'];
  const rows = data.map(r => [r.date,r.time,r.name,r.phone,r.email,r.people,r.zonename||r.zone,r.status]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v||''}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = `reservas_${APP_CONFIG.restaurantId}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast('CSV exportado ✓','success');
};

// ── Realtime ──────────────────────────────────────────────
db.channel('realtime-res').on('postgres_changes',{ event:'INSERT', schema:'public', table:'reservations' }, payload => {
  if (payload.new.restaurant_id !== RID) return;
  toast(`¡Nueva reserva! ${payload.new.name} · ${payload.new.time}`,'success');
  if (dateInput.value === payload.new.date || !dateInput.value) loadDashboard();
}).subscribe();

// ── PRODUCTOS ─────────────────────────────────────────────
let allProducts = [];

async function loadProducts() {
  const { data } = await db.from('menu_items').select('*').eq('restaurant_id', RID).order('position');
  allProducts = data || [];
  renderProducts();
}

function renderProducts() {
  const tbody   = document.getElementById('products-body');
  const catVal  = document.getElementById('category-filter').value;
  const search  = document.getElementById('product-search').value.toLowerCase();
  let filtered  = allProducts.filter(p => p.category === catVal);
  if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
  document.getElementById('displayed-products-count').textContent = filtered.length;
  tbody.innerHTML = '';
  filtered.forEach(p => {
    const allergenBadges = ALLERGENS.filter(a => p.allergens?.[a]).map(a => `<span style="font-size:0.65rem;padding:2px 6px;background:var(--surface-3);border:1px solid var(--border);border-radius:4px;color:var(--text-dim);">${ALLERGEN_NAMES[a]}</span>`).join(' ');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align:center;color:var(--gold);font-weight:700;">${p.position||0}</td>
      <td style="text-align:center;"><i class="fas ${p.visible?'fa-eye':'fa-eye-slash'}" style="color:${p.visible?'var(--success)':'var(--error)'}"></i></td>
      <td style="display:flex;align-items:center;gap:10px;">
        ${p.image_url?`<img src="${p.image_url}" style="width:38px;height:38px;object-fit:cover;border-radius:6px;border:1px solid var(--border);" alt="">`:''}
        <div><strong>${p.name}</strong>${p.is_sugerencia?' ⭐':''}<div style="font-size:0.75rem;color:var(--text-dim);">${(p.info||'').substring(0,40)}</div></div>
      </td>
      <td style="color:var(--text-dim);font-size:0.82rem;">${p.category}</td>
      <td style="color:var(--success);font-weight:700;">${parseFloat(p.price).toFixed(2)} €</td>
      <td style="font-size:0.7rem;">${allergenBadges||'<span style="color:var(--text-muted)">—</span>'}</td>
      <td style="text-align:right;">
        <button class="action-btn edit-btn" onclick="openEditModal('${p.id}')"><i class="fas fa-edit"></i></button>
        <button class="action-btn delete-btn" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById('category-filter').onchange = renderProducts;
document.getElementById('product-search').oninput   = renderProducts;
document.getElementById('refresh-products-btn').onclick = loadProducts;

// Modal producto
const productModal = document.getElementById('product-modal');
document.getElementById('close-product-modal').onclick = () => productModal.classList.remove('open');

document.getElementById('add-product-btn').onclick = () => {
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('modal-title').textContent = 'Añadir Producto';
  document.getElementById('image-preview-container').style.display = 'none';
  ALLERGENS.forEach(a => document.getElementById(`a-${a}`).checked = false);
  productModal.classList.add('open');
};

window.openEditModal = id => {
  const p = allProducts.find(x => x.id == id);
  if (!p) return;
  document.getElementById('product-id').value    = p.id;
  document.getElementById('p-name').value        = p.name;
  document.getElementById('p-info').value        = p.info||'';
  document.getElementById('p-category').value    = p.category;
  document.getElementById('p-price').value       = p.price;
  document.getElementById('p-position').value    = p.position||0;
  document.getElementById('p-visible').checked   = p.visible;
  document.getElementById('p-sugerencia').checked= p.is_sugerencia;
  document.getElementById('p-image-url').value   = p.image_url||'';
  const prev = document.getElementById('image-preview');
  const prevC= document.getElementById('image-preview-container');
  if (p.image_url) { prev.src = p.image_url; prevC.style.display='block'; } else { prevC.style.display='none'; }
  ALLERGENS.forEach(a => document.getElementById(`a-${a}`).checked = p.allergens?.[a]||false);
  document.getElementById('modal-title').textContent = 'Editar Producto';
  productModal.classList.add('open');
};

window.previewImage = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('image-preview').src = ev.target.result;
    document.getElementById('image-preview-container').style.display = 'block';
  };
  reader.readAsDataURL(file);
};

document.getElementById('product-form').onsubmit = async e => {
  e.preventDefault();
  const btn = document.querySelector('#product-form .save-btn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  const id = document.getElementById('product-id').value;
  let imageUrl = document.getElementById('p-image-url').value;
  const fileInput = document.getElementById('p-image');
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const path = `${RID}/${Date.now()}.${file.name.split('.').pop()}`;
    const { error: upErr } = await db.storage.from('menu-images').upload(path, file, { upsert: true });
    if (!upErr) { const { data: urlData } = db.storage.from('menu-images').getPublicUrl(path); imageUrl = urlData.publicUrl; }
  }
  const allergens = {};
  ALLERGENS.forEach(a => allergens[a] = document.getElementById(`a-${a}`).checked);
  const payload = {
    restaurant_id: RID,
    name:          document.getElementById('p-name').value,
    info:          document.getElementById('p-info').value,
    category:      document.getElementById('p-category').value,
    price:         parseFloat(document.getElementById('p-price').value),
    position:      parseInt(document.getElementById('p-position').value)||1000,
    visible:       document.getElementById('p-visible').checked,
    is_sugerencia: document.getElementById('p-sugerencia').checked,
    image_url:     imageUrl,
    allergens,
  };
  if (id) await db.from('menu_items').update(payload).eq('id', id);
  else    await db.from('menu_items').insert([payload]);
  productModal.classList.remove('open');
  loadProducts();
  toast(id ? 'Producto actualizado ✓' : 'Producto añadido ✓','success');
  btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar Producto';
};

window.deleteProduct = async id => {
  if (!confirm('¿Borrar este producto?')) return;
  await db.from('menu_items').delete().eq('id', id);
  loadProducts();
  toast('Producto eliminado','info');
};

// Restaurar carta original
document.getElementById('import-data-btn').onclick = async () => {
  if (!confirm('¿Restaurar carta original? Borrará los productos actuales de esta categoría.')) return;
  toast('Esta función carga la carta de muestra. Importa tus productos desde el panel.','info');
};

// ── HORARIO SEMANAL (editor completo por día) ─────────────
const DAYS = [
  { key: 'lunes',     label: 'Lunes',     default: { open: false } },
  { key: 'martes',   label: 'Martes',    default: { open: false } },
  { key: 'miercoles',label: 'Miércoles', default: { open: true, from: '19:00', to: '23:30' } },
  { key: 'jueves',   label: 'Jueves',    default: { open: true, from: '19:00', to: '23:30' } },
  { key: 'viernes',  label: 'Viernes',   default: { open: true, from: '19:00', to: '23:30' } },
  { key: 'sabado',   label: 'Sábado',    default: { open: true, from: '12:00', to: '23:30' } },
  { key: 'domingo',  label: 'Domingo',   default: { open: true, from: '12:00', to: '23:30' } },
];

async function loadSchedule() {
  const { data } = await db.from('settings').select('*').eq('key', 'weekly_schedule').eq('restaurant_id', RID).single();
  let schedule = {};
  if (data?.value) { try { schedule = JSON.parse(data.value); } catch(e){} }
  renderScheduleGrid(schedule);
  loadSpecialDays();
}

function renderScheduleGrid(schedule) {
  const grid = document.getElementById('weekly-schedule-grid');
  grid.innerHTML = '';
  DAYS.forEach(day => {
    const s = schedule[day.key] || day.default;
    const isOpen = s.open !== false;
    const card = document.createElement('div');
    card.className = `schedule-day-card${!isOpen ? ' closed-day' : ''}`;
    card.id = `day-card-${day.key}`;
    card.innerHTML = `
      <div class="day-header">
        <span class="day-name">${day.label}</span>
        <div class="day-toggle">
          <span style="font-size:0.75rem;color:var(--text-muted);">${isOpen ? 'Abierto' : 'Cerrado'}</span>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-${day.key}" ${isOpen ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div class="time-inputs" id="times-${day.key}" style="${!isOpen ? 'opacity:0.3;pointer-events:none;' : ''}">
        <div class="time-input-group">
          <label>Apertura</label>
          <input type="time" id="from-${day.key}" value="${s.from || '12:00'}">
        </div>
        <div class="time-input-group">
          <label>Cierre</label>
          <input type="time" id="to-${day.key}" value="${s.to || '23:30'}">
        </div>
      </div>`;
    grid.appendChild(card);
    // Toggle open/closed
    document.getElementById(`toggle-${day.key}`).onchange = e => {
      const times = document.getElementById(`times-${day.key}`);
      const label = e.target.closest('.day-toggle').querySelector('span');
      times.style.opacity = e.target.checked ? '1' : '0.3';
      times.style.pointerEvents = e.target.checked ? 'auto' : 'none';
      label.textContent = e.target.checked ? 'Abierto' : 'Cerrado';
      card.classList.toggle('closed-day', !e.target.checked);
    };
  });
}

document.getElementById('save-schedule-btn').onclick = async () => {
  const btn = document.getElementById('save-schedule-btn');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  const schedule = {};
  DAYS.forEach(day => {
    const isOpen = document.getElementById(`toggle-${day.key}`)?.checked || false;
    schedule[day.key] = {
      open: isOpen,
      from: document.getElementById(`from-${day.key}`)?.value || '12:00',
      to:   document.getElementById(`to-${day.key}`)?.value   || '23:30',
    };
  });
  await db.from('settings').upsert({ restaurant_id: RID, key: 'weekly_schedule', value: JSON.stringify(schedule) });
  toast('Horario semanal guardado ✓', 'success');
  btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar Horario Semanal';
};

async function loadSpecialDays() {
  const { data } = await db.from('special_days').select('*').eq('restaurant_id', RID).order('date');
  const tbody = document.getElementById('special-days-body');
  tbody.innerHTML = '';
  if (!data || !data.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:20px;">No hay días especiales.</td></tr>';
    return;
  }
  data.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.date}</strong></td>
      <td>${item.is_closed
        ? '<span style="color:var(--error);font-weight:700;"><i class="fas fa-times-circle"></i> CERRADO</span>'
        : '<span style="color:var(--success);font-weight:700;"><i class="fas fa-check-circle"></i> ABIERTO (excepción)</span>'}</td>
      <td style="text-align:right;"><button class="action-btn delete-btn" onclick="deleteSpecialDay('${item.date}')"><i class="fas fa-trash"></i> Quitar</button></td>`;
    tbody.appendChild(tr);
  });
}

async function setSpecialDay(closed) {
  const d = document.getElementById('special-date-input').value;
  if (!d) { toast('Selecciona una fecha','error'); return; }
  await db.from('special_days').upsert({ restaurant_id: RID, date: d, is_closed: closed });
  loadSpecialDays();
  toast(`Día ${d} marcado como ${closed?'CERRADO':'ABIERTO (excepción)'}`, closed?'error':'success');
}

document.getElementById('add-special-close-btn').onclick = () => setSpecialDay(true);
document.getElementById('add-special-open-btn').onclick  = () => setSpecialDay(false);
window.deleteSpecialDay = async date => {
  await db.from('special_days').delete().eq('date', date).eq('restaurant_id', RID);
  loadSpecialDays();
  toast('Día especial eliminado','info');
};

// ── SECCIONES / CATEGORÍAS ────────────────────────────────
async function loadCategories() {
  const { data } = await db.from('settings').select('*').eq('key','menu_categories').eq('restaurant_id', RID).single();
  let cats = APP_CONFIG.menuCategories;
  if (data?.value) { try { cats = JSON.parse(data.value); } catch(e){} }
  renderCategoriesList(cats);
}

function renderCategoriesList(cats) {
  const list = document.getElementById('categories-list');
  list.innerHTML = '';
  cats.forEach((cat, i) => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--surface-2);border:1.5px solid var(--border);border-radius:12px;';
    div.innerHTML = `
      <span style="font-size:1.1rem;cursor:grab;">⠿</span>
      <input type="text" value="${cat.label}" data-idx="${i}" data-field="label" placeholder="Nombre de sección"
        style="flex:1;padding:8px 12px;background:var(--surface);border:1.5px solid var(--border);border-radius:9px;font-family:var(--font-body);font-size:0.9rem;color:var(--text);outline:none;" onfocus="this.style.borderColor='var(--border-gold)'" onblur="this.style.borderColor='var(--border)'">
      <input type="text" value="${cat.id}" data-idx="${i}" data-field="id" placeholder="id (ej: pizzas)"
        style="width:130px;padding:8px 12px;background:var(--surface);border:1.5px solid var(--border);border-radius:9px;font-family:var(--font-body);font-size:0.85rem;color:var(--text-dim);outline:none;" onfocus="this.style.borderColor='var(--border-gold)'" onblur="this.style.borderColor='var(--border)'">
      <button onclick="removeCategory(${i})" class="action-btn delete-btn" style="flex-shrink:0;"><i class="fas fa-trash"></i></button>`;
    div.querySelectorAll('input').forEach(inp => {
      inp.oninput = () => {
        cats[parseInt(inp.dataset.idx)][inp.dataset.field] = inp.value;
      };
    });
    list.appendChild(div);
  });
  list._cats = cats;
}

window.removeCategory = idx => {
  const list = document.getElementById('categories-list');
  const cats = list._cats;
  if (!confirm(`¿Eliminar la sección "${cats[idx].label}"? Los productos no se borran.`)) return;
  cats.splice(idx, 1);
  renderCategoriesList(cats);
};

document.getElementById('add-category-btn').onclick = () => {
  const list = document.getElementById('categories-list');
  const cats = list._cats || [];
  cats.push({ id: `nueva-seccion-${Date.now()}`, label: 'Nueva Sección', page: 'menu.html', img: '' });
  renderCategoriesList(cats);
};

async function saveCategories() {
  const list = document.getElementById('categories-list');
  const cats = list._cats;
  if (!cats) return;
  await db.from('settings').upsert({ restaurant_id: RID, key: 'menu_categories', value: JSON.stringify(cats) });
  toast('Secciones guardadas ✓', 'success');
}
// Botón guardar categorías (añadido dinámicamente)
setTimeout(() => {
  const catSection = document.querySelector('#tab-categories .section-card');
  if (catSection && !document.getElementById('save-cats-btn')) {
    const btn = document.createElement('button');
    btn.id = 'save-cats-btn';
    btn.className = 'save-btn'; btn.style.marginTop = '14px';
    btn.innerHTML = '<i class="fas fa-save"></i> Guardar Secciones';
    btn.onclick = saveCategories;
    catSection.appendChild(btn);
  }
}, 100);

// ── CONFIGURACIÓN ─────────────────────────────────────────
async function loadConfigTab() {
  const { data } = await db.from('settings').select('*').eq('restaurant_id', RID);
  if (!data) return;
  const map = { ejs_admin_email:'ejs-admin-email', ejs_public_key:'ejs-public-key', ejs_service_id:'ejs-service-id', ejs_template_admin:'ejs-template-admin', ejs_template_client:'ejs-template-client' };
  Object.entries(map).forEach(([key, elId]) => {
    const s = data.find(x => x.key === key);
    if (s) document.getElementById(elId).value = s.value;
  });
}

document.getElementById('save-ejs-btn').onclick = async () => {
  const map = { ejs_admin_email:'ejs-admin-email', ejs_public_key:'ejs-public-key', ejs_service_id:'ejs-service-id', ejs_template_admin:'ejs-template-admin', ejs_template_client:'ejs-template-client' };
  for (const [key, elId] of Object.entries(map)) {
    const value = document.getElementById(elId).value;
    await db.from('settings').upsert({ restaurant_id: RID, key, value });
  }
  toast('Configuración de email guardada ✓','success');
};

document.getElementById('init-db-btn').onclick = () => {
  const sql = `-- Ejecutar en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  name TEXT, category TEXT, price DECIMAL,
  visible BOOLEAN DEFAULT true, is_sugerencia BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 1000, info TEXT,
  image_url TEXT, allergens JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL,
  date DATE, time TEXT, zone TEXT, people INTEGER,
  name TEXT, phone TEXT, email TEXT,
  status TEXT DEFAULT 'pending', zonename TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL, key TEXT, value TEXT,
  UNIQUE(restaurant_id, key)
);
CREATE TABLE IF NOT EXISTS special_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id TEXT NOT NULL, date DATE, is_closed BOOLEAN DEFAULT true,
  UNIQUE(restaurant_id, date)
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(restaurant_id, date);`;
  document.getElementById('db-init-msg').innerHTML =
    `<textarea style="width:100%;height:14rem;background:#000;color:#4ade80;font-family:monospace;padding:12px;border-radius:8px;border:1px solid #333;resize:vertical;">${sql}</textarea>`;
};

// ── QR ────────────────────────────────────────────────────
function loadQR() {
  const url  = APP_CONFIG.siteUrl || window.location.origin;
  document.getElementById('qr-url-display').textContent = url;
  document.getElementById('qr-label').textContent = url;
  const canvas = document.getElementById('qr-canvas');
  QRCode.toCanvas(canvas, url, { width: 240, margin: 2, color: { dark:'#000000', light:'#ffffff' } });
}

document.getElementById('download-qr-btn').onclick = () => {
  const canvas = document.getElementById('qr-canvas');
  const link   = document.createElement('a');
  link.download = `qr_${APP_CONFIG.restaurantId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('QR descargado ✓','success');
};

document.getElementById('print-qr-btn').onclick = () => {
  const canvas = document.getElementById('qr-canvas');
  const win    = window.open('','_blank');
  win.document.write(`<html><body style="text-align:center;font-family:sans-serif;padding:40px;">
    <h2>${APP_CONFIG.barName}</h2>
    <p style="color:#888;margin-bottom:20px;">Escanea para ver nuestra carta</p>
    <img src="${canvas.toDataURL()}" style="width:240px;"><br>
    <p style="font-size:12px;color:#aaa;margin-top:16px;">${APP_CONFIG.siteUrl}</p>
  </body></html>`);
  win.print();
};
