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

    let cible = null;
    let largeurNeutre = 150; // largeur de croisière entre deux textes

    function mesurerNeutre() {
        const l = navItems
            .map(function (el) { return el.getBoundingClientRect().width; })
            .filter(function (v) { return v > 20; })
            .sort(function (a, b) { return a - b; });
        if (!l.length) return;
        const med = l[Math.floor(l.length / 2)] + 16;
        if (med > 60 && med < 400) largeurNeutre = med;
    }

    // --- Bulle liquide : position et largeur lissées, étirement selon la vitesse ---
    let cx = null;        // centre courant
    let w = null;         // largeur de base courante
    let cibleCx = null;
    let cibleW = null;
    let boucle = 0;
    let tPrec = 0;

    function poser(centre, largeur) {
        cibleCx = centre;
        cibleW = largeur;
        if (!boucle) {
            // premier pas calculé tout de suite, la suite au fil des images
            tPrec = performance.now();
            animer(tPrec);
        }
    }

    function animer(t) {
        if (!tPrec) tPrec = t;
        const dt = Math.min(0.05, (t - tPrec) / 1000) || 0.016;
        tPrec = t;

        if (cx === null) { cx = cibleCx; w = cibleW; }

        const aP = 1 - Math.exp(-dt / 0.05);
        const aW = 1 - Math.exp(-dt / 0.07);

        const ecart = cibleCx - cx;
        cx += ecart * aP;
        w += (cibleW - w) * aW;

        // étirement proportionnel à la vitesse de rapprochement
        const etire = Math.min(46, Math.abs(ecart) * 2.2);
        const centre = cx + Math.sign(ecart) * etire * 0.18;
        const largeur = Math.min(w + etire, topBar.clientWidth - 12);

        const bar = topBar.getBoundingClientRect();
        const gauche = Math.max(6, Math.min(bar.width - largeur - 6, centre - largeur / 2));

        navBubble.style.left = gauche + 'px';
        navBubble.style.width = largeur + 'px';
        navBubble.style.transform = 'scaleY(' + (1 - etire * 0.0022).toFixed(3) + ')';

        if (Math.abs(ecart) < 0.4 && Math.abs(cibleW - w) < 0.4) {
            cx = cibleCx;
            w = cibleW;
            navBubble.style.transform = '';
            boucle = 0;
            return;
        }
        boucle = requestAnimationFrame(animer);
    }

    function moveBubbleTo(el, instantane) {
        if (!el) return;
        cible = el;
        const barRect = topBar.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const padding = 8; // px de marge intérieure autour du texte
        const largeur = elRect.width + padding * 2;
        const centre = elRect.left - barRect.left + elRect.width / 2;
        if (instantane) { cx = centre; w = largeur; }
        poser(centre, largeur);
    }

    // Élément par défaut : le lien de la page courante, sinon le logo
    function elPageCourante() {
        const ici = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        const lien = navItems.filter(a => {
            if (a === logoEl) return false;
            const cible = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
            return cible === ici;
        })[0];
        return lien || logoEl;
    }

    const elDefaut = elPageCourante();
    cible = elDefaut;

    // Placement instantané (la bulle est animée par la boucle, pas par une transition CSS)
    navBubble.style.transition = 'none';
    function initBubble() {
        mesurerNeutre();
        moveBubbleTo(elDefaut, true);
    }
    initBubble();

    // La mise en page bouge quand les polices arrivent : on replace la bulle,
    // instantanément (sans transition) pour qu'aucun décalage ne subsiste.
    function replacer() {
        mesurerNeutre();
        if (!cible || dedans) return; // pendant le suivi, c'est la souris qui commande
        moveBubbleTo(cible, true);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(replacer);
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', replacer);
    window.addEventListener('load', replacer);
    window.addEventListener('resize', replacer);
    /* La bulle ne se montre qu'une fois les polices arrivées et sa place mesurée :
       sinon elle apparaît minuscule puis saute à sa position définitive. */
    function montrerBulle() {
        replacer();
        /* la position reste pilotée image par image ; seule l'apparition est fondue */
        navBubble.style.transition = 'opacity 0.35s ease';
        /* sur l'accueil, c'est l'animation de la barre qui fait naître la pastille,
           en même temps que les textes : on ne la montre pas avant */
        if (window.__introBarre) return;
        requestAnimationFrame(() => navBubble.classList.add('vue'));
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(montrerBulle);
        setTimeout(montrerBulle, 700);   // filet de sécurité si la police traîne
    } else {
        montrerBulle();
    }

    // Veille de 4 s après le chargement : la police peut s'appliquer sans prévenir
    let battements = 0;
    const veille = setInterval(() => {
        replacer();
        if (++battements >= 16) clearInterval(veille);
    }, 250);

    // Toute variation de largeur (police, zoom, fenêtre) replace la bulle
    if (window.ResizeObserver) {
        const ro = new ResizeObserver(replacer);
        ro.observe(topBar);
        navItems.forEach(el => ro.observe(el));
    }

    // --- Suivi de la souris ---
    const MARGE = 14;      // quelques pixels de suivi hors de la barre
    const EXTENSION = 10;  // dépassement autour d'un texte où la bulle s'arrête dessus
    let dedans = false;

    function suivre(e) {
        const bar = topBar.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        const dansZone = x > bar.left - MARGE && x < bar.right + MARGE &&
                         y > bar.top - MARGE && y < bar.bottom + MARGE;

        if (!dansZone) {
            if (dedans) {
                dedans = false;
                moveBubbleTo(elDefaut);
            }
            return;
        }

        dedans = true;

        // sur un texte : la bulle s'y arrête net
        const dessus = navItems.filter(function (el) {
            const r = el.getBoundingClientRect();
            return x >= r.left - EXTENSION && x <= r.right + EXTENSION;
        })[0];

        if (dessus) {
            moveBubbleTo(dessus);
            return;
        }

        // entre deux textes : la bulle suit la souris à une largeur de croisière,
        // la même dans les deux sens (médiane des textes de la barre)
        poser(x - bar.left, largeurNeutre);
    }

    window.addEventListener('pointermove', suivre, { passive: true });
})();

// --- TOP BAR D'ACCUEIL : petite bulle qui s'ouvre, puis texte tapé ---
(function () {
    if (typeof gsap === 'undefined') return;

    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page !== 'index.html') return; // uniquement à l'accueil
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bar = document.querySelector('.top-bar');
    if (!bar) return;

    /* la page masque la barre dès sa première image : on la garde cachée un
       instant, puis l'animation démarre vraiment */
    const racine = document.documentElement;
    const enAttente = racine.classList.contains('barre-attente');

    const pastille = bar.querySelector('.nav-bubble');
    // éléments animés : le bloc du logo (flex item, donc transformable) et les liens
    const cibles = [bar.querySelector('.logo')]
        .concat([...bar.querySelectorAll('.nav-links a')])
        .filter(Boolean);
    if (!cibles.length) return;

    /* la pastille naît avec les textes, un peu après le début de l'animation :
       la boucle de la barre ne doit pas la montrer avant */
    window.__introBarre = true;

    // géométrie finale, mesurée avant de toucher à la barre
    const r0 = bar.getBoundingClientRect();
    const finT = r0.top;
    const finW = r0.width;

    // état de départ : petite bulle ronde au-dessus de la page, textes encore effacés
    bar.classList.add('barre-intro');
    bar.style.top = (finT - 96) + 'px';
    bar.style.opacity = '0';
    bar.style.setProperty('--fb-w', '52px');
    bar.style.setProperty('--fb-r', '26px');
    if (pastille) pastille.classList.remove('vue');
    gsap.set(cibles, { opacity: 0 });

    // la barre tombe, puis sa forme s'ouvre pendant que les textes apparaissent par-dessus
    const tl = gsap.timeline({ delay: 0.05, paused: true });
    tl.to(bar, { top: finT, opacity: 1, duration: 0.45, ease: 'power3.out' }, 0)
      .to(bar, {
          '--fb-w': finW + 'px',
          '--fb-r': '16px',
          duration: 0.7,
          ease: 'power3.inOut'
      }, 0.5)
      .add(() => {
          // la pastille de navigation naît en même temps que le texte
          window.__introBarre = false;
          if (pastille) {
              pastille.classList.add('vue');
              pastille.classList.add('bulle-apparait');
              setTimeout(() => pastille.classList.remove('bulle-apparait'), 900);
          }

          // les textes apparaissent en fondu à leur place, au-dessus de la barre
          gsap.to(cibles, {
              opacity: 1,
              duration: 0.6,
              ease: 'power2.out',
              onComplete: () => gsap.set(cibles, { clearProps: 'opacity' })
          });
      }, 0.62)
      .add(() => {
          bar.classList.remove('barre-intro');
          gsap.set(bar, { clearProps: 'top,opacity' });
          bar.style.removeProperty('--fb-w');
          bar.style.removeProperty('--fb-r');
      }, 1.2);

    if (enAttente) {
        /* quelques millisecondes sur la page seule avant que la barre n'entre */
        setTimeout(() => {
            racine.classList.remove('barre-attente');
            tl.play();
        }, 140);
    } else {
        tl.play();
    }
})();

// --- BANDEAU DES LOGICIELS : DÉFILEMENT AU SCROLL + GLISSER À LA MAIN ---
(function () {
    const bande = document.querySelector('.logiciels');
    if (!bande || typeof gsap === 'undefined') return;

    const glisse = bande.querySelector('.logiciels-glisse');
    const piste = bande.querySelector('.logiciels-piste');
    const groupe = piste && piste.querySelector('.logiciels-groupe');
    if (!glisse || !piste || !groupe) return;

    const base = groupe.innerHTML;
    let largeurGroupe = 0;
    let decalage = 0; // px, toujours ramené dans ]-largeurGroupe ; 0]

    // --- Indice de glisser : un trait fin sous la barre, avec un point qui suit
    // ses déplacements (le va-et-vient lui-même est plus bas dans ce fichier) ---
    const aide = document.createElement('div');
    aide.className = 'logiciels-aide';
    aide.setAttribute('aria-hidden', 'true');
    aide.innerHTML = '<span class="logiciels-aide-point"></span>';
    bande.appendChild(aide);
    const point = aide.querySelector('.logiciels-aide-point');

    const AMPLITUDE = 18;   // px : l'écart du petit va-et-vient
    let nudge = 0;          // décalage du va-et-vient, ajouté au glisser manuel

    function ramener() {
        if (!largeurGroupe) return;
        decalage = decalage % largeurGroupe;
        if (decalage > 0) decalage -= largeurGroupe;
    }

    function appliquer() {
        glisse.style.transform = 'translate3d(' + (decalage + nudge) + 'px, 0, 0)';
        // le point coulisse sur le trait proportionnellement au déplacement de la barre
        if (point && AMPLITUDE) {
            const portee = Math.max(0, (aide.offsetWidth - point.offsetWidth) / 2);
            point.style.transform = 'translate3d(' + (nudge / AMPLITUDE * portee).toFixed(2) + 'px, 0, 0)';
        }
    }

    // La première moitié couvre la largeur de l'écran, la seconde assure la boucle
    function construire() {
        groupe.innerHTML = base;
        piste.innerHTML = '';
        piste.appendChild(groupe);

        let garde = 0;
        while (groupe.getBoundingClientRect().width < window.innerWidth && garde++ < 20) {
            groupe.insertAdjacentHTML('beforeend', base);
        }

        // Trois motifs identiques : la fenêtre visible reste toujours couverte,
        // même poussée à fond par le glisser pendant que le scroll est en fin de course.
        for (let i = 0; i < 2; i++) {
            const clone = groupe.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            piste.appendChild(clone);
        }

        largeurGroupe = groupe.getBoundingClientRect().width;
        decalage = 0;
        appliquer();
    }

    construire();

    // Défilement au scroll : les logos glissent vers la droite, lentement — un peu
    // moins d'un demi-motif parcouru sur toute la traversée de la bande.
    // Valeurs en pourcentage de la piste (3 motifs) : le trajet vaut 0,4 motif,
    // indépendamment de la largeur mesurée à l'écran.
    gsap.fromTo(piste, { xPercent: -30 }, {
        xPercent: -16.67,
        ease: 'none',
        scrollTrigger: {
            trigger: bande,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
            invalidateOnRefresh: true
        }
    });

    // --- Le va-et-vient : la barre se dandine doucement, mais seulement quand le
    // scroll est arrêté et qu'elle est encore à l'écran, pour ne pas déranger le
    // ScrollTrigger. Le point du trait suit exactement ce déplacement.
    const etatNudge = { v: 0 };
    let vaEtVient = null;
    let repos = null;

    function barreVisible() {
        const r = bande.getBoundingClientRect();
        const h = window.innerHeight || document.documentElement.clientHeight;
        return r.bottom > 60 && r.top < h - 40;
    }

    function stopper() {
        if (vaEtVient) {
            vaEtVient.kill();
            vaEtVient = null;
        }
        bande.classList.remove('va-et-vient');
        if (nudge !== 0) {
            nudge = 0;
            etatNudge.v = 0;
            appliquer();
        }
    }

    function demarrer() {
        if (actif || vaEtVient || !barreVisible()) return;
        etatNudge.v = 0;
        nudge = 0;
        appliquer();
        vaEtVient = gsap.timeline({
            repeat: -1,
            repeatDelay: 0.75,
            onUpdate: function () {
                nudge = etatNudge.v;
                appliquer();
            }
        })
            .to(etatNudge, { v: AMPLITUDE, duration: 1.05, ease: 'sine.inOut' })
            .to(etatNudge, { v: -AMPLITUDE, duration: 1.7, ease: 'sine.inOut' })
            .to(etatNudge, { v: 0, duration: 1.05, ease: 'sine.inOut' });
        bande.classList.add('va-et-vient');
    }

    function surScroll() {
        stopper();
        clearTimeout(repos);
        repos = setTimeout(function () {
            if (!actif) demarrer();
        }, 300);
    }
    window.addEventListener('scroll', surScroll, { passive: true });

    // Glisser à la main : on maintient la ligne et on la déplace de gauche à droite
    let actif = false;
    let pointeur = null;
    let departX = 0;
    let departDecalage = 0;

    bande.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        actif = true;
        stopper();
        clearTimeout(repos);
        pointeur = e.pointerId;
        departX = e.clientX;
        departDecalage = decalage;
        bande.classList.add('glisse-active');
        try { bande.setPointerCapture(pointeur); } catch (err) {}
    });

    bande.addEventListener('pointermove', function (e) {
        if (!actif || e.pointerId !== pointeur) return;
        decalage = departDecalage + (e.clientX - departX);
        ramener();
        appliquer();
    });

    function relacher(e) {
        if (!actif) return;
        if (e && e.pointerId !== undefined && e.pointerId !== pointeur) return;
        actif = false;
        bande.classList.remove('glisse-active');
        try { if (pointeur !== null) bande.releasePointerCapture(pointeur); } catch (err) {}
        pointeur = null;
        // après un glisser, on rend la main au va-et-vient
        surScroll();
    }

    bande.addEventListener('pointerup', relacher);
    bande.addEventListener('pointercancel', relacher);
    window.addEventListener('blur', function () { relacher(); });

    window.addEventListener('load', function () {
        construire();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    });

    let minuteur = null;
    window.addEventListener('resize', function () {
        clearTimeout(minuteur);
        minuteur = setTimeout(function () {
            construire();
            if (window.ScrollTrigger) ScrollTrigger.refresh();
        }, 250);
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

// Référence à l'explosion au scroll (utilisée par le module des lettres manipulables)
let tlExplodeRef = null;

// --- 1. APPARITION CLASSIQUE & ÉLÉGANTE DU HERO ---
if (introLine && heroSection) {
    const tlHero = gsap.timeline({
        delay: 0.1,
        // Les lettres ne deviennent manipulables qu'une fois l'apparition terminée
        onComplete: () => document.dispatchEvent(new Event('hero:intro-done'))
    });

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
    tlExplodeRef = gsap.timeline({
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

        tlExplodeRef.to(wrapper, {
            x: dirX,
            y: dirY,
            rotation: dirRot,
            scale: dirScale,
            opacity: 0,
            ease: "power1.in"
        }, 0);
    });

    // Évanouissement vers le haut de la ligne d'intro ("et voici mon PORTFOLIO")
    tlExplodeRef.to(".hero-intro-line", {
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

// --- 3 bis. FOND PHOTOGRAPHIQUE : s'efface au fil du scroll, le vert prend le relais ---
if (document.querySelector('.fond-image')) {
    gsap.to('.fond-image', {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero-section',
            start: 'top top',
            endTrigger: '.domain-selection',
            end: 'top 75%',
            scrub: true
        }
    });
}


// --- 4. SCROLLTRIGGER : SPIRALE DES BULLES (DESCENDUES SOUS LE TITRE) ---
const mm = gsap.matchMedia();

mm.add({
    isDesktop: "(min-width: 901px)",
    isMobile: "(max-width: 900px)"
}, (context) => {
    const { isDesktop } = context.conditions;

    // Rien à animer sur les pages sans bulles de domaine (ex. contact)
    if (!document.querySelector('.bubble-card')) return;

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

        // PLASTIQUE : descend, mais s'arrête plus haut pour laisser
        // la place aux deux lignes de texte sous les bulles (atterrit à y: 250)
        tlSpiral.to(".bubble-plastique", {
            motionPath: {
                path: [
                    { x: 0, y: 0 },
                    { x: -130, y: 74 },
                    { x: -180, y: 148 },
                    { x: -90, y: 206 },
                    { x: 0, y: 250 }
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

    // Le titre « Où on va ? » se dévoile tôt : il est posé au-dessus des bulles,
    // il n'a plus besoin d'attendre qu'elles s'écartent
    tlSpiral.fromTo(".titre-centre", {
        opacity: 0,
        scale: 0.88
    }, {
        opacity: 1,
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
    }, 0.12);

    // la flèche rouge n'est plus révélée par le scroll : elle reste invisible
    // tant que le curseur n'est pas descendu au niveau du titre, puis elle sort
    // du titre d'elle-même (voir initFlecheOrbitale)

    // la phrase sous les bulles apparaît d'elle-même quand elle entre à l'écran
    gsap.fromTo(".domain-note", {
        opacity: 0,
        y: 14
    }, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power2.out",
        scrollTrigger: {
            trigger: ".domain-note",
            /* la phrase est posée au plancher de la page : elle n'atteint jamais
               92 % de la hauteur d'écran, on la révèle dès qu'elle entre */
            start: "top bottom",
            once: true
        }
    });
});

// --- FLÈCHE ROUGE : elle suit le curseur en continu mais reste invisible tant
// qu'il n'est pas descendu au niveau du « Où on va ? » ---
(function initFlecheOrbitale() {
    const fleche = document.querySelector('.fleche-orbitale');
    const titre = document.querySelector('.titre-centre');
    if (!fleche || !titre) return;

    let centre = { x: 0, y: 0 };
    let ancre = { x: 0, y: 0 };
    let rayon = 150;
    let rayonActuel = 0;
    let seuil = 0;              // le niveau du titre : la flèche attend qu'on y descende
    let curseur = { x: 0, y: 0 };
    let curseurVu = false;
    let activee = false;        // une fois révélée, elle ne se cache plus
    let distanceCurseur = 9999;
    let angle = 0;
    let angleVise = angle;

    // le curseur repousse la flèche : elle recule vers le titre puis s'efface
    const MARGE = 54;        // écart minimum gardé entre le curseur et la flèche
    const DEDANS = 26;       // rayon où la flèche est rangée dans le titre
    const SORTIE = 96;       // rayon à partir duquel elle est de nouveau pleine

    function mesurer() {
        const r = titre.getBoundingClientRect();
        centre.x = r.left + r.width / 2;
        centre.y = r.top + r.height / 2;
        // niveau du texte : la flèche attend que le curseur descende jusque-là
        seuil = r.top;
        // la flèche est ancrée au centre de son conteneur : on retranche ce point
        const boite = fleche.offsetParent ? fleche.offsetParent.getBoundingClientRect() : null;
        if (boite) {
            ancre.x = boite.left + boite.width / 2;
            ancre.y = boite.top + boite.height / 2;
        } else {
            ancre.x = centre.x;
            ancre.y = centre.y;
        }
        // l'anneau passe autour du titre, à l'écart de ses bords
        rayon = Math.max(r.width / 2 + 52, r.height / 2 + 58);
    }
    mesurer();
    // on part directement sur l'anneau : la flèche suit déjà le curseur, seule sa
    // visibilité change quand le curseur atteint le niveau du titre
    rayonActuel = rayon;

    // elle suit le curseur depuis le début, mais reste invisible ; elle devient
    // visible dès que le curseur descend au niveau du texte, puis ne se cache plus
    function verifierSortie() {
        if (activee || !curseurVu) return;
        if (curseur.y < seuil) return;   // encore au-dessus du titre : elle reste invisible
        activee = true;
    }

    function viser(e) {
        if (e.pointerType === 'touch') return;
        curseur.x = e.clientX;
        curseur.y = e.clientY;
        curseurVu = true;
        mesurer();
        angleVise = Math.atan2(e.clientY - centre.y, e.clientX - centre.x);
        distanceCurseur = Math.hypot(e.clientX - centre.x, e.clientY - centre.y);
        verifierSortie();
    }
    document.addEventListener('pointermove', viser, { passive: true });
    document.addEventListener('mousemove', viser, { passive: true });

    // au scroll le titre change de niveau : on refait le point, et on vérifie la
    // sortie au cas où le curseur ne bouge pas
    window.addEventListener('scroll', function () {
        mesurer();
        verifierSortie();
    }, { passive: true });
    window.addEventListener('resize', mesurer);

    function tourner() {
        // on rattrape l'angle visé par le chemin le plus court : sans ça, un
        // passage par la gauche (de +180° à −180°) la faisait tourner à l'envers
        const ecart = Math.atan2(Math.sin(angleVise - angle), Math.cos(angleVise - angle));
        angle += ecart * 0.14;

        // quand le curseur approche, il la repousse vers le titre
        const vise = Math.min(rayon, Math.max(0, distanceCurseur - MARGE));
        rayonActuel += (vise - rayonActuel) * 0.22;

        const x = centre.x + Math.cos(angle) * rayonActuel - ancre.x;
        const y = centre.y + Math.sin(angle) * rayonActuel - ancre.y;
        fleche.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' +
            (angle * 180 / Math.PI) + 'deg)';

        fleche.style.opacity = activee ? 1 : 0;

        // entierement rangee dans le titre, elle s'efface ; elle revient dès
        // que le curseur s'eloigne assez (le fondu suit la repousse)
        const fondu = Math.max(0, Math.min(1, (rayonActuel - DEDANS) / (SORTIE - DEDANS)));
        const dessin = fleche.firstElementChild;
        if (dessin) dessin.style.opacity = fondu;

        requestAnimationFrame(tourner);
    }
    requestAnimationFrame(tourner);
})();

// --- SAS PHOTO : les deux volets se referment avant d'ouvrir la page photo ---
// Le même passage sert depuis n'importe quelle page (barre de navigation, portes
// du numérique, liens de contact) : on garde l'animation de l'accueil.
(function initSasPhoto() {
    /* sur la page photographie elle-même, les volets n'ont rien à fermer : le
       choix d'axe et le retour au choix ont leurs propres transitions */
    if (/photographie\.html$/.test(location.pathname)) return;
    if (document.querySelector('.photo-split-screen')) return;

    let sas = document.querySelector('.sas-photo');
    if (!sas) {
        sas = document.createElement('div');
        sas.className = 'sas-photo';
        sas.setAttribute('aria-hidden', 'true');
        sas.innerHTML = '<div class="sas-photo-volet sas-photo-gauche"></div><div class="sas-photo-volet sas-photo-droite"></div>';
        document.body.appendChild(sas);
    }

    const calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let enCours = false;

    document.addEventListener('click', (e) => {
        if (enCours || calme) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        const lien = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!lien) return;
        if (lien.target && lien.target !== '_self') return;
        /* le retour au choix d'axe des pages de domaine a sa propre transition :
           les volets ne doivent jamais se refermer par-dessus */
        if (lien.hasAttribute('data-retour') || lien.closest('[data-retour]')) return;
        const href = lien.getAttribute('href') || '';
        if (!/^photographie\.html(#.*)?$/.test(href)) return;

        enCours = true;
        e.preventDefault();
        sas.classList.add('on');
        /* 560 ms de fermeture, puis on charge la page qui rouvrira les volets */
        setTimeout(() => { window.location.href = href; }, 620);
    }, true);

    /* retour arrière : les volets ne doivent pas rester fermés */
    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) return;
        sas.classList.remove('on');
        enCours = false;
    });
})();

// --- SAS ACCUEIL : la barre rejoue son apparition de l'accueil, à l'envers ---
// Depuis n'importe quelle page, un retour à l'accueil fait d'abord se vider la
// barre, se réduire en pastille puis remonter hors champ, comme sur l'accueil.
(function initSasAccueil() {
    const chemin = location.pathname;
    if (/\/$/.test(chemin) || /index\.html$/.test(chemin)) return;   // déjà sur l'accueil

    const bar = document.querySelector('.top-bar');
    if (!bar) return;

    const cibles = [bar.querySelector('.logo')]
        .concat([].slice.call(bar.querySelectorAll('.nav-links a')))
        .filter(Boolean);
    const pastille = bar.querySelector('.nav-bubble');
    const calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let enCours = false;

    function remettreBarre() {
        bar.classList.remove('barre-intro');
        bar.style.removeProperty('--fb-w');
        bar.style.removeProperty('--fb-r');
        if (typeof gsap !== 'undefined') {
            gsap.set(bar, { clearProps: 'top,opacity' });
            gsap.set(cibles, { clearProps: 'opacity' });
        }
        if (pastille) { pastille.style.opacity = ''; pastille.classList.add('vue'); }
        enCours = false;
    }

    document.addEventListener('click', (e) => {
        if (enCours || calme || typeof gsap === 'undefined') return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        const lien = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!lien) return;
        if (lien.target && lien.target !== '_self') return;
        const href = lien.getAttribute('href') || '';
        const net = href.split('#')[0];
        if (net !== 'index.html' && net !== './' && net !== '/') return;

        enCours = true;
        e.preventDefault();

        /* même chronologie que sur l'accueil, jouée dans l'autre sens */
        const r0 = bar.getBoundingClientRect();
        const haut = r0.top;
        bar.classList.add('barre-intro');
        bar.style.setProperty('--fb-w', r0.width + 'px');
        bar.style.setProperty('--fb-r', '16px');

        const tl = gsap.timeline({
            onComplete: () => { window.location.href = href; }
        });
        tl.to(cibles, { opacity: 0, duration: 0.26, ease: 'power2.in' }, 0.04)
          .to(pastille, { opacity: 0, duration: 0.2, ease: 'power2.in' }, 0.04)
          .to(bar, { '--fb-w': '52px', '--fb-r': '26px', duration: 0.46, ease: 'power3.inOut' }, 0.16)
          .to(bar, { top: (haut - 96) + 'px', opacity: 0, duration: 0.4, ease: 'power3.in' }, 0.44);
    }, true);

    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) return;
        remettreBarre();
    });
})();

// --- SAS NUMÉRIQUE : un voile vert recouvre la page avant d'ouvrir numerique.html ---
// Depuis l'accueil la transition existe déjà (la fente du rideau vert) ; sur les
// autres pages, un bloc du même vert que le rideau de numerique.html monte en
// fondu par-dessus tout, barre de navigation comprise, puis la page se charge.
(function initSasNum() {
    const chemin = location.pathname;
    if (/numerique\.html$/.test(chemin)) return;          // déjà sur la page
    if (/\/$/.test(chemin) || /index\.html$/.test(chemin)) return; // l'accueil a sa transition

    let voile = document.querySelector('.sas-num-voile');
    if (!voile) {
        voile = document.createElement('div');
        voile.className = 'sas-num-voile';
        voile.setAttribute('aria-hidden', 'true');
        document.body.appendChild(voile);
    }

    const calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let enCours = false;

    document.addEventListener('click', (e) => {
        if (enCours || calme) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        const lien = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!lien) return;
        if (lien.target && lien.target !== '_self') return;
        const href = lien.getAttribute('href') || '';
        if (!/^numerique\.html(#.*)?$/.test(href)) return;

        enCours = true;
        e.preventDefault();
        voile.classList.add('on');
        /* fondu court : la page s'ouvre sur le même vert le plus tôt possible */
        setTimeout(() => { window.location.href = href; }, 260);
    }, true);

    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) return;
        voile.classList.remove('on');
        enCours = false;
    });
})();

// --- SAS CONTACT : le bleu de la page contact monte en fondu ---
// Un bloc du bleu du fond de contact recouvre tout, barre comprise, puis la page
// s'ouvre sur ce même bleu où les pois et les textes éclosent. La barre, elle, se
// fond depuis le sombre dans la page contact elle-même, après son chargement.
(function initSasContact() {
    if (/contact\.html$/.test(location.pathname)) return;

    let voile = document.querySelector('.sas-contact-voile');
    if (!voile) {
        voile = document.createElement('div');
        voile.className = 'sas-contact-voile';
        voile.setAttribute('aria-hidden', 'true');
        document.body.appendChild(voile);
    }

    const calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let enCours = false;

    document.addEventListener('click', (e) => {
        if (enCours || calme) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        const lien = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!lien) return;
        if (lien.target && lien.target !== '_self') return;
        const href = lien.getAttribute('href') || '';
        if (!/^contact\.html(#.*)?$/.test(href)) return;

        enCours = true;
        e.preventDefault();
        voile.classList.add('on');
        /* le bleu est opaque en 220 ms : la page s'ouvre juste après */
        setTimeout(() => { window.location.href = href; }, 260);
    }, true);

    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) return;
        voile.classList.remove('on');
        enCours = false;
    });
})();

// --- ÉTOILES DE PLASTIQUE : trame régulière + passage depuis les autres pages ---
// Une seule trame régulière, un seul déplacement : chaque étoile est un point de
// la grille, décalé tout entier vers le bas-gauche. La position du champ est
// sauvegardée au moment du clic et reprise telle quelle à l'arrivée, donc le
// passage d'une page à l'autre ne se voit pas. La vitesse est douce pendant la
// transition puis monte progressivement sur la page, et la traînée suit la
// vitesse : rien ne démarre d'un coup.
(function initEtoilesPlastique() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const VITESSE_DOUCE = 12;    // px/s pendant le passage
    const VITESSE_MAX = 430;     // px/s en plein vol
    const CLE = 'etoiles-plastique';

    const surPage = /plastique\.html$/.test(location.pathname);
    const champs = [];
    let boucle = 0;
    let derniere = 0;

    // la position sauvegardée continue d'avancer pendant le chargement de la page
    function lireEtat() {
        try {
            const brut = sessionStorage.getItem(CLE);
            if (!brut) return 0;
            const garde = JSON.parse(brut);
            const ecoule = Math.min(2000, Math.max(0, Date.now() - garde.t));
            return garde.d + VITESSE_DOUCE * ecoule / 1000;
        } catch (err) { return 0; }
    }

    function ecrireEtat(d) {
        try { sessionStorage.setItem(CLE, JSON.stringify({ d: d, t: Date.now() })); } catch (err) {}
    }

    function oublierEtat() {
        try { sessionStorage.removeItem(CLE); } catch (err) {}
    }

    // Trame carrée : le pas suit le plus petit côté. La période L dépasse l'écran,
    // si bien que les rebouclages se font hors champ et que la trame reste intacte.
    function trame() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const pas = Math.round(Math.max(190, Math.min(w, h) / 3.1));
        return { pas: pas, L: (Math.ceil(Math.max(w, h) / pas) + 1) * pas };
    }

    function creerChamp(racine, depart) {
        racine.innerHTML = '';
        const plan = document.createElement('div');
        plan.className = 'ciel-plan';
        racine.appendChild(plan);

        const t = trame();
        const etoiles = [];
        for (let y = 0; y < t.L; y += t.pas) {
            for (let x = 0; x < t.L; x += t.pas) {
                const el = document.createElement('span');
                el.className = 'etoile';
                el.innerHTML = '<i class="etoile-trainee"></i><i class="etoile-tete"></i>';
                plan.appendChild(el);
                etoiles.push({ el: el, x: x, y: y });
            }
        }

        const champ = { d: depart, v: VITESSE_DOUCE, cible: VITESSE_DOUCE, t: t, etoiles: etoiles };

        champ.dessiner = function () {
            const L = t.L;
            for (let i = 0; i < etoiles.length; i++) {
                const e = etoiles[i];
                let x = (e.x - champ.d) % L;
                let y = (e.y + champ.d) % L;
                if (x < 0) x += L;
                if (y < 0) y += L;
                e.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
            }
            /* la traînée (longueur et opacité) suit la vitesse, donc elle
               apparaît progressivement avec elle */
            const part = Math.min(1, champ.v / VITESSE_MAX);
            plan.style.setProperty('--t', part.toFixed(3));
            plan.style.setProperty('--to', (0.7 * part).toFixed(3));
        };

        champ.dessiner();
        return champ;
    }

    function tourner(t) {
        boucle = requestAnimationFrame(tourner);
        if (!derniere) { derniere = t; return; }
        const dt = Math.min(0.05, (t - derniere) / 1000);
        derniere = t;
        for (let i = 0; i < champs.length; i++) {
            const c = champs[i];
            /* la vitesse rejoint sa cible en douceur : environ 4 s pour passer
               de la dérive au vol, sans à-coup */
            c.v += (c.cible - c.v) * Math.min(1, dt * 0.8);
            c.d += c.v * dt;
            if (c.d > c.t.L * 1000) c.d = c.d % c.t.L;
            c.dessiner();
        }
    }

    function lancer() {
        if (boucle) return;
        derniere = 0;
        boucle = requestAnimationFrame(tourner);
    }

    /* ---------- sur la page plastique : la trame reprend, puis s'élance ---------- */
    if (surPage) {
        const ciel = document.getElementById('pmCiel');
        if (!ciel) return;

        let champ = creerChamp(ciel, lireEtat());
        champs.push(champ);
        lancer();

        // après l'arrivée, la vitesse monte doucement : les traînées suivent
        setTimeout(() => { champ.cible = VITESSE_MAX; }, 280);

        window.addEventListener('beforeunload', () => ecrireEtat(champ.d));

        // si l'on repart ailleurs, la position sauvegardée n'a plus lieu d'être
        document.addEventListener('click', (e) => {
            const lien = e.target && e.target.closest ? e.target.closest('a[href]') : null;
            if (!lien) return;
            if (!/plastique\.html/.test(lien.getAttribute('href') || '')) oublierEtat();
        }, true);

        let minuteur = null;
        window.addEventListener('resize', () => {
            clearTimeout(minuteur);
            minuteur = setTimeout(() => {
                const d = champ.d;
                champs.length = 0;
                champ = creerChamp(ciel, d);
                champ.cible = VITESSE_MAX;
                champs.push(champ);
            }, 260);
        });
        return;
    }

    /* ---------- depuis les autres pages : le voile de passage ---------- */
    const sas = document.createElement('div');
    sas.className = 'sas-plastique';
    sas.setAttribute('aria-hidden', 'true');
    sas.innerHTML = '<div class="sas-plastique-fond"></div><div class="sas-plastique-ciel"></div>';
    document.body.appendChild(sas);

    const champ = creerChamp(sas.querySelector('.sas-plastique-ciel'), 0);
    champs.push(champ);

    let enCours = false;

    document.addEventListener('click', (e) => {
        if (enCours) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
        const lien = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!lien) return;
        if (lien.target && lien.target !== '_self') return;
        const href = lien.getAttribute('href') || '';
        if (!/^plastique\.html(#.*)?$/.test(href)) return;

        enCours = true;
        e.preventDefault();

        /* 1. les étoiles arrivent et glissent déjà doucement, sans traînée */
        lancer();
        sas.classList.add('on');
        /* 2. le vert du fond se referme derrière elles */
        setTimeout(() => sas.classList.add('vert'), 380);
        /* 3. la page s'ouvre : la trame reprendra exactement à cette position */
        setTimeout(() => {
            ecrireEtat(champ.d);
            window.location.href = href;
        }, 1080);
    }, true);

    window.addEventListener('pageshow', (e) => {
        if (!e.persisted) return;
        sas.classList.remove('on');
        sas.classList.remove('vert');
        enCours = false;
    });
})();


// --- VISIONNEUSE PHOTO : LIGHTBOX AVEC NAVIGATION ---
(function initLightbox() {
    // Pages qui désactivent la visionneuse plein écran (ex. la page Numérique,
    // où les images servent de vignettes et ne doivent pas s'ouvrir au clic).
    if (document.body.classList.contains('sans-lightbox')) return;

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
    let animation = null;   // glissement en cours entre deux photos

    function reinitialiserZoom() {
        zoom = 1;
        if (imgEl) {
            if (!animation) imgEl.style.transform = '';
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

    // Toutes les photos cliquables d'une portée (une case photo par défaut), dans l'ordre du document
    function collectGallery(portee) {
        const seen = new Set();
        gallery = [];
        (portee || document).querySelectorAll('.bubble-img-card, .lightbox-trigger, .editorial-img-frame').forEach(card => {
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

    function remplir(index) {
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

    // Changement de photo : l'ancienne sort du côté opposé à la flèche utilisée,
    // la nouvelle arrive du côté de cette flèche.
    function show(index, direction) {
        if (!gallery.length) return;

        const cible = (index + gallery.length) % gallery.length;
        const sens = direction || 1;
        const course = 70;

        if (!isOpen() || cible === current || typeof gsap === 'undefined') {
            remplir(cible);
            return;
        }

        if (animation) animation.kill();
        animation = null;

        reinitialiserZoom();
        lightbox.classList.add('glisse');

        animation = gsap.timeline({
            onComplete: () => {
                animation = null;
                lightbox.classList.remove('glisse');
            }
        })
            .to(imgEl, { x: -sens * course, opacity: 0, scale: 1, duration: 0.16, ease: 'power2.in' })
            .add(() => remplir(cible))
            .fromTo(imgEl,
                { x: sens * course, opacity: 0, scale: 1 },
                { x: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
            );
    }

    function openWith(img) {
        /* La visionneuse reste dans la case d'où l'on part : sur la page photo,
           une case d'un domaine ne propose que ses propres images, pas celles
           des autres cases ni de l'autre domaine. */
        const casePhoto = img.closest('.pr-card, .pe-section, .photo-domaine-bloc') || document;
        collectGallery(casePhoto);
        const index = gallery.findIndex(photo => photo.el === img);
        if (typeof gsap !== 'undefined' && imgEl) gsap.set(imgEl, { clearProps: 'transform,opacity' });
        show(index === -1 ? 0 : index, 1);
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
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); show(current - 1, -1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); show(current + 1, 1); });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!isOpen()) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1, -1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1, 1); }
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
    if (document.body.classList.contains('photo-fusion')) return;
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
function construireTambour(scope) {
    /* une seule instance à la fois : on démonte la précédente (changement de domaine) */
    if (window.__tambourNettoyage) { window.__tambourNettoyage(); window.__tambourNettoyage = null; }
    if (typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // on peut limiter la mesure à un domaine (pendant un glissement, l'autre
    // bloc est encore figé dans la page) et on ignore les cases masquées
    const racine = scope || document;
    const items = Array.from(racine.querySelectorAll('.pr-card, .pe-section')).filter(el => el.offsetParent);
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

    var declencheur = null;
    function surDefilement() { render(); }

    if (typeof ScrollTrigger !== 'undefined') {
        declencheur = ScrollTrigger.create({
            trigger: document.body,
            start: 0,
            end: 'max',
            onUpdate: render,
            onRefresh: measure
        });
    } else {
        document.addEventListener('scroll', surDefilement, { passive: true });
    }

    window.addEventListener('resize', refreshParams);
    window.addEventListener('load', measure);
    var minuteurMesure = setTimeout(measure, 1200);

    window.__tambourNettoyage = function () {
        if (declencheur) declencheur.kill();
        else document.removeEventListener('scroll', surDefilement);
        window.removeEventListener('resize', refreshParams);
        window.removeEventListener('load', measure);
        clearTimeout(minuteurMesure);
        /* on rend les cases de ce domaine à leur état neutre */
        entries.forEach(function (entry) {
            gsap.set(entry.el, { rotateX: 0, z: 0, scaleX: 1, scaleY: 1, opacity: 1, filter: 'none' });
        });
    };

    measure();
    render();          // état appliqué tout de suite, sans attendre un défilement
}
window.construireTambour = construireTambour;

/* Remet les cases d'un domaine à plat (sans perspective ni échelle) avant un
   glissement : l'effet du carrousel s'efface doucement au lieu de se figer
   d'un coup au moment où le swipe démarre. */
window.aplatirTambour = function (portee, duree) {
    if (typeof gsap === 'undefined') return null;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    var racine = portee || document;
    var cases = Array.from(racine.querySelectorAll('.pr-card, .pe-section')).filter(function (el) { return el.offsetParent; });
    if (!cases.length) return null;
    gsap.killTweensOf(cases);
    return gsap.to(cases, {
        rotateX: 0, z: 0, scaleX: 1, scaleY: 1, opacity: 1, filter: 'none',
        transformOrigin: '50% 50%',
        duration: duree === undefined ? 0.22 : duree,
        ease: 'power2.out'
    });
};

if (!document.body.classList.contains('photo-fusion')) construireTambour();
// --- 5. TITRE MANIPULABLE : GRAVITÉ, INERTIE ET SOUFFLE DE SOURIS ---
(function () {
    if (!ransomWrappers.length || !heroSection || !window.PointerEvent) return;

    var AIR = 0.975;           // résistance de l'air (immobilise vite)
    var REBOND_MUR = 0.55;

    var actif = false;
    var pret = false;
    var sourisVue = false;     // on n'active qu'une fois une vraie souris repérée
    var prise = null;
    var decal = { x: 0, y: 0 };
    var monde = { g: 0, h: 0, d: 0, b: 0 };
    var dernier = 0;
    var raf = 0;

    var corps = Array.prototype.map.call(ransomWrappers, function (el) {
        return {
            el: el,
            x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0,
            hx: 0, hy: 0, w: 0, h: 0,
            rot0: parseFloat(el.getAttribute('data-rot')) || 0,
            libre: false,
            z: 0
        };
    });

    var souris = { t: 0 };

    function mesurerMonde() {
        var r = heroSection.getBoundingClientRect();
        monde = { g: r.left, h: r.top, d: r.right, b: r.bottom };
    }

    function mesurerLettres() {
        corps.forEach(function (c) {
            var r = c.el.getBoundingClientRect();
            c.w = r.width;
            c.h = r.height;
            if (!c.hx && !c.hy) {
                c.hx = r.left + r.width / 2;
                c.hy = r.top + r.height / 2;
            }
            if (!c.libre) { c.x = c.hx; c.y = c.hy; }
        });
    }

    function pas(dt) {
        corps.forEach(function (c) {
            if (c === prise || !c.libre) return;

            var f = Math.pow(AIR, dt * 60);
            c.vx *= f;
            c.vy *= f;
            c.va *= Math.pow(0.965, dt * 60);

            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.a += c.va * dt;

            var dw = c.w / 2, dh = c.h / 2;
            if (c.x - dw < monde.g) { c.x = monde.g + dw; c.vx = Math.abs(c.vx) * REBOND_MUR; }
            if (c.x + dw > monde.d) { c.x = monde.d - dw; c.vx = -Math.abs(c.vx) * REBOND_MUR; }
            if (c.y - dh < monde.h) { c.y = monde.h + dh; c.vy = Math.abs(c.vy) * REBOND_MUR; }
            if (c.y + dh > monde.b) { c.y = monde.b - dh; c.vy = -Math.abs(c.vy) * REBOND_MUR; }
        });

        // chocs entre lettres
        for (var i = 0; i < corps.length; i++) {
            var A = corps[i];
            if (!A.libre) continue;
            for (var j = i + 1; j < corps.length; j++) {
                var B = corps[j];
                if (!B.libre) continue;
                var dx2 = B.x - A.x, dy2 = B.y - A.y;
                var ox = (A.w + B.w) / 2 - Math.abs(dx2);
                var oy = (A.h + B.h) / 2 - Math.abs(dy2);
                if (ox <= 0 || oy <= 0) continue;
                if (ox < oy) {
                    var sx = dx2 >= 0 ? 1 : -1;
                    A.x -= sx * ox / 2;
                    B.x += sx * ox / 2;
                    var e1 = (A.vx - B.vx) * 0.4;
                    A.vx -= e1;
                    B.vx += e1;
                } else {
                    var sy = dy2 >= 0 ? 1 : -1;
                    A.y -= sy * oy / 2;
                    B.y += sy * oy / 2;
                    var e2 = (A.vy - B.vy) * 0.4;
                    A.vy -= e2;
                    B.vy += e2;
                }
            }
        }

        // rendu
        corps.forEach(function (c) {
            if (!c.libre) return;
            gsap.set(c.el, { x: c.x - c.hx, y: c.y - c.hy, rotation: c.rot0 + c.a });
            if (c === prise) return;
            var z = 100 + Math.round(c.y / 10);
            if (z !== c.z) { c.z = z; c.el.style.zIndex = z; }
        });
    }

    function boucle(t) {
        if (!actif) { raf = 0; return; }
        raf = requestAnimationFrame(boucle);
        if (!dernier) { dernier = t; return; }
        var dt = (t - dernier) / 1000;
        dernier = t;
        if (dt <= 0) return;
        if (dt > 0.05) dt = 0.05;
        pas(dt);
    }

    function activer() {
        if (actif || !pret || !sourisVue || window.scrollY > 12) return;
        mesurerMonde();
        mesurerLettres();
        actif = true;
        heroSection.classList.add('titre-libre');
        dernier = 0;
        if (!raf) raf = requestAnimationFrame(boucle);
    }

    function desactiver() {
        if (!actif) return;
        actif = false;
        if (prise) { prise.el.classList.remove('saisie'); prise = null; }
        heroSection.classList.remove('titre-libre');
        // l'explosion au scroll repart des positions actuelles
        if (tlExplodeRef) tlExplodeRef.invalidate();
    }

    // saisir une lettre
    corps.forEach(function (c) {
        c.el.addEventListener('pointerdown', function (e) {
            if (!actif || e.button !== 0) return;
            e.preventDefault();
            c.libre = true;
            prise = c;
            c.el.classList.add('saisie');
            c.vx = 0;
            c.vy = 0;
            c.va = 0;
            decal.x = e.clientX - c.x;
            decal.y = e.clientY - c.y;
            c.el.style.zIndex = 5000;
            try { c.el.setPointerCapture(e.pointerId); } catch (err) {}
        });
    });

    window.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'mouse' || e.pointerType === '') sourisVue = true;
        if (!actif) activer();

        var now = performance.now();
        var dt = Math.max(8, now - souris.t) / 1000;
        souris.t = now;

        if (!prise) return;
        var nx = e.clientX - decal.x;
        var ny = e.clientY - decal.y;
        prise.vx = gsap.utils.clamp(-3000, 3000, (nx - prise.x) / dt);
        prise.vy = gsap.utils.clamp(-3000, 3000, (ny - prise.y) / dt);
        prise.x = nx;
        prise.y = ny;
    }, { passive: true });

    window.addEventListener('pointerup', function () {
        if (!prise) return;
        prise.el.classList.remove('saisie');
        prise.z = -1;
        prise = null;
    });

    window.addEventListener('scroll', function () {
        if (window.scrollY > 12) desactiver();
        else activer();
    }, { passive: true });

    window.addEventListener('resize', function () {
        if (!actif) return;
        mesurerMonde();
        mesurerLettres();
    });

    document.addEventListener('hero:intro-done', function () {
        pret = true;
        activer();
    });
})();

// --- INVITE À SAISIR LES LETTRES DU TITRE ---
// Même logique que l'indice de la barre des logiciels : un point parcourt une
// ligne courbe en bas à gauche du « I » et la lettre tire doucement avec lui.
// Le tracé et le rythme sont en CSS (aucune écriture inline, donc la physique
// GSAP des lettres reste maîtresse de leur transform) ; ici on ne gère que
// l'apparition, les arrêts et la main du curseur.
(function () {
    var titre = document.querySelector('.ransom-title-wrapper');
    var premiere = document.querySelector('#hero-title > .ransom-wrapper');
    if (!titre || !premiere || !heroSection) return;

    var aide = document.createElement('div');
    aide.className = 'titre-saisie';
    aide.setAttribute('aria-hidden', 'true');
    aide.innerHTML =
        '<svg viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg">' +
        '<path class="titre-saisie-trait" d="M 20 16 C 17 14.5 14 11.5 12 8"/></svg>' +
        '<span class="titre-saisie-point"></span>';
    titre.appendChild(aide);

    // Coin inférieur gauche réellement visible de la lettre : on part de la
    // mise en page (offsetLeft/offsetTop, insensibles au scroll et aux animations)
    // et on y applique la matrice de la lettre (rotation et descente aléatoires),
    // pour tomber pile sur l'angle et pas sur le coin de sa boîte englobante.
    function coinBasGauche(el) {
        var w = el.offsetWidth;
        var h = el.offsetHeight;
        var cx = el.offsetLeft + w / 2;
        var cy = el.offsetTop + h / 2;
        var a = 1, b = 0, c = 0, d = 1, e = 0, f = 0;
        var t = getComputedStyle(el).transform;
        if (t && t !== 'none') {
            var m = new DOMMatrix(t);
            a = m.a; b = m.b; c = m.c; d = m.d; e = m.e; f = m.f;
        }
        var lx = -w / 2, ly = h / 2;      // coin bas-gauche dans le repère de la lettre
        return {
            x: cx + (a * lx + c * ly) + e,
            y: cy + (b * lx + d * ly) + f
        };
    }

    // Le point part de (20, 16) dans la boîte : on le pose à 10 px à gauche et
    // 6 px sous l'angle de la lettre, donc un peu à l'écart de celle-ci.
    function placer() {
        var p = coinBasGauche(premiere);
        aide.style.left = (p.x - 30) + 'px';
        aide.style.top = (p.y - 10) + 'px';
    }

    var minuteur = null;
    var saisie = false;
    var fini = false;          // une lettre a déjà été bougée : plus d'invitation
    var arme = 0;

    // L'invitation ne se montre qu'après un temps sans geste : si la souris
    // bouge encore, le minuteur repart et rien n'apparaît.
    var INACTIVITE = 700;

    function possible() {
        if (fini || saisie || window.scrollY > 12) return false;
        var r = heroSection.getBoundingClientRect();
        return r.bottom > 160 && r.top < window.innerHeight - 80;
    }

    function programmer(delai) {
        if (fini) return;
        clearTimeout(minuteur);
        minuteur = setTimeout(montrer, delai === undefined ? INACTIVITE : delai);
    }

    window.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        if (fini || saisie || heroSection.classList.contains('titre-invite')) return;
        var maintenant = Date.now();
        if (maintenant - arme < 150) return;   // pas un minuteur par pixel parcouru
        arme = maintenant;
        programmer();
    }, { passive: true });

    function montrer() {
        if (!possible()) { cacher(); return; }
        placer();
        heroSection.classList.add('titre-invite');
        // la typo du titre arrive parfois après le calcul : on recale dès que
        // la mise en page est stable, sinon l'invite reste à côté de l'angle
        requestAnimationFrame(placer);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placer(); });
    }

    function cacher() {
        heroSection.classList.remove('titre-invite');
    }

    // le scroll rend la main aux lettres (elles s'envolent) : on efface l'invite
    window.addEventListener('scroll', function () {
        cacher();
        document.body.classList.remove('lettre-survolee');
        programmer(300);
    }, { passive: true });

    window.addEventListener('resize', function () {
        if (heroSection.classList.contains('titre-invite')) placer();
    });

    // pendant qu'on tient une lettre, l'invite s'efface et revient après
    document.addEventListener('pointerdown', function (e) {
        if (!e.target || !e.target.closest || !e.target.closest('.ransom-wrapper')) return;
        saisie = true;
        /* la leçon est comprise : l'invitation ne revient plus, et la lettre
           ne se décale plus toute seule */
        fini = true;
        clearTimeout(minuteur);
        cacher();
        document.body.classList.add('lettre-saisie');
    });

    window.addEventListener('pointerup', function () {
        if (!saisie) return;
        saisie = false;
        document.body.classList.remove('lettre-saisie');
    });

    // curseur : la main « à saisir » apparaît sur les lettres du titre
    Array.prototype.forEach.call(document.querySelectorAll('#hero-title .ransom-wrapper'), function (el) {
        el.addEventListener('pointerenter', function (e) {
            if (e.pointerType && e.pointerType !== 'mouse') return;
            document.body.classList.add('lettre-survolee');
        });
        el.addEventListener('pointerleave', function () {
            document.body.classList.remove('lettre-survolee');
        });
    });

    document.addEventListener('hero:intro-done', function () {
        programmer(900);
    });

    window.addEventListener('load', function () {
        programmer(900);
    });
})();

// --- FOND PHOTOGRAPHIQUE DES PAGES PHOTO (PRO & EXPRESSIVE) ---
// La photo d'ouverture de chaque case devient le fond de la page, à 60 %,
// et change en fondu quand on passe d'une case à l'autre.
(function () {
    var cartes = Array.prototype.slice.call(document.querySelectorAll('.pr-card, .pe-section'));
    if (!cartes.length) return;

    var OPACITE = '0.6';

    var fond = document.createElement('div');
    fond.className = 'photo-fond';
    fond.setAttribute('aria-hidden', 'true');

    var couches = [document.createElement('div'), document.createElement('div')];
    couches.forEach(function (c) { c.className = 'photo-fond-couche'; });
    fond.appendChild(couches[0]);
    fond.appendChild(couches[1]);
    document.body.insertBefore(fond, document.body.firstChild);
    // le conteneur vert des pages se retire pour laisser voir la photo
    document.body.classList.add('photo-fond-actif');

    var actif = 0;
    var courant = '';

    function imageDe(carte) {
        if (!carte) return '';
        /* une case peut imposer sa propre photo de fond sans changer celle
           qui est affichée dans la case (attribut data-diapo) */
        var force = carte.getAttribute('data-diapo');
        if (force) {
            try { return new URL(force, location.href).href; } catch (e) { return force; }
        }
        var img = carte.querySelector('img');
        return img ? (img.currentSrc || img.src) : '';
    }

    function poser(url, immediat) {
        if (!url || url === courant) return;
        courant = url;

        var suivant = couches[1 - actif];
        var precedent = couches[actif];

        if (immediat) {
            suivant.style.transition = 'none';
            precedent.style.transition = 'none';
        }

        suivant.style.backgroundImage = 'url("' + url + '")';
        void suivant.offsetWidth;            // la couche part bien de 0
        suivant.style.opacity = OPACITE;
        precedent.style.opacity = '0';

        if (immediat) {
            requestAnimationFrame(function () {
                suivant.style.transition = '';
                precedent.style.transition = '';
            });
        }

        actif = 1 - actif;

        document.dispatchEvent(new CustomEvent('photo-fond:change', {
            detail: { url: url, domaine: url === photoDomaine }
        }));
    }

    // la case qui occupe le milieu de l'écran : c'est elle qui prend le fond.
    // Tant qu'aucune case n'est au centre, on garde la photo du domaine.
    function carteAuCentre() {
        var milieu = window.innerHeight / 2;
        for (var i = 0; i < cartes.length; i++) {
            var carte = cartes[i];
            if (!carte.offsetParent) continue;     // case d'un domaine masqué
            var r = carte.getBoundingClientRect();
            /* pendant un glissement, le domaine qui part et celui qui arrive sont
               hors écran sur le côté : ils ne doivent pas prendre le fond */
            if (r.right < 0 || r.left > window.innerWidth) continue;
            if (r.top <= milieu && r.bottom >= milieu) return carte;
        }
        return null;
    }

    var prevu = false;
    var photoDomaine = '';       // photo affichée en haut de page, avant la première case
    var derniereCarte = null;    // dernière case passée au centre

    function maj() {
        prevu = false;

        var carte = carteAuCentre();
        if (carte) {
            derniereCarte = carte;
            poser(imageDe(carte));
            return;
        }

        /* aucune case pile au centre : en haut de page on montre la photo du
           domaine, plus bas on garde celle de la dernière case traversée */
        var premiere = null;
        for (var i = 0; i < cartes.length; i++) {
            if (cartes[i].offsetParent) { premiere = cartes[i]; break; }
        }
        var enHaut = premiere && premiere.getBoundingClientRect().top > window.innerHeight / 2;

        if (enHaut && photoDomaine) poser(photoDomaine);
        else if (derniereCarte) poser(imageDe(derniereCarte));
        else if (photoDomaine) poser(photoDomaine);
    }
    function planifier() {
        if (prevu) return;
        prevu = true;
        requestAnimationFrame(maj);
    }

    // rien au chargement : la première photo arrive quand la première case entre à l'écran
    window.addEventListener('scroll', planifier, { passive: true });
    window.addEventListener('resize', planifier);
    window.addEventListener('load', planifier);

    // utilisable depuis la page de choix pour poser la photo du domaine
    window.photoFond = {
        poser: poser,
        /* photo du domaine : affichée tant qu'aucune case n'est au centre */
        poserDomaine: function (url, immediat) {
            photoDomaine = url || '';
            derniereCarte = null;          // on change de domaine : on repart de sa photo
            if (photoDomaine) poser(photoDomaine, immediat);
            planifier();
        }
    };

    // à l'arrivée, la photo du domaine est déjà en place : continuité avec la transition
    var hero = document.body.getAttribute('data-fond-hero');
    if (hero) { photoDomaine = hero; poser(hero, true); }
})();

// --- TITRE DU DOMAINE PHOTO : ARRIVÉE EN ROULANT VERS LE BAS ---
(function () {
    if (!document.body.classList.contains('photo-domaine')) return;
    if (document.body.classList.contains('photo-fusion')) return;
    if (typeof gsap === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var titre = document.querySelector('.domain-hero-title');
    var sous = document.querySelector('.domain-hero-subtitle');
    var nav = document.querySelector('.domain-subnav');
    if (!titre) return;

    var tl = gsap.timeline({ delay: 0.1 });
    tl.from(titre, { y: -70, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0);
    if (sous) tl.from(sous, { y: -50, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.12);
    if (nav) tl.from(nav, { y: -30, opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.24);
})();
