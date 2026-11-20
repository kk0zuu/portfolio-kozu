# AGENTS.md — Manuel de mise à jour du portfolio de Ian Bossut‑Gandou

> **À qui ce fichier s'adresse.** À un agent (ou un humain) qui reprend le site sans avoir vécu
> sa construction. Le site n'a **pas de build, pas de base de données, pas de CMS** : tout est
> dans des fichiers HTML autonomes, avec un `styles.css` partagé, un `app.js` partagé et un
> `<script>` propre à chaque page. Chaque page de domaine a **son propre système** ; il n'y a
> aucune abstraction commune. Ce document décrit ces systèmes un par un et donne les recettes
> exactes pour ajouter un projet ou une catégorie sans rien casser.

---

## Sommaire

1. [Contrat de travail](#1-contrat-de-travail)
2. [Carte du projet](#2-carte-du-projet)
3. [Conventions communes](#3-conventions-communes)
4. [Numérique — `numerique.html`](#4-numérique--numeriquehtml)
5. [Photographie — `photographie.html`](#5-photographie--photographiehtml)
6. [Projets plastiques — `plastique.html`](#6-projets-plastiques--plastiquehtml)
7. [Accueil — `index.html`](#7-accueil--indexhtml)
8. [Contact et 404](#8-contact-et-404)
9. [Ajouter une page de domaine complète](#9-ajouter-une-page-de-domaine-complète)
10. [Dettes connues — ne pas corriger sans demande](#10-dettes-connues--ne-pas-corriger-sans-demande)
11. [Vérifier et livrer](#11-vérifier-et-livrer)

---

## 1. Contrat de travail

Règles héritées de la façon dont le site a été construit, à respecter **à chaque intervention** :

- **Une seule tâche par demande.** On ne mélange pas « ajouter un projet » et « corriger un
  footer ». Si une erreur sans rapport est repérée, on la signale, on ne la corrige pas.
- **Commit en français, descriptif, puis `git push origin master`.** Un commit par tâche.
- **On ne casse rien hors périmètre.** Les pages ont des animations fragiles (sas d'arrivée,
  transitions, curseur, étoiles) : ne pas renommer de classe existante, ne pas réordonner les
  `<script>`, ne pas « nettoyer » du CSS au passage.
- **Pas de nouvelle dépendance.** GSAP 3.12.2 (gsap, ScrollTrigger, MotionPathPlugin) est chargé
  depuis cdnjs ; c'est tout. Pas de bundler, pas de framework, pas de npm.
- **Travail en 16:9 sur desktop.** Le responsive mobile est traité en fin de projet ; les blocs
  ajoutés doivent au minimum réutiliser les classes existantes (qui ont déjà leurs `@media`).
- Les messages destinés à Ian sont en français, tutoiement.

---

## 2. Carte du projet

| Fichier | Rôle | Système de contenu |
|---|---|---|
| `index.html` | Accueil : nom, présentation, **choix des 3 domaines** (bulles), étoiles violettes en bas | Bulles en dur + timeline GSAP |
| `numerique.html` | Domaine numérique : rayons (catégories) + projets | **Tableau JS `CATS`** + rendu dynamique |
| `photographie.html` | Domaine photo : deux axes (Studio & Pro / Expressive) | **HTML en dur** + moteur `app.js` |
| `plastique.html` | Projets plastiques : familles en boosters + cartes | **Tableau JS `CATS`** + rendu dynamique |
| `contact.html` | Contact | HTML statique (`mailto:`) |
| `404.html` | Page introuvable | HTML statique + `<style>` inline |
| `styles.css` | Styles partagés (barre, curseur, boutons, sas, photo, plastique…) | — |
| `app.js` | Moteur partagé (curseur, barre, sas, étoiles, lightbox photo, fond photo…) | Guards par sélecteur |
| `jeux.js` + `jeux-assets.js` | Mini-jeux du rayon « Site web » (chargés **uniquement** par `numerique.html`) | `window.MiniJeux.monter()` |
| `SAUVEGARDE.md` | Journal de bord du projet | — |

Dossiers d'images : `images/numerique/`, `images/photographie/pro/`,
`images/photographie/expressive/`, `images/plastique/`, `images/accueil/`,
`images/favicons/`, `images/cv/`, `images/logiciels/`.

Fichiers **obsolètes, ne pas éditer** : `_archive/`, `photo-pro.html`,
`photo-expressive.html` (anciennes versions des axes photo), `images/manifest.json`
(plus utilisé).

---

## 3. Conventions communes

### 3.1 Squelette d'une page

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Titre de la page – Ian Bossut‑Gandou</title>
  <link rel="icon" type="image/svg+xml" href="images/favicons/etoile-XXX.svg">
  <link rel="stylesheet" href="styles.css">
  <style> /* CSS propre à la page */ </style>
</head>
<body class="page-XXX">
  <!-- sas d'arrivée (facultatif, copié d'une page existante) -->
  <nav class="top-bar">…</nav>
  <div class="custom-cursor">…</div>
  … contenu …
  <footer class="…">© 2026 Ian Bossut‑Gandou – Tous droits réservés.</footer>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src=".../ScrollTrigger.min.js"></script>
  <script src=".../MotionPathPlugin.min.js"></script>
  <script src="app.js"></script>
  <script> /* script propre à la page */ </script>
</body>
```

`app.js` est défensif : chaque module commence par un test de sélecteur et sort si l'élément
n'existe pas. On peut donc l'inclure sur n'importe quelle page sans risque.

### 3.2 Images

- **Un dossier par domaine**, fichiers nommés `<numéro>_<hash>.<ext>` (issus de l'outil
  d'import de Ian) ou noms parlants pour les cas spéciaux
  (`diapo_amsterdam_canal.jpg`, `fond accueil.jpg`).
- **Chemin depuis la racine du site** (`images/…`), jamais relatif au dossier. Les espaces
  doivent être encodés en `%20` dans le HTML (`fond%20accueil.jpg`).
- **`alt` obligatoire** et descriptif : il sert aussi de légende de secours dans les visionneuses.
- Sur les pages photo, **`data-caption`** est la légende affichée en grand ; l'écrire avec le
  format existant : `Ville • Sujet et intention`.
- Pas de `width`/`height` pour l'instant, pas de `loading="lazy"` systématique : on suit le bloc
  voisin qu'on copie. (Le passage à WebP + dimensions est une dette planifiée, voir §10.)
- Ne jamais réutiliser un fichier image d'un autre projet « pour tester » : les chemins cassés
  sont la première cause de page vide.

### 3.3 Couleurs et typographies

| Page | Accent principal | Favicon |
|---|---|---|
| Accueil | violet `#C224EB` | `etoile-violet.svg` |
| Numérique | magenta `#FF00FF` / `#9C1DBD` | `etoile-blanc.svg` |
| Photographie | vert `#358E14` (axe Expressive) / violet `#9C1DBD` (axe Pro) | `etoile-vert.svg` |
| Plastique | magenta `#FF00FF` + vert néon | `etoile-jaune.svg` |
| Contact | bleu `#1232B4` | `etoile-bleu.svg` |
| 404 | violet `#C224EB` | `etoile-violet.svg` |

Les cinq SVG d'étoile partagent **exactement la même géométrie** : elle remplit 63 des 64 px
dans les deux sens (l'étoile est étirée verticalement, sinon une étoile à cinq branches perd
5 % de hauteur). L'étoile blanche de Numérique a un contour noir `stroke-width="2"` en
`linejoin="round"` et un polygone réduit d'autant : son empreinte extérieure reste identique
aux quatre autres. **Si l'on retouche un SVG, retoucher les cinq** et incrémenter le `?v=` des
balises `<link rel="icon">` (aujourd'hui `?v=3`), sinon les navigateurs resservent l'ancienne
étoile en cache et les onglets n'ont plus la même taille.

Variables CSS globales : `--color-neon-pink`, `--color-neon-green`, `--font-display`,
`--font-body`, `--font-schoolbell`, `--color-black`, `--color-bg-end`.

### 3.4 CSS : où écrire

- **`styles.css`** : uniquement ce qui est partagé par plusieurs pages (barre de navigation,
  curseur, sas, `.retour-domaines`, `.subnav-btn`, moteur photo, moteur plastique).
- **`<style>` de la page** : tout le reste. C'est la convention du projet : chaque page porte
  ses styles de mise en page. Ne pas déplacer l'existant.
- Toute animation nouvelle doit respecter `@media (prefers-reduced-motion: reduce)`.

### 3.5 Identifiants

- Slug en minuscules, sans accent, séparé par des tirets : `architecture`,
  `couple-lifestyle`, `exp-urbain`, `chris-soleil`.
- **Un `id` est unique dans la page** (il sert d'ancre et parfois de clé d'état) et **ne doit
  jamais être renommé** une fois publié : un lien externe peut pointer dessus.
- Registre actuel (ne pas réutiliser) :
  - Numérique : `chris-soleil`, `oko`, `2d-en-vrac`, `3d-en-vrac`, `branding`, `prints`,
    `retouches`, `jeu-ordinateur`, `jeu-mobile`.
  - Photo Pro : `architecture`, `couple-lifestyle`, `studio`, `packshot`, `portrait`.
  - Photo Expressive : `exp-architecture`, `exp-urbain`, `exp-transports`, `exp-portraits`,
    `exp-portraits-rue`, `exp-montagne`, `exp-lumiere`, `exp-obscurite`.
  - Plastique : `bobby`, `gant`, `prothese`, `pates`, `materiaux`, `dessins`.

---

## 4. Numérique — `numerique.html`

### 4.1 Comment la page fonctionne

C'est un **rayonnage** : trois catégories à gauche, un aperçu à droite. Un clic sur une
catégorie ouvre un **rayon** (bande horizontale de vignettes), un clic sur une vignette ouvre la
**page projet** en plein écran.

Tout le contenu vient d'un seul tableau, dans le `<script>` de la page (repère :
`var CATS = [`), et le rendu est fait par des fonctions juste en dessous (`apercuCat`,
`vignetteHtml`, `ouvrirRayon`, `ouvrirProjet`).

```js
var CATS = [
  {
    num: '01',                          // deux chiffres, affiché partout
    nom: 'Animation',                   // nom de la catégorie
    note: 'Texte d’aperçu…',            // HTML autorisé (injecté en innerHTML)
    projets: [ /* … */ ]
  },
  // …
];
```

Champs d'un projet :

| Champ | Requis | Rôle |
|---|---|---|
| `id` | oui | slug unique (identité, pas d'URL) |
| `nom` | oui | vignette, hero, lecteur, découpage du titre |
| `discipline` | non | ligne meta `discipline · année` |
| `annee` | non | idem |
| `texte` | non | HTML autorisé, affiché en `.lead` ; vide → « Texte de présentation à venir. » |
| `media` | oui (sauf jeu) | `[{ t:'image'\|'video', src:'images/…', alt:'…' }]` |
| `layout` | non | `'moches'`, `'kozu'`, `'retouches'`, `'galerie'`, `'lecteur'` |
| `lineTests` | non | booléen, **uniquement** avec `layout:'galerie'` |
| `sousTitre` | non | `layout:'lecteur'` seulement |
| `videos` | si lecteur | `[{ titre, src, poster, duree }]` (`src:null` → emplacement « à venir ») |
| `game` | non | `'desktop'` ou `'mobile'` (jeu) |

**La première entrée de `media` sert trois fois** : vignette du rayon, image d'ouverture de la
page projet, et aperçu de la catégorie si c'est la première image trouvée. C'est donc l'image
la plus représentative qui doit être en position 0.

Le compteur du haut (« Trois catégories · neuf projets ») et le nombre par catégorie sont
**écrits à la main** pour le premier, **calculés** pour les autres (`cat.projets.length`).

### 4.2 Les cinq mises en page

| `layout` | Rendu | Images utilisées |
|---|---|---|
| *(absent)* | hero + texte + collage `.gal` des images restantes | `media[0]` en hero, `media[1…]` en collage |
| `'moches'` | collage éditorial affiches (titre, palette, flèche) | `media[0]`, `[1]`, `[3]` |
| `'kozu'` | logotype / t-shirt / emplacements vidéo | `media[0]`, `[1]`, `[2]` |
| `'retouches'` | collage magazine (duo, texte, tirage large) | `media[0]`, `[1]`, `[3]`, `[4]` |
| `'galerie'` | bandeau « model sheets » + grille cliquable + visionneuse | **toutes** les `media` |
| `'lecteur'` | faux lecteur vidéo (média + recommandations) | `videos`, pas `media` |

Les CSS de ces mises en page sont dans le `<style>` de `numerique.html` (chercher `.moches`,
`.kozu`, `.mr`, `.galerie`, `.yt`, `.ms`, `.lt`).

### 4.3 Recette — ajouter un projet simple

1. Ouvrir `numerique.html`, trouver le `CATS` de la bonne catégorie.
2. Ajouter l'objet **à la fin** du tableau `projets` (l'ordre = ordre dans le rayon) :

```js
{
  id:'nouveau-projet', nom:'Nouveau projet',
  discipline:'Catégorie · Technique', annee:'2026', layout:'',
  texte:"Deux ou trois phrases sur la démarche, le médium, l'intention.",
  media:[
    { t:'image', src:'images/numerique/XX_nom.jpg', alt:'Description de l’image principale' },
    { t:'image', src:'images/numerique/XX_nom2.jpg', alt:'Description de la deuxième vue' }
  ]
}
```

3. Mettre à jour la phrase du haut si le total change :
   `<p class="kicker">Trois catégories · neuf projets</p>` → nouveau total.
4. Vérifier : survol de la catégorie (aperçu), clic → rayon, vignette, clic → projet,
   bouton « ← Rayon », `Échap`.

### 4.4 Recette — projet « à venir » (emplacement réservé)

Un projet sans média ni jeu affiche automatiquement des emplacements (« Images / Vidéos /
Texte »). C'est le mode utilisé pour annoncer un travail non terminé :

```js
{ id:'titre-a-venir', nom:'Titre à venir', discipline:'', annee:'', texte:'', media:[] }
```

Il apparaît dans le rayon avec la mention « à venir » et ouvre une page avec les trois
emplacements. Ne pas mettre `layout` ni `game` dans ce cas.

### 4.5 Recette — ajouter un lecteur vidéo

Copier `2d-en-vrac` : `layout:'lecteur'`, `sousTitre`, `texte`, `videos:[…]`.
Tant que `src` vaut `null`, la carte affiche « Extrait à venir » ; dès qu'un fichier existe
(`vidéos/…mp4`), le lecteur le joue et la vignette utilise `poster`.

### 4.6 Recette — ajouter un mini-jeu

`{ …, media:[], game:'desktop' }` ou `'mobile'`. La page masque le hero, affiche le texte puis
un hôte `.jeu-hote` rempli par `window.MiniJeux.monter(hote, type)` (défini dans `jeux.js`,
chargé par cette page uniquement). Le bouton « descendre » est masqué pour les jeux.
Un nouveau type de jeu exige du code dans `jeux.js`, pas seulement une entrée de données.

### 4.7 Recette — ajouter une catégorie (rayon)

```js
{
  num:'04', nom:'Nouvelle catégorie',
  note:'Une phrase qui résume ce qu’on trouve dans ce rayon.',
  projets:[ /* au moins un projet */ ]
}
```

Puis :
1. `num` doit suivre la numérotation (`'04'`), il est affiché tel quel.
2. Mettre à jour la phrase du haut (« Quatre catégories · … projets »).
3. Vérifier l'aperçu de droite : s'il n'y a **aucune image** dans la catégorie, la page affiche
   « visuels à venir » (état prévu, pas un bug).

### 4.8 Pièges spécifiques

- **`sectionModelSheets()` est codée en dur pour O.K.O.** : dès qu'un projet utilise
  `layout:'galerie'`, cette section (avec ses images `16_…png`, `15_…png`, `17_…jpg`) est
  injectée en haut de page. Pour un nouveau projet en galerie, **dupliquer la fonction** avec
  les bonnes images et brancher un `layout:'galerie-XXX'`, ou rendre la fonction paramétrable.
  Ne pas laisser un autre projet hériter des planches d'O.K.O.
- **L'ordre de `media` compte** pour `moches` (index 3), `kozu` (0/1/2) et `retouches`
  (3/4) : ce ne sont pas des collages génériques.
- Un projet avec **une seule** image n'affiche ni collage ni emplacements (juste texte + hero).
- `titreHtml()` découpe le nom en morceaux : les mots de plus de 9 lettres sont coupés et les
  symboles `&`, `/`, `·`, `—` sont ignorés. Éviter les noms très longs ou purement
  ponctuels.
- `p.catNum` / `p.catNom` sont ajoutés **au moment du clic** (ils viennent de la catégorie) :
  ne pas les écrire dans les données.

---

## 5. Photographie — `photographie.html`

### 5.1 Comment la page fonctionne

Pas de tableau de données : **le contenu est le HTML**. La page s'ouvre sur un écran coupé en
deux (`.photo-split`), chaque moitié ouvre un **axe** :

```html
<div class="photo-domaine-bloc" id="domaine-pro" hidden
     data-domaine="pro"
     data-teinte="rgba(156, 29, 189, 0.12)"
     data-fond="images/photographie/pro/10_…jpg">
  <header class="domain-hero-section"> … </header>
  <main class="domain-content">
    <div class="pr-ref">
      <article class="pr-card project-bubble" id="architecture"> … </article>
      …
    </div>
  </main>
  <footer> … </footer>
</div>
```

L'axe Expressive suit le même modèle avec `<div class="pe">` et des
`<section class="pe-section" id="exp-…">`.

Attributs à connaître :

| Attribut | Où | Effet |
|---|---|---|
| `data-domaine` | bloc d'axe | `pro` / `exp` ; sert au routage `#domaine-pro` |
| `data-teinte` | bloc d'axe | voile `rgba(...)` posé au-dessus du fond photo, visible tant que l'axe est affiché |
| `data-fond` | bloc d'axe | photo de fond affichée à l'ouverture de l'axe |
| `data-diapo` | carte | force l'image de fond/diapo de cette carte (sinon : première `<img>`) |
| `data-caption` | chaque `<img>` | légende de la visionneuse (sinon `alt`) |
| `data-bascule` | lien | passe à l'autre axe (`href="#domaine-exp"`) |
| `data-retour` | lien | revient à l'écran de choix d'axe |

Le moteur (`app.js`) découvre **automatiquement** toutes les `.pr-card` et `.pe-section` :
lightbox par carte, fond photographique à 60 %, diaporama au défilement, mise au point.
**Il suffit donc d'ajouter une carte pour qu'elle soit prise en compte** — aucune liste à
mettre à jour ailleurs.

### 5.2 Recette — ajouter un projet à l'axe Studio & Pro

Copier l'article le plus proche **en structure** (c'est le plus important : les mises en page
ne sont pas génériques), puis :

```html
<article class="pr-card project-bubble" id="mon-slug">
  <h2 class="bubble-main-title blur-reveal">Titre du projet</h2>
  <div class="pr-pair">
    <div class="editorial-img-frame">
      <img src="images/photographie/pro/XX_nom.jpg" alt="Description"
           data-caption="Lieu • Sujet et intention">
    </div>
    <div class="editorial-img-frame">
      <img src="images/photographie/pro/YY_nom.jpg" alt="Description"
           data-caption="Lieu • Sujet et intention">
    </div>
  </div>
  <p class="pr-text fade-in">Texte de présentation, une ou deux phrases.</p>
</article>
```

Mises en page disponibles (copier celle qui ressemble au besoin) :

- `pr-archi` — texte + diptyque + légende, titre à gauche (projet Architecture).
- `pr-couple` — titre et texte en tête, grande image + légende, image pleine largeur.
- `pr-studio` (avec `pr-studio__mid`, `pr-subtitle`, `pr-frame--mid`) — trois colonnes, série studio.
- `pr-packshot`, `pr-portrait` (+ `pr-portrait__text`), `pr-list`, `pr-stack`, `pr-sepia`,
  `pr-head--spread`, `pr-caption--center`, `pr-title--right`.

Règles :
- Le `id` doit être unique et ne pas commencer par `exp-`.
- Ajouter `data-diapo="…"` sur l'article si la photo de fond doit être différente de la
  première image.
- Placer l'article **dans `.pr-ref`** : c'est la portée du moteur.

### 5.3 Recette — ajouter une série à l'axe Expressive

```html
<section class="pe-section" id="exp-mon-slug">
  <h2 class="pe-title">Titre de la série</h2>
  <div class="pe-grid pe-archi">
    <div class="editorial-img-frame">
      <img src="images/photographie/expressive/XX_nom.jpg" alt="Description"
           data-caption="Lieu • Sujet">
    </div>
    <!-- 2 à 4 autres images -->
  </div>
</section>
```

Grilles disponibles : `pe-archi` (4 colonnes, sûre pour 3–5 images), `pe-montagne`,
`pe-lumiere`, `pe-obscurite`, `pe-rue` (spans 2 puis 3 : prévue pour beaucoup d'images).
Variantes de titre : `pe-title--right`, `pe-title--center`.
Le `id` doit commencer par `exp-` et le bloc doit rester dans `.pe`.

### 5.4 Ajouter un troisième axe (opération lourde)

Ce n'est **pas** une opération de données. Il faut :
1. une moitié dans `.photo-split` (`side-XXX`) ;
2. un nouveau `.photo-domaine-bloc` avec `data-teinte`, `data-fond`, `hidden` ;
3. le routage par hash dans le script de la page (`location.hash === '#domaine-XXX'`) ;
4. les liens `data-bascule` des deux autres axes ;
5. éventuellement des teintes/CSS dédiés.

À ne faire que si Ian le demande explicitement : l'écran de choix est conçu pour deux axes.

### 5.5 Pièges spécifiques

- **Le fond photographique est global** : dès qu'une page contient `.pr-card`/`.pe-section`,
  `app.js` ajoute `body.photo-fond-actif` et retire le fond vert. Ne pas s'étonner que la page
  perde son vert.
- Les images sont ordonnées **par le DOM**, jamais par le nom de fichier.
- Une carte sans image donne un fond vide et une visionneuse vide : toujours au moins une
  `.editorial-img-frame`.
- `#choix` n'existe pas comme ancre : le retour se fait par `data-retour` (le `href="#choix"`
  n'est qu'un fallback).
- `photo-pro.html` et `photo-expressive.html` sont d'anciennes pages isolées : ne pas y
  ajouter de contenu.

---

## 6. Projets plastiques — `plastique.html`

### 6.1 Comment la page fonctionne

Un **rail de boosters** (une famille = un paquet de cartes à déchirer). Déchirer le paquet
ouvre une grille de cartes ; une carte se retourne au clic, s'ouvre au double-clic dans une
**fiche projet** plein écran. Tout vient d'un tableau `CATS` et le rail est construit
automatiquement (compteur `01 / 04`, positions circulaires, rayon borné).

```js
var IMG = 'images/plastique/';

var CATS = [
  {
    id: 'sceno',                 // clé d'état (mémorise les paquets ouverts)
    num: '01',                   // affiché « Série 01 »
    nom: 'Conceptions scénographiques',
    def: "Une phrase qui définit la famille.",   // REQUIS (affiché sous le booster)
    projets: [ /* … */ ]
  }
];
```

Champs d'un projet :

| Champ | Requis | Rôle |
|---|---|---|
| `id` | oui | slug |
| `nom` | oui | carte + fiche |
| `meta` | oui | sous-titre technique (carte et fiche) |
| `court` | oui | texte du dos de la carte |
| `texte` | oui | texte long de la fiche (**texte brut**, injecté en `textContent`) |
| `img` | oui | **chemin complet** `IMG + 'fichier'` |
| `gal` | non | tableau de **noms de fichiers seuls** ; la 1re image devient la grande |
| `notes` | non | `[{ t:'libellé', c:'' \| 'magenta' \| 'verte' }]` |

### 6.2 Recette — ajouter un projet

```js
{
  id:'mon-projet', nom:'Mon projet', meta:'Matériau · technique · dimensions',
  court:"Une phrase pour le dos de la carte.",
  texte:"Le texte long de la fiche : matériaux, procédé, intention. Pas de HTML.",
  img: IMG + 'XX_nom.jpg',
  gal: ['YY_nom.jpg', 'ZZ_nom.jpg'],
  notes: [{ t:'Détail technique', c:'verte' }, { t:'Contrainte ou intention', c:'' }]
}
```

Puis vérifier : déchirer le paquet, compter les cartes, retourner la carte (clic), double-clic
→ fiche, `Échap` pour fermer.

### 6.3 Recette — ajouter une famille

Ajouter un objet dans `CATS` (`id`, `num` suivant, `nom`, `def`, `projets`), puis :
1. mettre à jour la phrase statique de la page :
   `Quatre familles de travail, quatre boosters.` (chercher ce texte, ligne ~291) ;
2. vérifier le compteur : il est calculé (`01 / 05`), rien à faire ;
3. vérifier la roue : les positions sont calculées à partir de `CATS.length` (rayon borné
   entre 300 et 520 px), aucune retouche CSS nécessaire pour 5 ou 6 familles.

### 6.4 Pièges spécifiques

- **Une famille sans projet fait planter la construction** du rail : le paquet empile
  `cat.projets[0].img`. Toujours au moins un projet par famille.
- `notes[].c` est injecté tel quel dans l'attribut `class` : seules les valeurs `''`,
  `'magenta'`, `'verte'` ont un style. Toute autre valeur = pastille neutre.
- `gal` ne contient **que** des noms de fichiers ; `img` contient le chemin complet. C'est la
  seule incohérence du projet, la respecter.
- `texte` est du texte brut : les apostrophes typographiques sont bienvenues, le HTML ne sera
  pas interprété.

---

## 7. Accueil — `index.html`

L'accueil n'a pas de système de contenu : trois bulles `.bubble-card` en dur, positionnées par
une **timeline GSAP** (`initSpirale` dans `app.js`), et la section `#choix-domaines` où dérivent
les étoiles violettes.

Ajouter un **quatrième domaine** n'est pas une opération de données. Il faut :
1. une nouvelle page (voir §9) ;
2. un `<a class="bubble-card bubble-XXX hover-target">` avec son image et son
   `<span class="handwritten-label">` ;
3. une règle `z-index` (`.bubble-XXX`) et une rotation du label dans `styles.css` ;
4. **une tween de position dans `initSpirale`** (branche desktop **et** branche mobile) ;
5. le lien dans la barre de navigation de **tous** les fichiers (`index`, `numerique`,
   `photographie`, `plastique`, `contact`, `404`) ;
6. son favicon étoile dans `images/favicons/`.

Autres points de vigilance de l'accueil :
- `initSasAccueil` intercepte les liens vers `index.html` depuis les autres pages pour rejouer
  le sas : ne pas ajouter de lien vers l'accueil dans un endroit où cette animation serait
  indésirable.
- `initEtoilesDomaines` pose son champ (`.etoiles-domaines`) **hors** de `#choix-domaines`,
  directement dans `body`, et le cale en JS du haut de `.intro-section` au bas de
  `#choix-domaines` : les étoiles pointent déjà pendant « qui suis-je ? ». Le champ est en
  `z-index: -1` (derrière le contenu, comme `.fond-image`) et son bord haut est masqué en
  dégradé pour ne pas couper les étoiles net. Le fondu d'allumage court de l'arrivée du champ
  par le bas de l'écran jusqu'à l'arrivée des bulles ; la course libre (au temps qui passe)
  part quand `#choix-domaines` touche le haut de l'écran ou quand la page est au bas. Toute
  modification de la hauteur de page change ce déclenchement : vérifier que les étoiles
  partent toujours.
- `initFlecheGuide` (dans `app.js`) ajoute sur l'accueil un **trait bleu qui s'étire** le long
  d'une courbe paramétrique (constantes `BOUCLES`, `ONDES`, `RESPIRATION`) : ce n'est pas un
  objet qui se déplace mais un `<path>` dont on révèle la longueur par `stroke-dasharray` /
  `stroke-dashoffset` selon le scroll, avec un `<path>` en forme de pointe posé sur la fin du
  trait par `transform` (translation + rotation sur la pente). Sa vitesse est modulée :
  `RESPIRATION` **est retranchée** à `s`, donc le tracé démarre à 22 % de la vitesse du scroll,
  accélère jusqu'au premier looping, puis alterne deux ralentissements et deux accélérations
  (inverser le signe inverserait ce départ). Le tout vit dans un `<svg>` aux
  mesures du document (`viewBox` = largeur × `scrollHeight`), en `z-index: -1` derrière le
  contenu ; sa longueur de course vaut `scrollHeight - innerHeight` et le trait démarre 64 px
  sous `#hero-title`. Couleurs et épaisseur : `.fleche-trait` / `.fleche-pointe` dans le
  `<style>` de `index.html`, bleu `#1232B4` (le fond de Contact), **sans contour**. Le tracé est
  ré-échantillonné (`PAS` points) à chaque `resize` et au `load`, car il dépend de la hauteur
  réelle de la page. Le **premier looping** (celui qui passe au-dessus de « qui suis-je ? ») est
  traité à part par une cloche gaussienne : les constantes `BOSSE`, `BOSSE_LARGEUR`,
  `BOSSE_X`, `BOSSE_Y` et `BOSSE_BAS` l'agrandissent et le descendent sans toucher au reste du
  tracé. La pente de la pointe est mesurée par différence finie sur `point()`, pour rester juste
  malgré cette cloche.
- La **fin du tracé** est construite à part (`construireFinale`) : à partir de `FIN_U0` (0,86),
  la courbe de base est remplacée par une **Catmull-Rom centripète** qui monte au-dessus du
  titre `.titre-centre`, fait un looping (`FIN_RAYON`) et vient finir **derrière le titre**
  `« Où on va ? »` (la pointe est donc invisible). Deux points fantômes encadrent la liste de
  contrôle : l'un avant la jonction (raccord dans la même direction), l'autre après l'arrivée
  (sans lui, la dernière ligne droite ne serait jamais parcourue). Le titre est mesuré en
  coordonnées du document à chaque `mesurer()`.
- Quand la pointe arrive (`u ≥ 0,985`), `initFlecheGuide` émet l'événement **`fleche-guide:arrivee`**.
  `initFlecheOrbitale` (la flèche rouge) l'attend : sans cet événement, elle reste invisible même
  si le curseur est au niveau du titre. Supprimer ou renommer l'événement empêche la flèche rouge
  d'apparaître ; inversement, si le guide ne tourne pas (pas de `#hero-title`, mouvement réduit),
  la flèche rouge garde son ancien déclenchement.
  malgré cette cloche.

---

## 8. Contact et 404

- `contact.html` : page statique, aucun contenu structuré. Le contact passe par un
  `mailto:` (`gandou.christian@gmail.com`) et des liens externes. Une modification de texte se
  fait directement dans le HTML ; ne pas ajouter de formulaire (il n'y a pas de backend).
- `404.html` : page autonome pour GitHub Pages (servie automatiquement pour toute URL
  inconnue). Elle réutilise `styles.css`, la barre de navigation et les classes existantes
  (`.retour-domaines`, `.subnav-btn`). Son CSS est dans un `<style>` inline. Elle est en
  `noindex` : ne pas l'indexer.

---

## 9. Ajouter une page de domaine complète

1. Copier la page la plus proche (structure `<head>`, barre, curseur, sas, footer, scripts).
2. `<title>`, favicon (`images/favicons/etoile-XXX.svg`), `class` du `<body>`.
3. Contenu : soit un tableau `CATS` + rendu (modèle Numérique / Plastique), soit du HTML en dur
   (modèle Photographie).
4. Ajouter le lien dans la barre de navigation des **six** fichiers HTML existants.
5. Ajouter une bulle sur l'accueil si c'est un domaine de premier niveau (§7).
6. Prévoir un bouton de retour : `.retour-domaines` vers `index.html#choix-domaines`
   (variante `.clair` sur fond photo) et, si la page a des sous-niveaux, `.subnav-btn`.
7. Styles dans le `<style>` de la page ; réutiliser `styles.css` pour tout ce qui est commun.
8. Design : grands titres `--font-display`, blocs brutalistes (contour noir, ombre décalée),
   un accent de couleur, étoiles si le domaine s'y prête.
9. Tester au clavier (`Échap` ferme les couches), vérifier le sas d'arrivée et le retour accueil.

---

## 10. Dettes connues — ne pas corriger sans demande

Ces points sont **connus et volontairement repoussés**. Les signaler à Ian, ne pas les traiter
d'office :

1. **Poids des images** : ~212 Mo / 265 fichiers, jusqu'à 4,8 Mo par PNG. La conversion WebP, le
   plafonnement et l'ajout de `width`/`height` sont validés sur le principe mais pas lancés
   (attendre le « go »).
2. **Bouton « Télécharger le CV » en PDF** : à implémenter plus tard (l'image CV existe dans
   `images/cv/`).
3. **Fichiers orphelins** : `photo-pro.html`, `photo-expressive.html`, `_archive/`,
   `images/manifest.json`, une vidéo `problème swipe des pages photos.mp4` (~7,5 Mo), des
   dizaines d'images non référencées dans `images/accueil/`.
4. **Pieds de page incohérents** : absents sur `index.html` et `contact.html`, présents ailleurs.
5. **Accessibilité / SEO** : pas de `meta description` ni Open Graph sauf contact, trois `h1`
   sur `photographie.html`, focus clavier à revoir par endroits.
6. **Mobile** : le responsive est prévu en fin de projet ; ne pas entreprendre de refonte
   mobile au détour d'un ajout de projet.

---

## 11. Vérifier et livrer

### 11.1 Servir le site en local

```bash
python -m http.server 8123      # ou : npx --yes serve . -l 8123
```

Puis ouvrir `http://127.0.0.1:8123/numerique.html` (etc.). Un simple double-clic sur le
fichier fonctionne aussi pour la plupart des pages, mais le serveur évite les surprises de
chemins et de polices.

### 11.2 Vérification minimale après un ajout

- La page s'ouvre, **aucune erreur console**.
- Le nouvel élément est **visible et cliquable** (vignette, carte, article).
- Le texte et les images sont les bons (pas de chemin cassé, pas d'`alt` oublié).
- Pas de **débordement horizontal** (`document.documentElement.scrollWidth <= innerWidth`).
- Les compteurs écrits à la main sont à jour.
- Retour arrière fonctionnel (`Échap`, boutons).

Ne pas lancer de tests automatisés, de build ou d'audit : il n'y en a pas dans ce projet.

### 11.3 Commit

```bash
git add <fichiers> && git commit -m "Ajoute le projet <nom> au rayon <catégorie>"
git push origin master
```

Message en français, une phrase qui dit **pourquoi/quoi**, pas la liste des fichiers.
Un commit par tâche, poussé immédiatement.
