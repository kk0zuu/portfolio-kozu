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
    /* On écoute le pointeur et non la souris : saisir une lettre annule le
       pointerdown, ce qui coupe les événements souris de compatibilité. Avec
       mousemove, le curseur restait figé dès qu'on attrapait une lettre. */
    document.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const x = e.clientX;
        const y = e.clientY;
        requestAnimationFrame(() => {
            cursor.style.left = x + 'px';
            cursor.style.top = y + 'px';
            if (cursor.style.opacity !== '1') {
                cursor.style.opacity = '1';
            }
        });
    }, { passive: true });

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

    let parti = false;
    function entrer() {
        if (parti) return;
        parti = true;
        racine.classList.remove('barre-attente');
        tl.play();
    }

    if (enAttente) {
        if (racine.classList.contains('sas-domaines-arrivee')) {
            /* retour au choix des domaines : le vert tient l'écran ; la barre
               n'entre qu'une fois le voile levé, pour reprendre exactement là
               où sa sortie l'avait laissée */
            document.addEventListener('choix:reveler', entrer, { once: true });
            /* filet de sécurité : la barre ne doit jamais rester dehors */
            setTimeout(entrer, 4000);
        } else {
            /* quelques millisecondes sur la page seule avant que la barre n'entre */
            setTimeout(entrer, 140);
        }
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

    /* la flèche rouge n'entre en scène qu'une fois le trait bleu arrivé
       derrière le « où on va ? ». Sans guide (pas de titre, mouvement réduit),
       elle n'attend rien et garde son ancien déclenchement. */
    const guidePresent = !!document.getElementById('hero-title') &&
        !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    let guideArrive = !guidePresent;
    document.addEventListener('fleche-guide:arrivee', function () {
        guideArrive = true;
        verifierSortie();
    });

    // elle suit le curseur depuis le début, mais reste invisible ; elle devient
    // visible dès que le curseur descend au niveau du texte et que le trait
    // bleu a fini son tracé, puis ne se cache plus
    function verifierSortie() {
        if (activee || !curseurVu || !guideArrive) return;
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

// --- BOUTON « CHOIX DES DOMAINES » : la flèche s'étire jusqu'au bord de la page ---
// Le bouton est le même partout (voir styles.css) : seule la longueur de
// l'étirement dépend de sa place, on la mesure au survol et au redimensionnement.
(function initRetourDomaines() {
    var boutons = [].slice.call(document.querySelectorAll('.retour-domaines'));
    if (!boutons.length) return;

    function mesurer(btn) {
        var fleche = btn.querySelector('.retour-fleche');
        if (!fleche) return;
        btn.style.setProperty('--etirement', Math.max(0, Math.round(fleche.getBoundingClientRect().left)) + 'px');
    }

    boutons.forEach(function (btn) {
        ['pointerenter', 'mouseenter', 'focus'].forEach(function (ev) {
            btn.addEventListener(ev, function () { mesurer(btn); });
        });
        mesurer(btn);
    });

    window.addEventListener('resize', function () { boutons.forEach(mesurer); });
    window.addEventListener('load', function () {
        requestAnimationFrame(function () { boutons.forEach(mesurer); });
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
    let vert = null;

    /* voile vert pâle du choix des domaines : créé au premier retour, puis
       réutilisé si l'on revient sur la page */
    function voileDuChoix() {
        if (vert && document.body.contains(vert)) return vert;
        vert = document.querySelector('.sas-domaines-voile');
        if (!vert) {
            vert = document.createElement('div');
            vert.className = 'sas-domaines-voile';
            vert.setAttribute('aria-hidden', 'true');
            document.body.appendChild(vert);
        }
        return vert;
    }

    function remettreBarre() {
        bar.classList.remove('barre-intro');
        document.body.classList.remove('sas-choix');
        if (vert) vert.classList.remove('on');
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

        /* le retour au choix des domaines : la barre se range comme sur l'accueil
           pendant que le vert pâle du choix monte derrière elle (body.sas-choix),
           puis la page s'ouvre sur ce même vert */
        const versChoix = href.indexOf('#choix-domaines') !== -1;
        if (versChoix) {
            const vert = voileDuChoix();
            /* on force le navigateur à peindre le voile à opacité 0 avant de
               l'allumer : sans ça, le premier retour le ferait claquer d'un
               coup au lieu de fondre sur la page */
            void vert.offsetWidth;
            vert.classList.add('on');
            document.body.classList.add('sas-choix');
        }

        enCours = true;
        e.preventDefault();

        /* même chronologie que sur l'accueil, jouée dans l'autre sens */
        const r0 = bar.getBoundingClientRect();
        const haut = r0.top;
        bar.classList.add('barre-intro');
        bar.style.setProperty('--fb-w', r0.width + 'px');
        bar.style.setProperty('--fb-r', '16px');

        const tl = gsap.timeline({
            onComplete: () => {
                if (versChoix) {
                    try { sessionStorage.setItem('sas-domaines', '1'); } catch (err) {}
                }
                window.location.href = href;
            }
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

    const VITESSE_DOUCE = 6;     // px/s pendant le passage
    const VITESSE_MAX = 205;     // px/s en plein vol
    const OPACITE = 0.85;        // les étoiles restent un peu en retrait du ciel
    const DECOLLAGE = 4200;      // ms : montée en vitesse sur la page plastique
    const FONDU_GAUCHE = 90;     // px : l'étoile s'éteint juste avant de sortir à gauche
    const FONDU_DROITE = 90;     // px : et se rallume en entrant par la droite
    const FONDU_HAUT = 110;      // px : même chose en haut, après le rebouclage
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
        const pas = Math.round(Math.max(200, Math.min(w, h) / 4));
        return { pas: pas, L: (Math.ceil(Math.max(w, h) / pas) + 1) * pas, w: w, h: h };
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

                /* l'étoile et sa traînée s'éteignent juste avant d'être coupées
                   par le bord gauche, et se rallument en entrant par la droite
                   (ou par le haut, quand elles rebouclent). */
                let gauche = x / FONDU_GAUCHE;
                let droite = (t.w - x) / FONDU_DROITE;
                let haut = y / FONDU_HAUT;
                if (gauche > 1) gauche = 1;
                if (droite > 1) droite = 1;
                if (haut > 1) haut = 1;
                let op = gauche < droite ? gauche : droite;
                if (haut < op) op = haut;
                op *= OPACITE;
                /* pendant le passage, elles ne se posent pas toutes en même
                   temps : la vague part du haut-droit vers le bas-gauche */
                if (champ.apparition) {
                    const a = champ.apparition;
                    const vague = ((t.w - x) + y) / (t.w + t.h);
                    const p = (performance.now() - a.depuis - vague * a.etalement) / a.fondu;
                    op *= p < 0 ? 0 : (p > 1 ? 1 : p);
                }

                e.el.style.opacity = op < 1 ? op.toFixed(2) : '';
            }
            /* la traînée (longueur et opacité) suit la vitesse, donc elle
               apparaît progressivement avec elle */
            const part = Math.min(1, champ.v / VITESSE_MAX);
            plan.style.setProperty('--t', part.toFixed(3));
            plan.style.setProperty('--to', (0.6 * part).toFixed(3));
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
            /* décollage en douceur : le smoothstep part et arrive à vitesse
               nulle, donc ni à-coup au départ ni à l'arrivée */
            if (c.decollage) {
                let p = (performance.now() - c.decollage.depuis) / c.decollage.duree;
                if (p < 0) p = 0;
                if (p > 1) p = 1;
                c.v = VITESSE_DOUCE + (VITESSE_MAX - VITESSE_DOUCE) * p * p * (3 - 2 * p);
            }
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
        setTimeout(() => {
            champ.decollage = { depuis: performance.now(), duree: DECOLLAGE };
        }, 280);

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
                champ.decollage = { depuis: performance.now() - DECOLLAGE * 0.8, duree: DECOLLAGE };
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

        /* 1. les étoiles arrivent une à une en diagonale et glissent déjà
              doucement, sans traînée */
        lancer();
        champ.apparition = { depuis: performance.now(), etalement: 620, fondu: 400 };
        sas.classList.add('on');
        /* la barre passe au sombre avant que la page ne s'ouvre */
        document.documentElement.classList.add('barre-sombre');
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
        document.documentElement.classList.remove('barre-sombre');
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
            if (c === prise || !c.libre || c.dansCase) return;

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
            if (!A.libre || A.dansCase) continue;
            for (var j = i + 1; j < corps.length; j++) {
                var B = corps[j];
                if (!B.libre || B.dansCase) continue;
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
            if (!c.libre || c.dansCase) return;
            gsap.set(c.el, { x: c.x - c.hx, y: c.y - c.hy, rotation: c.rot0 + c.a });
            if (c === prise) return;
            var z = (c.enPlus ? 900 : 100) + Math.round(c.y / 10);
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
    function brancher(c) {
        c.el.addEventListener('pointerdown', function (e) {
            if (!actif || e.button !== 0) return;
            e.preventDefault();
            if (c.dansCase && window.caseSecrete) window.caseSecrete.retirer(c);
            c.libre = true;
            prise = c;
            c.el.classList.add('saisie');
            c.vx = 0;
            c.vy = 0;
            c.va = 0;
            /* on repart de la position réellement vue : la mesure d'origine a
               pu être prise pendant l'animation d'intro, et l'écart ferait
               sauter la lettre au moment où on la saisit */
            var rr = c.el.getBoundingClientRect();
            c.x = rr.left + rr.width / 2;
            c.y = rr.top + rr.height / 2;
            decal.x = e.clientX - c.x;
            decal.y = e.clientY - c.y;
            c.el.style.zIndex = 5000;
            try { c.el.setPointerCapture(e.pointerId); } catch (err) {}
        });
    }
    corps.forEach(brancher);

    /* Fait apparaître une lettre de plus, posée hors du flux au-dessus du
       titre, et l'inscrit dans la physique : elle se saisit et se range dans
       la case comme les autres. Sert au second T de TOUT. */
    window.lettresTitre = {
        ajouter: function (modele, cx, cy) {
            if (!modele || !modele.parentNode) return false;
            // une seule lettre en plus à la fois
            var vieux = document.querySelectorAll('.lettre-en-plus');
            for (var k = 0; k < vieux.length; k++) {
                if (vieux[k].parentNode) vieux[k].parentNode.removeChild(vieux[k]);
            }
            var el = modele.cloneNode(true);
            el.classList.add('lettre-en-plus');
            /* le modèle est rangé dans la case : sa transformation contient le
               décalage du rangement. On repart d'une rotation propre. */
            var rot = parseFloat(el.getAttribute('data-rot')) || 0;
            el.style.transform = 'rotate(' + rot + 'deg)';
            el.style.position = 'absolute';
            el.style.margin = '0';
            el.style.left = '0px';
            el.style.top = '0px';
            el.style.zIndex = 4000;
            /* dans le titre lui-même : même contexte d'empilement que les
               autres lettres, donc au-dessus d'elles quand on veut la saisir */
            (modele.closest('#hero-title') || modele.closest('.ransom-title-wrapper') || modele.parentNode).appendChild(el);

            var racine = el.offsetParent || el.parentNode;
            var rb = racine.getBoundingClientRect();
            el.style.left = (cx - rb.left - el.offsetWidth / 2) + 'px';
            el.style.top = (cy - rb.top - el.offsetHeight / 2) + 'px';

            var b = el.getBoundingClientRect();
            var c = {
                el: el,
                x: b.left + b.width / 2, y: b.top + b.height / 2,
                vx: 0, vy: 0, a: 0, va: 0,
                hx: b.left + b.width / 2, hy: b.top + b.height / 2,
                w: b.width, h: b.height,
                rot0: rot,
                libre: true,
                enPlus: true,
                z: 0
            };
            corps.push(c);
            brancher(c);

            // la lettre modèle est rangée dans la case : on repart de sa taille
            // pleine et sans sa classe de saisie
            el.classList.remove('saisie');
            if (window.gsap) gsap.set(el, { scale: 1 });
            var carte = el.querySelector('.ransom-card');
            if (carte && window.gsap) gsap.from(carte, { scale: 0.4, opacity: 0, duration: 0.5, ease: 'back.out(1.8)' });
            return el;
        },

        /* Retire du jeu une lettre ajoutée à la volée (et de la page, avec un
           petit effacement). La physique oublie son corps au passage. */
        retirer: function (el) {
            if (!el) return;
            el.dataset.parti = '1';
            for (var i = 0; i < corps.length; i++) {
                if (corps[i].el === el) {
                    if (prise === corps[i]) prise = null;
                    corps.splice(i, 1);
                    break;
                }
            }
            var carte = el.querySelector('.ransom-card');
            var effacer = function () { if (el.parentNode) el.parentNode.removeChild(el); };
            if (carte && window.gsap) {
                gsap.to(carte, { scale: 0, opacity: 0, duration: 0.22, ease: 'power2.in', overwrite: true, onComplete: effacer });
                /* filet de sécurité : la lettre quitte la page quoi qu'il arrive */
                setTimeout(effacer, 420);
            } else {
                effacer();
            }
        },

        /* La place d'origine d'une lettre, mesurée sur la mise en page (et non
           sur sa transformation) : elle reste juste même si la page a défilé
           ou si la lettre est rangée dans la case. */
        home: function (el) {
            if (!el) return null;
            var op = el.offsetParent || document.body;
            var rb = op.getBoundingClientRect();
            return {
                x: rb.left + el.offsetLeft + el.offsetWidth / 2,
                y: rb.top + el.offsetTop + el.offsetHeight / 2
            };
        }
    };

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
        // lâchée au-dessus de la case secrète, la lettre s'y range
        if (window.caseSecrete) window.caseSecrete.deposer(prise);
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
    /* Le tracé va de droite à gauche, comme le décalage de la lettre. Il est
       plus long que ce déplacement : le point n'en parcourt que le dernier
       tronçon, calculé pour valoir exactement les 8 px de la lettre. */
    const TRACE = 'M 20 16 C 14.94 18.4 8.19 18.4 2 16';
    const COURSE = 8;          // le décalage de la lettre, en px
    aide.innerHTML =
        '<svg viewBox="0 0 24 20" xmlns="http://www.w3.org/2000/svg">' +
        '<path class="titre-saisie-trait" d="' + TRACE + '"/></svg>' +
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

    // Le tracé part de (20, 16) dans la boîte : on le pose à 10 px à gauche et
    // 6 px sous l'angle de la lettre, donc un peu à l'écart de celle-ci.
    function placer() {
        var p = coinBasGauche(premiere);
        aide.style.left = (p.x - 30) + 'px';
        aide.style.top = (p.y - 10) + 'px';
    }

    // Le point ne parcourt que la fin du tracé : on lui donne le pourcentage de
    // départ qui correspond à la course de la lettre, mesuré sur le vrai tracé.
    (function calerDepart() {
        var chemin = aide.querySelector('path');
        if (!chemin || !chemin.getTotalLength) return;
        var longueur = chemin.getTotalLength();
        if (!longueur) return;
        var depart = Math.max(0, 1 - COURSE / longueur) * 100;
        aide.style.setProperty('--depart-point', depart.toFixed(2) + '%');
    })();

    var minuteur = null;
    var saisie = false;
    var fini = false;          // une lettre a déjà été bougée : plus d'invitation

    // L'invitation arrive 550 ms après le dernier défilement. Bouger la souris
    // ne compte pas : seule l'immobilité de la page compte.
    var REPOS = 550;

    function possible() {
        if (fini || saisie || window.scrollY > 12) return false;
        var r = heroSection.getBoundingClientRect();
        return r.bottom > 160 && r.top < window.innerHeight - 80;
    }

    function programmer(delai) {
        if (fini) return;
        clearTimeout(minuteur);
        minuteur = setTimeout(montrer, delai === undefined ? REPOS : delai);
    }

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
        programmer(REPOS);
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
        programmer(REPOS);
    });

    window.addEventListener('load', function () {
        programmer(REPOS);
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

// --- 7. LA CASE SECRÈTE DERRIÈRE « PORTFOLIO » (mini-jeu) ---------------
// Le badge « PORTFOLIO » se tire sans que rien ne l'annonce : derrière lui
// attend une case blanche, qui garde sa largeur mais s'allonge jusqu'à la
// hauteur des lettres. On y dépose des lettres, et le sous-titre change de
// mot sur un rouleau de machine à sous.
(function () {
    var ligne = document.querySelector('.hero-intro-line');
    var conteneur = document.querySelector('.hero-content');
    var badge = document.querySelector('.portfolio-badge');
    var sousTitre = document.querySelector('.hero-manuscript-text');
    var titre = document.querySelector('#hero-title');
    if (!ligne || !conteneur || !badge || !sousTitre || !titre) return;
    if (typeof gsap === 'undefined' || !window.PointerEvent) return;

    var GLYPHES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?!&%@';
    var PLACES = 4;                       // quatre places sous le badge
    var PLACES_MAX = 6;                   // six au plus : au-delà de TIAS, la case s'ouvre de deux places
    var SECRETS = {
        'IAN': { texte: "et oui c'est mon nom" },
        'BOSS': { texte: "et oui, c'est moi le" },
        'NOUS': { texte: "la république, c'est" },
        'TG': { texte: 'pas très gentil ça' },
        '-': { texte: '"+", lol' },
        'SOS': { texte: 'tous les cris les' },
        'NON': { texte: "non c'est" },
        'GO': { texte: '1, 2, 3...' },
        'SUD': { texte: 'Nord ou' },
        'TU': { texte: "la 2e personne du singulier, c'est" },
        'TOUT': { texte: "un point c'est" },
        'TOUS': { texte: 'Tous pour un et un pour' },
        'OUI': { texte: "c'est un grand" },
        'GOUT': { texte: 'vous avez bon' },
        'GOAT': { texte: "c'est moi le" },
        'AND': { texte: 'we do english here,' },
        'GAI': { texte: "je suis quelqu'un de" },
        'AUTO': { texte: "fan d'", signe: '?' },
        'DOS': { texte: "j'ai mal au" },
        'DAB': { texte: 'en mode 2017 ?' },
        'TIASOA': { texte: "elle m'a forcé à rajouter son prénom" }
    };
    var DEFAUT = 'secret ?!';
    var ETALEMENT = 0.028;                // décalage du rouleau, colonne par colonne
    var ITEMS = 6;                        // cases parcourues par le rouleau
    var ARRIVEE = -((ITEMS - 1) / ITEMS) * 100; // position de la case finale du rouleau

    /* Une place dans la ligne : la case blanche dessous, le badge dessus.
       La case reste ainsi DANS le flux de la ligne — elle ne peut donc jamais
       passer sous le texte, et elle suit les changements de longueur. */
    var place = document.createElement('span');
    place.className = 'portfolio-slot';
    ligne.insertBefore(place, badge);

    var boite = document.createElement('div');
    boite.className = 'case-secrete';
    boite.setAttribute('aria-hidden', 'true');
    place.appendChild(boite);
    place.appendChild(badge);

    /* le signe qui peut apparaître à droite de la case (le « ? » d'AUTO) */
    var signe = document.createElement('span');
    signe.className = 'case-signe';
    signe.setAttribute('aria-hidden', 'true');
    ligne.appendChild(signe);
    var signeActuel = '';

    var revelee = false;
    var texteActuel = '';
    var posees = [];
    var pret = false;
    var priseBadge = null;
    var hauteurLettres = 66;
    var tEnPlusEl = null;
    var largeurRepos = 0;                 // largeur de la case au repos (ses quatre places)
    var etiree = false;                   // la case s'est ouverte à droite pour la suite de TIAS
    /* écart fixe entre la place du badge et la case : il est mesuré à la
       révélation pour que la case reste pile à l'endroit d'où PORTFOLIO a
       été soulevé, malgré le changement de longueur de la ligne */
    var decalage = { x: 0, y: 0 };

    document.addEventListener('hero:intro-done', function () { pret = true; });

    /* ---------- le rouleau du sous-titre ---------- */
    function colonne(ch, posee) {
        var col = document.createElement('span');
        col.className = 'slot-case';
        if (ch === ' ') {
            col.innerHTML = '&nbsp;';
            return col;
        }
        var pile = document.createElement('span');
        pile.className = 'slot-pile';
        for (var k = 0; k < ITEMS; k++) {
            var it = document.createElement('span');
            it.className = 'slot-item';
            it.textContent = (k === ITEMS - 1) ? ch : GLYPHES.charAt(Math.floor(Math.random() * GLYPHES.length));
            pile.appendChild(it);
        }
        col.appendChild(pile);
        col._pile = pile;
        // « et voici mon » se lit tout de suite, sans traverser de glyphes
        if (posee) gsap.set(pile, { yPercent: ARRIVEE });
        return col;
    }

    /* La colonne prend la largeur de sa vraie lettre. Sans ça, c'est le glyphe
       le plus large du rouleau qui la fixe : « i » ou « , » héritaient d'une
       colonne de la taille d'un « m », d'où un espacement irrégulier. */
    function fixerLargeurs(ligne) {
        var fs = parseFloat(getComputedStyle(ligne).fontSize) || 16;
        var cols = ligne.querySelectorAll('.slot-case');
        for (var i = 0; i < cols.length; i++) {
            var items = cols[i].querySelectorAll('.slot-item');
            if (!items.length) continue;
            var r = document.createRange();
            r.selectNodeContents(items[items.length - 1]);
            var w = r.getBoundingClientRect().width;
            if (w > 0) cols[i].style.width = (w / fs).toFixed(3) + 'em';
        }
    }

    function construire(texte, posee) {
        var l = document.createElement('span');
        l.className = 'slot-ligne';
        for (var i = 0; i < texte.length; i++) l.appendChild(colonne(texte.charAt(i), posee));
        return l;
    }

    // La phrase et la case doivent rester dans la page, même quand la phrase
    // est longue et que la case s'est ouverte de deux places vers la droite.
    // On regarde la vraie place de la case, pas une largeur théorique : si ça
    // dépasse, on resserre l'espacement des lettres, puis la phrase rétrécit
    // par petits pas jusqu'à rentrer.
    function tient(l) {
        if (!l) return true;
        var marge = 12;
        var largeur = document.documentElement.clientWidth;
        var r = rectBoite();
        var t = l.getBoundingClientRect();
        return r.right <= largeur - marge && t.left >= marge;
    }

    function ajuster(l) {
        sousTitre.style.letterSpacing = '';
        sousTitre.style.fontSize = '';
        if (!l || tient(l)) return;

        var fs = parseFloat(getComputedStyle(sousTitre).fontSize) || 16;

        // 1) l'espacement se resserre d'au plus 5 % de la taille : les lettres
        //    restent lisibles, elles ne se touchent pas
        sousTitre.style.letterSpacing = (-fs * 0.05).toFixed(2) + 'px';
        if (tient(l)) return;

        // 2) sinon la phrase rétrécit d'un cran à la fois, sans jamais descendre
        //    sous 60 % de sa taille
        var mini = fs * 0.6;
        for (var k = 0; k < 40; k++) {
            var actuel = parseFloat(getComputedStyle(sousTitre).fontSize) || fs;
            if (actuel <= mini) break;
            sousTitre.style.fontSize = Math.max(mini, actuel * 0.96).toFixed(2) + 'px';
            if (tient(l)) return;
        }
    }

    function emballer() {
        var texte = (sousTitre.textContent || '').trim();
        var l = construire(texte, true);
        sousTitre.textContent = '';
        sousTitre.appendChild(l);
        texteActuel = texte;
        ajuster(l);
    }

    function ecrire(texte, marque, glisse) {
        marque = marque || '';
        if (texte === texteActuel && marque === signeActuel) return;
        texteActuel = texte;
        if (glisse === undefined) glisse = true;

        /* Tout ce qui va bouger est mesuré avant : le texte, la case et le
           badge glissent ensuite vers leur nouvelle place, au lieu de sauter
           quand la ligne se recentre. À la révélation, la case apparaît
           directement à sa place : pas de glissement à ce moment-là. */
        var avantTexte = sousTitre.getBoundingClientRect();
        var avantCase = boite.getBoundingClientRect();
        var avantBadge = badge.getBoundingClientRect();

        /* le signe de droite entre dans la ligne : il décale la case, et le
           glissement plus bas s'en charge comme du reste du texte */
        signeActuel = marque;
        if (marque) {
            signe.textContent = marque;
            gsap.set(signe, { display: 'inline-block', opacity: 0, y: -10, scale: 0.7 });
            gsap.to(signe, { opacity: 1, y: 0, scale: 1, duration: 0.35, delay: 0.22, ease: 'back.out(1.6)' });
        } else if (signe.textContent && signe.style.display !== 'none') {
            // il sort tout de suite : la ligne se rétrécit, et c'est le
            // glissement plus bas qui accompagne ce décalage
            gsap.set(signe, { display: 'none', opacity: 0 });
        }

        var ancienne = sousTitre.firstElementChild;
        if (ancienne) {
            gsap.set(ancienne, { position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap' });
            gsap.to(ancienne, {
                yPercent: -50, opacity: 0, duration: 0.24, ease: 'power2.in',
                onComplete: function () { if (ancienne.parentNode) ancienne.parentNode.removeChild(ancienne); }
            });
        }

        var neuve = construire(texte, false);
        sousTitre.appendChild(neuve);
        fixerLargeurs(neuve);
        ajuster(neuve);

        /* le rouleau part dans tous les cas, avec ou sans glissement */
        var piles = [];
        Array.prototype.forEach.call(neuve.children, function (col) { if (col._pile) piles.push(col._pile); });
        if (piles.length) {
            gsap.fromTo(piles, { yPercent: 0 }, {
                yPercent: ARRIVEE,
                duration: 0.62,
                ease: 'back.out(1.2)',
                stagger: ETALEMENT
            });
        }

        if (!glisse) {
            // la case apparaît déjà à sa place : ni elle, ni le texte, ni le
            // badge ne glissent à cet instant
            if (posees.length) placer(0);
            return;
        }

        var apresTexte = sousTitre.getBoundingClientRect();
        var dxTexte = avantTexte.left - apresTexte.left;
        if (Math.abs(dxTexte) > 1) {
            gsap.fromTo(neuve, { x: dxTexte }, { x: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        }

        var apresCase = boite.getBoundingClientRect();
        var dxCase = avantCase.left - apresCase.left;
        var dyCase = avantCase.top - apresCase.top;
        if (Math.abs(dxCase) > 1 || Math.abs(dyCase) > 1) {
            gsap.fromTo(boite, { x: dxCase, y: dyCase }, { x: 0, y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        }

        if (!priseBadge) {
            var apresBadge = badge.getBoundingClientRect();
            var dxBadge = avantBadge.left - apresBadge.left;
            var dyBadge = avantBadge.top - apresBadge.top;
            if (Math.abs(dxBadge) > 1 || Math.abs(dyBadge) > 1) {
                var bx = parseFloat(gsap.getProperty(badge, 'x')) || 0;
                var by = parseFloat(gsap.getProperty(badge, 'y')) || 0;
                gsap.fromTo(badge, { x: bx + dxBadge, y: by + dyBadge }, { x: bx, y: by, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
            }
        }

        // la case a pu se décaler avec la nouvelle longueur : on y replace les
        // lettres, sur la même durée que le glissement
        if (posees.length) placer(0.5);
    }

    emballer();

    /* ---------- la case : sa largeur, puis la hauteur des lettres ---------- */
    // centrage par marges négatives : exact, et à l'abri des transformations
    // (la largeur de repos sert de référence : quand la case s'ouvre à droite,
    // son bord gauche et les lettres déjà posées ne bougent pas)
    function centrer() {
        var base = largeurRepos || boite.offsetWidth;
        boite.style.marginLeft = (decalage.x - base / 2) + 'px';
        boite.style.marginTop = (decalage.y - boite.offsetHeight / 2) + 'px';
    }

    function reveler() {
        if (revelee) return;
        revelee = true;

        var carte = titre.querySelector('.ransom-card');
        hauteurLettres = carte ? Math.round(carte.getBoundingClientRect().height) : 66;

        largeurRepos = boite.offsetWidth;
        gsap.set(boite, { height: badge.getBoundingClientRect().height });
        centrer();
        gsap.to(boite, { opacity: 1, duration: 0.18, ease: 'power1.out' });
        gsap.to(boite, {
            height: hauteurLettres,
            duration: 0.5,
            ease: 'power3.out',
            onUpdate: centrer,
            onComplete: centrer
        });

        /* PORTFOLIO est encore chez lui à cet instant : c'est exactement cette
           position que la case doit reprendre. On mesure donc l'écart avec la
           place après le changement de texte (« et voici mon » devient
           « secret ?! », la ligne se resserre) et on le garde à demeure :
           ni glissement, ni saut, la case est pile là où était le badge. */
        var rb = badge.getBoundingClientRect();
        ecrire(DEFAUT, '', false);

        /* le badge vit dans le flux : la ligne qui se resserre le décalerait de
           quelques pixels alors qu'on est en train de le tenir. On compense
           aussitôt son décalage, sans animation, pour qu'il ne bouge pas. */
        var ra = badge.getBoundingClientRect();
        var ddx = rb.left - ra.left;
        var ddy = rb.top - ra.top;
        if (priseBadge && (ddx || ddy)) {
            priseBadge.x += ddx;
            priseBadge.y += ddy;
            gsap.set(badge, { x: priseBadge.x, y: priseBadge.y });
        }

        var pa = place.getBoundingClientRect();
        decalage.x = Math.round((rb.left + rb.width / 2) - (pa.left + pa.width / 2));
        decalage.y = Math.round((rb.top + rb.height / 2) - (pa.top + pa.height / 2));
        centrer();
    }

    /* ---------- le badge qu'on peut tirer, sans l'annoncer ---------- */
    badge.addEventListener('pointerdown', function (e) {
        if (!pret || priseBadge || e.button !== 0) return;
        e.preventDefault();
        priseBadge = {
            x: parseFloat(gsap.getProperty(badge, 'x')) || 0,
            y: parseFloat(gsap.getProperty(badge, 'y')) || 0,
            px: e.clientX,
            py: e.clientY,
            bouge: false
        };
        badge.classList.add('badge-prise');
        try { badge.setPointerCapture(e.pointerId); } catch (err) {}
    });

    window.addEventListener('pointermove', function (e) {
        if (!priseBadge) return;
        var dx = e.clientX - priseBadge.px;
        var dy = e.clientY - priseBadge.py;
        if (!priseBadge.bouge && Math.abs(dx) + Math.abs(dy) > 4) {
            priseBadge.bouge = true;
            reveler();
        }
        if (!priseBadge.bouge) return;
        gsap.set(badge, { x: priseBadge.x + dx, y: priseBadge.y + dy });
    }, { passive: true });

    window.addEventListener('pointerup', function () {
        if (!priseBadge) return;
        priseBadge = null;
        badge.classList.remove('badge-prise');
    });

    window.addEventListener('pointercancel', function () {
        if (!priseBadge) return;
        priseBadge = null;
        badge.classList.remove('badge-prise');
    });

    /* ---------- les lettres qu'on dépose dans la case ---------- */
    // la place libre la plus proche de celle visée
    function placeLibre(vise) {
        var prises = {};
        posees.forEach(function (o) { prises[o.slotCase] = true; });
        for (var d = 0; d <= PLACES_MAX; d++) {
            var a = vise - d;
            var b = vise + d;
            if (a >= 0 && a < PLACES_MAX && !prises[a]) return a;
            if (b < PLACES_MAX && b !== a && !prises[b]) return b;
        }
        return -1;
    }

    // le rectangle de la case sans son déplacement de glissement : c'est lui
    // qui donne la vraie place des lettres, y compris pendant qu'elle glisse
    function rectBoite() {
        /* On part de la place (le parent, qui ne glisse jamais) et des mesures
           de la case, insensibles aux transformations : on obtient ainsi la
           vraie position de la case même pendant qu'elle glisse. */
        var p = place.getBoundingClientRect();
        var w = boite.offsetWidth;
        var h = boite.offsetHeight;
        var base = largeurRepos || w;
        var l = p.left + p.width / 2 - base / 2 + decalage.x;
        var t = p.top + p.height / 2 - h / 2 + decalage.y;
        return { left: l, top: t, right: l + w, bottom: t + h, width: w, height: h };
    }

    function placer(duree) {
        var d = (duree === undefined) ? 0.32 : duree;
        var r = rectBoite();
        /* les places gardent toujours le même pas : les lettres déjà posées ne
           bougent pas quand la case s'ouvre pour la suite du mot */
        var largeur = (largeurRepos || r.width) / PLACES;
        posees.forEach(function (c) {
            var i = c.slotCase;
            var cx = r.left + largeur * (i + 0.5);
            var cy = r.top + r.height / 2;
            var echelle = Math.min(1, (r.height - 14) / c.h, (largeur - 8) / c.w);
            c.x = cx;
            c.y = cy;
            c.vx = 0;
            c.vy = 0;
            gsap.to(c.el, {
                x: cx - c.hx,
                y: cy - c.hy,
                rotation: 0,
                scale: echelle,
                duration: d,
                ease: 'power3.out',
                overwrite: true
            });
        });
    }

    function verifier() {
        // les lettres se lisent de gauche à droite, quel que soit l'ordre
        // dans lequel on les a posées
        var mot = posees.slice().sort(function (a, b) { return a.slotCase - b.slotCase; }).map(function (c) {
            var carte = c.el.querySelector('.ransom-card');
            return (carte ? carte.textContent : '').trim();
        }).join('');
        var secret = SECRETS[mot];

        /* TIAS ouvre la case à droite : deux places de plus, sans rien déplacer.
           On l'ouvre avant d'écrire la phrase, pour que celle-ci se resserre
           en tenant compte de la place que la case prend à droite. */
        etendre(mot.indexOf('TIAS') === 0 || posees.length > PLACES);

        ecrire(secret ? secret.texte : DEFAUT, secret ? secret.signe : '');

        /* Le second T : il apparaît à la place du T d'origine dès que la case
           forme TOU ou TU, et disparaît dès qu'on défait cette combinaison.
           Tant qu'il est lui-même rangé dans la case, il reste là. */
        var combo = (mot === 'TOU' || mot === 'TU');
        var tDedans = false, modele = null;
        for (var i = 0; i < posees.length; i++) {
            var carte = posees[i].el.querySelector('.ransom-card');
            if (!carte || carte.textContent.trim() !== 'T') continue;
            if (tEnPlusEl && posees[i].el === tEnPlusEl) tDedans = true;
            else if (!tEnPlusEl) modele = posees[i].el;
        }

        if (combo && !tEnPlusEl) {
            if (!modele) {
                for (var j = 0; j < posees.length; j++) {
                    var cj = posees[j].el.querySelector('.ransom-card');
                    if (cj && cj.textContent.trim() === 'T') { modele = posees[j].el; break; }
                }
            }
            if (modele && window.lettresTitre) {
                var home = window.lettresTitre.home(modele);
                if (home) tEnPlusEl = window.lettresTitre.ajouter(modele, home.x, home.y);
            }
        } else if (!combo && tEnPlusEl && !tDedans) {
            if (window.lettresTitre) window.lettresTitre.retirer(tEnPlusEl);
            tEnPlusEl = null;
        }
    }

    /* ---------- la case qui s'ouvre à droite pour « TIAS » ---------- */
    /* Quatre places tiennent sous le badge. Dès que les lettres forment TIAS,
       la case s'étire vers la droite de deux places — son bord gauche et les
       lettres déjà posées ne bougent pas — pour laisser entrer la suite du mot.
       Elle se referme en douceur dès que TIAS n'y est plus. */
    function compacter() {
        var ordre = posees.slice().sort(function (a, b) { return a.slotCase - b.slotCase; });
        var change = false;
        for (var i = 0; i < ordre.length; i++) {
            if (ordre[i].slotCase !== i) { ordre[i].slotCase = i; change = true; }
        }
        return change;
    }

    function etendre(oui) {
        if (!largeurRepos || oui === etiree) return;
        etiree = oui;
        if (!oui) compacter();
        var extra = oui ? Math.round(largeurRepos / PLACES * (PLACES_MAX - PLACES)) : 0;

        if (typeof gsap === 'undefined') {
            boite.style.setProperty('--extra', extra + 'px');
            centrer();
            if (posees.length) placer(0);
            return;
        }

        gsap.to(boite, {
            '--extra': extra + 'px',
            duration: 0.5,
            ease: 'power3.inOut',
            onUpdate: centrer,
            overwrite: 'auto'
        });
        if (posees.length) placer(0.5);
    }

    function deposer(c) {
        if (!revelee || !c || posees.indexOf(c) >= 0) return false;
        // on accepte la lettre là où la case est *vue* (même en plein glissement)…
        var r = boite.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        if (c.x < r.left || c.x > r.right || c.y < r.top || c.y > r.bottom) return false;
        /* les deux places de plus n'existent que quand la case s'est ouverte */
        if (posees.length >= (etiree ? PLACES_MAX : PLACES)) return false;
        var largeur = (largeurRepos || r.width) / PLACES;
        var vise = Math.floor((c.x - r.left) / largeur);
        if (vise < 0) vise = 0;
        if (vise > PLACES_MAX - 1) vise = PLACES_MAX - 1;
        var libre = placeLibre(vise);
        if (libre < 0) return false;
        c.slotCase = libre;
        c.dansCase = true;
        posees.push(c);
        placer();
        verifier();
        return true;
    }

    function retirer(c) {
        var i = posees.indexOf(c);
        if (i < 0) return;
        posees.splice(i, 1);
        c.dansCase = false;
        delete c.slotCase;
        gsap.to(c.el, { scale: 1, duration: 0.2, ease: 'power2.out', overwrite: true });
        placer();
        verifier();
    }

    // la fenêtre change : on resserre à nouveau le texte et on replace les lettres
    var minuteur = null;
    window.addEventListener('resize', function () {
        clearTimeout(minuteur);
        minuteur = setTimeout(function () {
            if (revelee) {
                /* la largeur du badge a pu changer : on remesure la case au
                   repos, puis on remet son ouverture si elle était ouverte.
                   C'est fait avant de resserrer la phrase, sinon elle se
                   resserre sur une largeur de case qui n'est plus la bonne. */
                boite.style.setProperty('--extra', '0px');
                largeurRepos = boite.offsetWidth;
                if (etiree) {
                    boite.style.setProperty('--extra', Math.round(largeurRepos / PLACES * (PLACES_MAX - PLACES)) + 'px');
                }
                gsap.set(boite, { height: hauteurLettres });
                centrer();
            }
            ajuster(sousTitre.lastElementChild);
            if (revelee && posees.length) placer();
        }, 220);
    });

    window.caseSecrete = { deposer: deposer, retirer: retirer };
})();

// --- ARRIVÉE SUR LE CHOIX DES DOMAINES ---
// Depuis une page de domaine, « retour au choix des domaines » mène à
// index.html#choix-domaines. Le navigateur s'y pose avant que les images et
// l'intro n'aient fini de mettre la page en place : on recale donc la position
// une fois le chargement terminé, puis à la fin de l'intro, pour arriver pile
// sur le choix des domaines et jamais sur le haut de la page.
(function poserSurLeChoix() {
    if (location.hash !== '#choix-domaines') return;
    var dernier = -1;

    function poser() {
        var cible = document.getElementById('choix-domaines');
        if (!cible) return;
        var y = cible.getBoundingClientRect().top + (window.pageYOffset || 0);
        y = Math.max(0, Math.round(y));
        if (Math.abs(y - (window.pageYOffset || 0)) < 4 || y === dernier) return;
        dernier = y;
        window.scrollTo(0, y);
    }

    window.addEventListener('load', function () { requestAnimationFrame(poser); });
    document.addEventListener('hero:intro-done', function () { requestAnimationFrame(poser); });
})();

// --- OUVERTURE SUR LE CHOIX DES DOMAINES ---
// index.html pose le voile vert pâle avant son premier rendu quand on arrive par
// « retour au choix des domaines » (classe sur <html>). Une fois la page chargée,
// le voile s'efface : le titre apparaît, la phrase suit, et les trois cases rondes
// gonflent comme des bulles, l'une après l'autre.
(function ouvrirSurLeChoix() {
    var racine = document.documentElement;
    if (!racine.classList.contains('sas-domaines-arrivee')) return;

    var voile = document.getElementById('sasDomaines');
    var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fait = false;

    function decouvrir() {
        if (voile) {
            voile.style.visibility = 'hidden';
            voile.style.opacity = '0';
        }
        racine.classList.remove('sas-domaines-arrivee');
        /* le fond reste vert : c'est l'état du choix des domaines à l'écran */
        if (typeof gsap !== 'undefined') gsap.set('body', { backgroundColor: 'var(--color-bg-end)' });
    }

    function reveler() {
        if (fait) return;
        fait = true;
        if (calme || typeof gsap === 'undefined') { decouvrir(); return; }

        /* la barre entre en même temps que le vert s'efface : sa sortie et son
           entrée se répondent d'une page à l'autre */
        document.dispatchEvent(new Event('choix:reveler'));

        var tl = gsap.timeline({ onComplete: decouvrir });
        if (voile) tl.to(voile, { opacity: 0, duration: 0.65, ease: 'power2.out' }, 0);
        tl.fromTo('.bubble-card',
            { scale: 0.12, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.12 }, 0.08);
        tl.from('.titre-centre', { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.42);
        /* la phrase du bas a son propre dévoilement au scroll : l'arrivée le
           remplace, sinon elle resterait invisible sous le voile */
        gsap.killTweensOf('.domain-note');
        tl.fromTo('.domain-note',
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.56);
    }

    window.addEventListener('load', function () { requestAnimationFrame(reveler); });
    /* filet de sécurité : le voile ne doit jamais rester en place */
    setTimeout(reveler, 4200);
})();

// --- ÉTOILES DU CHOIX DES DOMAINES : deux rideaux le long des bords ---
// À gauche les étoiles descendent, à droite elles montent ; le centre du cadre
// reste vide. Le champ commence au haut de « qui suis-je ? » : les étoiles
// pointent déjà pendant cette section et n'arrivent pas d'un coup sur le choix
// des domaines. Tant qu'on descend, c'est le scroll qui les entraîne et qui les
// allume en fondu. Une fois la page arrivée en bas, le scroll ne peut plus
// rien : elles continuent alors leur course au temps qui passe.
(function initEtoilesDomaines() {
    const section = document.getElementById('choix-domaines');
    if (!section) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* le champ ne peut pas rester dans la section : elle rogne ses débordements
       et il doit déborder vers le haut, sur « qui suis-je ? » */
    const intro = document.querySelector('.intro-section') || section;

    const PAR_COTE = 14;       // étoiles par bord, à pleine largeur
    const DEBORD = 90;         // px hors du cadre avant le rebouclage
    const ENTRAINE = 0.5;      // px parcourus par px de scroll descendu
    const VITESSE = 26;        // px/s une fois la page arrivée en bas
    const ENTREE = 950;        // ms : le fondu d'arrivée, quand on revient sur la page

    const champ = document.createElement('div');
    champ.className = 'etoiles-domaines';
    champ.setAttribute('aria-hidden', 'true');
    document.body.appendChild(champ);

    let naissance = 0;      // instant où les étoiles entrent à l'écran
    const etoiles = [];
    let largeur = 0;
    let hauteur = 0;
    let finPage = 0;    // scroll maximal : la page est en bas
    let derive = 0;     // px parcourus sans le scroll, une fois la page en bas
    let tBas = 0;       // instant où la course libre a commencé
    let proche = false; // la section touche l'écran : la course continue
    let boucle = 0;
    let derniere = 0;

    function entre(a, b) { return a + Math.random() * (b - a); }

    /* le champ est calé sur le document : du haut de « qui suis-je ? » au bas
       du choix des domaines. La position est refaite quand la page se stabilise
       (polices, images), pour que le changement de hauteur des sections ne
       déplace pas la couture des étoiles. */
    function placer() {
        const haut = intro.getBoundingClientRect().top + window.scrollY;
        const bas = section.getBoundingClientRect().bottom + window.scrollY;
        champ.style.top = Math.round(haut) + 'px';
        champ.style.height = Math.round(Math.max(0, bas - haut)) + 'px';
    }

    function semer() {
        placer();
        largeur = champ.clientWidth;
        hauteur = champ.clientHeight;
        const bande = Math.max(110, Math.min(300, largeur * 0.21));
        const nombre = Math.round(PAR_COTE * (largeur < 760 ? 0.65 : 1));

        champ.textContent = '';
        etoiles.length = 0;

        for (let cote = 0; cote < 2; cote++) {
            for (let i = 0; i < nombre; i++) {
                const el = document.createElement('i');
                el.className = 'etoile-domaine';
                const taille = entre(15, 40);
                el.style.setProperty('--taille', taille.toFixed(1) + 'px');

                /* plus on s'écarte du bord, plus l'étoile est rare : les bords
                   restent fournis, le centre du cadre reste vide. Elle est
                   écartée du bord de la moitié de sa taille pour ne jamais
                   être coupée par le cadre. */
                const ecart = Math.max(taille / 2, Math.pow(Math.random(), 1.6) * bande);

                etoiles.push({
                    el: el,
                    x: cote === 0 ? ecart : largeur - ecart,
                    y: Math.random() * (hauteur + DEBORD * 2),
                    /* les étoiles lointaines glissent un peu moins vite */
                    part: entre(0.62, 1.12),
                    sens: cote === 0 ? 1 : -1,   // à gauche vers le bas, à droite vers le haut
                    angle: Math.random() * 360,
                    force: entre(0.4, 1),
                    fondu: -1
                });
                champ.appendChild(el);
            }
        }
    }

    function dessiner() {
        const r = champ.getBoundingClientRect();               // les étoiles
        const choix = section.getBoundingClientRect();         // le récit
        hauteur = r.height;

        /* le fondu part dès que les étoiles pointent par le bas de l'écran et
           s'achève quand les bulles prennent leurs places : pendant
           « qui suis-je ? » elles sont déjà là, encore voilées */
        const debut = r.top + window.scrollY - window.innerHeight * 0.85;
        const fin = choix.top + window.scrollY - window.innerHeight * 0.25;
        finPage = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const fenetre = Math.max(1, fin - debut);
        proche = r.bottom > -320 && r.top < window.innerHeight + 320;

        /* le fondu ne commence qu'au moment où elles entrent vraiment à
           l'écran : pas de fondu d'arrivée déjà consommé pendant le chargement */
        const maintenant = performance.now();
        if (!naissance && proche) naissance = maintenant;

        /* le bout du récit est atteint : soit la page est au bas, soit on vient
           d'arriver directement sur le choix des domaines (le retour depuis une
           page de domaine pose la section en haut de l'écran, vingt pixels
           avant le bas : le scroll ne peut alors plus rien). Les étoiles
           avancent donc au temps qui passe. La course se mesure à l'horloge et
           non à la frame, elle reste juste d'un écran à l'autre. */
        if (choix.top <= 1 || window.scrollY >= finPage - 2) {
            if (!tBas) tBas = maintenant;
            derive += VITESSE * (maintenant - tBas) / 1000;
            tBas = maintenant;
        } else {
            tBas = 0;
        }

        const avance = window.scrollY - debut;

        let p = avance / fenetre;
        if (p < 0) p = 0;
        if (p > 1) p = 1;

        /* le fondu court sur toute l'approche, lissé pour que l'allumage
           reste progressif : c'est lui qui les fait poindre dès
           « qui suis-je ? » */
        let fondu = p * p * (3 - 2 * p);

        /* et le fondu d'arrivée : en revenant sur la page, on est déjà tout en
           bas du scroll, donc sans lui les étoiles seraient là d'un coup. Il
           ne change rien quand on arrive en haut de l'accueil. */
        let entree = naissance ? (maintenant - naissance) / ENTREE : 0;
        if (entree < 1) {
            if (entree < 0) entree = 0;
            fondu *= entree * entree * (3 - 2 * entree);
        }

        const dep = avance * ENTRAINE + derive;
        const P = hauteur + DEBORD * 2;

        for (let i = 0; i < etoiles.length; i++) {
            const e = etoiles[i];
            let y = (e.y + dep * e.sens * e.part) % P;
            if (y < 0) y += P;
            y -= DEBORD;

            e.el.style.transform = 'translate3d(' + e.x.toFixed(1) + 'px,' +
                y.toFixed(1) + 'px,0) rotate(' + e.angle.toFixed(1) + 'deg)';

            if (e.fondu !== fondu) {
                e.el.style.opacity = (fondu * e.force).toFixed(3);
                e.fondu = fondu;
            }
        }
    }

    function tourner(t) {
        if (!proche) { boucle = 0; return; }
        boucle = requestAnimationFrame(tourner);
        if (!derniere) { derniere = t; return; }
        derniere = t;
        dessiner();
    }

    function lancer() {
        if (boucle) return;
        derniere = 0;
        boucle = requestAnimationFrame(tourner);
    }

    semer();
    dessiner();

    /* le scroll entraîne les étoiles : le dessin part à chaque cran, sans
       attendre la frame suivante, et la course repart si la section revient.
       L'arrivée sur #choix-domaines (retour depuis une page de domaine) peut
       déplacer le scroll sans que la boucle tourne encore : on redessine donc
       aussi au chargement complet et au saut d'ancre. */
    function rejoindre() {
        dessiner();
        if (proche) lancer();
    }

    window.addEventListener('scroll', rejoindre, { passive: true });
    /* au chargement complet, les sections ont leur hauteur définitive : le
       champ est reposé avant de redessiner */
    window.addEventListener('load', function () { placer(); rejoindre(); });
    window.addEventListener('hashchange', rejoindre);
    window.addEventListener('pageshow', rejoindre);

    lancer();

    /* au changement de taille, la trame est reposée sur les nouvelles mesures ;
       la course déjà gagnée (derive) est gardée */
    let minuteur = null;
    window.addEventListener('resize', function () {
        clearTimeout(minuteur);
        minuteur = setTimeout(function () {
            semer();
            dessiner();
            if (proche) lancer();
        }, 220);
    });
})();

// --- FLÈCHE GUIDE : un trait bleu qui s'étire au fil de la page ---
// Le tracé est une courbe paramétrique organique : trois loopings, des
// allers-retours, des passages à l'horizontale. Le scroll ne déplace pas une
// flèche : il fait grandir le trait le long de ce chemin, et la pointe reste
// posée au bout, orientée par la pente. Le tracé vit dans un SVG aux mesures
// du document (donc en coordonnées de page) posé derrière tout le contenu.
(function initFlecheGuide() {
    const titre = document.getElementById('hero-title');
    if (!titre) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const BOUCLES = 3;          // loopings sur la descente
    const ONDES = 2;            // ondulation lente : les allers-retours
    /* écart de vitesse autour de celle du scroll : le trait avance entre 22 %
       et 178 % de la vitesse du défilement. */
    const RESPIRATION = 0.78;
    const FREQ_RESPIRATION = 2; // deux accélérations et deux ralentissements
    /* au tout début le tracé est presque immobile : le scroll descend plus vite
       que lui, puis il rattrape sur la première tranche de la page. VITESSE_DEPART
       est une fraction de la vitesse du scroll (0,06 = 6 %). */
    const VITESSE_DEPART = 0.06;
    const RAMPE = 0.12;         // part du scroll où la vitesse remonte à la normale
    const PROFIL = 400;         // précision du profil de vitesse
    /* le virage serré du haut, autour de « qui suis-je ? », se parcourt au pas :
       une cloche locale y écrase la vitesse */
    const RALENTI = 0.17;       // sa place, en part du tracé
    const RALENTI_LARGEUR = 0.055;
    const RALENTI_FORCE = 0.8;  // la vitesse y tombe à 20 % de la sienne ailleurs
    const PAS = 900;            // points d'échantillonnage du tracé
    /* le tracé ne démarre pas au premier pixel de scroll : il laisse passer
       quelques centimètres, le temps que la page se mette en route */
    const DELAI_DEPART = 140;   // en px de scroll
    const RETOUR = 380;         // durée du demi-tour, en ms (avant la transition)
    /* le premier looping, celui qui passe au-dessus de « qui suis-je ? », est
       élargi et posé un peu plus bas que les autres : une cloche centrée sur
       l'endroit où il se trouve, et qui retombe à zéro ailleurs */
    const BOSSE = 0.17;         // sa place, en part du tracé
    const BOSSE_LARGEUR = 0.09; // largeur de la cloche
    const BOSSE_X = 0.35;       // un peu plus large
    const BOSSE_Y = 0.2;        // un peu plus haut
    const BOSSE_BAS = 90;       // et un peu plus bas
    /* Rien n'est dessiné « à part » : les deux moments particuliers du tracé
       sont obtenus en le **tirant doucement** vers une forme cible (une ellipse
       autour du titre « qui suis-je ? », un grand tour autour de « où on va ? »).
       Le poids du mélange monte et redescend en douceur, et la courbe de base
       comme la cible sont lisses : le raccord l'est donc aussi, sans point de
       contrôle ni cassure. */
    const FIN_U0 = 0.84;        // début du mélange de la fin
    const FIN_RAYON = 190;      // rayon du tour final
    const FIN_RAMPE = 0.3;      // part de la fin où le tracé rejoint le tour
    const FIN_TOUR = -320;      // balayage du tour (négatif : sens horaire)
    const FIN_PLONGEE = 0.6;    // part de la fin à partir de laquelle le tracé
                                // quitte le tour et entre derrière le titre
    const NS = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fleche-guide');
    svg.setAttribute('aria-hidden', 'true');

    const trait = document.createElementNS(NS, 'path');
    trait.setAttribute('class', 'fleche-trait');

    const pointe = document.createElementNS(NS, 'path');
    pointe.setAttribute('class', 'fleche-pointe');
    /* la pointe du dessin est à l'origine : la rotation la fait pivoter sur
       elle-même, et la translation la pose exactement au bout du trait */
    pointe.setAttribute('d', 'M0 0 L-7.5 -17 L0 -12.4 L7.5 -17 Z');

    svg.appendChild(trait);
    svg.appendChild(pointe);
    document.body.appendChild(svg);

    let largeur = 0;
    let haut = 0;       // y du départ, sous le titre
    let course = 0;     // descente totale = défilement maximal de la page
    let cx = 0;         // axe de la courbe
    let Ax = 0;         // amplitude horizontale
    let By = 0;         // amplitude verticale des loopings
    let By2 = 0;        // amplitude de l'ondulation lente
    let cumul = [];     // longueur de trait accumulée jusqu'à chaque point
    let total = 0;
    let anglePrec = null;
    let annonce = false;  // le trait est-il arrivé au bout de son tour ?
    let uAffiche = 0;     // part du tracé actuellement dessinée
    let recul = false;    // le tracé est-il en train de rentrer (demi-tour)
    /* forme cible du tour final, recalée à chaque mesure de la page */
    let finCx = 0, finCy = 0, finAngle = 0;
    let finBx = 0, finBy = 0;   // l'arrivée : derrière le titre
    let profil = [];    // avancement du tracé en fonction du scroll, normalisé

    /* Profil de vitesse. La vitesse est décrite **en fonction de l'avancement du
       tracé** (u), pas du scroll : c'est la seule façon de ralentir un virage
       précis, puisqu'à chaque instant c'est bien le tracé qui compte. On en
       déduit combien de scroll coûte chaque fraction de tracé, on normalise
       (u(1) = 1 exactement), et `avance()` fait le chemin inverse. */
    function construireProfil() {
        const vitesse = function (u) {
            let w = u / RAMPE;
            if (w > 1) w = 1;
            const lisse = w * w * (3 - 2 * w);
            const souffle = 1 - RESPIRATION * Math.cos(2 * Math.PI * FREQ_RESPIRATION * u);
            const d = (u - RALENTI) / RALENTI_LARGEUR;
            const frein = 1 - RALENTI_FORCE * Math.exp(-d * d);
            return Math.max(0.05, (VITESSE_DEPART + (souffle - VITESSE_DEPART) * lisse) * frein);
        };
        profil = [0];
        const pas = 1 / PROFIL;
        let total = 0;
        for (let i = 1; i <= PROFIL; i++) {
            total += pas / ((vitesse((i - 1) * pas) + vitesse(i * pas)) / 2);
            profil.push(total);
        }
        for (let i = 0; i <= PROFIL; i++) profil[i] /= total;
    }

    /* part du tracé atteinte pour un scroll donné : on inverse le profil */
    function avance(s) {
        if (s <= 0) return 0;
        if (s >= 1) return 1;
        let bas = 0, haut = PROFIL;
        while (haut - bas > 1) {
            const mid = (bas + haut) >> 1;
            if (profil[mid] <= s) bas = mid; else haut = mid;
        }
        const ecart = profil[bas + 1] - profil[bas];
        const f = ecart > 0 ? (s - profil[bas]) / ecart : 0;
        return Math.min(1, (bas + f) / PROFIL);
    }

    /* la cloche du premier looping : 1 au centre, 0 de part et d'autre */
    function bosse(u) {
        const d = (u - BOSSE) / BOSSE_LARGEUR;
        return Math.exp(-d * d);
    }

    function base(u) {
        const a = 2 * Math.PI * BOUCLES * u;
        const b = 2 * Math.PI * ONDES * u;
        const g = bosse(u);
        /* l'écart au chemin moyen est agrandi et poussé vers le bas autour du
           premier looping seulement */
        const ex = Ax * (1 - Math.cos(a)) - Ax * (1 - Math.cos(b));
        const ey = By * Math.sin(a) + By2 * Math.sin(b);
        return {
            x: cx + ex * (1 + BOSSE_X * g),
            y: haut + course * u + ey * (1 + BOSSE_Y * g) + BOSSE_BAS * g
        };
    }

    /* montée et descente en douceur, dérivée nulle aux deux bouts */
    function lisser(t) {
        const x = Math.min(1, Math.max(0, t));
        return x * x * (3 - 2 * x);
    }

    function point(u) {
        const p = base(u);

        /* fin : le tracé est tiré vers un grand tour autour de « où on va ? »,
           et s'arrête dessus, la pointe visible sous le titre */
        if (finCx && u > FIN_U0) {
            const t = (u - FIN_U0) / (1 - FIN_U0);
            /* le tracé rejoint le tour en quelques pour cent, puis le suit
               exactement : le cercle est donc parcouru en entier, et la
               jonction reste lisse puisque le poids repart de zéro */
            const w = lisser(t / FIN_RAMPE);
            const a = (finAngle + t * FIN_TOUR) * Math.PI / 180;
            let cibleX = finCx + Math.cos(a) * FIN_RAYON;
            let cibleY = finCy + Math.sin(a) * FIN_RAYON;
            /* sur la fin, la cible quitte le cercle et glisse jusqu'au titre :
               la pointe y entre et disparaît derrière le cadre */
            const d = lisser((t - FIN_PLONGEE) / (1 - FIN_PLONGEE));
            cibleX += (finBx - cibleX) * d;
            cibleY += (finBy - cibleY) * d;
            p.x += (cibleX - p.x) * w;
            p.y += (cibleY - p.y) * w;
        }
        return p;
    }

    /* cale le tour final sur le titre de la page réelle */
    function placerCibles() {
        const fin = document.querySelector('.titre-centre');
        if (!fin) return;
        const r = fin.getBoundingClientRect();
        finCx = r.left + r.width / 2 + 60;
        finCy = r.top + window.scrollY - 20;
        /* le point d'arrivée : dans le cadre du titre, donc invisible */
        finBx = r.left + r.width - 12;
        finBy = r.top + window.scrollY + r.height / 2;
        /* on démarre le tour du côté où le tracé arrive, pour que la jonction
           ne fasse pas de saut */
        const j = base(FIN_U0);
        finAngle = Math.atan2((j.y - finCy) / FIN_RAYON, (j.x - finCx) / FIN_RAYON) * 180 / Math.PI;
    }

    /* la pente donne l'orientation de la pointe ; on la mesure sur la courbe
       elle-même, pour qu'elle reste juste malgré la cloche et le tour final */
    function pente(u) {
        const e = 0.0002;
        const avant = point(Math.max(0, u - e));
        const apres = point(Math.min(1, u + e));
        return { x: apres.x - avant.x, y: apres.y - avant.y };
    }

    function mesurer() {
        const vh = window.innerHeight;
        const t = titre.getBoundingClientRect();
        const page = document.documentElement.scrollHeight;
        largeur = document.documentElement.clientWidth;
        haut = t.bottom + window.scrollY + 64;
        course = Math.max(0, page - vh);
        cx = largeur / 2;
        /* la courbe reste dans une bande raisonnable, proportionnelle à l'écran */
        const portee = Math.min(largeur * 0.33, 520);
        Ax = portee / 2;
        By = Math.min(170, vh * 0.19);
        By2 = By * 0.42;
        anglePrec = null;

        /* page plus courte que l'écran : rien à accompagner */
        if (course < 120) { svg.style.display = 'none'; return; }
        svg.style.display = '';

        svg.setAttribute('width', largeur);
        svg.setAttribute('height', page);
        svg.setAttribute('viewBox', '0 0 ' + largeur + ' ' + page);

        placerCibles();

        /* le tracé échantillonné : la courbe est lisse, la ligne brisée ne se
           voit pas, et elle donne la longueur réelle du chemin */
        let d = '';
        cumul = [0];
        let prec = point(0);
        d = 'M' + prec.x.toFixed(1) + ' ' + prec.y.toFixed(1);
        for (let i = 1; i <= PAS; i++) {
            const p = point(i / PAS);
            d += 'L' + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
            cumul.push(cumul[i - 1] + Math.hypot(p.x - prec.x, p.y - prec.y));
            prec = p;
        }
        total = cumul[PAS];
        trait.setAttribute('d', d);
        /* aucun trait visible au départ : seul l'arrondi de la pointe reste */
        trait.setAttribute('stroke-dasharray', total.toFixed(1));
        trait.setAttribute('stroke-dashoffset', total.toFixed(1));
    }

    /* dessine le tracé jusqu'à la part u, pointe comprise */
    function tracer(u) {
        if (!total) return;
        uAffiche = u;

        /* longueur de trait jusqu'à u : les points sont à pas constant en u */
        const i = Math.min(PAS - 1, Math.floor(u * PAS));
        const long = cumul[i] + (cumul[i + 1] - cumul[i]) * (u * PAS - i);
        trait.setAttribute('stroke-dashoffset', (total - long).toFixed(1));

        const p = point(u);
        const v = pente(u);
        let angle = Math.atan2(v.y, v.x) * 180 / Math.PI - 90;   // 0 = pointe vers le bas
        if (anglePrec !== null) {
            /* on tourne toujours du côté le plus court */
            while (angle - anglePrec > 180) angle -= 360;
            while (angle - anglePrec < -180) angle += 360;
        }
        anglePrec = angle;

        pointe.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) +
            ') rotate(' + angle.toFixed(2) + ')');

        /* la pointe vient de rentrer derrière le titre : c'est le signal que
           guette la flèche rouge pour entrer en scène */
        if (!annonce && u >= 0.985) {
            annonce = true;
            document.dispatchEvent(new CustomEvent('fleche-guide:arrivee'));
        }
    }

    function dessiner() {
        if (!total || recul) return;
        const marge = course - DELAI_DEPART;
        const s = marge > 0 ? Math.min(1, Math.max(0, (window.scrollY - DELAI_DEPART) / marge)) : 0;
        /* le scroll avance de façon inégale : le trait s'allonge plus ou moins
           vite, sans jamais reculer (le profil est croissant) */
        tracer(Math.min(1, Math.max(0, avance(s))));
    }

    /* Demi-tour : quand on quitte l'accueil par un domaine, le tracé rentre en
       arrière jusqu'à son point de départ, pointe comprise, avant que la page
       ne bascule. Il n'est donc plus là pendant la transition. */
    function rentrer() {
        if (recul || !total || uAffiche <= 0) return;
        recul = true;
        const depart = uAffiche;
        const debut = performance.now();
        const duree = RETOUR;
        function pas(maintenant) {
            const t = Math.min(1, (maintenant - debut) / duree);
            const doux = t * t * (3 - 2 * t);
            tracer(depart * (1 - doux));
            if (t < 1) requestAnimationFrame(pas);
        }
        requestAnimationFrame(pas);
    }

    /* une seule mise à jour par image, même si le scroll crache des événements */
    let attente = false;
    function auScroll() {
        if (attente) return;
        attente = true;
        requestAnimationFrame(function () { attente = false; dessiner(); });
    }

    construireProfil();
    mesurer();
    dessiner();

    /* la flèche n'entre en scène qu'une fois le titre posé : elle attend la fin
       de l'animation d'accueil (`hero:intro-done`), avec une minuterie de
       secours au cas où cette animation n'aurait pas lieu */
    let parue = false;
    function paraitre() {
        if (parue) return;
        parue = true;
        svg.classList.add('fleche-prete');
    }
    document.addEventListener('hero:intro-done', paraitre, { once: true });
    setTimeout(paraitre, 2600);

    /* les domaines sauf la photographie : au clic, la flèche fait demi-tour
       pendant que la transition se prépare */
    Array.prototype.forEach.call(document.querySelectorAll('.bubble-card'), function (bouchon) {
        const href = bouchon.getAttribute('href') || '';
        if (/photographie\.html/.test(href)) return;
        bouchon.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
            rentrer();
        });
    });

    /* retour arrière depuis le cache du navigateur : la flèche reprend sa place */
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        recul = false;
        mesurer();
        dessiner();
    });

    window.addEventListener('scroll', auScroll, { passive: true });
    /* le chargement des images déplace la page : on recale le départ */
    window.addEventListener('load', function () { mesurer(); dessiner(); });
    window.addEventListener('resize', function () { mesurer(); dessiner(); });
})();
