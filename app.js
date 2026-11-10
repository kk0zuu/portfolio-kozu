// Enregistrement sécurisé des plugins GSAP s'ils sont chargés
if (typeof gsap !== 'undefined') {
    const pluginsToRegister = [];
    if (typeof ScrollTrigger !== 'undefined') pluginsToRegister.push(ScrollTrigger);
    if (typeof MotionPathPlugin !== 'undefined') pluginsToRegister.push(MotionPathPlugin);
    if (pluginsToRegister.length > 0) {
        gsap.registerPlugin(...pluginsToRegister);
    }
}

// --- GESTION DU CURSEUR PERSONNALISÉ ---
const cursor = document.querySelector('.custom-cursor');

if (cursor) {
    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            if (cursor.style.opacity !== '1') {
                cursor.style.opacity = '1';
            }
        });
    });

    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
    });

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('.hover-target, a, button')) {
            document.body.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (!e.relatedTarget || !e.relatedTarget.closest('.hover-target, a, button')) {
            document.body.classList.remove('hovering');
        }
    });
}

// --- NAVIGATION BUBBLE (liquid glass) ---
(function () {
    const topBar = document.querySelector('.top-bar');
    const navBubble = document.querySelector('.nav-bubble');
    if (!topBar || !navBubble) return;

    // Tous les éléments cliquables de la barre : logo + liens nav
    const logoEl = topBar.querySelector('.logo');
    const navItems = [logoEl, ...topBar.querySelectorAll('.nav-links a')].filter(Boolean);

    function moveBubbleTo(el) {
        if (!el) return;
        const barRect = topBar.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const padding = 8; // px de marge intérieure autour du texte
        navBubble.style.left = (elRect.left - barRect.left - padding) + 'px';
        navBubble.style.width = (elRect.width + padding * 2) + 'px';
    }

    // Position initiale : sur le logo
    // On attend que le layout soit prêt
    function initBubble() {
        if (logoEl) moveBubbleTo(logoEl);
    }

    // Désactiver la transition au chargement pour un positionnement instantané
    navBubble.style.transition = 'none';
    requestAnimationFrame(() => {
        initBubble();
        // Réactiver la transition après le positionnement initial
        requestAnimationFrame(() => {
            navBubble.style.transition = '';
        });
    });

    // Hover : déplacer la bulle sur l'élément survolé
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => moveBubbleTo(item));
    });

    // Quitter la barre : revenir au logo
    topBar.addEventListener('mouseleave', () => {
        if (logoEl) moveBubbleTo(logoEl);
    });
})();

// --- GÉNÉRATION DU TITRE RANSOM NOTE (VERT EXACT, MAGENTA, CONTOURS & ESPACEMENTS) ---
const heroTitleEl = document.querySelector('.hero-section #hero-title');
// Ne générer le ransom note complet que s'il s'agit du titre d'accueil
if (heroTitleEl && heroTitleEl.closest('.hero-content') && document.querySelector('.hero-intro-line')) {
    // Décomposition par mots et tiret pour gérer les espacements spécifiques
    // Mot 1 : "IAN", Mot 2 : "BOSSUT", Tiret : "-", Mot 3 : "GANDOU"
    const wordsConfig = [
        { text: "IAN", isDash: false },
        { text: "BOSSUT", isDash: false },
        { text: "-", isDash: true },
        { text: "GANDOU", isDash: false }
    ];

    // Polices soignées magazine spécifiques par lettre (sans glitch déformant sur 2e S et D)
    const letterFonts = [
        'ransom-font-archivo',    // I
        'ransom-font-playfair',   // A
        'ransom-font-typewriter', // N
        // espace mot
        'ransom-font-bungee',     // B
        'ransom-font-cinzel',     // O
        'ransom-font-bebas',      // S
        'ransom-font-playfair',   // 2e S : Serif soigné
        'ransom-font-typewriter', // U
        'ransom-font-cinzel',     // T
        // espace tiret
        'ransom-font-bebas',      // -
        // espace tiret
        'ransom-font-archivo',    // G
        'ransom-font-playfair',   // A
        'ransom-font-typewriter', // N
        'ransom-font-cinzel',     // D : Majuscule romaine nette
        'ransom-font-bungee',     // O
        'ransom-font-bebas'       // U
    ];

    // 3 styles typographiques autorisés (JAMAIS de blanc sans contour) :
    // 1. Noir pur sans contour
    // 2. Blanc avec fin contour noir
    // 3. Noir avec fin contour blanc
    const textStrokeStyles = [
        'letter-style-black',
        'letter-style-white-black-stroke',
        'letter-style-black-white-stroke'
    ];

    let letterCounter = 0;
    let titleHTML = '';

    wordsConfig.forEach((item, itemIndex) => {
        if (itemIndex === 1) {
            // Espace entre "IAN" et "BOSSUT"
            titleHTML += '<span class="ransom-word-space"></span>';
        } else if (itemIndex === 2) {
            // Espace conservé avant le tiret "-"
            titleHTML += '<span class="ransom-dash-space"></span>';
        } else if (itemIndex === 3) {
            // Espace conservé après le tiret "-"
            titleHTML += '<span class="ransom-dash-space"></span>';
        }

        item.text.split('').forEach(char => {
            // Alternance stricte 1 lettre sur 2 : MAGENTA (#9C1DBD) et VERT (#358E14)
            const colorClass = (letterCounter % 2 === 0) ? 'ransom-purple' : 'ransom-green';

            // Découpe asymétrique irrégulière (façon ciseaux de magazine)
            const clipClass = `clip-cut-${letterCounter % 6}`;

            // Police dédiée
            const fontClass = letterFonts[letterCounter] || 'ransom-font-archivo';

            // Sélection aléatoire du style de contour
            const strokeStyle = textStrokeStyles[Math.floor(Math.random() * textStrokeStyles.length)];

            // Randomisation organique de la position et de la rotation
            const rot = gsap.utils.random(-5.5, 6.5).toFixed(1);
            const offsetY = gsap.utils.random(-5, 6).toFixed(1);

            // Ombres nettes et semi-transparentes avec direction randomisée
            const shadowX = gsap.utils.random(-6, 7).toFixed(1);
            const shadowY = gsap.utils.random(5, 10).toFixed(1);
            const shadowBlur = gsap.utils.random(4, 7).toFixed(1);

            // Les lettres appartenant à un mot sont rapprochées (letter-in-word)
            const spacingClass = item.isDash ? '' : 'letter-in-word';

            titleHTML += `<span class="ransom-wrapper ${spacingClass}" 
                                style="--shadow-x: ${shadowX}px; --shadow-y: ${shadowY}px; --shadow-blur: ${shadowBlur}px; transform: translateY(${offsetY}px) rotate(${rot}deg);" 
                                data-rot="${rot}" 
                                data-y="${offsetY}">
                            <span class="ransom-card ${colorClass} ${clipClass} ${fontClass} ${strokeStyle}">
                                ${char}
                            </span>
                        </span>`;

            letterCounter++;
        });
    });

    heroTitleEl.innerHTML = titleHTML;
}

// Récupération des éléments du titre principal et de l'introduction
const ransomWrappers = document.querySelectorAll('.ransom-wrapper');
const introLine = document.querySelector('.hero-intro-line');
const manuscriptText = document.querySelector('.hero-manuscript-text');
const portfolioBadge = document.querySelector('.portfolio-badge');
const heroSection = document.querySelector('.hero-section');

// --- 1. APPARITION CLASSIQUE & ÉLÉGANTE DU HERO ---
if (introLine && heroSection) {
    const tlHero = gsap.timeline({ delay: 0.1 });

    // Apparition simple et fluide de la ligne d'intro ("et voici mon PORTFOLIO")
    tlHero.from([manuscriptText, portfolioBadge], {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out"
    });

    // Apparition douce en cascade des lettres du titre
    if (ransomWrappers.length > 0) {
        tlHero.from(ransomWrappers, {
            opacity: 0,
            y: 30,
            scale: 0.9,
            duration: 0.5,
            stagger: 0.02,
            ease: "power2.out"
        }, "-=0.3");
    }
}


// --- 2. SCROLLTRIGGER : ÉPARPILLEMENT / EXPLOSION DU TITRE AU SCROLL VERS LE BAS ---
if (ransomWrappers.length > 0 && heroSection) {
    const tlExplode = gsap.timeline({
        scrollTrigger: {
            trigger: ".hero-section",
            start: "top top",      // Commence dès qu'on commence à scroller depuis le haut
            end: "+=600",          // Distance de scroll fixe et prévisible (600px de scroll)
            scrub: 1.2,            // Synchronisé avec la molette de scroll
            invalidateOnRefresh: true
        }
    });

    // Éjection centrifuge explosive de chaque lettre
    ransomWrappers.forEach((wrapper, index) => {
        const finalRot = parseFloat(wrapper.getAttribute('data-rot')) || 0;
        
        // Distribution spatiale : les lettres s'écartent vers les 4 coins
        const normX = (index - 7.5) / 7.5; // -1 (gauche) à +1 (droite)
        const dirX = normX * 850 + gsap.utils.random(-180, 180);
        const dirY = (index % 2 === 0 ? -1 : 1) * gsap.utils.random(300, 680) + gsap.utils.random(-120, 120);
        const dirRot = finalRot + gsap.utils.random(-260, 260);
        const dirScale = gsap.utils.random(0.3, 1.8);

        tlExplode.to(wrapper, {
            x: dirX,
            y: dirY,
            rotation: dirRot,
            scale: dirScale,
            opacity: 0,
            ease: "power1.in"
        }, 0);
    });

    // Évanouissement vers le haut de la ligne d'intro ("et voici mon PORTFOLIO")
    tlExplode.to(".hero-intro-line", {
        y: -90,
        opacity: 0,
        ease: "power1.in"
    }, 0);
}


// --- 3. SCROLLTRIGGER : CHANGEMENT DE FOND (BLANC -> VERT PÂLE) ---
// Uniquement sur les pages qui ont la section de choix des domaines.
if (document.querySelector('.domain-selection')) {
    ScrollTrigger.create({
        trigger: ".domain-selection",
        start: "top 75%",
        end: "bottom center",
        onEnter: () => gsap.to("body", { backgroundColor: "var(--color-bg-end)", duration: 0.8 }),
        onLeaveBack: () => gsap.to("body", { backgroundColor: "var(--color-bg-start)", duration: 0.8 })
    });
}


// --- 4. SCROLLTRIGGER : SPIRALE DES BULLES (DESCENDUES SOUS LE TITRE) ---
const mm = gsap.matchMedia();

mm.add({
    isDesktop: "(min-width: 901px)",
    isMobile: "(max-width: 900px)"
}, (context) => {
    const { isDesktop } = context.conditions;

    gsap.set(".bubble-card", {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
        scale: 0.9,
        rotation: 0
    });

    gsap.set(".handwritten-label", {
        scale: 0.2,
        opacity: 0
    });

    const tlSpiral = gsap.timeline({
        scrollTrigger: {
            trigger: ".domain-selection",
            start: "top 80%",
            end: "bottom 90%",
            scrub: 1.2
        }
    });

    tlSpiral.to(".bubble-card", {
        scale: 1,
        duration: 0.3,
        ease: "power1.out"
    }, 0);

    tlSpiral.to(".handwritten-label", {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.8)",
        stagger: 0.05
    }, 0.2);

    if (isDesktop) {
        // NUMÉRIQUE : Trajectoire descendue (atterrit à y: 40)
        tlSpiral.to(".bubble-num", {
            motionPath: {
                path: [
                    { x: 0, y: 0 },
                    { x: -80, y: -40 },
                    { x: -220, y: -30 },
                    { x: -370, y: 40 }
                ],
                curviness: 1.5
            },
            rotation: -5,
            ease: "power1.inOut"
        }, 0);

        // PHOTO : Trajectoire descendue (atterrit à y: 40)
        tlSpiral.to(".bubble-photo", {
            motionPath: {
                path: [
                    { x: 0, y: 0 },
                    { x: 120, y: 110 },
                    { x: 250, y: 100 },
                    { x: 360, y: 40 }
                ],
                curviness: 1.5
            },
            rotation: 4,
            ease: "power1.inOut"
        }, 0);

        // PLASTIQUE : Descend plus bas (atterrit à y: 340)
        tlSpiral.to(".bubble-plastique", {
            motionPath: {
                path: [
                    { x: 0, y: 0 },
                    { x: -130, y: 100 },
                    { x: -180, y: 200 },
                    { x: -90, y: 280 },
                    { x: 0, y: 340 }
                ],
                curviness: 1.5
            },
            rotation: -2,
            ease: "power1.inOut"
        }, 0);

    } else {
        tlSpiral.to(".bubble-num", {
            motionPath: {
                path: [
                    { x: 0, y: 0 },
                    { x: -30, y: -30 },
                    { x: -130, y: -70 }
                ],
                curviness: 1.3
            },
            rotation: -4,
            ease: "power1.inOut"
        }, 0);

        tlSpiral.to(".bubble-photo", {
            motionPath: {
                path: [
                    { x: 0, y: 0 },
                    { x: 40, y: 40 },
                    { x: 130, y: -70 }
                ],
                curviness: 1.3
            },
            rotation: 4,
            ease: "power1.inOut"
        }, 0);

        tlSpiral.to(".bubble-plastique", {
            motionPath: {
                path: [
                    { x: 0, y: 0 },
                    { x: -50, y: 80 },
                    { x: 0, y: 210 }
                ],
                curviness: 1.3
            },
            rotation: -2,
            ease: "power1.inOut"
        }, 0);
    }
});

// --- VISIONNEUSE PHOTO : LIGHTBOX AVEC NAVIGATION ---
(function initLightbox() {
    let lightbox = document.querySelector('.portfolio-lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.className = 'portfolio-lightbox';
        lightbox.innerHTML = `
            <button class="lightbox-nav lightbox-prev" aria-label="Photo précédente">‹</button>
            <button class="lightbox-nav lightbox-next" aria-label="Photo suivante">›</button>
            <div class="lightbox-content-box">
                <button class="lightbox-close-btn" aria-label="Fermer">✕</button>
                <img src="" alt="Vue agrandie">
                <p class="lightbox-caption"></p>
                <p class="lightbox-counter"></p>
            </div>
        `;
        document.body.appendChild(lightbox);
    }

    const imgEl = lightbox.querySelector('img');
    const captionEl = lightbox.querySelector('.lightbox-caption');
    const counterEl = lightbox.querySelector('.lightbox-counter');
    const closeBtn = lightbox.querySelector('.lightbox-close-btn');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    let gallery = [];
    let current = -1;

    // --- Zoom à la molette dans la visionneuse (pages photo) ---
    // La molette au-dessus de la photo agrandit ou réduit l'image autour du
    // point survolé, sans déplacer la page derrière.
    const zoomAutorise = !!document.querySelector('.pr-card, .pe-section');
    let zoom = 1;

    function reinitialiserZoom() {
        zoom = 1;
        if (imgEl) {
            imgEl.style.transform = '';
            imgEl.style.transformOrigin = '';
        }
        lightbox.classList.remove('zoomed');
    }

    if (zoomAutorise && imgEl) {
        lightbox.classList.add('zoom-actif');

        imgEl.addEventListener('wheel', (e) => {
            if (!isOpen()) return;
            const rect = imgEl.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            e.preventDefault();

            // Repère du curseur dans l'image : la mise à l'échelle part de là,
            // le point survolé reste donc sous le curseur.
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            const facteur = e.deltaY < 0 ? 1.12 : 1 / 1.12;
            zoom = Math.min(4, Math.max(1, zoom * facteur));

            if (zoom === 1) { reinitialiserZoom(); return; }

            imgEl.style.transformOrigin = x.toFixed(2) + '% ' + y.toFixed(2) + '%';
            imgEl.style.transform = 'scale(' + zoom.toFixed(3) + ')';
            lightbox.classList.add('zoomed');
        }, { passive: false });
    }

    // Toutes les photos cliquables de la page, dans l'ordre du document
    function collectGallery() {
        const seen = new Set();
        gallery = [];
        document.querySelectorAll('.bubble-img-card, .lightbox-trigger, .editorial-img-frame').forEach(card => {
            const img = card.tagName === 'IMG' ? card : card.querySelector('img');
            if (!img || !img.src) return;
            if (seen.has(img.src)) return;
            seen.add(img.src);
            const caption = (card.querySelector && card.querySelector('.img-caption') && card.querySelector('.img-caption').textContent.trim())
                || img.getAttribute('data-caption')
                || img.alt
                || '';
            gallery.push({ el: img, src: img.src, alt: img.alt, caption: caption });
        });
        return gallery;
    }

    function show(index) {
        if (!gallery.length) return;
        current = (index + gallery.length) % gallery.length;
        const photo = gallery[current];
        if (imgEl) {
            imgEl.src = photo.src;
            imgEl.alt = photo.alt || 'Vue agrandie';
        }
        if (captionEl) captionEl.textContent = photo.caption;
        if (counterEl) counterEl.textContent = (current + 1) + ' / ' + gallery.length;
        const multiple = gallery.length > 1;
        if (prevBtn) prevBtn.hidden = !multiple;
        if (nextBtn) nextBtn.hidden = !multiple;
        reinitialiserZoom();
    }

    function openWith(img) {
        collectGallery();
        const index = gallery.findIndex(photo => photo.el === img);
        show(index === -1 ? 0 : index);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        if (imgEl) imgEl.src = '';
        if (captionEl) captionEl.textContent = '';
        if (counterEl) counterEl.textContent = '';
        reinitialiserZoom();
    }

    function isOpen() {
        return lightbox.classList.contains('active');
    }

    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); show(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); show(current + 1); });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!isOpen()) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    });

    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target || !target.closest) return;
        if (lightbox.contains(target)) return;
        const card = target.closest('.bubble-img-card, .lightbox-trigger, .editorial-img-frame');
        // Un clic direct sur une photo doit ouvrir la visionneuse, même quand la
        // carte qui la contient est transformée en 3D par le carrousel.
        const img = target.tagName === 'IMG' ? target : (card && card.querySelector('img'));
        if (img && img.src) openWith(img);
    });

    // Préchauffe les images voisines pour une navigation instantanée
    function preloadNeighbours() {
        if (!gallery.length) return;
        [current + 1, current - 1].forEach(i => {
            const photo = gallery[(i + gallery.length) % gallery.length];
            if (photo) { const pre = new Image(); pre.src = photo.src; }
        });
    }
    if (prevBtn) prevBtn.addEventListener('mouseenter', preloadNeighbours);
    if (nextBtn) nextBtn.addEventListener('mouseenter', preloadNeighbours);
})();

// --- ANIMATIONS D'APPARITION : BLUR TO FOCUS, FADE-IN & STAGGER ---
(function() {
    if (typeof gsap === 'undefined') return;

    // 1. Titres : Blur Reveal (blur 10px -> 0px + opacité avec courbe douce)
    gsap.utils.toArray('.blur-reveal').forEach(title => {
        gsap.fromTo(title,
            { opacity: 0, filter: 'blur(10px)' },
            {
                opacity: 1,
                filter: 'blur(0px)',
                duration: 0.9,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: title,
                    start: 'top 88%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // 2. Descriptions : Simple Fade-In
    gsap.utils.toArray('.fade-in').forEach(desc => {
        gsap.fromTo(desc,
            { opacity: 0, y: 15 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: desc,
                    start: 'top 88%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    // 3. Éléments à l'intérieur des bulles et planches (Images en Stagger 0.1s + translation vers le haut)
    //    Les cases photo (.pr-card) sont traitées plus bas, photo par photo.
    document.querySelectorAll('.project-bubble:not(.pr-card), .editorial-board').forEach(container => {
        const items = container.querySelectorAll('.bubble-img-card, .editorial-img-frame');
        if (items.length > 0) {
            gsap.fromTo(items,
                { opacity: 0, y: 22 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    ease: 'power2.out',
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: container,
                        start: 'top 82%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        }
    });
    // 4. Pages photo : chaque photo apparaît dès qu'elle devient visible.
    //    Les cases étant transformées en 3D par le carrousel, les positions
    //    calculées par ScrollTrigger seraient faussées : on observe donc la
    //    visibilité réelle de chaque photo.
    const photos = [...document.querySelectorAll('.pr-card .editorial-img-frame, .pe-section .editorial-img-frame')];

    if (photos.length) {
        photos.forEach((item, index) => {
            gsap.set(item, { opacity: 0, y: 22 });
            item.dataset.revealDelay = String(Math.min(index, 8) * 0.06);
        });

        if ('IntersectionObserver' in window) {
            // Les cases Expressive sont plus basses dans le viewport : leurs photos
            // n'apparaissaient qu'une fois déjà bien installées à l'écran. On les
            // déclenche donc avant même qu'elles ne franchissent le bord bas.
            const creerObservateur = (marge) => {
                const observateur = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) return;
                        const el = entry.target;
                        observateur.unobserve(el);
                        gsap.to(el, {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: 'power2.out',
                            delay: parseFloat(el.dataset.revealDelay) || 0
                        });
                    });
                }, { rootMargin: marge, threshold: 0.01 });
                return observateur;
            };

            const tot = creerObservateur('0px 0px 14% 0px');    // cases Expressive : plus tôt
            const tard = creerObservateur('0px 0px -8% 0px');   // cases Studio & Pro

            photos.forEach((el) => {
                (el.closest('.pe-section') ? tot : tard).observe(el);
            });
        } else {
            gsap.set(photos, { opacity: 1, y: 0 });
        }
    }
})();
// --- HERO ÉPINGLÉ (PAGES PHOTOGRAPHIE) ---
// Le titre de la page reste en place et les cases défilent par-dessus lui.
(function initPinnedHero() {
    const hero = document.querySelector('.domain-hero-section');
    const content = hero && hero.nextElementSibling;
    if (!hero || !content || !content.classList.contains('domain-content')) return;

    const root = document.documentElement;

    function appliquer() {
        // Sur mobile le hero est trop haut pour rester fixe : comportement normal.
        if (window.innerWidth < 901) {
            root.classList.remove('hero-pinned');
            root.style.removeProperty('--hero-top');
            root.style.removeProperty('--hero-offset');
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            return;
        }

        // On mesure avant d'épingler, sinon position et hauteur lues sont celles
        // de l'élément déjà sorti du flux.
        root.classList.remove('hero-pinned');

        const rect = hero.getBoundingClientRect();
        const top = rect.top + (window.pageYOffset || 0);

        root.style.setProperty('--hero-top', top + 'px');
        root.style.setProperty('--hero-offset', rect.height + 'px');
        root.classList.add('hero-pinned');

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    appliquer();

    let minuteur = null;
    window.addEventListener('resize', () => {
        clearTimeout(minuteur);
        minuteur = setTimeout(appliquer, 150);
    });
    window.addEventListener('load', appliquer);
})();

// --- CARROUSEL 3D VERTICAL "TAMBOUR" (PAGES PHOTOGRAPHIE) ---
// Les cartes (et non les photos) pivotent sur l'axe X selon la position de leur
// portion visible par rapport au centre du viewport : plates au centre, inclinées
// en haut et en bas. Une zone centrale les garde nettes plus longtemps.
(function initDrumCarousel() {
    if (typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const items = Array.from(document.querySelectorAll('.pr-card, .pe-section'));
    if (!items.length) return;

    function params() {
        const mobile = window.innerWidth < 901;
        return {
            tilt: mobile ? 14 : 30,          // rotateX des cartes éloignées
            depth: mobile ? -90 : -200,      // translateZ
            shrink: mobile ? 0.92 : 0.85,    // scale global
            squash: mobile ? 0.3 : 0.45,     // écrasement vertical (aspiration)
            narrow: mobile ? 0.03 : 0.06,    // resserrement horizontal
            haze: mobile ? 0.65 : 0.5,       // opacité
            blur: mobile ? 2 : 5,            // flou de profondeur
            perspective: mobile ? 900 : 1200,
            dead: 0.3                        // zone centrale nette : plus petit = transition plus étalée
        };
    }

    let p = params();
    let pageMax = 0;
    let lastExit = 0.5;      // mi-départ de la dernière carte, calibré sur sa hauteur
    let basDocument = 0;     // bas de la dernière case en coordonnées du document
    let dernierCalculPage = 0;

    const entries = items.map((el) => {
        gsap.set(el, { transformPerspective: p.perspective, transformOrigin: '50% 50%' });
        return { el: el, set: gsap.quickSetter(el, 'css'), layoutTop: 0, layoutHeight: 0 };
    });

    // Mesure de la mise en page réelle : on neutralise d'abord l'effet, sinon les
    // rectangles renvoyés sont ceux déjà déformés par la rotation et l'échelle.
    function measure() {
        entries.forEach((entry) => gsap.set(entry.el, { rotateX: 0, z: 0, scale: 1 }));

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        entries.forEach((entry) => {
            const rect = entry.el.getBoundingClientRect();
            entry.layoutTop = rect.top + scrollTop;
            entry.layoutHeight = rect.height;
        });

        pageMax = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

        calibrerDerniere();
        render();
    }

    // Effet « fenêtre macOS » : la carte se pince vers le bord par lequel elle
    // sort (origine de transformation déplacée vers ce bord), s'écrase
    // verticalement et se resserre en largeur, sans jamais pencher.
    function etatEffet(distance) {
        const dist = Math.min(1, Math.abs(distance));
        const base = 1 - (1 - p.shrink) * dist;
        return {
            transformOrigin: '50% ' + (50 + 50 * distance).toFixed(1) + '%',
            rotateX: p.tilt * distance,
            z: p.depth * dist,
            scaleX: base * (1 - p.narrow * dist),
            scaleY: base * (1 - p.squash * dist),
            opacity: 1 - (1 - p.haze) * dist,
            filter: 'blur(' + (p.blur * dist).toFixed(2) + 'px)'
        };
    }

    function apply(entry, distance) {
        entry.set(etatEffet(distance));
    }

    // La dernière carte est bien plus haute sur une page que sur l'autre : à
    // intensité égale, elle sortirait de l'écran d'un côté et resterait entière
    // de l'autre. On cherche donc le mi-départ le plus franc qui lui laisse
    // encore un quart d'écran visible une fois la page arrivée en bas.
    function calibrerDerniere() {
        const entry = entries[entries.length - 1];
        if (!entry || !entry.layoutHeight) return;

        const vh = window.innerHeight;
        const topFin = entry.layoutTop - pageMax;
        const basFin = topFin + entry.layoutHeight;
        basDocument = entry.layoutTop + entry.layoutHeight;
        const cible = vh * 0.25;

        gsap.set(entry.el, { transformPerspective: p.perspective, transformOrigin: '50% 50%', rotateX: 0, z: 0, scaleX: 1, scaleY: 1 });
        const neutre = entry.el.getBoundingClientRect();

        let choisi = 0.15;
        for (let test = 0.15; test <= 0.5501; test += 0.05) {
            gsap.set(entry.el, etatEffet(-test));
            const r = entry.el.getBoundingClientRect();
            const decalageHaut = r.top - neutre.top;
            const decalageBas = r.bottom - neutre.bottom;
            const visible = Math.min(basFin + decalageBas, vh) - Math.max(topFin + decalageHaut, 0);
            if (visible >= cible) choisi = test;
        }

        gsap.set(entry.el, etatEffet(0));
        lastExit = choisi;
    }

    function render() {
        const vh = window.innerHeight;
        const middle = vh / 2;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;

        // Le document grandit encore après la mesure (images, polices) : on
        // rafraîchit la limite de défilement sans lire la mise en page à chaque image.
        const maintenant = performance.now();
        if (scrollTop + vh * 1.5 >= pageMax || maintenant - dernierCalculPage > 300) {
            pageMax = Math.max(0, document.documentElement.scrollHeight - vh);
            dernierCalculPage = maintenant;
        }

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const top = entry.layoutTop - scrollTop;
            const bottom = top + entry.layoutHeight;

            const derniere = i === entries.length - 1;

            if (top > vh) { apply(entry, derniere ? lastExit : 1); continue; }
            if (bottom < 0) { apply(entry, derniere ? -lastExit : -1); continue; }

            // Centre de la portion réellement visible de la carte
            const visibleTop = Math.max(top, 0);
            const visibleBottom = Math.min(bottom, vh);
            const visibleCenter = (visibleTop + visibleBottom) / 2;

            const raw = (visibleCenter - middle) / middle;
            const abs = Math.abs(raw);

            // Zone morte : la carte reste parfaitement nette tant qu'elle occupe
            // le centre de l'écran, puis l'effet monte progressivement.
            const shaped = abs <= p.dead ? 0 : Math.min(1, (abs - p.dead) / (1 - p.dead));

            let distance = raw < 0 ? -shaped : shaped;

            // La dernière carte amorce son départ sur la fin du défilement et s'y
            // arrête à mi-chemin : elle reste visible en haut de l'écran, comme la
            // première qui n'est pas encore tout à fait arrivée.
            if (derniere) {
                const reste = Math.max(0, pageMax - scrollTop);
                // Le départ n'est amorcé qu'une fois le bas de la case passé sous
                // l'écran d'une vingtaine de pixels : la case a fini d'être
                // parcourue, puis les blocs du bas arrivent pendant l'animation.
                const basFinEcran = basDocument - pageMax;
                const course = Math.max(160, vh - basFinEcran + 20);
                const depart = Math.max(0, Math.min(1, 1 - reste / course));
                distance = -Math.max(shaped, lastExit * depart);
            }

            apply(entry, distance);
        }
    }

    function refreshParams() {
        p = params();
        entries.forEach((entry) => gsap.set(entry.el, { transformPerspective: p.perspective }));
        measure();
    }

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
            trigger: document.body,
            start: 0,
            end: 'max',
            onUpdate: render,
            onRefresh: measure
        });
    } else {
        document.addEventListener('scroll', render, { passive: true });
    }

    window.addEventListener('resize', refreshParams);
    window.addEventListener('load', measure);
    setTimeout(measure, 1200);

    measure();
})();