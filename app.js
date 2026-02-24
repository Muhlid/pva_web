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

// --- NAVİGASYON MOTORU ---
window.navigate = function(sectionId) {
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
    
    const mobNav = document.getElementById('mobile-nav');
    const mobOverlay = document.getElementById('mobile-nav-overlay');
    if(mobNav) mobNav.classList.remove('active');
    if(mobOverlay) mobOverlay.classList.remove('active');
    
    if(sectionId === 'news') loadNews();
    if(sectionId === 'events') loadEvents();
    if(sectionId === 'home') loadHomePreviews();
    if(sectionId === 'pilots') loadPilots(); 
    if(sectionId === 'radar') loadLiveRadar();
};

window.toggleMobileMenu = function() {
    document.getElementById('mobile-nav').classList.toggle('active');
    document.getElementById('mobile-nav-overlay').classList.toggle('active');
};

// --- MODAL AÇ/KAPAT ---
window.openAdminModal = function() {
    window.closePilotModal();
    document.getElementById('adminModal').style.display = 'flex';
    if(isAdminLoggedIn) {
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminControlPanel').style.display = 'block';
        window.switchAdminTab('pending');
    } else {
        document.getElementById('loginArea').style.display = 'block';
        document.getElementById('adminControlPanel').style.display = 'none';
        document.getElementById('adminPass').value = '';
    }
};

window.closeAdminModal = function() { 
    document.getElementById('adminModal').style.display = 'none'; 
};

// --- PİLOT MODAL KONTROLLERİ (GLOBAL ZORUNLU SÜRÜM) ---
window.openPilotModal = function() {
    console.log("Pilot Butonu Tetiklendi!"); 
    window.closeAdminModal();
    
    const pilotModal = document.getElementById('pilotModal');
    if (pilotModal) {
        pilotModal.style.setProperty('display', 'flex', 'important');
        window.resetPilotModal();
    } else {
        console.error("HATA: 'pilotModal' ID'li element bulunamadı.");
    }
};

window.closePilotModal = function() { 
    const pilotModal = document.getElementById('pilotModal');
    if (pilotModal) {
        pilotModal.style.setProperty('display', 'none', 'important');
    }
};

// --- PİLOT MENÜ & STEP-BY-STEP ---
window.resetPilotModal = function() {
    const choiceArea = document.getElementById('pilotChoiceArea');
    const loginArea = document.getElementById('pilotLoginArea');
    const registerArea = document.getElementById('pilotRegisterArea');

    if (choiceArea) choiceArea.style.display = 'block';
    if (loginArea) loginArea.style.display = 'none';
    if (registerArea) registerArea.style.display = 'none';
    
    if(document.getElementById('regStep1')) window.nextRegStep(1); 
};

window.showPilotLogin = function() {
    document.getElementById('pilotChoiceArea').style.display = 'none';
    document.getElementById('pilotLoginArea').style.display = 'block';
};

window.showPilotRegister = function() {
    document.getElementById('pilotChoiceArea').style.display = 'none';
    document.getElementById('pilotRegisterArea').style.display = 'block';
};

window.nextRegStep = function(stepNum) {
    const s1 = document.getElementById('regStep1');
    const s2 = document.getElementById('regStep2');
    const s3 = document.getElementById('regStep3');
    
    if(s1 && s2 && s3) {
        s1.style.display = 'none';
        s2.style.display = 'none';
        s3.style.display = 'none';
        
        const targetStep = document.getElementById('regStep' + stepNum);
        if (targetStep) targetStep.style.display = 'block';
    }
};

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

// --- PİLOT BAŞVURU (GLOBAL) ---
window.submitPilotApplication = async function() {
    const callsign = document.getElementById('regCallsign').value.trim().toUpperCase();
    const name = document.getElementById('regName').value.trim();
    const discord = document.getElementById('regDiscord').value.trim() || "-";
    const rank = document.getElementById('regRank').value;
    const hours = document.getElementById('regHours').value;
    const pass = document.getElementById('regPass').value;

    if(!callsign || !name || !hours || !pass) {
        return alert("Please fill all required fields in all steps!");
    }

    const activeQ = await db.collection('pva_pilots').where('callsign', '==', callsign).get();
    const pendingQ = await db.collection('pva_pending').where('callsign', '==', callsign).get();
    
    if(!activeQ.empty || !pendingQ.empty) {
        return alert("Registration Failed: This Callsign is already in use or pending approval!");
    }

    await db.collection('pva_pending').add({
        callsign, name, discord, rank, hours, password: btoa(pass), 
        date: new Date().toLocaleDateString(), timestamp: Date.now()
    });
    
    alert("Application Submitted!\nYour application is now in the Global Waiting Room. You can login once a Staff member approves it.");
    window.closePilotModal();
};

// --- PİLOT GİRİŞİ ---
window.pilotLogin = async function() {
    const callsignInput = document.getElementById('loginCallsign');
    const passInput = document.getElementById('loginPass');
    
    if(!callsignInput || !passInput) return;

    const callsign = callsignInput.value.trim().toUpperCase();
    const pass = passInput.value;
    const encodedPass = btoa(pass); 
    
    try {
        const activeQ = await db.collection('pva_pilots')
            .where('callsign', '==', callsign)
            .where('password', '==', encodedPass)
            .get();

        if(!activeQ.empty) {
            currentLoggedPilot = activeQ.docs[0].data();
            isPilotLoggedIn = true;
            
            updateNavbarUI(); 
            window.updatePilotStats(currentLoggedPilot); // KARNE GÜNCELLEME TETİKLENİYOR
            window.closePilotModal(); 
            window.navigate('pilots'); 
            return;
        } 
        
        const pendingQ = await db.collection('pva_pending')
            .where('callsign', '==', callsign)
            .where('password', '==', encodedPass)
            .get();

        if(!pendingQ.empty) {
            alert("Account Status: PENDING\nYour application is still under review by the Staff.");
        } else {
            alert("Login Failed: Incorrect Callsign or Password.");
        }

    } catch (error) {
        console.error("Bulut Bağlantı Hatası:", error);
        alert("Connection Error: Database is not responding.");
    }
};

window.pilotLogout = function() {
    currentLoggedPilot = null;
    isPilotLoggedIn = false;
    updateNavbarUI();
    const statsCard = document.getElementById('pilotStatsCard');
    if (statsCard) statsCard.style.display = 'none'; // Çıkış yapınca karneyi gizle
    window.navigate('home'); 
};

// --- PİLOT KARNESİ (STATS) HESAPLAMA MOTORU ---
window.updatePilotStats = function(pilotData) {
    if(!pilotData) return;

    const statsCard = document.getElementById('pilotStatsCard');
    if(!statsCard) return; // HTML'de kart yoksa hata vermesin

    const currentHours = parseFloat(pilotData.hours) || 0;
    
    // Rütbe Gereksinimleri (Saatlere Göre Sıralı)
    const rankTiers = [
        { name: "Cadet", min: 0 },
        { name: "Second Officer", min: 20 },
        { name: "First Officer", min: 50 },
        { name: "Senior FO", min: 100 },
        { name: "Captain", min: 250 },
        { name: "Senior Captain", min: 500 },
        { name: "Commander", min: 750 },
        { name: "Emerald", min: 1000 },
        { name: "Diamond", min: 1500 },
        { name: "Sapphire", min: 2500 }
    ];

    // Bir sonraki rütbeyi ve mevcut seviyeyi bul
    let nextRank = rankTiers.find(tier => tier.min > currentHours);
    let currentRank = pilotData.rank || "Cadet";

    // Metinleri Güncelle
    const statRankEl = document.getElementById('statRank');
    const statHoursEl = document.getElementById('statHours');
    if(statRankEl) statRankEl.innerText = currentRank;
    if(statHoursEl) statHoursEl.innerText = currentHours.toFixed(1) + "h";
    
    const nextRankLabel = document.getElementById('nextRankLabel');
    const hoursRemaining = document.getElementById('hoursRemaining');
    const statsProgressBar = document.getElementById('statsProgressBar');

    if (nextRank) {
        // İlerleme yüzdesini hesapla
        let prevTier = rankTiers.slice().reverse().find(tier => tier.min <= currentHours) || rankTiers[0];
        let range = nextRank.min - prevTier.min;
        let earnedInTier = currentHours - prevTier.min;
        let progress = (earnedInTier / range) * 100;
        let remaining = nextRank.min - currentHours;

        if(nextRankLabel) nextRankLabel.innerText = "Next Rank: " + nextRank.name;
        if(hoursRemaining) hoursRemaining.innerText = remaining.toFixed(1) + "h left";
        if(statsProgressBar) statsProgressBar.style.width = Math.min(progress, 100) + "%";
    } else {
        // En son rütbeye ulaşıldıysa
        if(nextRankLabel) nextRankLabel.innerText = "Ultimate Rank Reached!";
        if(hoursRemaining) hoursRemaining.innerText = "Max Level";
        if(statsProgressBar) statsProgressBar.style.width = "100%";
    }

    statsCard.style.display = 'block'; // Kartı görünür yap
};

// --- ADMIN SİSTEMİ ---
window.checkAdminPass = function() {
    const pass = document.getElementById('adminPass').value;
    if(btoa(pass) === "cHZhMjAyNg==") { 
        isAdminLoggedIn = true;
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminControlPanel').style.display = 'block';
        window.switchAdminTab('pending');
        loadNews(); 
        loadEvents();
        loadPilots();
    } else { 
        alert("Access Denied!"); 
    }
};

window.switchAdminTab = function(tab) {
    document.getElementById('pendingPilotsArea').style.display = 'none';
    document.getElementById('addEventArea').style.display = 'none';
    document.getElementById('addNewsArea').style.display = 'none';

    if(tab === 'pending') { document.getElementById('pendingPilotsArea').style.display = 'block'; loadPendingPilots(); }
    if(tab === 'event') document.getElementById('addEventArea').style.display = 'block';
    if(tab === 'news') document.getElementById('addNewsArea').style.display = 'block';
};

// --- BULUTTAN ÇEKİCİLER & DİĞER FONKSİYONLAR ---
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
                <button onclick="window.approvePilot('${docId}')" style="background:green; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;"><i class="fas fa-check"></i> Approve</button>
                <button onclick="window.rejectPilot('${docId}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;"><i class="fas fa-times"></i> Reject</button>
            </div>
        </div>`;
    });
}

window.approvePilot = async function(docId) {
    const docRef = db.collection('pva_pending').doc(docId);
    const docSnap = await docRef.get();
    
    if(docSnap.exists) {
        const pilotData = docSnap.data();
        await db.collection('pva_pilots').add(pilotData);
        await docRef.delete();
        loadPendingPilots();
        loadPilots();
        alert(pilotData.callsign + " has been successfully approved!");
    }
};

window.rejectPilot = async function(docId) {
    if(confirm("Are you sure you want to REJECT this application?")) {
        await db.collection('pva_pending').doc(docId).delete();
        loadPendingPilots();
    }
};

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
        let delBtn = isAdminLoggedIn ? `<button onclick="window.deletePilot('${docId}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; float:right;"><i class="fas fa-trash"></i></button>` : "";
        
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

window.deletePilot = async function(docId) {
    let pass = prompt("SECURITY CLEARANCE REQUIRED:\nPlease enter the Admin Password:");
    if (pass && btoa(pass) === "cHZhMjAyNg==") {
        if(confirm("Are you sure you want to completely remove this pilot?")) {
            await db.collection('pva_pilots').doc(docId).delete();
            loadPilots();
        }
    } else { alert("Access Denied!"); }
};

window.addNews = async function() {
    const title = document.getElementById('newsTitleInput').value.trim();
    const content = document.getElementById('newsContentInput').value.trim();
    const date = document.getElementById('newsDateInput').value;
    const img = document.getElementById('newsImgInput').value.trim() || 'https://i.ibb.co/mVTDxrzD/image-1.png';

    if(!title || !content) return alert("Title and Content required!");

    await db.collection('pva_news').add({ id: Date.now(), title, content, date, img });
    alert("News Published!");
    document.getElementById('newsTitleInput').value = '';
    document.getElementById('newsContentInput').value = '';
    document.getElementById('newsImgInput').value = '';
    loadNews(); loadHomePreviews();
};

window.addEvent = async function() {
    const server = document.getElementById('evServer').value.trim() || "Expert";
    const route = document.getElementById('evRoute').value.trim();
    const aircraft = document.getElementById('evAircraft').value.trim() || "Any";
    const time = document.getElementById('evTime').value;
    const date = document.getElementById('evDate').value;
    const img = document.getElementById('evImg').value.trim() || 'https://i.ibb.co/mVTDxrzD/image-1.png';

    if(!route || !date || !time) return alert("Route, Date and Time required!");

    await db.collection('pva_events').add({ id: Date.now(), server, route, aircraft, time, date, img });
    alert("Event Published!");
    document.getElementById('evRoute').value = '';
    document.getElementById('evImg').value = '';
    loadEvents(); loadHomePreviews();
};

async function loadHomePreviews() { 
    const np = document.getElementById('new-home-news'); const ep = document.getElementById('new-home-event');
    if(np) { 
        const snapNews = await db.collection('pva_news').orderBy('id', 'desc').limit(3).get();
        np.innerHTML = ""; 
        snapNews.forEach(docSnap => { 
            const n = docSnap.data();
            np.innerHTML += `<div class="clean-card"><img src="${n.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${n.title}</h3><p style="color:#666;">${n.content.substring(0, 70)}...</p></div></div>`; 
        }); 
    }
    if(ep) { 
        const snapEv = await db.collection('pva_events').orderBy('id', 'desc').limit(3).get();
        ep.innerHTML = ""; 
        snapEv.forEach(docSnap => { 
            const e = docSnap.data();
            ep.innerHTML += `<div class="clean-card"><img src="${e.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${e.route}</h3><p style="color:#666;">Aircraft: ${e.aircraft}<br>Server: ${e.server}</p></div></div>`; 
        }); 
    }
}

async function loadNews() { 
    const activeCont = document.getElementById('local-news-container'); const pastCont = document.getElementById('past-news-container');
    if(!activeCont || !pastCont) return; 
    
    const snapshot = await db.collection('pva_news').orderBy('id', 'desc').get();
    activeCont.innerHTML = ""; pastCont.innerHTML = "";
    
    let activeCount = 0;
    snapshot.forEach(docSnap => {
        const n = docSnap.data();
        const docId = docSnap.id;
        let btn = isAdminLoggedIn ? `<br><button onclick="window.delItem('pva_news', '${docId}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer;">Delete</button>` : "";
        const cardHTML = `<div class="clean-card"><img src="${n.img}"><div class="card-body"><h3>${n.title}</h3><p>${n.content}</p><small>${n.date}</small>${btn}</div></div>`;
        if(activeCount < 3) { activeCont.innerHTML += cardHTML; activeCount++; } else { pastCont.innerHTML += cardHTML; }
    });
}

async function loadEvents() { 
    const activeCont = document.getElementById('events-list'); const pastCont = document.getElementById('past-events-list');
    if(!activeCont || !pastCont) return; 
    
    const snapshot = await db.collection('pva_events').get();
    activeCont.innerHTML = ""; pastCont.innerHTML = "";
    const now = new Date();
    
    snapshot.forEach(docSnap => {
        const e = docSnap.data();
        const docId = docSnap.id;
        const eventDate = new Date(`${e.date}T${e.time}:00Z`);
        let btn = isAdminLoggedIn ? `<br><button onclick="window.delItem('pva_events', '${docId}')" style="background:red; color:white; border:none; padding:5px 10px; cursor:pointer;">Delete</button>` : "";
        const cardHTML = `<div class="clean-card"><img src="${e.img}"><div class="card-body"><h3>${e.route}</h3><p>Server: ${e.server}</p><small>${e.date} at ${e.time}Z</small>${btn}</div></div>`;
        if(eventDate >= now) { activeCont.innerHTML += cardHTML; } else { pastCont.innerHTML += cardHTML; }
    });
}

window.delItem = async function(col, docId) {
    let pass = prompt("Admin Password:");
    if (pass && btoa(pass) === "cHZhMjAyNg==") {
        if(confirm("Are you sure?")) { 
            await db.collection(col).doc(docId).delete(); 
            loadNews(); loadEvents(); loadHomePreviews(); 
        }
    } else { alert("Access Denied!"); }
};

window.openLightbox = function(src) { 
    document.getElementById('lightboxImg').src = src; 
    document.getElementById('lightboxModal').style.display = 'flex'; 
};
window.closeLightbox = function() { 
    document.getElementById('lightboxModal').style.display = 'none'; 
};

async function loadLiveRadar() {
    const radarCont = document.getElementById('live-radar-display');
    const adminTool = document.getElementById('admin-radar-tool');
    if(!radarCont) return;
    const radarUrl = "https://pva-global--muhliscan.replit.app/";
    if (adminTool) adminTool.style.display = 'none';
    radarCont.innerHTML = `
        <div style="width: 100%; height: 650px; position: relative; background: #111; border-radius: 10px; overflow: hidden;">
            <iframe src="${radarUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen loading="lazy"></iframe>
        </div>
        <p style="color:#888; font-size: 0.8rem; margin-top: 10px; text-align: center;"><i class="fas fa-sync-alt fa-spin"></i> Live Data from PVA Operations Center</p>
    `;
}

window.updateGlobalRadar = async function() {
    const radarInput = document.getElementById('radarUrlInput');
    if (!radarInput) return;
    const newUrl = radarInput.value.trim();
    if(!newUrl) return alert("Please enter a valid Image URL!");
    try {
        await db.collection('pva_settings').doc('live_radar').set({
            url: newUrl, updatedBy: currentLoggedPilot ? currentLoggedPilot.callsign : "Admin", timestamp: Date.now()
        });
        alert("Radar updated!"); radarInput.value = ""; loadLiveRadar();
    } catch (error) { alert("Error: " + error.message); }
};

// --- SAYFA YÜKLENDİĞİNDE ---
document.addEventListener('DOMContentLoaded', () => {
    loadHomePreviews();
    updateNavbarUI();
});
