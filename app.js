let isAdminLoggedIn = false; // Admin yetkisi takip ediliyor

// --- ANİMASYON ---
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        counter.innerText = '0';
        const updateCounter = () => {
            const target = +counter.getAttribute('data-target');
            const c = +counter.innerText;
            const increment = target / 50; 
            if (c < target) {
                counter.innerText = `${Math.ceil(c + increment)}`;
                setTimeout(updateCounter, 30);
            } else {
                counter.innerText = target;
            }
        };
        updateCounter();
    });
}

// --- MENÜ GEÇİŞLERİ ---
function toggleMenu() {
    document.getElementById('glass-nav').classList.toggle('active');
}

function navigate(sectionId) {
    toggleMenu(); 
    document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
    });
    const target = document.getElementById(sectionId);
    if(target) {
        target.classList.remove('hidden-section');
        target.classList.add('active-section');
    }
    
    // Hangi sayfaya girilirse o sayfanın verilerini yükle
    if (sectionId === 'home') animateCounters();
    if (sectionId === 'events') loadEvents();
    if (sectionId === 'news') loadNews();
}

document.addEventListener('DOMContentLoaded', () => {
    animateCounters();
    loadEvents();
    loadNews();
});

// --- ADMIN ŞİFRE VE GÖZ İKONU KONTROLÜ ---
function togglePassVisibility() {
    const passInput = document.getElementById('adminPass');
    const icon = document.getElementById('togglePassword');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function openAdminModal(type) {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminType').value = type; 
    document.getElementById('loginArea').style.display = 'block';
    document.getElementById('addEventArea').style.display = 'none';
    document.getElementById('addNewsArea').style.display = 'none';
    document.getElementById('adminPass').value = '';
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

function checkAdminPass() {
    const pass = document.getElementById('adminPass').value;
    const type = document.getElementById('adminType').value;

    if (pass === "pva2026") {
        isAdminLoggedIn = true; 
        document.getElementById('loginArea').style.display = 'none';
        
        loadEvents(); 
        loadNews();

        if (type === 'event') document.getElementById('addEventArea').style.display = 'block';
        if (type === 'news') document.getElementById('addNewsArea').style.display = 'block';
    } else {
        alert("Access Denied! Incorrect Password.");
    }
}

// --- GÜVENLİ VERİ ÇEKME FONKSİYONU (Anti-Crash) ---
function getSafeData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch(e) {
        return [];
    }
}

// --- EVENTS (ETKİNLİKLER) SİSTEMİ ---
function loadEvents() {
    const list = document.getElementById('events-list');
    if(!list) return;
    
    const events = getSafeData('pva_events');
    list.innerHTML = '';

    if (events.length === 0) {
        list.innerHTML = '<p style="color:#ccc;">No upcoming events at the moment.</p>';
    } else {
        events.forEach(ev => {
            let deleteBtn = isAdminLoggedIn ? `<button onclick="deleteEvent(${ev.id})" style="background:red; color:white; border:none; padding:8px 15px; border-radius:5px; margin-top:10px; cursor:pointer;"><i class="fas fa-trash"></i> Delete Event</button>` : '';
            
            list.innerHTML += `
            <div class="event-card">
                <div class="event-img" style="background-image: url('${ev.img}');"></div>
                <div class="event-details">
                    <span class="event-date">${ev.date}</span>
                    <h3>${ev.title}</h3>
                    <p><strong>Route:</strong> ${ev.route}</p>
                    <p><strong>Server:</strong> Expert Server</p>
                    ${deleteBtn}
                </div>
            </div>`;
        });
    }
}

function addEvent() {
    const title = document.getElementById('evTitle').value;
    const date = document.getElementById('evDate').value;
    const route = document.getElementById('evRoute').value;
    const img = document.getElementById('evImg').value || "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000"; // Resim boşsa dağ resmi koy

    if(!title || !date) return alert("Title and Date are required!");

    const events = getSafeData('pva_events');
    events.unshift({ id: Date.now(), title, date, route, img });
    localStorage.setItem('pva_events', JSON.stringify(events));
    
    closeAdminModal();
    loadEvents();
    alert("Event Successfully Published!");
}

function deleteEvent(id) {
    if(confirm("Are you sure you want to delete this event?")) {
        let events = getSafeData('pva_events');
        events = events.filter(ev => ev.id !== id);
        localStorage.setItem('pva_events', JSON.stringify(events));
        loadEvents();
    }
}

// --- NEWS (HABERLER) SİSTEMİ ---
function loadNews() {
    const container = document.getElementById('local-news-container');
    if(!container) return;

    const newsData = getSafeData('pva_news');
    container.innerHTML = '';

    if (newsData.length === 0) {
        container.innerHTML = '<p style="color:#ccc;">No recent operations news.</p>';
    } else {
        newsData.forEach(n => {
            let imgHTML = n.img ? `<div class="news-img-box" style="width:100%; height:200px; overflow:hidden;"><img src="${n.img}" style="width:100%; height:100%; object-fit:cover;"></div>` : '';
            let deleteBtn = isAdminLoggedIn ? `<button onclick="deleteNews(${n.id})" style="background:red; color:white; border:none; padding:8px 15px; border-radius:5px; margin-top:10px; cursor:pointer;"><i class="fas fa-trash"></i> Delete News</button>` : '';
            
            container.innerHTML += `
            <div class="news-item" style="background: rgba(255,255,255,0.05); border-left: 4px solid var(--pva-green); border-radius: 10px; margin-bottom: 20px; overflow: hidden; text-align: left;">
                ${imgHTML}
                <div style="padding: 15px;">
                    <h4 style="margin:0;color:var(--pva-gold); font-size:1.2rem;">${n.title}</h4>
                    <p style="color:#ccc;font-size:0.95rem; margin:10px 0;">${n.content}</p>
                    <span style="color:var(--pva-green); font-weight:bold;"><i class="far fa-clock"></i> ${n.date}</span><br>
                    ${deleteBtn}
                </div>
            </div>`;
        });
    }
}

function addNews() {
    const title = document.getElementById('newsTitleInput').value;
    const content = document.getElementById('newsContentInput').value;
    const date = document.getElementById('newsDateInput').value || "Just now";
    const img = document.getElementById('newsImgInput').value;

    if(!title || !content) return alert("Title and Content are required!");

    const newsData = getSafeData('pva_news');
    newsData.unshift({ id: Date.now(), title, content, date, img });
    localStorage.setItem('pva_news', JSON.stringify(newsData));
    
    closeAdminModal();
    loadNews();
    alert("News Successfully Published!");
}

function deleteNews(id) {
    if(confirm("Are you sure you want to delete this news?")) {
        let newsData = getSafeData('pva_news');
        newsData = newsData.filter(n => n.id !== id);
        localStorage.setItem('pva_news', JSON.stringify(newsData));
        loadNews();
    }
}
// --- GALERİ TAM EKRAN (LIGHTBOX) KODLARI ---
function openLightbox(imageSrc) {
    const lightbox = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    
    lightboxImg.src = imageSrc; // Tıklanan resmin linkini büyük ekrana aktar
    lightbox.style.display = 'flex'; // Modalı görünür yap
}

function closeLightbox() {
    const lightbox = document.getElementById('lightboxModal');
    lightbox.style.display = 'none'; // Modalı gizle
}
