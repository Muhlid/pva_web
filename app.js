let isAdminLoggedIn = false;
let isPilotLoggedIn = false;

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

// Data Yönetimi (Boş başlar)
function getSafeData(key) {
    try { 
        return JSON.parse(localStorage.getItem(key)) || []; 
    } catch(e) { return []; }
}

// Modal Kontrolleri
function openAdminModal(type) {
    document.getElementById('mobile-nav').classList.remove('active');
    document.getElementById('mobile-nav-overlay').classList.remove('active');
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminType').value = type; // 'all', 'news', 'event'
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

function openPilotRegisterModal() { 
    document.getElementById('pilotRegisterModal').style.display = 'flex'; 
    document.getElementById('pCallsign').value = '';
    document.getElementById('pName').value = '';
    document.getElementById('pDiscord').value = ''; // Yeni Eklendi
    document.getElementById('pHours').value = '';
}
function closePilotRegisterModal() { document.getElementById('pilotRegisterModal').style.display = 'none'; }

// Şifre Sistemleri
function checkAdminPass() {
    const pass = document.getElementById('adminPass').value;
    if(btoa(pass) === "cHZhMjAyNg==") { // pva2026
        isAdminLoggedIn = true;
        document.getElementById('loginArea').style.display = 'none';
        
        const type = document.getElementById('adminType').value;
        // Gelen komuta göre sadece Haberi, sadece Eventi veya ikisini birden aç
        if(type === 'event') {
            document.getElementById('addEventArea').style.display = 'block';
        } else if(type === 'news') {
            document.getElementById('addNewsArea').style.display = 'block';
        } else {
            // Navbar'dan basıldıysa ('all') ikisini de gösterir
            document.getElementById('addEventArea').style.display = 'block';
            document.getElementById('addNewsArea').style.display = 'block';
        }
        loadNews(); loadEvents(); loadPilots(); 
    } else { alert("Incorrect Admin Password!"); }
}

function checkPilotPass() {
    const pass = document.getElementById('pilotPass').value;
    if(btoa(pass) === "cHZhMTIz") {  // pva123
        isPilotLoggedIn = true;
        closePilotModal();
        navigate('pilots'); 
        loadPilots(); 
    } else { alert("Access Denied! Incorrect Pilot Password."); }
}

function addPilot() {
    const callsign = document.getElementById('pCallsign').value;
    const name = document.getElementById('pName').value;
    const discord = document.getElementById('pDiscord').value || "-"; // Yeni Eklendi
    const rank = document.getElementById('pRank').value;
    const hours = document.getElementById('pHours').value;

    // Discord ismini zorunlu yapmak istersen buraya !discord ekleyebilirsin
    if(!callsign || !name || !hours) return alert("Callsign, IFC Name and Hours are required!");

    const data = getSafeData('pva_pilots');
    // Discord'u da paketin içine dahil ettik
    data.push({ id: Date.now(), callsign, name, discord, rank, hours }); 
    localStorage.setItem('pva_pilots', JSON.stringify(data));
    
    closePilotRegisterModal();
    loadPilots();
    alert("Profile Successfully Registered!");
}

function deletePilot(id) {
    // Silme tuşuna basıldığında Admin şifresini zorla sorar
    let pass = prompt("SECURITY CLEARANCE REQUIRED:\nPlease enter the Admin Password to delete this pilot:");
    
    // Girilen şifre pva2026 (cHZhMjAyNg==) ise işleme izin ver
    if (pass && btoa(pass) === "cHZhMjAyNg==") {
        if(confirm("Password Verified! Are you sure you want to remove this pilot from the roster?")) {
            let data = getSafeData('pva_pilots').filter(p => p.id !== id);
            localStorage.setItem('pva_pilots', JSON.stringify(data));
            loadPilots();
            alert("Pilot successfully removed.");
        }
    } else {
        // Şifre yanlışsa veya iptale basılırsa reddet
        alert("Access Denied! Incorrect Admin Password. Deletion cancelled.");
    }
}

function loadPilots() {
    const tbody = document.getElementById('pilot-roster-body');
    const addBtn = document.getElementById('addPilotBtn');
    if(!tbody) return;

    if(addBtn) {
        addBtn.style.display = (isPilotLoggedIn || isAdminLoggedIn) ? "inline-block" : "none";
    }

    tbody.innerHTML = "";
    const pilots = getSafeData('pva_pilots');

    if(pilots.length === 0) {
        // Sütun sayısı 4'ten 5'e çıktığı için colspan=5 yapıldı
        tbody.innerHTML = `<tr><td colspan="5" style="padding:15px; text-align:center; color:#888;">No pilots registered yet.</td></tr>`;
        return;
    }

    pilots.forEach(p => {
        let delBtn = isAdminLoggedIn ? `<button onclick="deletePilot(${p.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; float:right;"><i class="fas fa-trash"></i></button>` : "";
        
        // p.discord tabloya eklendi
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
// Haber ve Etkinlikler
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
                    <h3 style="color:var(--pva-green); margin-top:0;">${n.title}</h3>
                    <p style="color:#666;">${n.content.substring(0, 70)}...</p>
                    <span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;">Published on ${n.date}</span>
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
                    <h3 style="color:var(--pva-green); margin-top:0;">${e.route}</h3>
                    <p style="color:#666;">Aircraft: ${e.aircraft}<br>Server: ${e.server}</p>
                    <span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;">Starts on ${e.date} at ${e.time}Z (${localStr} Local)</span>
                </div>
            </div>`;
        });
    }
}

// --- AKILLI HABER ARŞİVLEME SİSTEMİ ---
function loadNews() {
    const activeCont = document.getElementById('local-news-container');
    const pastCont = document.getElementById('past-news-container');
    if(!activeCont || !pastCont) return;
    
    activeCont.innerHTML = "";
    pastCont.innerHTML = "";
    
    const data = getSafeData('pva_news');
    let activeCount = 0;
    let pastCount = 0;

    data.forEach((n, index) => {
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_news', ${n.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; margin-top:10px; cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>` : "";
        
        const cardHTML = `
        <div class="clean-card">
            <img src="${n.img}">
            <div class="card-body">
                <h3 style="color:var(--pva-green); margin-top:0;">${n.title}</h3>
                <p style="color:#666; font-size:0.9rem;">${n.content}</p>
                <span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;">
                    <i class="far fa-calendar"></i> Published on ${n.date} ${btn}
                </span>
            </div>
        </div>`;

        // İlk 3 haber "Latest" kısmına, eskiler "Archive" kısmına
        if(index < 3) {
            activeCont.innerHTML += cardHTML;
            activeCount++;
        } else {
            pastCont.innerHTML += cardHTML;
            pastCount++;
        }
    });

    if(activeCount === 0) activeCont.innerHTML = "<p style='color:#888; grid-column: 1/-1;'>No latest news available.</p>";
    if(pastCount === 0) pastCont.innerHTML = "<p style='color:#888; grid-column: 1/-1;'>Archive is empty.</p>";
}

// --- AKILLI ETKİNLİK ZAMANLAYICI (OTOMATİK GEÇMİŞE ALIR) ---
function loadEvents() {
    const activeCont = document.getElementById('events-list');
    const pastCont = document.getElementById('past-events-list');
    if(!activeCont || !pastCont) return;
    
    activeCont.innerHTML = "";
    pastCont.innerHTML = "";
    
    const data = getSafeData('pva_events');
    const now = new Date(); // Şu anki gerçek zaman
    
    let activeCount = 0;
    let pastCount = 0;

    data.forEach(e => {
        // Etkinliğin saatini UTC olarak algıla
        const eventDate = new Date(`${e.date}T${e.time}:00Z`);
        const localStr = eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_events', ${e.id})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; margin-top:10px; cursor:pointer;"><i class="fas fa-trash"></i> Delete</button>` : "";
        
        const cardHTML = `
        <div class="clean-card">
            <img src="${e.img}">
            <div class="card-body">
                <h3 style="color:var(--pva-green); margin-top:0;">${e.route}</h3>
                <p style="color:#666; font-size:0.9rem;">Aircraft: ${e.aircraft}<br>Server: ${e.server}</p>
                <span class="card-meta" style="color:#888; font-size:0.85rem; border-top:1px solid #eee; display:block; padding-top:10px; margin-top:15px;">
                    <i class="far fa-clock"></i> ${e.time}Z (${localStr} Local) <br>
                    <i class="far fa-calendar"></i> ${e.date} ${btn}
                </span>
            </div>
        </div>`;

        // Etkinlik henüz geçmediyse yukarı, süresi dolduysa geçmişe (aşağı) at
        if(eventDate >= now) {
            activeCont.innerHTML += cardHTML;
            activeCount++;
        } else {
            pastCont.innerHTML += cardHTML;
            pastCount++;
        }
    });

    if(activeCount === 0) activeCont.innerHTML = "<p style='color:#888; grid-column: 1/-1;'>No upcoming events. Standby for briefing.</p>";
    if(pastCount === 0) pastCont.innerHTML = "<p style='color:#888; grid-column: 1/-1;'>No past events in records.</p>";
}

function delItem(key, id) {
    // Silme tuşuna basıldığında Admin şifresini zorla sorar
    let pass = prompt("SECURITY CLEARANCE REQUIRED:\nPlease enter the Admin Password to delete this item:");
    
    if (pass && btoa(pass) === "cHZhMjAyNg==") {
        if(confirm("Password Verified! Are you sure you want to delete this item?")) {
            let data = getSafeData(key).filter(i => i.id !== id);
            localStorage.setItem(key, JSON.stringify(data));
            loadNews(); loadEvents(); loadHomePreviews();
            alert("Item successfully deleted.");
        }
    } else {
        alert("Access Denied! Incorrect Admin Password. Deletion cancelled.");
    }
}

// Lightbox
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
        setTimeout(() => closeIntro(), 5000); 
    }
});
