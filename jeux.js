/* Deux mini-jeux du portfolio — sans dépendance, montés dans la page Numérique.
   1. « Le rayon perdu » : pixel RPG, ZQSD / flèches, coffres à trouver.
   2. « Cadrage » : viseur photo piloté au gyroscope (glisser si absent). */
(function () {
  'use strict';

  /* ------------------------------ son ------------------------------ */
  var son = { ctx: null, muet: false };

  function ctxSon() {
    if (!son.ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { son.ctx = new C(); } catch (e) { return null; }
    }
    if (son.ctx.state === 'suspended') son.ctx.resume();
    return son.ctx;
  }

  function bip(freq, duree, type, vol) {
    if (son.muet) return;
    var c = ctxSon();
    if (!c) return;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(vol || 0.07, c.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (duree || 0.12));
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + (duree || 0.12) + 0.03);
  }

  function arpege(freqs) {
    freqs.forEach(function (f, i) {
      setTimeout(function () { bip(f, 0.13, 'square', 0.055); }, i * 62);
    });
  }

  /* ------------------------------ musique ------------------------------ */
  /* Une petite boucle 8 bit, deux voix très douces (carré pour l’arpège,
     triangle pour la basse), programmée d’avance pour ne pas dépendre du
     minuteur. Quatre accords : do, sol, la mineur, fa. */
  var MUSIQUE = { voulue: false, actif: false, timer: 0, pas: 0, prochain: 0, gain: null, ancre: null };

  var MELODIE = [
    72, 76, 79, 76, 79, 76, 72, 67, /* do */
    71, 74, 79, 74, 79, 74, 71, 67, /* sol */
    69, 72, 76, 72, 76, 72, 69, 64, /* la mineur */
    69, 72, 77, 72, 77, 72, 69, 65  /* fa */
  ];
  var BASSE = [48, 55, 43, 50, 45, 52, 41, 48];
  var PAS_MUSIQUE = 60 / 138 / 2; /* une croche à 138 bpm */

  function frequence(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function noteMusique(n, t, duree, vol, type) {
    var c = ctxSon();
    if (!c) return;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(frequence(n), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g);
    g.connect(MUSIQUE.gain || c.destination);
    o.start(t);
    o.stop(t + duree + 0.03);
  }

  function planifierMusique() {
    var c = ctxSon();
    if (!c) return;
    if (MUSIQUE.ancre && !document.body.contains(MUSIQUE.ancre)) { arreterMusique(); return; }
    while (MUSIQUE.prochain < c.currentTime + 0.2) {
      var i = MUSIQUE.pas % MELODIE.length;
      var t = MUSIQUE.prochain;
      noteMusique(MELODIE[i], t, PAS_MUSIQUE * 1.55, 0.05);
      if (i % 2 === 0) noteMusique(BASSE[(MUSIQUE.pas / 2) % BASSE.length], t, PAS_MUSIQUE * 1.5, 0.055, 'triangle');
      MUSIQUE.prochain += PAS_MUSIQUE;
      MUSIQUE.pas++;
    }
  }

  function lancerMusique(ancre) {
    MUSIQUE.voulue = true;
    if (ancre) MUSIQUE.ancre = ancre;
    if (son.muet || MUSIQUE.actif) return;
    var c = ctxSon();
    if (!c) return;
    if (!MUSIQUE.gain) {
      MUSIQUE.gain = c.createGain();
      MUSIQUE.gain.gain.value = 0.55;
      MUSIQUE.gain.connect(c.destination);
    }
    MUSIQUE.actif = true;
    MUSIQUE.prochain = c.currentTime + 0.14;
    planifierMusique();
    MUSIQUE.timer = setInterval(planifierMusique, 40);
  }

  /* coupe les prochaines notes sans oublier qu’elle doit revenir */
  function suspendreMusique() {
    MUSIQUE.actif = false;
    if (MUSIQUE.timer) { clearInterval(MUSIQUE.timer); MUSIQUE.timer = 0; }
  }

  function arreterMusique() {
    MUSIQUE.voulue = false;
    suspendreMusique();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) suspendreMusique();
    else if (MUSIQUE.voulue && !son.muet) lancerMusique();
  });

  /* ------------------------------ chrome ------------------------------ */
  function boutonSon() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'jeu-son';
    function maj() {
      b.textContent = son.muet ? 'Son : coupé' : 'Son : activé';
      b.setAttribute('aria-pressed', String(!son.muet));
    }
    b.addEventListener('click', function () {
      son.muet = !son.muet;
      maj();
      if (son.muet) suspendreMusique();
      else {
        bip(740, 0.1, 'square', 0.05);
        if (MUSIQUE.voulue) lancerMusique();
      }
    });
    maj();
    return b;
  }

  function cadre(racine, titre, sousTitre, aide) {
    var wrap = document.createElement('div');
    wrap.className = 'jeu';
    wrap.innerHTML =
      '<div class="jeu-tete">' +
        '<div class="jeu-intro">' +
          '<h4 class="jeu-titre">' + titre + '</h4>' +
          '<p class="jeu-sous">' + sousTitre + '</p>' +
        '</div>' +
        '<div class="jeu-hud"></div>' +
      '</div>' +
      '<div class="jeu-scene"></div>' +
      '<p class="jeu-aide">' + aide + '</p>';
    racine.appendChild(wrap);
    var hud = wrap.querySelector('.jeu-hud');
    hud.appendChild(boutonSon());
    return {
      wrap: wrap,
      scene: wrap.querySelector('.jeu-scene'),
      hud: hud,
      aide: wrap.querySelector('.jeu-aide')
    };
  }

  function jauge(hud, nb) {
    var d = document.createElement('div');
    d.className = 'jeu-infos';
    var html = '';
    for (var i = 0; i < nb; i++) html += '<span></span>';
    d.innerHTML = html;
    hud.insertBefore(d, hud.firstChild);
    var cells = d.querySelectorAll('span');
    return function (valeurs) {
      for (var i = 0; i < cells.length; i++) cells[i].textContent = valeurs[i] == null ? '' : valeurs[i];
    };
  }

  function voile(scene, titre, texte, action, surClic) {
    var v = document.createElement('div');
    v.className = 'jeu-voile';
    v.innerHTML =
      '<div class="jeu-voile-boite">' +
        '<h5>' + titre + '</h5>' +
        '<p>' + texte + '</p>' +
        '<button type="button" class="jeu-bouton">' + action + '</button>' +
      '</div>';
    scene.appendChild(v);
    v.querySelector('button').addEventListener('click', function () {
      v.remove();
      surClic();
    });
    return v;
  }

  /* ==================================================================
     JEU 1 — LE RAYON PERDU (ordinateur, ZQSD)
     ================================================================== */
  function jeuRayon(racine) {
    var ui = cadre(
      racine,
      'Le rayon perdu',
      'Pixel RPG · trouver les coffres, puis la porte',
      'ZQSD ou flèches pour marcher, ou clic sur une case : le personnage s’y rend seul, à la manière d’un Habbo. E ou Entrée ouvre un coffre quand tu es devant, A ou Maj droite frappe avec la côte. Trois cœurs, un demi-cœur perdu par contact. La porte s’ouvre une fois tout trouvé.'
    );

    var canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 384;
    canvas.className = 'jeu-canvas';
    ui.scene.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var T = 32;
    var TX = canvas.width / T;
    var TY = canvas.height / T;

    var A = window.JeuxAssets;
    var NIVEAUX = A.niveaux;

    var etat = null;
    var cles = {};
    var dernier = 0;
    var enCours = false;

    var infos = jauge(ui.hud, 3);

    function chargerPlan(plan) {
      var grille = [];
      for (var y = 0; y < TY; y++) {
        var ligne = (plan[y] || '').padEnd(TX, '#').slice(0, TX);
        grille.push(ligne);
      }
      return grille;
    }

    function nouveauNiveau(i) {
      var cfg = NIVEAUX[i];
      var grille = chargerPlan(cfg.plan);
      var coffres = [];
      var porte = null;
      var joueur = { x: 2, y: 2 };

      for (var y = 0; y < TY; y++) {
        for (var x = 0; x < TX; x++) {
          var c = grille[y][x];
          if (c === 'C') coffres.push({ x: x, y: y, ouvert: false });
          else if (c === 'D') porte = { x: x, y: y };
          else if (c === 'P') joueur = { x: x, y: y };
        }
      }

      var memo = etat ? { coeurs: etat.coeurs, epee: etat.epee } : { coeurs: 6, epee: false };

      etat = {
        niveau: i,
        nom: cfg.nom,
        grille: grille,
        coffres: coffres,
        porte: porte,
        joueur: { x: joueur.x * T + T / 2, y: joueur.y * T + T / 2, dir: 'bas', pas: 0 },
        chemin: [],
        temps: i === 0 ? 100 : 0,
        total: 100,
        trouves: 0,
        tresor: 0,
        message: '',
        messageT: 0,
        objet: null,
        transition: 0,
        fin: null,
        coeurs: memo.coeurs,
        epee: memo.epee,
        invuln: 0,
        coup: 0,
        recharge: 0,
        coffreArme: coffres.length ? coffres.length - 1 : -1,
        blobs: placerBlobs(grille, joueur, 1 + i)
      };
    }

    /* --------------------------- blobs et cœurs --------------------------- */
    function placerBlobs(grille, joueur, n) {
      var libres = [];
      for (var y = 1; y < TY - 1; y++) {
        for (var x = 1; x < TX - 1; x++) {
          if (grille[y][x] !== '.') continue;
          if (Math.abs(x - joueur.x) + Math.abs(y - joueur.y) < 6) continue;
          libres.push({ x: x, y: y });
        }
      }
      var blobs = [];
      var pas = libres.length / n;
      for (var i = 0; i < n && libres.length; i++) {
        var t = libres[Math.min(libres.length - 1, Math.floor(i * pas + pas / 2))];
        blobs.push({ x: t.x * T + T / 2, y: t.y * T + T / 2, phase: i * 1.7, mort: false, t: 0 });
      }
      return blobs;
    }

    function blobBloque(x, y) {
      return solide(x - 7, y - 6) || solide(x + 7, y - 6) || solide(x - 7, y + 6) || solide(x + 7, y + 6);
    }

    function majBlobs(dt) {
      var j = etat.joueur;
      etat.blobs.forEach(function (b) {
        if (b.mort) { b.t -= dt; return; }
        b.phase += dt * 5;
        var dx = j.x - b.x;
        var dy = j.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d > 18) {
          var v = 30;
          var nx = b.x + (dx / d) * v * dt;
          var ny = b.y + (dy / d) * v * dt;
          if (!blobBloque(nx, b.y)) b.x = nx;
          if (!blobBloque(b.x, ny)) b.y = ny;
        }
        if (d < 22) degat();
      });
    }

    function degat() {
      if (!etat || etat.fin || etat.invuln > 0) return;
      etat.coeurs = Math.max(0, etat.coeurs - 1);
      etat.invuln = 1.2;
      bip(140, 0.2, 'sawtooth', 0.08);
      if (etat.coeurs <= 0) {
        enCours = false;
        etat.fin = 'perdu';
        finDePartie(false, 'Les blobs ont eu raison de tes trois cœurs.');
      }
    }

    function frapper() {
      if (!etat || etat.fin || etat.transition) return;
      if (!etat.epee) {
        etat.message = 'Mains nues : trouve la côte de Bobby l’hybride.';
        etat.messageT = 1.8;
        return;
      }
      if (etat.recharge > 0) return;
      etat.recharge = 0.42;
      etat.coup = 0.22;
      bip(540, 0.06, 'square', 0.045);

      var j = etat.joueur;
      var dx = j.dir === 'gauche' ? -1 : j.dir === 'droite' ? 1 : 0;
      var dy = j.dir === 'haut' ? -1 : j.dir === 'bas' ? 1 : 0;
      if (!dx && !dy) dx = 1;
      var cx = j.x + dx * 26;
      var cy = j.y + dy * 26;

      etat.blobs.forEach(function (b) {
        if (b.mort) return;
        var ex = b.x - cx;
        var ey = b.y - cy;
        if (Math.sqrt(ex * ex + ey * ey) < 34) {
          b.mort = true;
          b.t = 0.28;
          bip(280, 0.1, 'triangle', 0.055);
        }
      });
    }

    function tempsRestant() {
      return etat.total - (performance.now() - etat.debut) / 1000;
    }

    function demarrer() {
      etat = null;
      nouveauNiveau(0);
      etat.debut = performance.now();
      etat.total = 110;
      etat.trouves = 0;
      etat.tresor = 0;
      enCours = true;
      dernier = performance.now();
      requestAnimationFrame(boucle);
      arpege([523, 659, 784]);
      lancerMusique(canvas);
    }

    function solide(x, y) {
      var cx = Math.floor(x / T);
      var cy = Math.floor(y / T);
      if (cx < 0 || cy < 0 || cx >= TX || cy >= TY) return true;
      return etat.grille[cy][cx] === '#';
    }

    function collision(x, y) {
      var dx = 9;
      var dy = 12;
      return solide(x - dx, y - dy) || solide(x + dx, y - dy) || solide(x - dx, y + dy) || solide(x + dx, y + dy);
    }

    /* ---------------- déplacement au clic, à la manière d’un Habbo ---------------- */
    function marchable(x, y) {
      return x >= 0 && y >= 0 && x < TX && y < TY && etat.grille[y][x] !== '#';
    }

    /* un coffre ne se piétine pas : on vise la case libre la plus proche de lui */
    function caseArrivee(cx, cy) {
      if (!marchable(cx, cy)) return null;
      if (etat.grille[cy][cx] !== 'C') return { x: cx, y: cy };
      var j = etat.joueur;
      var px = Math.floor(j.x / T);
      var py = Math.floor(j.y / T);
      var cotes = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      var meilleur = null;
      var dmin = 1e9;
      for (var i = 0; i < cotes.length; i++) {
        var nx = cx + cotes[i][0];
        var ny = cy + cotes[i][1];
        if (!marchable(nx, ny)) continue;
        var dd = Math.abs(nx - px) + Math.abs(ny - py);
        if (dd < dmin) { dmin = dd; meilleur = { x: nx, y: ny }; }
      }
      return meilleur;
    }

    /* parcours en largeur sur la grille, quatre voisins, le plus court chemin */
    function cheminVers(cx, cy) {
      var j = etat.joueur;
      var sx = Math.max(0, Math.min(TX - 1, Math.floor(j.x / T)));
      var sy = Math.max(0, Math.min(TY - 1, Math.floor(j.y / T)));
      var chemin = [];

      /* le personnage se recale d’abord sur le centre de sa tuile */
      var centre = { x: sx * T + T / 2, y: sy * T + T / 2 };
      if (Math.abs(j.x - centre.x) > 1 || Math.abs(j.y - centre.y) > 1) chemin.push(centre);
      if (sx === cx && sy === cy) return chemin;

      var vus = new Uint8Array(TX * TY);
      var avant = new Int16Array(TX * TY);
      var depart = sy * TX + sx;
      var arrive = cy * TX + cx;
      var file = [depart];
      vus[depart] = 1;
      avant[depart] = -1;
      var cotes = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      var trouve = false;

      for (var tete = 0; tete < file.length; tete++) {
        var c = file[tete];
        if (c === arrive) { trouve = true; break; }
        var x = c % TX;
        var y = (c - x) / TX;
        for (var k = 0; k < 4; k++) {
          var nx = x + cotes[k][0];
          var ny = y + cotes[k][1];
          if (!marchable(nx, ny)) continue;
          var n = ny * TX + nx;
          if (vus[n]) continue;
          vus[n] = 1;
          avant[n] = c;
          file.push(n);
        }
      }
      if (!trouve) return null;

      var suite = [];
      for (var p = arrive; p !== -1 && p !== depart; p = avant[p]) {
        var px2 = p % TX;
        suite.push({ x: px2 * T + T / 2, y: ((p - px2) / TX) * T + T / 2 });
      }
      suite.reverse();
      return chemin.concat(suite);
    }

    function marcherChemin(dt) {
      var j = etat.joueur;
      var reste = 118 * dt;
      var avance = 0;
      while (reste > 0 && etat.chemin.length) {
        var p = etat.chemin[0];
        var dx = p.x - j.x;
        var dy = p.y - j.y;
        var d = Math.abs(dx) + Math.abs(dy);
        if (d <= reste) {
          j.x = p.x;
          j.y = p.y;
          avance += d;
          reste -= d;
          etat.chemin.shift();
          continue;
        }
        var ux = 0;
        var uy = 0;
        if (Math.abs(dx) >= Math.abs(dy)) ux = dx > 0 ? 1 : -1;
        else uy = dy > 0 ? 1 : -1;
        if (collision(j.x + ux * reste, j.y + uy * reste)) { etat.chemin.length = 0; break; }
        j.x += ux * reste;
        j.y += uy * reste;
        if (ux < 0) j.dir = 'gauche';
        else if (ux > 0) j.dir = 'droite';
        else if (uy < 0) j.dir = 'haut';
        else if (uy > 0) j.dir = 'bas';
        avance += reste;
        reste = 0;
      }
      if (avance > 0) j.pas += dt * 9;
    }

    function deplacer(dt) {
      var j = etat.joueur;
      var vx = 0;
      var vy = 0;
      var v = 118;
      if (cles.KeyA || cles.ArrowLeft) vx -= 1;
      if (cles.KeyD || cles.ArrowRight) vx += 1;
      if (cles.KeyW || cles.ArrowUp) vy -= 1;
      if (cles.KeyS || cles.ArrowDown) vy += 1;

      /* le clavier reprend toujours la main sur un trajet demandé au clic */
      if (vx || vy) etat.chemin.length = 0;

      if (vx && vy) { vx *= 0.72; vy *= 0.72; }

      if (vx < 0) j.dir = 'gauche';
      else if (vx > 0) j.dir = 'droite';
      else if (vy < 0) j.dir = 'haut';
      else if (vy > 0) j.dir = 'bas';

      if (vx || vy) j.pas += dt * 9;

      var nx = j.x + vx * v * dt;
      if (!collision(nx, j.y)) j.x = nx;
      var ny = j.y + vy * v * dt;
      if (!collision(j.x, ny)) j.y = ny;

      if (!vx && !vy && etat.chemin.length) marcherChemin(dt);

      j.x = Math.max(10, Math.min(canvas.width - 10, j.x));
      j.y = Math.max(10, Math.min(canvas.height - 10, j.y));
    }

    function coffreProche() {
      if (!etat) return null;
      var j = etat.joueur;
      var meilleur = null;
      var dmin = 36;
      etat.coffres.forEach(function (c) {
        if (c.ouvert) return;
        var cx = c.x * T + T / 2;
        var cy = c.y * T + T / 2;
        var d = Math.max(Math.abs(j.x - cx), Math.abs(j.y - cy));
        if (d < dmin) { dmin = d; meilleur = c; }
      });
      return meilleur;
    }

    function ouvrirProche() {
      var c = coffreProche();
      if (!c || !etat || etat.transition || etat.fin) return;
      c.ouvert = true;
      etat.trouves++;

      /* le coffre du fond du premier rayon cache la côte de Bobby */
      if (!etat.epee && c === etat.coffres[etat.coffreArme]) {
        etat.epee = true;
        etat.objet = { icone: A.cote, t: 0 };
        etat.message = 'La côte de Bobby l’hybride — A ou Maj droite pour frapper.';
        etat.messageT = 3.6;
        arpege([392, 523, 659]);
        return;
      }

      var tresor = A.tresors[etat.tresor % A.tresors.length];
      etat.tresor++;
      etat.objet = { icone: tresor.icone, t: 0 };
      etat.message = tresor.nom;
      etat.messageT = 2.8;
      bip(880, 0.09, 'square', 0.06);
      setTimeout(function () { bip(1174, 0.11, 'square', 0.05); }, 80);
    }

    function verifierPorte() {
      var j = etat.joueur;
      if (etat.porte && etat.trouves === etat.coffres.length) {
        var px = etat.porte.x * T + T / 2;
        var py = etat.porte.y * T + T / 2;
        if (Math.abs(j.x - px) < 20 && Math.abs(j.y - py) < 22 && !etat.transition) {
          etat.transition = 1;
          arpege([523, 784, 1046]);
          setTimeout(function () {
            if (etat.niveau + 1 < NIVEAUX.length) {
              var bonus = Math.max(0, tempsRestant());
              var tresor = etat.tresor;
              nouveauNiveau(etat.niveau + 1);
              etat.debut = performance.now();
              etat.total = 110 - (etat.niveau * 8) + bonus * 0.35;
              etat.tresor = tresor;
            } else {
              enCours = false;
              etat.fin = 'gagne';
              finDePartie(true);
            }
          }, 420);
        }
      }
    }

    function finDePartie(gagne, raison) {
      arreterMusique();
      var score = etat.tresor * 100 + Math.round(Math.max(0, tempsRestant())) * 5;
      voile(
        ui.scene,
        gagne ? 'Rayon terminé' : raison ? 'K.O.' : 'Temps écoulé',
        gagne
          ? 'Tu as trouvé ' + etat.tresor + ' trésors. Score : ' + score + '.'
          : raison || 'Tu as trouvé ' + etat.tresor + ' trésors avant la fermeture. Score : ' + score + '.',
        'Rejouer',
        demarrer
      );
    }

    /* ------------------------------ dessin ------------------------------ */
    function sol(y, x) {
      var c = etat.grille[y][x];
      return c === '#';
    }

    function dessiner() {
      if (!etat) return;
      var g = etat.grille;

      ctx.fillStyle = '#12100f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (var y = 0; y < TY; y++) {
        for (var x = 0; x < TX; x++) {
          var px = x * T;
          var py = y * T;
          if (sol(y, x)) {
            ctx.fillStyle = '#3b2c22';
            ctx.fillRect(px, py, T, T);
            ctx.fillStyle = '#6b4d38';
            ctx.fillRect(px, py, T, 7);
            ctx.fillStyle = '#2a1f19';
            ctx.fillRect(px, py + T - 5, T, 5);
          } else {
            ctx.fillStyle = (x + y) % 2 ? '#191512' : '#1d1815';
            ctx.fillRect(px, py, T, T);
            ctx.fillStyle = 'rgba(255,255,255,0.035)';
            ctx.fillRect(px + 4, py + 4, 2, 2);
          }
        }
      }

      /* case de destination d’un trajet au clic */
      if (etat.chemin.length) {
        var dest = etat.chemin[etat.chemin.length - 1];
        var mx = Math.floor(dest.x / T) * T;
        var my = Math.floor(dest.y / T) * T;
        var puls = 0.62 + 0.18 * Math.sin(performance.now() / 240);
        ctx.strokeStyle = 'rgba(255,0,255,' + puls.toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx + 1.5, my + 1.5, T - 3, T - 3);
      }

      /* porte, tirée des assets */
      if (etat.porte) {
        var ouverte = etat.trouves === etat.coffres.length;
        var dx = etat.porte.x * T + 1;
        var dy = etat.porte.y * T + 1;
        A.dessiner(ctx, ouverte ? A.porteOuverte : A.porteFermee, dx, dy, 3);
      }

      /* coffres */
      etat.coffres.forEach(function (c) {
        var cx = c.x * T + 1;
        var cy = c.y * T + 1;
        A.dessiner(ctx, c.ouvert ? A.coffreOuvert : A.coffreFerme, cx, cy, 3);
        if (!c.ouvert) {
          var pres = Math.abs(etat.joueur.x - (c.x * T + T / 2)) < 40 && Math.abs(etat.joueur.y - (c.y * T + T / 2)) < 40;
          if (pres) {
            ctx.fillStyle = 'rgba(244,246,208,0.55)';
            ctx.fillRect(cx + 16, cy + 2, 2, 2);
          }
        }
      });

      /* blobs */
      etat.blobs.forEach(function (b) {
        if (b.mort) return;
        var spr = Math.sin(b.phase) > 0 ? A.blobA : A.blobB;
        var bxx = Math.round(b.x - 15);
        var byy = Math.round(b.y - 12);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(bxx + 4, byy + 21, 22, 3);
        A.dessiner(ctx, spr, bxx, byy, 3);
      });

      /* joueur */
      var j = etat.joueur;
      var bob = Math.sin(j.pas) * 1.5;
      var bx = Math.round(j.x - 12);
      var by = Math.round(j.y - 16 + bob);

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(bx + 4, by + 30, 16, 3);

      ctx.globalAlpha = etat.invuln > 0 && Math.floor(etat.invuln * 12) % 2 === 0 ? 0.4 : 1;
      A.dessiner(ctx, A.joueur, bx, by, 2);
      ctx.globalAlpha = 1;

      /* la côte tenue en main, et le coup */
      if (etat.epee) {
        var dxd = j.dir === 'gauche' ? -1 : j.dir === 'droite' ? 1 : 0;
        var dyd = j.dir === 'haut' ? -1 : j.dir === 'bas' ? 1 : 0;
        if (!dxd && !dyd) dxd = 1;
        var base = Math.atan2(dyd, dxd);

        ctx.save();
        ctx.translate(j.x + dxd * 8, j.y - 4);
        ctx.rotate(base + (etat.coup > 0 ? -0.8 + (1 - etat.coup / 0.22) * 1.6 : 0.35));
        ctx.translate(10, -5);
        A.dessiner(ctx, A.cote, 0, 0, 1.4);
        ctx.restore();

        if (etat.coup > 0) {
          var prog = 1 - etat.coup / 0.22;
          for (var k = 0; k < 6; k++) {
            var a2 = base - 1.2 + prog * 1.6 + k * 0.16;
            ctx.globalAlpha = 0.9 - k * 0.11;
            ctx.fillStyle = k % 2 ? '#ff00ff' : '#e4f6d0';
            ctx.fillRect(Math.round(j.x + Math.cos(a2) * 30), Math.round(j.y + Math.sin(a2) * 30 - 4), 3, 3);
          }
          ctx.globalAlpha = 1;
        }
      }

      /* invite d’ouverture, au-dessus du coffre le plus proche */
      var proche = coffreProche();
      if (proche) {
        var tx = proche.x * T + T / 2;
        var ty = proche.y * T - 4;
        var txt = 'E  OUVRIR';
        ctx.font = '8px "Archivo Black", sans-serif';
        ctx.textBaseline = 'middle';
        var larg = Math.max(48, ctx.measureText(txt).width + 16);
        var bbx = Math.round(tx - larg / 2);
        var bby = Math.round(ty - 18);
        ctx.fillStyle = 'rgba(11,11,12,0.93)';
        ctx.fillRect(bbx, bby, Math.round(larg), 15);
        ctx.strokeStyle = '#e4f6d0';
        ctx.lineWidth = 1;
        ctx.strokeRect(bbx + 0.5, bby + 0.5, Math.round(larg) - 1, 14);
        ctx.fillStyle = '#e4f6d0';
        ctx.fillText(txt, bbx + 8, bby + 8);
        ctx.beginPath();
        ctx.moveTo(tx - 4, bby + 15);
        ctx.lineTo(tx + 4, bby + 15);
        ctx.lineTo(tx, bby + 20);
        ctx.closePath();
        ctx.fill();
      }

      /* objet trouvé, en grand au premier plan */
      if (etat.objet) {
        var o = etat.objet;
        var apparait = Math.min(1, o.t / 0.25);
        var sortie = o.t > 3.5 ? Math.max(0, (4.3 - o.t) / 0.8) : 1;
        var alpha = apparait * sortie;
        var Iw = o.icone[0].length;
        var Ih = o.icone.length;
        var E = Math.max(2, Math.floor(170 / Math.max(Iw, Ih)));
        var l = Math.max(Iw, Ih) * E + 56;
        var h = l;
        var x0 = Math.round((canvas.width - l) / 2);
        var y0 = Math.round((canvas.height - h) / 2);

        ctx.globalAlpha = 0.66 * alpha;
        ctx.fillStyle = '#0b0b0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#12100f';
        ctx.fillRect(x0, y0, l, h);
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, l - 1, h - 1);
        ctx.strokeStyle = 'rgba(255,0,255,0.5)';
        ctx.strokeRect(x0 + 4.5, y0 + 4.5, l - 9, h - 9);
        ctx.fillStyle = 'rgba(201,162,39,0.9)';
        ctx.fillRect(x0, y0, 10, 2);
        ctx.fillRect(x0, y0, 2, 10);
        ctx.fillRect(x0 + l - 10, y0 + h - 2, 10, 2);
        ctx.fillRect(x0 + l - 2, y0 + h - 10, 2, 10);

        A.dessiner(
          ctx,
          o.icone,
          x0 + Math.round((l - Iw * E) / 2),
          y0 + Math.round((h - Ih * E) / 2) + Math.round(Math.sin(o.t * 3.4) * 2),
          E
        );
        ctx.globalAlpha = 1;
      }

      /* cœurs, en haut à gauche */
      var pleins = etat.coeurs / 2;
      ctx.fillStyle = 'rgba(11,11,12,0.66)';
      ctx.fillRect(10, 8, 3 * 26 + 8, 26);
      for (var hi = 0; hi < 3; hi++) {
        var hx = 14 + hi * 26;
        var hy = 12;
        A.dessiner(ctx, A.coeurVide, hx, hy, 2.4);
        var part = Math.max(0, Math.min(1, pleins - hi));
        if (part > 0) {
          ctx.save();
          if (part < 1) {
            ctx.beginPath();
            ctx.rect(hx, hy, 8 * 2.4 * part, 7 * 2.4);
            ctx.clip();
          }
          A.dessiner(ctx, A.coeur, hx, hy, 2.4);
          ctx.restore();
        }
      }

      /* coffres du rayon : un par coffre, ouvert ou à ouvrir, en haut à droite */
      var nbCoffres = etat.coffres.length;
      var ech = 1.5;
      var icone = 10 * ech;
      var ecart = icone + 4;
      var largCompteur = nbCoffres * ecart + 46;
      var xCompteur = canvas.width - 10 - largCompteur;
      ctx.fillStyle = 'rgba(11,11,12,0.66)';
      ctx.fillRect(xCompteur, 8, largCompteur, 26);
      for (var ci = 0; ci < nbCoffres; ci++) {
        var cxi = xCompteur + 8 + ci * ecart;
        var cyi = 8 + (26 - icone) / 2;
        if (!etat.coffres[ci].ouvert) ctx.globalAlpha = 0.5;
        A.dessiner(ctx, etat.coffres[ci].ouvert ? A.coffreOuvert : A.coffreFerme, cxi, cyi, ech);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = etat.trouves === nbCoffres ? '#ff00ff' : '#e4f6d0';
      ctx.font = '8px "Archivo Black", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(etat.trouves + '/' + nbCoffres, xCompteur + 8 + nbCoffres * ecart + 3, 21);

      /* message trésor */
      if (etat.messageT > 0) {
        var a = Math.min(1, etat.messageT);
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(11,11,12,0.88)';
        ctx.fillRect(12, canvas.height - 44, canvas.width - 24, 30);
        ctx.fillStyle = '#e4f6d0';
        ctx.font = '10px "Archivo Black", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('+ ' + etat.message, 24, canvas.height - 29);
        ctx.globalAlpha = 1;
      }
    }

    function boucle(t) {
      if (!enCours) return;
      if (!document.body.contains(canvas)) return;
      var dt = Math.min(0.05, (t - dernier) / 1000 || 0);
      dernier = t;

      if (!etat.transition) {
        deplacer(dt);
        majBlobs(dt);
        verifierPorte();
      }

      etat.invuln = Math.max(0, etat.invuln - dt);
      etat.coup = Math.max(0, etat.coup - dt);
      etat.recharge = Math.max(0, etat.recharge - dt);

      etat.messageT = Math.max(0, etat.messageT - dt);
      if (etat.objet) {
        etat.objet.t += dt;
        if (etat.objet.t > 4.3) etat.objet = null;
      }
      var reste = Math.max(0, tempsRestant());
      infos([etat.nom, 'Coffres ' + etat.trouves + '/' + etat.coffres.length, fmt(reste)]);

      if (reste <= 0 && !etat.fin && !etat.transition) {
        enCours = false;
        etat.fin = 'perdu';
        finDePartie(false);
        return;
      }

      dessiner();
      requestAnimationFrame(boucle);
    }

    function fmt(s) {
      s = Math.max(0, Math.ceil(s));
      var m = Math.floor(s / 60);
      var r = s % 60;
      return m + ':' + (r < 10 ? '0' : '') + r;
    }

    function surTouche(e, bas) {
      if (!enCours) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) >= 0) {
        e.preventDefault();
        cles[e.code] = bas;
      }
    }

    document.addEventListener('keydown', function (e) {
      if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        if (enCours) {
          e.preventDefault();
          ouvrirProche();
        }
        return;
      }
      /* A (touche Q en AZERTY) et Maj droite pour frapper */
      if (e.code === 'KeyQ' || e.code === 'ShiftRight') {
        if (enCours) {
          e.preventDefault();
          frapper();
        }
        return;
      }
      surTouche(e, true);
    });
    document.addEventListener('keyup', function (e) { surTouche(e, false); });

    /* clic sur le plateau : le personnage rejoint la case, chemin en largeur */
    canvas.addEventListener('pointerdown', function (e) {
      if (!enCours || !etat || etat.fin || etat.transition) return;
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var cx = Math.floor((e.clientX - r.left) / r.width * TX);
      var cy = Math.floor((e.clientY - r.top) / r.height * TY);
      if (cx < 0 || cy < 0 || cx >= TX || cy >= TY) return;
      var arrivee = caseArrivee(cx, cy);
      if (!arrivee) return;
      var chemin = cheminVers(arrivee.x, arrivee.y);
      if (!chemin || !chemin.length) return;
      etat.chemin = chemin;
      e.preventDefault();
    });

    nouveauNiveau(0);
    dessiner();
    voile(
      ui.scene,
      'Le rayon perdu',
      'Trouve les coffres des trois rayons et ouvre-les avec E ou Entrée. L’un d’eux cache la côte de Bobby l’hybride : elle sert d’épée. Trois cœurs, des blobs partout, et le temps qui file.',
      'Entrer dans le rayon',
      demarrer
    );

    carnetConception(racine);
  }

  /* ---------------- carnet de conception, sous la fenêtre ---------------- */
  function carteMini(plan, echelle) {
    var A = window.JeuxAssets;
    var L = plan[0].length;
    var H = plan.length;
    var c = document.createElement('canvas');
    c.width = L * echelle;
    c.height = H * echelle;
    var g = c.getContext('2d');
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < L; x++) {
        var ch = plan[y].charAt(x);
        g.fillStyle = ch === '#' ? A.tuiles.mur : ((x + y) % 2 ? A.tuiles.solA : A.tuiles.solB);
        g.fillRect(x * echelle, y * echelle, echelle, echelle);
        if (ch === 'C') {
          g.fillStyle = '#c9a227';
          g.fillRect(x * echelle + 2, y * echelle + 2, echelle - 4, echelle - 4);
        } else if (ch === 'D') {
          g.fillStyle = '#ff00ff';
          g.fillRect(x * echelle + 2, y * echelle + 2, echelle - 4, echelle - 4);
        } else if (ch === 'P') {
          g.fillStyle = '#e8801f';
          g.fillRect(x * echelle + 2, y * echelle + 2, echelle - 4, echelle - 4);
        }
      }
    }
    return c;
  }

  function carnetConception(racine) {
    var A = window.JeuxAssets;
    if (!A) return;

    var s = document.createElement('section');
    s.className = 'gd';
    s.innerHTML =
      '<header class="gd-tete">' +
        '<p class="gd-kicker">Carnet de conception</p>' +
        '<h4 class="gd-titre">Le rayon perdu, du croquis au pixel</h4>' +
        '<p class="gd-intro">Le jeu tient dans une grille de tuiles de 32 pixels et une seule feuille d’assets : un personnage de 12 × 16, deux états de coffre, une porte, dix objets de 20 × 20, la côte de Bobby l’hybride, deux frames de blob et trois cœurs. Ce sont exactement les mêmes dessins qui servent dans le jeu et sur cette planche.</p>' +
      '</header>' +
      '<div class="gd-planches"></div>' +
      '<div class="gd-bloc">' +
        '<h5 class="gd-sous-titre">Les dix trésors</h5>' +
        '<ul class="gd-objets"></ul>' +
      '</div>' +
      '<div class="gd-deux">' +
        '<div class="gd-bloc">' +
          '<h5 class="gd-sous-titre">Palette</h5>' +
          '<ul class="gd-palette"></ul>' +
        '</div>' +
        '<div class="gd-bloc">' +
          '<h5 class="gd-sous-titre">Les trois rayons</h5>' +
          '<div class="gd-cartes"></div>' +
        '</div>' +
      '</div>' +
      '<div class="gd-bloc">' +
        '<h5 class="gd-sous-titre">Règles</h5>' +
        '<ul class="gd-regles">' +
          '<li>Se déplacer aux ZQSD ou aux flèches, sans grille : la collision se fait tuile par tuile. Un clic sur une case trace le plus court chemin et le personnage le suit seul ; n’importe quelle touche de déplacement reprend la main.</li>' +
          '<li>E ou Entrée ouvre le coffre devant lequel on s’arrête ; rien ne s’ouvre au simple contact.</li>' +
          '<li>Chaque coffre dévoile un objet, gagne du temps et s’affiche au-dessus de la tête.</li>' +
          '<li>La porte du fond reste close tant qu’un coffre du rayon est fermé.</li>' +
          '<li>Un coffre du premier rayon contient la côte de Bobby l’hybride : une fois en main, A ou Maj droite frappe devant soi.</li>' + '<li>Les blobs rôdent dans les rayons, un de plus à chaque niveau ; un coup de côte les fait éclater.</li>' + '<li>Trois cœurs, qui se vident d’un demi-cœur à chaque contact, avec une seconde d’invulnérabilité pour se dégager.</li>' + '<li>Trois rayons enchaînés, de quatre à cinq coffres, pour une traversée d’une à deux minutes.</li>' +
        '</ul>' +
      '</div>';

    racine.appendChild(s);

    /* planches de sprites */
    var planches = [
      { sprite: A.joueur, nom: 'Personnage', note: '12 × 16 px · ×2' },
      { sprite: A.coffreFerme, nom: 'Coffre fermé', note: '10 × 10 px · ×3' },
      { sprite: A.coffreOuvert, nom: 'Coffre ouvert', note: '10 × 10 px · ×3' },
      { sprite: A.porteFermee, nom: 'Porte close', note: '10 × 10 px · ×3' },
      { sprite: A.porteOuverte, nom: 'Porte ouverte', note: '10 × 10 px · ×3' },
      { sprite: A.cote, nom: 'Côte de Bobby', note: '12 × 10 px · ×1,4' },
      { sprite: A.blobA, nom: 'Blob', note: '10 × 8 px · ×3' },
      { sprite: A.coeur, nom: 'Cœur', note: '8 × 7 px · ×2,4' },
      { sprite: A.tresors[0].icone, nom: 'Objet', note: '20 × 20 px · ×7' }
    ];

    var zonePlanches = s.querySelector('.gd-planches');
    planches.forEach(function (p) {
      var f = document.createElement('figure');
      f.className = 'gd-planche';
      f.appendChild(A.vignette(p.sprite, 7, '#141117'));
      var leg = document.createElement('figcaption');
      leg.innerHTML = '<strong>' + p.nom + '</strong><span>' + p.note + '</span>';
      f.appendChild(leg);
      zonePlanches.appendChild(f);
    });

    /* les objets */
    var zoneObjets = s.querySelector('.gd-objets');
    A.tresors.forEach(function (t) {
      var li = document.createElement('li');
      var boite = document.createElement('span');
      boite.className = 'gd-objet-vue';
      boite.appendChild(A.vignette(t.icone, 4, '#141117'));
      var nom = document.createElement('span');
      nom.className = 'gd-objet-nom';
      nom.textContent = t.nom;
      li.appendChild(boite);
      li.appendChild(nom);
      zoneObjets.appendChild(li);
    });

    /* palette */
    var zonePalette = s.querySelector('.gd-palette');
    A.couleurs.forEach(function (c) {
      var li = document.createElement('li');
      li.innerHTML = '<i style="background:' + c.valeur + '"></i>' +
        '<span class="gd-palette-nom">' + c.nom + '</span>' +
        '<span class="gd-palette-hex">' + c.valeur.toUpperCase() + '</span>';
      zonePalette.appendChild(li);
    });

    /* cartes des rayons */
    var zoneCartes = s.querySelector('.gd-cartes');
    A.niveaux.forEach(function (n, i) {
      var f = document.createElement('figure');
      f.className = 'gd-carte';
      f.appendChild(carteMini(n.plan, 9));
      var leg = document.createElement('figcaption');
      var coffres = n.plan.join('').split('C').length - 1;
      leg.innerHTML = '<strong>' + n.nom + '</strong><span>' + coffres + ' coffres</span>';
      f.appendChild(leg);
      zoneCartes.appendChild(f);
    });
  }

  /* ==================================================================
     JEU 2 — CADRAGE (mobile, gyroscope)
     ================================================================== */
  function jeuCadrage(racine) {
    var ui = cadre(
      racine,
      'Cadrage',
      'Viseur photo · le téléphone devient l’appareil',
      'Incline l’appareil pour balayer la scène et garder le sujet dans le viseur. Sans gyroscope, glisse le doigt pour viser.'
    );

    var canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 560;
    canvas.className = 'jeu-canvas';
    ui.scene.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var MONDE_L = 1500;
    var MONDE_H = 900;
    var VUE_L = canvas.width;
    var VUE_H = canvas.height;

    var etat = {
      niveau: 0,
      sujet: 0,
      sujetsParNiveau: 3,
      camX: (MONDE_L - VUE_L) / 2,
      camY: (MONDE_H - VUE_H) / 2,
      cibleX: (MONDE_L - VUE_L) / 2,
      cibleY: (MONDE_H - VUE_H) / 2,
      jauge: 0,
      flash: 0,
      fin: null,
      gyro: false,
      drag: false,
      sujets: [
        { x: 420, y: 320, vx: 34, vy: 22, r: 12, nom: 'l’oiseau de nuit' },
        { x: 980, y: 520, vx: -42, vy: 30, r: 11, nom: 'la silhouette' },
        { x: 700, y: 240, vx: 28, vy: -26, r: 10, nom: 'le feu follet' }
      ]
    };

    var base = null;
    var enCours = false;
    var dernier = 0;

    var infos = jauge(ui.hud, 3);

    function dimensiook() {
      return {
        w: Math.round(VUE_L * (etat.niveau === 0 ? 0.62 : etat.niveau === 1 ? 0.52 : 0.44)),
        h: Math.round(VUE_H * (etat.niveau === 0 ? 0.5 : etat.niveau === 1 ? 0.42 : 0.36))
      };
    }

    function cadreViseur() {
      var d = dimensiook();
      return { x: (VUE_L - d.w) / 2, y: (VUE_H - d.h) / 2, w: d.w, h: d.h };
    }

    function sujetCourant() {
      return etat.sujets[etat.sujet % etat.sujets.length];
    }

    function nouveauSujet() {
      var s = sujetCourant();
      var vitesse = 30 + etat.niveau * 26;
      s.x = 220 + Math.random() * (MONDE_L - 440);
      s.y = 200 + Math.random() * (MONDE_H - 400);
      s.vx = (Math.random() < 0.5 ? -1 : 1) * (vitesse * (0.7 + Math.random() * 0.6));
      s.vy = (Math.random() < 0.5 ? -1 : 1) * (vitesse * (0.6 + Math.random() * 0.7));
      etat.jauge = 0;
    }

    function demarrer() {
      etat.niveau = 0;
      etat.sujet = 0;
      etat.jauge = 0;
      etat.fin = null;
      etat.flash = 0;
      etat.camX = etat.cibleX = (MONDE_L - VUE_L) / 2;
      etat.camY = etat.cibleY = (MONDE_H - VUE_H) / 2;
      nouveauSujet();
      enCours = true;
      dernier = performance.now();
      arpege([523, 659, 784]);
      requestAnimationFrame(boucle);
    }

    /* ------------------------- gyroscope & glisser ------------------------- */
    function ecouterGyro() {
      window.addEventListener('deviceorientation', function (e) {
        if (e.gamma == null && e.beta == null) return;
        etat.gyro = true;
        if (!base) base = { g: e.gamma || 0, b: e.beta || 0 };
        var gx = (e.gamma || 0) - base.g;
        var gy = (e.beta || 0) - base.b;
        var cx = (MONDE_L - VUE_L) / 2 + gx * 16;
        var cy = (MONDE_H - VUE_H) / 2 + (gy - (gy > 25 ? 25 : 0)) * 9;
        etat.cibleX = Math.max(0, Math.min(MONDE_L - VUE_L, cx));
        etat.cibleY = Math.max(0, Math.min(MONDE_H - VUE_H, cy));
      }, true);
    }

    function ecouterGlisser() {
      var actif = false;
      var px = 0;
      var py = 0;
      canvas.addEventListener('pointerdown', function (e) {
        actif = true;
        px = e.clientX;
        py = e.clientY;
        canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!actif) return;
        var k = 2.2;
        etat.cibleX = Math.max(0, Math.min(MONDE_L - VUE_L, etat.cibleX - (e.clientX - px) * k));
        etat.cibleY = Math.max(0, Math.min(MONDE_H - VUE_H, etat.cibleY - (e.clientY - py) * k));
        px = e.clientX;
        py = e.clientY;
      });
      canvas.addEventListener('pointerup', function () { actif = false; });
      canvas.addEventListener('pointercancel', function () { actif = false; });
    }

    /* ------------------------------ dessin ------------------------------ */
    function dessinerDecor() {
      var g = ctx.createLinearGradient(0, 0, 0, VUE_H);
      g.addColorStop(0, '#241a20');
      g.addColorStop(0.55, '#4a3239');
      g.addColorStop(1, '#1b1416');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VUE_L, VUE_H);

      /* collines lointaines, parallaxe douce */
      ctx.fillStyle = '#3a2b31';
      for (var i = 0; i < 7; i++) {
        var bx = ((i * 260 - etat.camX * 0.35) % (MONDE_L * 0.8)) - 120;
        var h = 120 + ((i * 47) % 90);
        ctx.beginPath();
        ctx.moveTo(bx, VUE_H);
        ctx.quadraticCurveTo(bx + 130, VUE_H - h * 1.6, bx + 280, VUE_H);
        ctx.fill();
      }

      /* silhouettes proches */
      ctx.fillStyle = '#1d1618';
      for (var k = 0; k < 9; k++) {
        var x = ((k * 190 - etat.camX * 0.75) % (MONDE_L * 0.9)) - 80;
        var y = VUE_H - 60 - ((k * 37) % 90);
        ctx.fillRect(x, y, 14, 120);
        ctx.beginPath();
        ctx.arc(x + 7, y - 6, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      /* halo de lune */
      var mx = 300 - etat.camX * 0.12;
      var my = 90 - etat.camY * 0.1;
      var halo = ctx.createRadialGradient(mx, my, 4, mx, my, 90);
      halo.addColorStop(0, 'rgba(228,246,208,0.55)');
      halo.addColorStop(1, 'rgba(228,246,208,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, VUE_L, VUE_H);
      ctx.fillStyle = '#e4f6d0';
      ctx.beginPath();
      ctx.arc(mx, my, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    function dessinerSujet() {
      var s = sujetCourant();
      var sx = s.x - etat.camX;
      var sy = s.y - etat.camY;

      var halo = ctx.createRadialGradient(sx, sy, 2, sx, sy, s.r * 3.4);
      halo.addColorStop(0, 'rgba(255,0,255,0.55)');
      halo.addColorStop(1, 'rgba(255,0,255,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r * 3.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff7e6';
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r + 7, 0, Math.PI * 2);
      ctx.stroke();

      var c = cadreViseur();
      var dedans = sx > c.x && sx < c.x + c.w && sy > c.y && sy < c.y + c.h;

      if (dedans) {
        ctx.strokeStyle = '#e4f6d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r + 14, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        /* flèche vers le sujet quand il sort du cadre */
        var cx = c.x + c.w / 2;
        var cy = c.y + c.h / 2;
        var a = Math.atan2(sy - cy, sx - cx);
        var ex = cx + Math.cos(a) * (c.w / 2 - 6);
        var ey = cy + Math.sin(a) * (c.h / 2 - 6);
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(a);
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, 7);
        ctx.lineTo(-6, -7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    function dessinerViseur() {
      var c = cadreViseur();
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.rect(0, 0, VUE_L, VUE_H);
      ctx.rect(c.x, c.y, c.w, c.h);
      ctx.fill('evenodd');

      ctx.strokeStyle = 'rgba(244,244,244,0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);

      /* repères des tiers */
      ctx.strokeStyle = 'rgba(244,244,244,0.22)';
      ctx.lineWidth = 1;
      [1, 2].forEach(function (i) {
        var x = c.x + (c.w / 3) * i;
        var y = c.y + (c.h / 3) * i;
        ctx.beginPath();
        ctx.moveTo(x, c.y);
        ctx.lineTo(x, c.y + c.h);
        ctx.moveTo(c.x, y);
        ctx.lineTo(c.x + c.w, y);
        ctx.stroke();
      });

      /* coins épais */
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 4;
      var L = 18;
      [[c.x, c.y, 1, 1], [c.x + c.w, c.y, -1, 1], [c.x, c.y + c.h, 1, -1], [c.x + c.w, c.y + c.h, -1, -1]].forEach(function (p) {
        ctx.beginPath();
        ctx.moveTo(p[0] + p[2] * L, p[1]);
        ctx.lineTo(p[0], p[1]);
        ctx.lineTo(p[0], p[1] + p[3] * L);
        ctx.stroke();
      });

      /* jauge de netteté */
      var w = VUE_L - 60;
      ctx.fillStyle = 'rgba(244,244,244,0.18)';
      ctx.fillRect(30, VUE_H - 34, w, 6);
      ctx.fillStyle = etat.jauge > 0.99 ? '#e4f6d0' : '#ff00ff';
      ctx.fillRect(30, VUE_H - 34, w * Math.min(1, etat.jauge), 6);
      ctx.restore();

      /* flash */
      if (etat.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + (etat.flash * 0.8) + ')';
        ctx.fillRect(0, 0, VUE_L, VUE_H);
      }
    }

    function boucle(t) {
      if (!enCours) return;
      if (!document.body.contains(canvas)) return;
      var dt = Math.min(0.05, (t - dernier) / 1000 || 0);
      dernier = t;

      var s = sujetCourant();
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < 120 || s.x > MONDE_L - 120) s.vx *= -1;
      if (s.y < 120 || s.y > MONDE_H - 120) s.vy *= -1;

      etat.camX += (etat.cibleX - etat.camX) * Math.min(1, dt * 7);
      etat.camY += (etat.cibleY - etat.camY) * Math.min(1, dt * 7);

      var c = cadreViseur();
      var sx = s.x - etat.camX;
      var sy = s.y - etat.camY;
      var dedans = sx > c.x && sx < c.x + c.w && sy > c.y && sy < c.y + c.h;

      if (etat.flash > 0) etat.flash = Math.max(0, etat.flash - dt * 2.2);

      if (dedans) {
        etat.jauge += dt / 3.2;
      } else {
        etat.jauge = Math.max(0, etat.jauge - dt / 2.4);
      }

      if (etat.jauge >= 1) {
        bip(1046, 0.12, 'square', 0.07);
        etat.flash = 1;
        etat.sujet++;
        if (etat.sujet % etat.sujetsParNiveau === 0) {
          etat.niveau++;
          if (etat.niveau > 2) {
            enCours = false;
            etat.fin = 'gagne';
            voile(ui.scene, 'Série terminée', 'Trois niveaux, neuf clichés nets. Beau travail de viseur.', 'Recommencer', demarrer);
            return;
          }
          arpege([523, 659, 784, 1046]);
        }
        nouveauSujet();
      }

      var fait = etat.sujet % etat.sujetsParNiveau;
      infos(['Niveau ' + (etat.niveau + 1) + '/3', 'Clichés ' + fait + '/' + etat.sujetsParNiveau, Math.round(etat.jauge * 100) + ' %']);

      dessinerDecor();
      dessinerSujet();
      dessinerViseur();
      requestAnimationFrame(boucle);
    }

    /* -------------------------- mise en route -------------------------- */
    ecouterGyro();
    ecouterGlisser();
    dessinerDecor();
    dessinerViseur();

    var v = voile(
      ui.scene,
      'Cadrage',
      'Le téléphone devient l’appareil : incline-le pour balayer la scène et garde le sujet dans le viseur pendant trois secondes.',
      'Activer le gyroscope',
      function () {
        var lance = false;
        function lancer() {
          if (lance) return;
          lance = true;
          base = null;
          demarrer();
        }

        var D = window.DeviceOrientationEvent;
        if (D && typeof D.requestPermission === 'function') {
          try {
            D.requestPermission().then(lancer).catch(lancer);
          } catch (e) {
            lancer();
          }
          /* si la permission ne répond pas (bureau sans capteur), on joue quand même */
          setTimeout(lancer, 600);
        } else {
          lancer();
        }
      }
    );

    setTimeout(function () {
      if (!etat.gyro && v.parentNode) {
        var p = v.querySelector('.jeu-voile-boite p');
        if (p) p.textContent = 'Pas de gyroscope détecté : glisse le doigt sur l’image pour balayer la scène et garder le sujet dans le viseur.';
      }
    }, 1400);
  }

  /* ------------------------------ export ------------------------------ */
  window.MiniJeux = {
    monter: function (racine, type) {
      racine.innerHTML = '';
      if (type === 'mobile') jeuCadrage(racine);
      else jeuRayon(racine);
    }
  };
})();
