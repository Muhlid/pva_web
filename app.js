let isAdminLoggedIn = false;

// --- NAVİGASYON VE MENÜ ---
function navigate(sectionId) {
    // Tüm sayfaları gizle
    document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
    });
    
    // İstenen sayfayı aç
    const target = document.getElementById(sectionId);
    if(target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
        window.scrollTo(0, 0);
    }
    
    // Mobil menü açıksa kapat
    document.getElementById('mobile-nav').classList.remove('active');
    document.getElementById('mobile-nav-overlay').classList.remove('active');
    
    // Sayfa özel yüklemelerini yap
    if(sectionId === 'news') loadNews();
    if(sectionId === 'events') loadEvents();
    if(sectionId === 'home') loadHomePreviews();
}

function toggleMobileMenu() {
    document.getElementById('mobile-nav').classList.toggle('active');
    document.getElementById('mobile-nav-overlay').classList.toggle('active');
}

// --- VERİ YÖNETİMİ ---
function getSafeData(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
}

// --- ADMIN PANELİ ---
function openAdminModal(type) {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminType').value = type;
    document.getElementById('loginArea').style.display = 'block';
    document.getElementById('addEventArea').style.display = 'none';
    document.getElementById('addNewsArea').style.display = 'none';
    document.getElementById('adminPass').value = '';
}
function closeAdminModal() { document.getElementById('adminModal').style.display = 'none'; }

function checkAdminPass() {
    if(document.getElementById('adminPass').value === "pva2026") {
        isAdminLoggedIn = true;
        document.getElementById('loginArea').style.display = 'none';
        
        const type = document.getElementById('adminType').value;
        if(type === 'event') document.getElementById('addEventArea').style.display = 'block';
        if(type === 'news') document.getElementById('addNewsArea').style.display = 'block';
        
        loadNews(); loadEvents(); // Admin butonlarını görünür yapmak için yenile
    } else { alert("Incorrect Password!"); }
}

// --- NEWS (HABERLER) İŞLEMLERİ ---
function addNews() {
    const title = document.getElementById('newsTitleInput').value;
    const content = document.getElementById('newsContentInput').value;
    const date = document.getElementById('newsDateInput').value;
    const img = document.getElementById('newsImgInput').value;

    if(!title || !content) return alert("Title and Content required!");

    const data = getSafeData('pva_news');
    data.unshift({id: Date.now(), title, content, date, img});
    localStorage.setItem('pva_news', JSON.stringify(data));
    
    closeAdminModal();
    loadNews(); // Listeyi yenile
    loadHomePreviews(); // Ana sayfayı yenile
    alert("News Published!");
}

function loadNews() {
    const container = document.getElementById('local-news-container');
    if(!container) return; // Eğer news sayfasında değilsek dur
    
    container.innerHTML = ""; // Temizle
    const data = getSafeData('pva_news');

    if (data.length === 0) {
        container.innerHTML = "<p style='color:#ccc;'>No active news found.</p>";
        return;
    }

    data.forEach(n => {
        let delBtn = isAdminLoggedIn ? `<button onclick="delItem('pva_news', ${n.id})" style="background:red; color:white; border:none; padding:5px 10px; margin-top:10px; cursor:pointer;">Delete</button>` : "";
        let imgHtml = n.img ? `<div style="width:100%; height:200px; background:url('${n.img}') center/cover; border-radius:5px; margin-bottom:10px;"></div>` : "";
        
        container.innerHTML += `
        <div class="news-item" style="background:rgba(255,255,255,0.05); border-left:4px solid var(--pva-gold); padding:20px; margin-bottom:20px; border-radius:10px; text-align:left;">
            ${imgHtml}
            <h3 style="color:var(--pva-gold); margin-top:0;">${n.title}</h3>
            <p style="color:#ddd; line-height:1.6;">${n.content}</p>
            <small style="color:#aaa;"><i class="far fa-calendar"></i> ${n.date}</small><br>
            ${delBtn}
        </div>`;
    });
}

// --- EVENTS (ETKİNLİKLER) İŞLEMLERİ ---
function addEvent() {
    // Form verilerini al
    const server = document.getElementById('evServer').value || "Expert Server";
    const route = document.getElementById('evRoute').value;
    const aircraft = document.getElementById('evAircraft').value || "Any";
    const ete = document.getElementById('evETE').value || "TBD";
    const multiplier = document.getElementById('evMultiplier').value || "1.0x";
    const time = document.getElementById('evTime').value; // UTC Saati
    const date = document.getElementById('evDate').value;
    const img = document.getElementById('evImg').value;

    if(!route || !date || !time) return alert("Route, Date and Time are required!");

    const data = getSafeData('pva_events');
    data.unshift({
        id: Date.now(),
        server, route, aircraft, ete, multiplier, time, date, img
    });
    localStorage.setItem('pva_events', JSON.stringify(data));
    
    closeAdminModal();
    loadEvents();
    loadHomePreviews();
    alert("Event Published!");
}

function loadEvents() {
    const list = document.getElementById('events-list');
    if(!list) return;
    
    list.innerHTML = "";
    const data = getSafeData('pva_events');

    if (data.length === 0) {
        list.innerHTML = "<p style='color:#ccc;'>No upcoming events.</p>";
        return;
    }

    data.forEach(e => {
        let delBtn = isAdminLoggedIn ? `<button onclick="delItem('pva_events', ${e.id})" style="background:red; color:white; border:none; padding:5px 10px; margin-top:10px; cursor:pointer;">Delete</button>` : "";
        let imgHtml = e.img ? `<div style="width:100%; height:150px; background:url('${e.img}') center/cover; border-radius:5px; margin-bottom:10px;"></div>` : "";
        
        // --- UTC SAATİ YEREL SAATE ÇEVİRME ---
        // Gelen tarih ve saat stringini birleştir (Örn: 2026-02-12T19:00:00Z)
        const utcDateStr = `${e.date}T${e.time}:00Z`;
        const dateObj = new Date(utcDateStr);
        
        // Yerel saati al (Tarayıcının saatine göre)
        const localTimeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        const timeDisplay = `${e.time}Z (${localTimeStr} Local)`;
        // -------------------------------------

        list.innerHTML += `
        <div class="event-card" style="background:rgba(255,255,255,0.05); border-top:3px solid var(--pva-gold); padding:20px; margin-bottom:20px; border-radius:10px; text-align:left;">
            ${imgHtml}
            <h3 style="color:var(--pva-gold); margin-top:0;">${e.route}</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.9rem; color:#ccc;">
                <div><strong>Server:</strong> ${e.server}</div>
                <div><strong>Aircraft:</strong> ${e.aircraft}</div>
                <div><strong>ETE:</strong> ${e.ete}</div>
                <div><strong>Multiplier:</strong> ${e.multiplier}</div>
                <div style="grid-column: 1 / -1; color:white; margin-top:10px;">
                    <i class="far fa-clock"></i> <strong>Time:</strong> ${timeDisplay} <br>
                    <i class="far fa-calendar"></i> <strong>Date:</strong> ${e.date}
                </div>
            </div>
            ${delBtn}
        </div>`;
    });
}

// --- ANA SAYFA ÖNİZLEME (PREVIEW) ---
function loadHomePreviews() {
    const n = getSafeData('pva_news')[0];
    const e = getSafeData('pva_events')[0];
    
    const np = document.getElementById('home-news-preview');
    const ep = document.getElementById('home-event-preview');
    
    if(np && n) {
        let imgHtml = n.img ? `<div style="width:100%; height:120px; background:url('${n.img}') center/cover; border-radius:5px; margin-bottom:10px;"></div>` : "";
        np.innerHTML = `
            ${imgHtml}
            <h3><i class="fas fa-bullhorn"></i> LATEST NEWS</h3>
            <h4 style="color:white; margin:5px 0;">${n.title}</h4>
            <p style="color:#ccc; font-size:0.9rem;">${n.content.substring(0, 60)}...</p>
            <button class="update-btn" onclick="navigate('news')">READ MORE</button>
        `;
    }

    if(ep && e) {
        // Ana sayfada da yerel saati gösterelim
        const utcDateStr = `${e.date}T${e.time}:00Z`;
        const dateObj = new Date(utcDateStr);
        const localTimeStr = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});

        ep.innerHTML = `
            <h3><i class="fas fa-plane-departure"></i> NEXT FLIGHT</h3>
            <div style="font-size:1.1rem; font-weight:bold; color:white; margin:10px 0;">${e.route}</div>
            <div style="font-size:0.9rem; color:#aaa; margin-bottom:5px;">${e.aircraft}</div>
            <div style="font-size:0.9rem; color:var(--pva-gold); font-weight:bold;">
                ${e.time}Z (${localTimeStr} Local)
            </div>
            <button class="update-btn" onclick="navigate('events')" style="margin-top:10px;">DETAILS</button>
        `;
    }
}

// --- SİLME FONKSİYONU ---
function delItem(key, id) {
    if(confirm("Are you sure you want to delete this item?")) {
        let data = getSafeData(key).filter(i => i.id !== id);
        localStorage.setItem(key, JSON.stringify(data));
        loadNews(); loadEvents(); loadHomePreviews();
    }
}

// --- LIGHTBOX ---
function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxModal').style.display = 'flex';
}
function closeLightbox() { document.getElementById('lightboxModal').style.display = 'none'; }

// SAYFA YÜKLENİNCE BAŞLAT
document.addEventListener('DOMContentLoaded', () => {
    loadHomePreviews();
});
