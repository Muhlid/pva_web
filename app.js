let isAdminLoggedIn = false;
let isPilotLoggedIn = false; // Yeni Pilot Giriş Durumu

// NAVİGASYON
function navigate(sectionId) {
    document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
    });
    
    const target = document.getElementById(sectionId);
    if(target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
        window.scrollTo(0, 0);
    }
    
    document.getElementById('mobile-nav').classList.remove('active');
    document.getElementById('mobile-nav-overlay').classList.remove('active');
    
    if(sectionId === 'news') loadNews();
    if(sectionId === 'events') loadEvents();
    if(sectionId === 'home') loadHomePreviews();
    if(sectionId === 'pilots') loadPilots(); // Roster sayfasına tıklandığında listeyi çek
}

function toggleMobileMenu() {
    document.getElementById('mobile-nav').classList.toggle('active');
    document.getElementById('mobile-nav-overlay').classList.toggle('active');
}

function closeIntro() {
    const intro = document.getElementById('intro-overlay');
    if (intro) {
        intro.style.opacity = '0';
        setTimeout(() => {
            intro.style.visibility = 'hidden';
            intro.style.display = 'none';
        }, 1000);
    }
}

// VERİ İŞLEMLERİ (Pilotları otomatik yüklemek için güncellendi)
function getSafeData(key) {
    try { 
        let data = JSON.parse(localStorage.getItem(key));
        // Eğer pilot listesi tamamen boşsa, Yönetim Ekibini varsayılan olarak ekle
        if (!data && key === 'pva_pilots') {
            data = [
                { id: 1, callsign: "PVA001", name: "Mughees Hassan", rank: "CEO", hours: "1500+" },
                { id: 2, callsign: "PVA002", name: "Rohaan Aamir", rank: "COO", hours: "1200+" },
                { id: 3, callsign: "PVA007", name: "Muhlis", rank: "Digital Manager", hours: "850+" }
            ];
            localStorage.setItem('pva_pilots', JSON.stringify(data));
        }
        return data || []; 
    } catch(e) { return []; }
}

// MODAL AÇ/KAPAT
function openAdminModal(type) {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminType').value = type;
    document.getElementById('loginArea').style.display = 'block';
    document.getElementById('addEventArea').style.display = 'none';
    document.getElementById('addNewsArea').style.display = 'none';
    document.getElementById('adminPass').value = '';
}
function closeAdminModal() { document.getElementById('adminModal').style.display = 'none'; }

function openPilotModal() {
    document.getElementById('mobile-nav').classList.remove('active');
    document.getElementById('mobile-nav-overlay').classList.remove('active');
    document.getElementById('pilotModal').style.display = 'flex';
    document.getElementById('pilotPass').value = ''; 
}
function closePilotModal() { document.getElementById('pilotModal').style.display = 'none'; }

function openPilotRegisterModal() { document.getElementById('pilotRegisterModal').style.display = 'flex'; }
function closePilotRegisterModal() { document.getElementById('pilotRegisterModal').style.display = 'none'; }

// ŞİFRE KONTROLLERİ (Kriptolu)
function checkAdminPass() {
    const pass = document.getElementById('adminPass').value;
    if(btoa(pass) === "cHZhMjAyNg==") { // pva2026
        isAdminLoggedIn = true;
        document.getElementById('loginArea').style.display = 'none';
        const type = document.getElementById('adminType').value;
        if(type === 'event') document.getElementById('addEventArea').style.display = 'block';
        if(type === 'news') document.getElementById('addNewsArea').style.display = 'block';
        loadNews(); loadEvents(); loadPilots(); // Admin giriş yapınca her yerde silme butonları açılsın
    } else { alert("Incorrect Password!"); }
}

function checkPilotPass() {
    const pass = document.getElementById('pilotPass').value;
    if(btoa(pass) === "cHZhMTIz") {  // pva123
        isPilotLoggedIn = true;
        closePilotModal();
        navigate('pilots'); // Roster'a atar
        loadPilots(); // "Register Profile" butonunu görünür yapar
    } else { alert("Access Denied! Incorrect Pilot Password."); }
}

// PİLOT LİSTESİ İŞLEMLERİ (YENİ)
function addPilot() {
    const callsign = document.getElementById('pCallsign').value;
    const name = document.getElementById('pName').value;
    const rank = document.getElementById('pRank').value;
    const hours = document.getElementById('pHours').value;

    if(!callsign || !name || !hours) return alert("Callsign, Name and Hours are required!");

    const data = getSafeData('pva_pilots');
    data.push({ id: Date.now(), callsign, name, rank, hours }); // Yeni pilotu listeye ekle
    localStorage.setItem('pva_pilots', JSON.stringify(data));
    
    closePilotRegisterModal();
    loadPilots();
    alert("Profile Successfully Registered!");
}

function deletePilot(id) {
    if(confirm("Are you sure you want to remove this pilot from the roster?")) {
        let data = getSafeData('pva_pilots').filter(p => p.id !== id);
        localStorage.setItem('pva_pilots', JSON.stringify(data));
        loadPilots();
    }
}

function loadPilots() {
    const tbody = document.getElementById('pilot-roster-body');
    const addBtn = document.getElementById('addPilotBtn');
    if(!tbody) return;

    // Ekleme butonunu sadece Pilot veya Admin giriş yapmışsa göster
    if(addBtn) {
        addBtn.style.display = (isPilotLoggedIn || isAdminLoggedIn) ? "inline-block" : "none";
    }

    tbody.innerHTML = "";
    const pilots = getSafeData('pva_pilots');

    if(pilots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding:15px; text-align:center;">No pilots registered yet.</td></tr>`;
        return;
    }

    pilots.forEach(p => {
        // Eğer admin giriş yaptıysa, pilot isminin yanına kırmızı sil butonu koy
        let delBtn = isAdminLoggedIn ? `<button onclick="deletePilot(${p.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; float:right;"><i class="fas fa-trash"></i></button>` : "";
        
        tbody.innerHTML += `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:15px; font-weight:bold; color:var(--pva-green);">${p.callsign}</td>
            <td style="padding:15px;">${p.name}</td>
            <td style="padding:15px;">${p.rank}</td>
            <td style="padding:15px;">${p.hours} ${delBtn}</td>
        </tr>`;
    });
}

// HABER VE ETKİNLİK İŞLEMLERİ
function addNews() {
    const title = document.getElementById('newsTitleInput').value;
    const content = document.getElementById('newsContentInput').value;
    const date = document.getElementById('newsDateInput').value;
    const img = document.getElementById('newsImgInput').value || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800';

    if(!title || !content) return alert("Title and Content required!");

    const data = getSafeData('pva_news');
    data.unshift({id: Date.now(), title, content, date, img});
    localStorage.setItem('pva_news', JSON.stringify(data));
    closeAdminModal(); loadNews(); loadHomePreviews();
}

function addEvent() {
    const server = document.getElementById('evServer').value || "Expert";
    const route = document.getElementById('evRoute').value;
    const aircraft = document.getElementById('evAircraft').value || "Any";
    const time = document.getElementById('evTime').value;
    const date = document.getElementById('evDate').value;
    const img = document.getElementById('evImg').value || 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=800';

    if(!route || !date || !time) return alert("Route, Date and Time required!");

    const data = getSafeData('pva_events');
    data.unshift({ id: Date.now(), server, route, aircraft, time, date, img });
    localStorage.setItem('pva_events', JSON.stringify(data));
    closeAdminModal(); loadEvents(); loadHomePreviews();
}

function loadHomePreviews() {
    const newsData = getSafeData('pva_news');
    const eventData = getSafeData('pva_events');
    const np = document.getElementById('new-home-news');
    const ep = document.getElementById('new-home-event');
    
    if(np) {
        np.innerHTML = "";
        newsData.slice(0, 3).forEach(n => {
            np.innerHTML += `
            <div class="clean-card">
                <img src="${n.img}">
                <div class="card-body">
                    <h3>${n.title}</h3>
                    <p>${n.content.substring(0, 70)}...</p>
                    <span class="card-meta">Published on ${n.date}</span>
                </div>
            </div>`;
        });
    }

    if(ep) {
        ep.innerHTML = "";
        eventData.slice(0, 3).forEach(e => {
            const localStr = new Date(`${e.date}T${e.time}:00Z`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
            ep.innerHTML += `
            <div class="clean-card">
                <img src="${e.img}">
                <div class="card-body">
                    <h3>${e.route}</h3>
                    <p>Aircraft: ${e.aircraft}<br>Server: ${e.server}</p>
                    <span class="card-meta">Starts on ${e.date} at ${e.time}Z (${localStr} Local)</span>
                </div>
            </div>`;
        });
    }
}

function loadNews() {
    const cont = document.getElementById('local-news-container');
    if(!cont) return;
    cont.innerHTML = "";
    getSafeData('pva_news').forEach(n => {
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_news', ${n.id})" style="color:red; cursor:pointer; background:none; border:none; margin-top:10px;">Delete</button>` : "";
        cont.innerHTML += `
        <div class="clean-card">
            <img src="${n.img}">
            <div class="card-body"><h3>${n.title}</h3><p>${n.content}</p><span class="card-meta">Published on ${n.date} ${btn}</span></div>
        </div>`;
    });
}

function loadEvents() {
    const cont = document.getElementById('events-list');
    if(!cont) return;
    cont.innerHTML = "";
    getSafeData('pva_events').forEach(e => {
        const localStr = new Date(`${e.date}T${e.time}:00Z`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_events', ${e.id})" style="color:red; cursor:pointer; background:none; border:none; margin-top:10px;">Delete</button>` : "";
        cont.innerHTML += `
        <div class="clean-card">
            <img src="${e.img}">
            <div class="card-body"><h3>${e.route}</h3><p>Aircraft: ${e.aircraft}<br>Server: ${e.server}</p><span class="card-meta">Starts on ${e.date} at ${e.time}Z (${localStr} Local) ${btn}</span></div>
        </div>`;
    });
}

function delItem(key, id) {
    if(confirm("Delete item?")) {
        let data = getSafeData(key).filter(i => i.id !== id);
        localStorage.setItem(key, JSON.stringify(data));
        loadNews(); loadEvents(); loadHomePreviews();
    }
}

// LİGHTBOX
function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightboxModal').style.display = 'flex';
}
function closeLightbox() { document.getElementById('lightboxModal').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', () => {
    loadHomePreviews();
    const introVideo = document.getElementById('pva-intro-video');
    if (introVideo) {
        introVideo.onended = () => closeIntro();
        setTimeout(() => closeIntro(), 10000); 
    }
});
