let isAdminLoggedIn = false;

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
}

function toggleMobileMenu() {
    document.getElementById('mobile-nav').classList.toggle('active');
    document.getElementById('mobile-nav-overlay').classList.toggle('active');
}

// INTRO KONTROL
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

// VERİ İŞLEMLERİ
function getSafeData(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
}

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
    const pass = document.getElementById('adminPass').value;
    if(btoa(pass) === "cHZhMjAyNg==") {
        isAdminLoggedIn = true;
        document.getElementById('loginArea').style.display = 'none';
        const type = document.getElementById('adminType').value;
        if(type === 'event') document.getElementById('addEventArea').style.display = 'block';
        if(type === 'news') document.getElementById('addNewsArea').style.display = 'block';
        loadNews(); loadEvents();
    } else { 
        alert("Incorrect Admin Password!"); 
    }
}

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

// BEYAZ KART TASARIMI İLE RENDER (HABERLER VE ETKİNLİKLER)
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

// Tüm haber ve etkinlikleri sayfalarda da ayni kart dizayniyla listele
function loadNews() {
    const cont = document.getElementById('local-news-container');
    if(!cont) return;
    cont.innerHTML = "";
    getSafeData('pva_news').forEach(n => {
        let btn = isAdminLoggedIn ? `<br><button onclick="delItem('pva_news', ${n.id})" style="color:red; cursor:pointer; background:none; border:none; margin-top:10px;">Delete</button>` : "";
        cont.innerHTML += `
        <div class="clean-card">
            <img src="${n.img}">
            <div class="card-body">
                <h3>${n.title}</h3>
                <p>${n.content}</p>
                <span class="card-meta">Published on ${n.date} ${btn}</span>
            </div>
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
            <div class="card-body">
                <h3>${e.route}</h3>
                <p>Aircraft: ${e.aircraft}<br>Server: ${e.server}</p>
                <span class="card-meta">Starts on ${e.date} at ${e.time}Z (${localStr} Local) ${btn}</span>
            </div>
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

document.addEventListener('DOMContentLoaded', () => {
    loadHomePreviews();
    
    // Video bitince intro kapansin
    const introVideo = document.getElementById('pva-intro-video');
    if (introVideo) {
        introVideo.onended = () => closeIntro();
        setTimeout(() => closeIntro(), 10000); // Guvenlik icin 10 sn
    }
});
// --- PİLOT ŞİFRE KONTROLÜ ---
function checkPilotPass() {
    const pass = document.getElementById('pilotPass').value;
    
    //şifresinin kriptolanmış (Base64) hali:
    if(btoa(pass) === "cHZhMTIz") { 
        closePilotModal();
        navigate('pilots'); // Doğru şifre girilince Roster sayfasına atar
    } else {
        alert("Access Denied! Incorrect Pilot Password.");
    }
}
