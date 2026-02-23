let isAdminLoggedIn = false;
let isPilotLoggedIn = false;
let currentLoggedPilot = null; 

// --- NAVİGASYON ---
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
    
    const mobNav = document.getElementById('mobile-nav');
    const mobOverlay = document.getElementById('mobile-nav-overlay');
    if(mobNav) mobNav.classList.remove('active');
    if(mobOverlay) mobOverlay.classList.remove('active');
    
    if(sectionId === 'news') loadNews();
    if(sectionId === 'events') loadEvents();
    if(sectionId === 'home') loadHomePreviews();
    if(sectionId === 'pilots') loadPilots(); 
}

function toggleMobileMenu() {
    document.getElementById('mobile-nav').classList.toggle('active');
    document.getElementById('mobile-nav-overlay').classList.toggle('active');
}

// --- VERİTABANI KONTROLÜ ---
function getSafeData(key) {
    try { 
        return JSON.parse(localStorage.getItem(key)) || []; 
    } catch(e) { return []; }
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

// --- PİLOT BAŞVURU (WAITING ROOM SİSTEMİ) ---
function submitPilotApplication() {
    const callsign = document.getElementById('regCallsign').value.trim().toUpperCase();
    const name = document.getElementById('regName').value.trim();
    const discord = document.getElementById('regDiscord').value.trim() || "-";
    const rank = document.getElementById('regRank').value;
    const hours = document.getElementById('regHours').value;
    const pass = document.getElementById('regPass').value;

    if(!callsign || !name || !hours || !pass) {
        return alert("Please fill all required fields in all steps!");
    }

    const activePilots = getSafeData('pva_pilots');
    const pendingPilots = getSafeData('pva_pending_pilots');
    
    if(activePilots.find(p => p.callsign === callsign) || pendingPilots.find(p => p.callsign === callsign)) {
        return alert("Registration Failed: This Callsign is already in use or pending approval!");
    }

    const newApp = { id: Date.now(), callsign, name, discord, rank, hours, password: btoa(pass), date: new Date().toLocaleDateString() };
    pendingPilots.push(newApp);
    localStorage.setItem('pva_pending_pilots', JSON.stringify(pendingPilots));
    
    alert("Application Submitted!\nYour application is now in the Waiting Room. You can login once a Staff member approves it.");
    closePilotModal();
}

// --- PİLOT GİRİŞİ (AKILLI KONTROL) ---
function pilotLogin() {
    const callsign = document.getElementById('loginCallsign').value.trim().toUpperCase();
    const pass = document.getElementById('loginPass').value;
    
    const activePilots = getSafeData('pva_pilots');
    const pendingPilots = getSafeData('pva_pending_pilots');
    
    const foundActive = activePilots.find(p => p.callsign === callsign && p.password === btoa(pass));
    if(foundActive) {
        currentLoggedPilot = foundActive;
        isPilotLoggedIn = true;
        updateNavbarUI();
        closePilotModal();
        navigate('pilots');
        return;
    } 
    
    const foundPending = pendingPilots.find(p => p.callsign === callsign && p.password === btoa(pass));
    if(foundPending) {
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

function loadPendingPilots() {
    const cont = document.getElementById('pending-list');
    if(!cont) return;
    cont.innerHTML = "";
    
    const pending = getSafeData('pva_pending_pilots');
    if(pending.length === 0) {
        cont.innerHTML = "<p style='text-align:center; color:#888;'>Waiting room is empty.</p>";
        return;
    }

    pending.forEach(p => {
        cont.innerHTML += `
        <div style="background:#f9f9f9; border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px;">
            <strong style="color:var(--pva-green); font-size:1.1rem;">${p.callsign}</strong> - ${p.name}<br>
            <span style="font-size:0.85rem; color:#666;">Rank: ${p.rank} | Hours: ${p.hours} | Discord: ${p.discord}</span><br>
            <div style="margin-top:10px; display:flex; gap:10px;">
                <button onclick="approvePilot(${p.id})" style="background:green; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;"><i class="fas fa-check"></i> Approve</button>
                <button onclick="rejectPilot(${p.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;"><i class="fas fa-times"></i> Reject</button>
            </div>
        </div>`;
    });
}

function approvePilot(id) {
    let pending = getSafeData('pva_pending_pilots');
    let active = getSafeData('pva_pilots');
    
    const pilotToApprove = pending.find(p => p.id === id);
    if(pilotToApprove) {
        active.push(pilotToApprove);
        pending = pending.filter(p => p.id !== id); 
        
        localStorage.setItem('pva_pilots', JSON.stringify(active));
        localStorage.setItem('pva_pending_pilots', JSON.stringify(pending));
        
        loadPendingPilots();
        loadPilots();
        alert(pilotToApprove.callsign + " has been successfully approved and added to the roster!");
    }
}

function rejectPilot(id) {
    if(confirm("Are you sure you want to REJECT and delete this application?")) {
        let pending = getSafeData('pva_pending_pilots');
        pending = pending.filter(p => p.id !== id);
        localStorage.setItem('pva_pending_pilots', JSON.stringify(pending));
        loadPendingPilots();
    }
}

// --- ROSTER LİSTELEME ---
function loadPilots() {
    const tbody = document.getElementById('pilot-roster-body');
    if(!tbody) return;

    tbody.innerHTML = "";
    const pilots = getSafeData('pva_pilots');

    if(pilots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:15px; text-align:center; color:#888;">No pilots registered yet.</td></tr>`;
        return;
    }

    pilots.forEach(p => {
        let delBtn = isAdminLoggedIn ? `<button onclick="deletePilot(${p.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; float:right;"><i class="fas fa-trash"></i></button>` : "";
        
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

function deletePilot(id) {
    let pass = prompt("SECURITY CLEARANCE REQUIRED:\nPlease enter the Admin Password to delete this pilot:");
    if (pass && btoa(pass) === "cHZhMjAyNg==") {
        if(confirm("Password Verified! Are you sure you want to remove this pilot from the roster?")) {
            let data = getSafeData('pva_pilots').filter(p => p.id !== id);
            localStorage.setItem('pva_pilots', JSON.stringify(data));
            loadPilots();
            alert("Pilot successfully removed.");
        }
    } else { alert("Access Denied! Deletion cancelled."); }
}

// --- HABER VE ETKİNLİK EKLEME ---
function addNews() {
    const title = document.getElementById('newsTitleInput').value.trim();
    const content = document.getElementById('newsContentInput').value.trim();
    const date = document.getElementById('newsDateInput').value;
    const img = document.getElementById('newsImgInput').value.trim() || 'https://i.ibb.co/mVTDxrzD/image-1.png';

    if(!title || !content) return alert("Title and Content required!");

    const data = getSafeData('pva_news');
    data.unshift({id: Date.now(), title, content, date, img});
    localStorage.setItem('pva_news', JSON.stringify(data));
    
    alert("News Published! You can see it in the News section.");
    document.getElementById('newsTitleInput').value = '';
    document.getElementById('newsContentInput').value = '';
    document.getElementById('newsImgInput').value = '';
    loadNews(); loadHomePreviews();
}

function addEvent() {
    const server = document.getElementById('evServer').value.trim() || "Expert";
    const route = document.getElementById('evRoute').value.trim();
    const aircraft = document.getElementById('evAircraft').value.trim() || "Any";
    const time = document.getElementById('evTime').value;
    const date = document.getElementById('evDate').value;
    const img = document.getElementById('evImg').value.trim() || 'https://i.ibb.co/mVTDxrzD/image-1.png';

    if(!route || !date || !time) return alert("Route, Date and Time required!");

    const data = getSafeData('pva_events');
    data.unshift({ id: Date.now(), server, route, aircraft, time, date, img });
    localStorage.setItem('pva_events', JSON.stringify(data));
    
    alert("Event Published! You can see it in the Events section.");
    document.getElementById('evRoute').value = '';
    document.getElementById('evImg').value = '';
    loadEvents(); loadHomePreviews();
}

// --- SAYFA YÜKLENİCİLER (KIRIK RESİM KALKANI ONERROR EKLENDİ) ---
function loadHomePreviews() { 
    const newsData = getSafeData('pva_news'); const eventData = getSafeData('pva_events');
    const np = document.getElementById('new-home-news'); const ep = document.getElementById('new-home-event');
    if(np) { 
        np.innerHTML = ""; 
        newsData.slice(0, 3).forEach(n => { 
            np.innerHTML += `<div class="clean-card"><img src="${n.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${n.title}</h3><p style="color:#666;">${n.content.substring(0, 70)}...</p><span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;">Published on ${n.date}</span></div></div>`; 
        }); 
    }
    if(ep) { 
        ep.innerHTML = ""; 
        eventData.slice(0, 3).forEach(e => { 
            const localStr = new Date(`${e.date}T${e.time}:00Z`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}); 
            ep.innerHTML += `<div class="clean-card"><img src="${e.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${e.route}</h3><p style="color:#666;">Aircraft: ${e.aircraft}<br>Server: ${e.server}</p><span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;">Starts on ${e.date} at ${e.time}Z (${localStr} Local)</span></div></div>`; 
        }); 
    }
}

function loadNews() { 
    const activeCont = document.getElementById('local-news-container'); const pastCont = document.getElementById('past-news-container');
    if(!activeCont || !pastCont) return; 
    activeCont.innerHTML = ""; pastCont.innerHTML = "";
    const data = getSafeData('pva_news'); let activeCount = 0; let pastCount = 0;
    
    data.forEach((n, index) => {
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_news', ${n.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; margin-top:10px; cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>` : "";
        const cardHTML = `<div class="clean-card"><img src="${n.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${n.title}</h3><p style="color:#666; font-size:0.9rem;">${n.content}</p><span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;"><i class="far fa-calendar"></i> Published on ${n.date} ${btn}</span></div></div>`;
        if(index < 3) { activeCont.innerHTML += cardHTML; activeCount++; } else { pastCont.innerHTML += cardHTML; pastCount++; }
    });
}

function loadEvents() { 
    const activeCont = document.getElementById('events-list'); const pastCont = document.getElementById('past-events-list');
    if(!activeCont || !pastCont) return; 
    activeCont.innerHTML = ""; pastCont.innerHTML = "";
    const data = getSafeData('pva_events'); const now = new Date(); let activeCount = 0; let pastCount = 0;
    
    data.forEach(e => {
        const eventDate = new Date(`${e.date}T${e.time}:00Z`); const localStr = eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_events', ${e.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; margin-top:10px; cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>` : "";
        const cardHTML = `<div class="clean-card"><img src="${e.img}" onerror="this.onerror=null; this.src='https://i.ibb.co/mVTDxrzD/image-1.png';"><div class="card-body"><h3 style="color:var(--pva-green); margin-top:0;">${e.route}</h3><p style="color:#666; font-size:0.9rem;">Aircraft: ${e.aircraft}<br>Server: ${e.server}</p><span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;"><i class="far fa-clock"></i> ${e.time}Z (${localStr} Local) <br><i class="far fa-calendar"></i> ${e.date} ${btn}</span></div></div>`;
        if(eventDate >= now) { activeCont.innerHTML += cardHTML; activeCount++; } else { pastCont.innerHTML += cardHTML; pastCount++; }
    });
}

function delItem(key, id) {
    let pass = prompt("SECURITY CLEARANCE REQUIRED:\nPlease enter the Admin Password:");
    if (pass && btoa(pass) === "cHZhMjAyNg==") {
        if(confirm("Are you sure?")) { 
            let data = getSafeData(key).filter(i => i.id !== id); 
            localStorage.setItem(key, JSON.stringify(data)); 
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
       
