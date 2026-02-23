// --- FIREBASE BULUT (CLOUD) BAĞLANTISI ---
const firebaseConfig = {
    apiKey: "AIzaSyC6GMkseNNX2bZ-WffaLkcJxobH9IpaIG4",
    authDomain: "pvalog-b8ea7.firebaseapp.com",
    projectId: "pvalog-b8ea7",
    storageBucket: "pvalog-b8ea7.firebasestorage.app",
    messagingSenderId: "1010465903072",
    appId: "1:1010465903072:web:54b5de0f1fdc93e2405b85"
};

// Firebase'i Başlat
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- GLOBAL DEĞİŞKENLER ---
let isAdminLoggedIn = false;
let isPilotLoggedIn = false;
let currentLoggedPilot = null; 

// --- NAVİGASYON MOTORU (GÜNCEL SÜRÜM) ---
function navigate(sectionId) {
    // 1. Tüm sayfaları gizle
    document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
    });
    
    // 2. Hedef sayfayı bul ve aktif et
    const target = document.getElementById(sectionId);
    if(target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
        window.scrollTo(0, 0); // Sayfayı en üste kaydır
    }
    
    // 3. Mobil menü açıksa kapat
    const mobNav = document.getElementById('mobile-nav');
    const mobOverlay = document.getElementById('mobile-nav-overlay');
    if(mobNav) mobNav.classList.remove('active');
    if(mobOverlay) mobOverlay.classList.remove('active');
    
    // 4. SAYFA TETİKLEYİCİLERİ (Global Veri Senkronizasyonu)
    // Her sayfa açıldığında buluttan en güncel veriyi çeker
    if(sectionId === 'news') loadNews();
    if(sectionId === 'events') loadEvents();
    if(sectionId === 'home') loadHomePreviews();
    if(sectionId === 'pilots') loadPilots(); 
    if(sectionId === 'radar') loadLiveRadar(); // Radar artık burada tetikleniyor!
}

function toggleMobileMenu() {
    document.getElementById('mobile-nav').classList.toggle('active');
    document.getElementById('mobile-nav-overlay').classList.toggle('active');
}

// --- MODAL AÇ/KAPAT ---
function openAdminModal() {
    document.getElementById('adminModal').style.display = 'flex';
    if(isAdminLoggedIn) {
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminControlPanel').style.display = 'block';
        switchAdminTab('pending');
    } else {
        document.getElementById('loginArea').style.display = 'block';
        document.getElementById('adminControlPanel').style.display = 'none';
        document.getElementById('adminPass').value = '';
    }
}
function closeAdminModal() { document.getElementById('adminModal').style.display = 'none'; }

function openPilotModal() {
    document.getElementById('pilotModal').style.display = 'flex';
    resetPilotModal();
}
function closePilotModal() { document.getElementById('pilotModal').style.display = 'none'; }

// --- PİLOT MENÜ & STEP-BY-STEP ---
function resetPilotModal() {
    document.getElementById('pilotChoiceArea').style.display = 'block';
    document.getElementById('pilotLoginArea').style.display = 'none';
    document.getElementById('pilotRegisterArea').style.display = 'none';
    if(document.getElementById('regStep1')) nextRegStep(1); 
}
function showPilotLogin() {
    document.getElementById('pilotChoiceArea').style.display = 'none';
    document.getElementById('pilotLoginArea').style.display = 'block';
}
function showPilotRegister() {
    document.getElementById('pilotChoiceArea').style.display = 'none';
    document.getElementById('pilotRegisterArea').style.display = 'block';
}
function nextRegStep(stepNum) {
    const s1 = document.getElementById('regStep1');
    const s2 = document.getElementById('regStep2');
    const s3 = document.getElementById('regStep3');
    if(s1 && s2 && s3) {
        s1.style.display = 'none';
        s2.style.display = 'none';
        s3.style.display = 'none';
        document.getElementById('regStep' + stepNum).style.display = 'block';
    }
}

function updateNavbarUI() {
    const navLoginBtn = document.getElementById('navPilotLoginBtn');
    const navProfile = document.getElementById('navPilotProfile');
    const displayName = document.getElementById('displayPilotName');
    
    if(navLoginBtn && navProfile && displayName) {
        if(isPilotLoggedIn && currentLoggedPilot) {
            navLoginBtn.style.display = 'none';
            navProfile.style.display = 'flex'; 
            displayName.innerText = currentLoggedPilot.callsign;
        } else {
            navLoginBtn.style.display = 'flex';
            navProfile.style.display = 'none';
        }
    }
}

// --- PİLOT BAŞVURU (GLOBAL WAITING ROOM SİSTEMİ) ---
async function submitPilotApplication() {
    const callsign = document.getElementById('regCallsign').value.trim().toUpperCase();
    const name = document.getElementById('regName').value.trim();
    const discord = document.getElementById('regDiscord').value.trim() || "-";
    const rank = document.getElementById('regRank').value;
    const hours = document.getElementById('regHours').value;
    const pass = document.getElementById('regPass').value;

    if(!callsign || !name || !hours || !pass) {
        return alert("Please fill all required fields in all steps!");
    }

    // Buluttan bu isimde biri var mı kontrol et
    const activeQ = await db.collection('pva_pilots').where('callsign', '==', callsign).get();
    const pendingQ = await db.collection('pva_pending').where('callsign', '==', callsign).get();
    
    if(!activeQ.empty || !pendingQ.empty) {
        return alert("Registration Failed: This Callsign is already in use or pending approval!");
    }

    // Bulut bekleme odasına yaz
    await db.collection('pva_pending').add({
        callsign, name, discord, rank, hours, password: btoa(pass), 
        date: new Date().toLocaleDateString(), timestamp: Date.now()
    });
    
    alert("Application Submitted!\nYour application is now in the Global Waiting Room. You can login once a Staff member approves it.");
    closePilotModal();
}

// --- PİLOT GİRİŞİ (BULUT KONTROL) ---
async function pilotLogin() {
    const callsign = document.getElementById('loginCallsign').value.trim().toUpperCase();
    const pass = document.getElementById('loginPass').value;
    const encodedPass = btoa(pass);
    
    // Aktiflerde ara
    const activeQ = await db.collection('pva_pilots').where('callsign', '==', callsign).where('password', '==', encodedPass).get();
    if(!activeQ.empty) {
        currentLoggedPilot = activeQ.docs[0].data();
        isPilotLoggedIn = true;
        updateNavbarUI();
        closePilotModal();
        navigate('pilots');
        return;
    } 
    
    // Bekleyenlerde ara
    const pendingQ = await db.collection('pva_pending').where('callsign', '==', callsign).where('password', '==', encodedPass).get();
    if(!pendingQ.empty) {
        alert("Account Status: PENDING\nYour application is still under review by the Staff. Please check back later.");
    } else {
        alert("Login Failed: Incorrect Callsign or Password, or account does not exist.");
    }
}

function pilotLogout() {
    currentLoggedPilot = null;
    isPilotLoggedIn = false;
    updateNavbarUI();
    navigate('home');
}

// --- ADMIN SİSTEMİ VE ONAYLAMA SÜRECİ ---
function checkAdminPass() {
    const pass = document.getElementById('adminPass').value;
    if(btoa(pass) === "cHZhMjAyNg==") { 
        isAdminLoggedIn = true;
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminControlPanel').style.display = 'block';
        switchAdminTab('pending');
        loadNews(); 
        loadEvents();
        loadPilots();
    } else { 
        alert("Access Denied!"); 
    }
}

function switchAdminTab(tab) {
    document.getElementById('pendingPilotsArea').style.display = 'none';
    document.getElementById('addEventArea').style.display = 'none';
    document.getElementById('addNewsArea').style.display = 'none';

    if(tab === 'pending') { document.getElementById('pendingPilotsArea').style.display = 'block'; loadPendingPilots(); }
    if(tab === 'event') document.getElementById('addEventArea').style.display = 'block';
    if(tab === 'news') document.getElementById('addNewsArea').style.display = 'block';
}

// --- BULUTTAN BEKLEYENLERİ ÇEK ---
async function loadPendingPilots() {
    const cont = document.getElementById('pending-list');
    if(!cont) return;
    cont.innerHTML = "<p style='text-align:center;'>Syncing from Global Cloud...</p>";
    
    const snapshot = await db.collection('pva_pending').orderBy('timestamp', 'desc').get();
    cont.innerHTML = "";
    
    if(snapshot.empty) {
        cont.innerHTML = "<p style='text-align:center; color:#888;'>Waiting room is empty.</p>";
        return;
    }

    snapshot.forEach(docSnap => {
        const p = docSnap.data();
        const docId = docSnap.id;
        cont.innerHTML += `
        <div style="background:#f9f9f9; border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px;">
            <strong style="color:var(--pva-green); font-size:1.1rem;">${p.callsign}</strong> - ${p.name}<br>
            <span style="font-size:0.85rem; color:#666;">Rank: ${p.rank} | Hours: ${p.hours} | Discord: ${p.discord}</span><br>
            <div style="margin-top:10px; display:flex; gap:10px;">
                <button onclick="approvePilot('${docId}')" style="background:green; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;"><i class="fas fa-check"></i> Approve</button>
                <button onclick="rejectPilot('${docId}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;"><i class="fas fa-times"></i> Reject</button>
            </div>
        </div>`;
    });
}

async function approvePilot(docId) {
    const docRef = db.collection('pva_pending').doc(docId);
    const docSnap = await docRef.get();
    
    if(docSnap.exists) {
        const pilotData = docSnap.data();
        await db.collection('pva_pilots').add(pilotData); // Aktife taşı
        await docRef.delete(); // Bekleyenlerden sil
        
        loadPendingPilots();
        loadPilots();
        alert(pilotData.callsign + " has been successfully approved globally!");
    }
}

async function rejectPilot(docId) {
    if(confirm("Are you sure you want to REJECT and delete this application from the Cloud?")) {
        await db.collection('pva_pending').doc(docId).delete();
        loadPendingPilots();
    }
}

// --- BULUTTAN ROSTER (PİLOTLAR) ÇEK ---
async function loadPilots() {
    const tbody = document.getElementById('pilot-roster-body');
    if(!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Syncing Database...</td></tr>`;

    const snapshot = await db.collection('pva_pilots').get();
    tbody.innerHTML = "";

    if(snapshot.empty) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:15px; text-align:center; color:#888;">No pilots registered yet.</td></tr>`;
        return;
    }

    snapshot.forEach(docSnap => {
        const p = docSnap.data();
        const docId = docSnap.id;
        let delBtn = isAdminLoggedIn ? `<button onclick="deletePilot('${docId}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; float:right;"><i class="fas fa-trash"></i></button>` : "";
        
        tbody.innerHTML += `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:15px; font-weight:bold; color:var(--pva-green);">${p.callsign}</td>
            <td style="padding:15px;">${p.name}</td>
            <td style="padding:15px;"><i class="fab fa-discord" style="color:#7289da;"></i> ${p.discord || "-"}</td>
            <td style="padding:15px;">${p.rank}</td>
            <td style="padding:15px;">${p.hours} ${delBtn}</td>
        </tr>`;
    });
}

async function deletePilot(docId) {
    let pass = prompt("SECURITY CLEARANCE REQUIRED:\nPlease enter the Admin Password:");
    if (pass && btoa(pass) === "cHZhMjAyNg==") {
        if(confirm("Password Verified! Are you sure you want to completely remove this pilot?")) {
            await db.collection('pva_pilots').doc(docId).delete();
            loadPilots();
            alert("Pilot successfully removed from Global Database.");
        }
    } else { alert("Access Denied!"); }
}

// --- BULUT HABER VE ETKİNLİK EKLEME ---
async function addNews() {
    const title = document.getElementById('newsTitleInput').value.trim();
    const content = document.getElementById('newsContentInput').value.trim();
    const date = document.getElementById('newsDateInput').value;
    const img = document.getElementById('newsImgInput').value.trim() || 'https://i.ibb.co/mVTDxrzD/image-1.png';

    if(!title || !content) return alert("Title and Content required!");

    await db.collection('pva_news').add({ id: Date.now(), title, content, date, img });
    
    alert("News Published Globally!");
    document.getElementById('newsTitleInput').value = '';
    document.getElementById('newsContentInput').value = '';
    document.getElementById('newsImgInput').value = '';
    loadNews(); loadHomePreviews();
}

async function addEvent() {
    const server = document.getElementById('evServer').value.trim() || "Expert";
    const route = document.getElementById('evRoute').value.trim();
    const aircraft = document.getElementById('evAircraft').value.trim() || "Any";
    const time = document.getElementById('evTime').value;
    const date = document.getElementById('evDate').value;
    const img = document.getElementById('evImg').value.trim() || 'https://i.ibb.co/mVTDxrzD/image-1.png';

    if(!route || !date || !time) return alert("Route, Date and Time required!");

    await db.collection('pva_events').add({ id: Date.now(), server, route, aircraft, time, date, img });
    
    alert("Event Published Globally!");
    document.getElementById('evRoute').value = '';
    document.getElementById('evImg').value = '';
    loadEvents(); loadHomePreviews();
}

// --- BULUTTAN ÇEKİCİLER (ANA SAYFA, HABERLER, ETKİNLİKLER) ---
async function loadHomePreviews() { 
    const np = document.getElementById('new-home-news'); const ep = document.getElementById('new-home-event');
    
    if(np) { 
        np.innerHTML = "<p>Syncing News...</p>"; 
        const snapNews = await db.collection('pva_news').orderBy('id', 'desc').limit(3).get();
        np.innerHTML = ""; 
        snapNews.forEach(docSnap => { 
            const n = docSnap.data();
            np.innerHTML += `<div class="clean-card"><img src="${n.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${n.title}</h3><p style="color:#666;">${n.content.substring(0, 70)}...</p><span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;">Published on ${n.date}</span></div></div>`; 
        }); 
    }
    if(ep) { 
        ep.innerHTML = "<p>Syncing Events...</p>"; 
        const snapEv = await db.collection('pva_events').orderBy('id', 'desc').limit(3).get();
        ep.innerHTML = ""; 
        snapEv.forEach(docSnap => { 
            const e = docSnap.data();
            const localStr = new Date(`${e.date}T${e.time}:00Z`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}); 
            ep.innerHTML += `<div class="clean-card"><img src="${e.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${e.route}</h3><p style="color:#666;">Aircraft: ${e.aircraft}<br>Server: ${e.server}</p><span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;">Starts on ${e.date} at ${e.time}Z (${localStr} Local)</span></div></div>`; 
        }); 
    }
}

async function loadNews() { 
    const activeCont = document.getElementById('local-news-container'); const pastCont = document.getElementById('past-news-container');
    if(!activeCont || !pastCont) return; 
    activeCont.innerHTML = "<p>Syncing...</p>"; pastCont.innerHTML = "";
    
    const snapshot = await db.collection('pva_news').orderBy('id', 'desc').get();
    activeCont.innerHTML = ""; 
    
    let activeCount = 0; let pastCount = 0;
    snapshot.forEach(docSnap => {
        const n = docSnap.data();
        const docId = docSnap.id;
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_news', '${docId}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; margin-top:10px; cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>` : "";
        const cardHTML = `<div class="clean-card"><img src="${n.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${n.title}</h3><p style="color:#666; font-size:0.9rem;">${n.content}</p><span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;"><i class="far fa-calendar"></i> Published on ${n.date} ${btn}</span></div></div>`;
        if(activeCount < 3) { activeCont.innerHTML += cardHTML; activeCount++; } else { pastCont.innerHTML += cardHTML; pastCount++; }
    });
}

async function loadEvents() { 
    const activeCont = document.getElementById('events-list'); const pastCont = document.getElementById('past-events-list');
    if(!activeCont || !pastCont) return; 
    activeCont.innerHTML = "<p>Syncing...</p>"; pastCont.innerHTML = "";
    
    const snapshot = await db.collection('pva_events').get();
    activeCont.innerHTML = ""; 
    const now = new Date(); let activeCount = 0; let pastCount = 0;
    
    snapshot.forEach(docSnap => {
        const e = docSnap.data();
        const docId = docSnap.id;
        const eventDate = new Date(`${e.date}T${e.time}:00Z`); const localStr = eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_events', '${docId}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; margin-top:10px; cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>` : "";
        const cardHTML = `<div class="clean-card"><img src="${e.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${e.route}</h3><p style="color:#666; font-size:0.9rem;">Aircraft: ${e.aircraft}<br>Server: ${e.server}</p><span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;"><i class="far fa-clock"></i> ${e.time}Z (${localStr} Local) <br><i class="far fa-calendar"></i> ${e.date} ${btn}</span></div></div>`;
        if(eventDate >= now) { activeCont.innerHTML += cardHTML; activeCount++; } else { pastCont.innerHTML += cardHTML; pastCount++; }
    });
}

async function delItem(col, docId) {
    let pass = prompt("SECURITY CLEARANCE REQUIRED:\nPlease enter the Admin Password:");
    if (pass && btoa(pass) === "cHZhMjAyNg==") {
        if(confirm("Are you sure? This will delete the item globally!")) { 
            await db.collection(col).doc(docId).delete(); 
            loadNews(); loadEvents(); loadHomePreviews(); 
        }
    } else { alert("Access Denied!"); }
}

// --- LIGHTBOX (GALERİ) KONTROLÜ ---
function openLightbox(src) { 
    document.getElementById('lightboxImg').src = src; 
    document.getElementById('lightboxModal').style.display = 'flex'; 
}
function closeLightbox() { document.getElementById('lightboxModal').style.display = 'none'; }

// --- SAYFA YÜKLENDİĞİNDE ---
document.addEventListener('DOMContentLoaded', () => {
    loadHomePreviews();
    updateNavbarUI();
});
                
// --- GLOBAL CANLI RADAR (REPLIT ENTEGRASYONLU) ---
async function loadLiveRadar() {
    const radarCont = document.getElementById('live-radar-display');
    const adminTool = document.getElementById('admin-radar-tool');
    
    if(!radarCont) return;

    // Replit üzerindeki canlı takip sistemi linkin
    const radarUrl = "https://pva-global--muhliscan.replit.app/";

    // Admin kontrolü: Replit otomatik çalıştığı için admin paneline artık gerek yok
    // Ama yine de alanı temiz tutmak için admin aracını gizliyoruz
    if (adminTool) {
        adminTool.style.display = 'none';
    }

    // Radar alanına Replit sayfasını interaktif bir pencere (iframe) olarak gömüyoruz
    radarCont.innerHTML = `
        <div style="width: 100%; height: 650px; position: relative; background: #111; border-radius: 10px; overflow: hidden;">
            <iframe 
                src="${radarUrl}" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
                allowfullscreen 
                loading="lazy"
                title="PVA Global Operations Center">
            </iframe>
        </div>
        <p style="color:#888; font-size: 0.8rem; margin-top: 10px; text-align: center;">
            <i class="fas fa-sync-alt fa-spin"></i> Live Data Streamed from PVA Operations Center
        </p>
    `;
}

// --- RADAR GÜNCELLEME (BULUT YAZICI) ---
async function updateGlobalRadar() {
    const radarInput = document.getElementById('radarUrlInput');
    if (!radarInput) return;
    
    const newUrl = radarInput.value.trim();
    if(!newUrl) return alert("Please enter a valid Image URL!");

    try {
        await db.collection('pva_settings').doc('live_radar').set({
            url: newUrl,
            updatedBy: currentLoggedPilot ? currentLoggedPilot.callsign : "Admin",
            timestamp: Date.now()
        });

        alert("Radar updated globally for all users!");
        radarInput.value = ""; // Kutuyu temizle
        loadLiveRadar(); // Ekranı yenile
    } catch (error) {
        alert("Error updating radar: " + error.message);
    }
}
