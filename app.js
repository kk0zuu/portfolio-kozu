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
    document.querySelectorAll('.project-bubble, .editorial-board').forEach(container => {
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
            squash: mobile ? 0.14 : 0.22,    // écrasement vertical (effet dock)
            spread: mobile ? 0.03 : 0.06,    // léger étirement horizontal
            haze: mobile ? 0.65 : 0.5,       // opacité
            blur: mobile ? 2 : 5,            // flou de profondeur
            perspective: mobile ? 900 : 1200,
            dead: mobile ? 0.4 : 0.5         // zone centrale nette (0 = centre, 1 = bord)
        };
    }

    let p = params();

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

        render();
    }

    function apply(entry, distance) {
        const dist = Math.min(1, Math.abs(distance));
        const base = 1 - (1 - p.shrink) * dist;

        // Déformation « fenêtre macOS » : la carte s'aplatit verticalement et
        // s'élargit très légèrement en partant vers le bord, comme aspirée.
        entry.set({
            rotateX: p.tilt * distance,
            z: p.depth * dist,
            scaleX: base * (1 + p.spread * dist),
            scaleY: base * (1 - p.squash * dist),
            opacity: 1 - (1 - p.haze) * dist,
            filter: 'blur(' + (p.blur * dist).toFixed(2) + 'px)'
        });
    }

    function render() {
        const vh = window.innerHeight;
        const middle = vh / 2;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const top = entry.layoutTop - scrollTop;
            const bottom = top + entry.layoutHeight;

            if (top > vh) { apply(entry, 1); continue; }        // pas encore entrée
            if (bottom < 0) { apply(entry, -1); continue; }     // déjà sortie en haut

            // Centre de la portion réellement visible de la carte
            const visibleTop = Math.max(top, 0);
            const visibleBottom = Math.min(bottom, vh);
            const visibleCenter = (visibleTop + visibleBottom) / 2;

            const raw = (visibleCenter - middle) / middle;
            const abs = Math.abs(raw);

            // Zone morte : la carte reste parfaitement nette tant qu'elle occupe
            // le centre de l'écran, puis l'effet monte progressivement.
            const shaped = abs <= p.dead ? 0 : Math.min(1, (abs - p.dead) / (1 - p.dead));

            apply(entry, raw < 0 ? -shaped : shaped);
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