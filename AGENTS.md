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
- **Une seule famille de formes** : partout, cases, boutons et blocs de texte sont des
  **rectangles à coins arrondis** — jamais des pilules (`999px`), jamais des angles droits. Les
  rayons sont posés dans la section « FORME UNIQUE » en fin de `styles.css`, avec
  `--forme-bloc` (20 px), `--forme-bouton` (12 px) et `--forme-tag` (8 px) ; une page qui porte
  ses propres styles (Numérique, Plastique, 404) a la sienne en fin de `<style>`. Un nouveau
  bloc ou bouton reprend ces rayons, et un calque qui couvre toute la surface (liseré, texture
  en `::before`) reçoit le même rayon, sinon il repeint des angles droits par-dessus.
  Les vrais cercles (points, curseur, étoiles, flèches rondes, avatars) restent ronds, et les
  **photos** (`.editorial-img-frame`, donc toute la page Photographie) gardent leurs angles
  droits : ce sont des images, pas des boutons — leur case, elle, reste arrondie.
  L'étiquette manuscrite des bulles de l'accueil (`.handwritten-label`, « numérique »,
  « photographie », « projet plastique ») **suit la règle commune** : rectangles à coins
  arrondis (`--forme-bouton`) au repos comme au survol. Elle a eu un temps des angles droits
  (demandé puis retiré par Ian le 21/11). Ce qui lui reste de particulier : **chacune son ombre**
  — Numérique à gauche (`-4px 0`), Plastique en bas (`0 4px`), Photographie à droite (`4px 0`) —
  plus son inclinaison propre, et « projet plastique » est la seule **d'aplomb** (`rotate(0deg)`).
  Les trois ombres sont **à 70 % d'opacité** (`--ombre-etiquette: rgba(0, 0, 0, 0.7)`), Ian l'a
  demandé : à noir plein elles pesaient plus que la case.
  Les feuilles sont appelées avec `styles.css?v=5` dans les six pages : **incrémenter ce numéro**
  à chaque retouche de `styles.css`, sinon Ian voit l'ancienne version dans son navigateur.
  **Exceptions** : les boutons rectangulaires de Numérique (« ← Rayon », « son activé »…) et,
  sur `plastique.html`, les **boosters** (`.pm-pack`, `.pm-slab`, `.pm-foil`) et les **cartes
  projet** (`.pm-face`) gardent leurs angles droits — leur silhouette de sachet déchiré et leur
  cadre noir en dépendent. Les commandes de cette page (« voir le projet », flèches, retours)
  et la fiche projet, elles, prennent les coins arrondis.

### 3.5 Identifiants

- Slug en minuscules, sans accent, séparé par des tirets : `architecture`,
  `couple-lifestyle`, `exp-urbain`, `chris-soleil`.
- **Un `id` est unique dans la page** (il sert d'ancre et parfois de clé d'état) et **ne doit
  jamais être renommé** une fois publié : un lien externe peut pointer dessus.
- Registre actuel (ne pas réutiliser) :
  - Numérique : `chris-soleil`, `oko`, `2d-en-vrac`, `3d-en-vrac`, `branding`, `prints`,
    `retouches`, `site-web`, `jeu-ordinateur`, `jeu-mobile`.
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

Le titre du hero (« Le numérique / en rayons ») est le **seul texte du site en Nabla**, la police
variable colorée de Google Fonts (ajoutée au `<link>` de la page, axes `EDPT` et `EHLT`) —
licence **SIL Open Font License 1.1** (Arthur Reinders Folmer & Just van Rossum), usage
commercial libre, aucune mention obligatoire. Elle est chargée par le CDN de Google Fonts : rien
n'est redistribué, donc rien à joindre au dépôt. Si un jour on héberge soi-même une version
modifiée du fichier, l'OFL impose de garder sa licence avec la police, de ne pas la vendre
seule et de renommer toute version dérivée visée par un nom réservé.

Nabla **porte ses propres palettes** : `color` n'a aucune prise dessus, même en `!important`.
Les couleurs sont donc remplacées par deux palettes maison dans `@font-palette-values`
(`--num-titre` : face blanche, flancs gris ; `--num-neon` : face magenta, flancs prune),
posées sur `h1` et `h1 em` avec `font-palette`. Nabla empile trois familles de faces, et non
des « liserés » : **7 = face principale** (et 9 son dégradé), **1 = face supérieure, celle qui
prend la lumière** (8 = son arête), **3/4/5/6/0 = les flancs d'ombre**, du plus clair au plus
profond. Une palette sans face supérieure plus claire que la face principale donne des lettres
noires en haut : c'est l'erreur à ne pas refaire (relevé au banc, un index isolé à la fois puis
en arc-en-ciel). `color` ne sert
plus qu'au repli sur les navigateurs sans COLRv1 (Safari), où le titre se dessine en
monochrome : blanc et magenta, lisible mais sans volume.

**Chaque mot échange sa palette au survol**, en fondu. Un mot n'a pas de palette animable
(`font-palette` ne s'interpole pas), donc chaque mot du titre est un `span.mot` qui porte **deux
couches** : le texte de base, puis `.mot-cache` en `position:absolute` juste au-dessus, au pixel,
avec la palette de l'autre ligne. Seule `opacity` bouge (`transition .26s`), sur `.mot:hover`.
Les couches sont identiques en texte, police et position, donc le fondu ne fait pas de double
contour (vérifié). `.mot-cache` est `aria-hidden` : un lecteur d'écran ne lit le titre qu'une
fois. Le survol ne porte que sur la boîte du mot, jamais sur la largeur du `h1` ni sur toute la
ligne. `color` suit dans les deux couches pour le repli sans COLRv1.

Piège vécu : les boîtes d'une couche en flux et d'une couche absolue ne coïncident pas
(`getBoundingClientRect` donne 84 px de haut pour le texte en flux contre 52 px pour l'absolue)
parce qu'une boîte inline prend l'ascendante/descendante de la police couleur, pas la hauteur de
ligne. Les **glyphes**, eux, sont bien alignés : c'est le rendu qu'il faut regarder, pas les
rectangles, avant de croire à un décalage. Pour changer l'épaisseur du relief,
ajouter `font-variation-settings: 'EDPT' … / 'EHLT' …` sur `h1`.

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
| `'chris'` | page documentaire (logline, dualité lune / soleil, recherches, entités, actes, état de production, emplacements réservés) | toutes les `media`, **par index** |

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
- **`layout:'chris'` a son propre rendu** (`chrisHtml()`, CSS `.cs-*` dans le `<style>` de la
  page, images dans `images/numerique/chris-soleil/`). La fonction lit les visuels **par
  index** : 0 = hero et vignette, 1 = planche de rotation, 2–5 = les quatre carnations de
  Chris, 6 = Soleil au crayon, 7–9 = les entités. Réordonner `media` casse les légendes ;
  ajouter une image à la fin du tableau ne pose aucun problème. Les neuf `.cs-slot` sont des
  emplacements réservés : quand un contenu arrive, il remplace la case correspondante (et son
  texte dans le tableau `slots` de `chrisHtml`).
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
- **Cases penchées et clic** : la visionneuse écoute le clic en phase de capture et retrouve la
  photo sous le curseur avec `elementsFromPoint`. Quand la case est inclinée en perspective
  (entre deux cases), la cible du clic n'est pas forcément l'image : le cadre, un plan voisin,
  ou le conteneur quand la case bouge entre l'appui et le relâchement. Ne pas revenir à un
  simple `e.target`, les photos redeviendraient muettes dès que la case est penchée. La barre
  de navigation, les liens et les boutons gardent leur clic.
- `#choix` n'existe pas comme ancre : le retour se fait par `data-retour` (le `href="#choix"`
  n'est qu'un fallback).
- **Le hero épinglé est rogné à l'arête de la première case.** `majerHero()` (dans le
  `<script>` de `photographie.html`, appelé sur `scroll`, `resize` et `scrollend`) pose un
  `clip-path: inset(0 0 X 0)` où `X` vaut « bas du hero − haut de la première case », puis
  passe le hero en `visibility: hidden` quand cette arête a atteint le haut de l'écran.
  **Ne pas revenir à un test sur le seul haut de la case** : le hero restait entier jusqu'à ce
  que le haut de la case touche le haut de l'écran, alors que son **bas** avait déjà dépassé le
  bas du hero — ses deux boutons (« Retour au choix d'axe », « Voir photos… ») flottaient dans
  l'interligne entre deux cases au scroll rapide (les cases sont plus courtes que le hero, et
  leur arrivée en perspective les rétrécit encore). La découpe est effacée à `y = 0`, sous
  901 px de large, au retour au choix d'axe (`revenir()`) et à chaque changement d'axe
  (`poserHero()`), sinon un axe hérite de la découpe de l'autre.
- `photo-pro.html` et `photo-expressive.html` sont d'anciennes pages isolées : ne pas y
  ajouter de contenu.

---

## 6. Projets plastiques — `plastique.html`

### 6.1 Comment la page fonctionne

Un **rail de boosters** (une famille = un paquet de cartes à déchirer). Déchirer le paquet
ouvre une grille de cartes ; une carte se retourne au clic, s'ouvre au double-clic dans une
**fiche projet** plein écran, rendue soit en **planche** de présentation, soit en
**planche-contact** selon `mise` (§6.2). Tout vient d'un tableau `CATS` et le rail est construit
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
| `texte` | oui | texte long de la fiche (**texte brut**, échappé par `ech()` puis injecté en HTML) |
| `img` | oui | **chemin complet** `IMG + 'fichier'` |
| `gal` | non | tableau de **noms de fichiers seuls** |
| `notes` | non | `[{ t:'libellé', c:'' \| 'magenta' \| 'verte' }]` |
| `mise` | non | `'planche'` (défaut : pièce unique) ou `'serie'` (planche-contact) |
| `tech` / `theme` | non | sous-titre de la planche : « techniques / thème » |
| `large` | non | `true` quand la photo de la pièce est **à l'horizontale** (elle passe pleine largeur) |
| `fiche` | non | `[['Techniques', '…'], ['Matériaux', '…'], …]` — fiche technique de la planche |
| `leg` | non | légendes des `gal`, **alignées par index** (les trous restent sans légende) |
| `appels` | non | `{ indexDeNote: [x%, y%, tailleRem] }` — cible cerclée sur la photo |
| `tags` | non | `'serie'` : pastilles de techniques affichées sous le texte |

### 6.2 Les deux mises en page

`ouvrirProjet` choisit le rendu selon `mise` :

- **`planche`** (les quatre pièces) — reprise de la **composition** des planches de
présentation du site d'origine (Canva), **sur le fond sombre `#0B0B0C` de la fiche d'avant**
(Ian y tient : seuls la mise en page et les cartouches changent) : bandeau de titre entre
deux filets pointillés, sous-titre `tech / theme`, pièce à gauche dans une case `#151517`,
texte justifié + `fiche` à droite, `notes` en étiquettes manuscrites, `gal` en collage de
vues légendées (`leg`), et `appels` qui cerclent un détail de la photo (cercle blanc) avec
un numéro repris sur l'étiquette. Avec `large: true` (photo horizontale), la pièce prend
toute la largeur et le texte se répartit dessous ; sinon les vues montent dans la marge droite.
**Ne pas reposer de feuille claire** : `.pm-pl` n'a pas de fond propre, il hérite du noir de
`.pm-fenetre`.
- **`serie`** (Dessins, Personnalisation Matériaux) — une collection, pas un objet :
planche-contact en cases `4/5` `#151517` où chaque image est **entière** (`object-fit:contain`,
jamais rognée), et les techniques en pastilles (`tags`) sous le texte. C'est la mise en page
adaptée : un cadrage `cover` couperait les dessins.

Aucune des deux n'utilise l'ancien hero plein écran (`.pm-f-hero`) : il a été retiré avec
ses styles, la fenêtre n'a plus qu'un conteneur `#pmFCorps` rempli par le rendu.

### 6.3 Recette — ajouter un projet

```js
{
  id:'mon-projet', nom:'Mon projet', meta:'Matériau · technique · dimensions',
  court:"Une phrase pour le dos de la carte.",
  texte:"Le texte long de la fiche : matériaux, procédé, intention. Pas de HTML.",
  img: IMG + 'XX_nom.jpg',
  gal: ['YY_nom.jpg', 'ZZ_nom.jpg'],
  notes: [{ t:'Détail technique', c:'verte' }, { t:'Contrainte ou intention', c:'' }],
  mise: 'planche', tech: 'soudure, moulage', theme: 'nature & hybridation',
  fiche: [['Techniques', 'soudure à l’arc, moulage'], ['Matériaux', 'acier, résine, papier de soie']],
  leg: ['Vue de face', 'Détail'],
  appels: { 0: [50, 45, 4.6] }
}
```

Puis vérifier : déchirer le paquet, compter les cartes, retourner la carte (clic), double-clic
→ fiche, `Échap` pour fermer.

### 6.4 Recette — ajouter une famille

Ajouter un objet dans `CATS` (`id`, `num` suivant, `nom`, `def`, `projets`), puis :
1. mettre à jour la phrase statique de la page :
   `Quatre familles de travail, quatre boosters.` (chercher ce texte, ligne ~291) ;
2. vérifier le compteur : il est calculé (`01 / 05`), rien à faire ;
3. vérifier la roue : les positions sont calculées à partir de `CATS.length` (rayon borné
   entre 300 et 520 px), aucune retouche CSS nécessaire pour 5 ou 6 familles.

### 6.5 Pièges spécifiques

- **Une famille sans projet fait planter la construction** du rail : le paquet empile
  `cat.projets[0].img`. Toujours au moins un projet par famille.
- `notes[].c` est injecté tel quel dans l'attribut `class` : seules les valeurs `''`,
  `'magenta'`, `'verte'` ont un style. Toute autre valeur = pastille neutre.
- `gal` ne contient **que** des noms de fichiers ; `img` contient le chemin complet. C'est la
  seule incohérence du projet, la respecter.
- `texte` est du texte brut : les apostrophes typographiques sont bienvenues, le HTML ne sera
  pas interprété (tout passe par `ech()`).
- `appels` se cale sur l'index de `notes` : `{ 0: [50, 45, 4.6] }` cercle la **première**
  note. Une note sans appel reste une simple étiquette, sans numéro.
- **La barre de navigation passe devant les écrans de la page** (`position:fixed`, `top:1rem`,
  3rem de haut, `z-index:1000` dans `styles.css`). L'écran des cartes est en `z-index:60` : son
  bloc d'en-tête garde donc `margin-top:4rem`, faute de quoi le titre passe sous la barre
  (même correction pour `.pm-retour-focus`, à `top:4.4rem`).
- **L'écran des cartes n'a pas de barre d'en-tête** : plus de fond, de filet, de numéro de
  famille ni de définition, et pas de bouton « ← Familles » (retiré le 21/11). Il ne reste que
  `.pm-cartes-nom`, un petit titre en capitales gris (`rgba(255,255,255,.42)`, 0,66–0,78 rem)
  posé au-dessus de la grille, qui défile avec elle. Il reste en blanc cassé et non en noir :
  sans couleur il héritait du noir du `body` et disparaissait. La définition de la famille
  (`cat.def`) ne s'affiche plus que sous le booster, sur le rail. L'écran est une **colonne
  flex** : la grille porte `margin-top:auto` et la ligne d'aide `margin-bottom:auto`, si bien
  que le couple cartes + aide se centre dans la hauteur libre et défile normalement quand une
  famille est trop longue (marges automatiques = zéro en débordement). Sans ça, les deux
  cartes d'une petite famille restaient collées sous le titre, en haut d'un écran vide.
- Le bouton de retour de la **mise au point** (`#pmRetourFocus`) s'appelle « ← Boosters » et
  s'efface pendant les cartes (`body.pm-cartes-ouvertes`) — c'est cette classe qui porte
  l'état, pas `:has()`.
- Ne pas remettre `object-fit:cover` sur les pièces des séries : le cadrage est le sujet.
- `lignes` de `fiche` : deux colonnes seulement, le libellé est mis en capitales par le CSS.

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
- **Bandeau des logiciels** (`.logiciels`, sur `index.html` *et* `contact.html`) : chaque pastille
  est un `<a class="logiciel" href="https://fr.wikipedia.org/wiki/…" target="_blank"
  rel="noopener noreferrer" draggable="false">` qui mène à la page **Wikipédia francophone** du
  logiciel, avec la ligne technique qui va avec (16 pastilles dans le motif de base). Trois
  pièges, tous tenus par `app.js` :
  - le bandeau se **duplique** (remplissage de la largeur + deux clones) : les copies reçoivent
    `tabindex="-1"` pour ne pas quadrupler les liens au clavier — seul le motif de départ reste
    atteignable ;
  - la **capture du pointeur** n'est posée qu'au premier vrai mouvement (`bouge > 4`). Posée dès
    l'appui, elle détourne le clic vers la bande et **aucun lien ne s'ouvre** ;
  - un relâchement après un glisser ne suit pas le lien (`bouge > 6` → `preventDefault`), sans
    quoi chaque glissade sur la ligne ouvrirait une page Wikipédia.
  Si l'on ajoute un logiciel, mettre l'`alt` **et** le `title` (`Nom — Wikipédia (nouvel onglet)`)
  et vérifier que la page existe en français : une URL fausse casse le lien, pas la mise en page.
  Depuis que les pastilles sont des liens, `initLightbox` les **ignore** (`openWith` sort si
  l'image est dans `.logiciels`) et refuse d'ouvrir une galerie **vide** : sans ce garde-fou, un
  clic sur un logo ouvrait un cadre noir plein écran par-dessus la page (« visionneuse
  fantôme », vue sur l'accueil où aucune photo n'est déclarée cliquable). La page photo, elle,
  garde sa visionneuse : `.pr-card` / `.pe-section` fournissent la galerie.
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
- **Ordre de l'apparition de l'accueil** (section 1 de `app.js`) : le titre d'abord, chaque
  lettre **descendue au bout d'une corde**, posée dans un ordre **tiré au hasard** (pas de
  gauche à droite) — un trait bleu (`#1232B4`, comme la flèche) que
  `app.js` pose dans le wrapper de sa lettre, hauteur égale à la chute mesurée, `scaleY` animé
  pour que le haut reste fixe hors cadre. La remontée est la **descente filmée à l'envers** :
  elle part **d'un bloc quand la dernière lettre est posée**, avec le même ordre, le même écart
  `ECART_CHUTE` d'une corde à l'autre, la même durée `DUREE_CHUTE` et la courbe inverse
  `power2.in` (qui est exactement `power2.out` retournée). **Pas de temps mort** : les deux courbes
  freinent en arrivant, si bien qu'en enchaînant pile elles s'arrêtaient deux ou trois images — d'où
  `AMORCE` (0,12 s) : la vague part un cheveu **avant** `finChute`, quand la dernière lettre n'est
  plus qu'à quelques pixels de sa place. Mesuré entre les deux phases : le mouvement total des
  cordes ne descend plus à zéro (0,011 au creux, contre 0,12 s d'arrêt net avant).
  À la pose, **la lettre encaisse le choc** : `REBOND` (12 px) vers le bas en 0,08 s, puis retour
  en 0,22 s en `back.out(3)`, qui la fait dépasser de ~3 px avant de se poser — l'effet « lâchée
  brusquement par sa corde ». Deux tweens séparés, jamais une ease `back` sur la chute entière :
  sur 800 px de course, `back` dépasserait de plusieurs dizaines de pixels.
  **La corde s'efface du bas vers le haut** : l'extrémité libre remonte rejoindre l'accroche, qui
  ne bouge pas d'un pixel. Pour ça on ne bascule **pas** l'origine de transformation (elle reste en
  bas, `50% 100%`, comme à la descente) : on anime `scaleY` 1 → 0 **et** `y` 0 → `-hauteur` de la
  corde ensemble, sur la même courbe. Le haut reste donc figé et c'est le bas qui part en premier.
  Mesuré : sur toute la remontée, le haut de chaque corde ne s'écarte pas de plus de 4 px de sa
  position de repos, et les longueurs à l'instant `t` égalent celles de la descente à l'instant
  miroir.
  **Quatre choses à ne pas refaire**, toutes essayées et refusées : une remontée plus courte
  (0,38 s) ou un `stagger` plus serré (0,012) casse le motif ; la lancer corde par corde dès que
  chaque lettre se pose la fait se mélanger aux lettres qui tombent encore ; **basculer l'origine
  en haut** (l'ancienne version) décroche les cordes de leurs lettres d'un coup et Ian l'a
  repoussée trois fois ; et faire rentrer la corde **dans** sa lettre (l'origine en bas, sans le
  `y`) donne une remontée du haut vers le bas, qu'il a refusée aussi — c'est la direction qui
  compte, pas seulement la cadence. Le rognage du hero ne revient qu'à `finRemontee` (fin de
  la dernière remontée). La ligne d'intro (« et voici mon » + « PORTFOLIO », qui arrivent des
  deux côtés et se cognent) et la barre de navigation partent, elles, à la pose de la dernière
  lettre. La barre n'entre donc plus sur une minuterie : elle attend l'événement
  **`accueil:titre-pose`**, avec un filet à 4 s. Pendant tout ce temps le hero porte
  **`.cordes-visibles`** (`overflow: visible` dans `styles.css`), sinon il rogne ses débordements à
  48 px du haut (le `padding-top` du body) et la bande où la barre va entrer reste vide : les
  cordes montent donc jusqu'au bord de l'écran et passent **derrière** la barre (`z-index: 1000`),
  où on les voit encore à travers son verre. La classe est retirée quand les cordes ont fini de
  remonter — le rognage doit revenir avant le scroll, qui éparpille les lettres à ±850 px.
- `initFlecheGuide` (dans `app.js`) ajoute sur l'accueil un **trait bleu qui s'étire** le long
  d'une courbe paramétrique (constantes `BOUCLES`, `ONDES`) : ce n'est pas un objet qui se
  déplace mais un `<path>` dont on révèle la longueur par `stroke-dasharray` /
  `stroke-dashoffset` selon le scroll, avec un `<path>` en forme de pointe posé sur la fin du
  trait par `transform` (translation + rotation sur la pente).
- **La vitesse se mesure en pixels de tracé par pixel de scroll**, jamais en part de `u`. C'est la
  seule unité qui corresponde à ce qu'on voit, et un **cran de molette vaut 100 px** sur presque
  toutes les souris : c'est l'unité de mesure à utiliser pour juger (`scrollTo` de 100 en 100,
  relever `stroke-dashoffset`, faire la différence). Le tracé fait ~5 400 px pour une course de
  ~2 000 px : **il avance donc en moyenne 2,7 fois plus vite que la page**, et on ne peut pas
  ralentir un endroit sans accélérer le reste. Sur cette base, les valeurs relevées sont de
  ~55 à ~600 px de tracé par cran (contre 27 à 864 avant le 20/11) : ~320 à 430 dans la descente,
  ~250 à 320 dans le virage, ~210 à 340 dans la remontée finale, et les **deux trous d'arrêt** (voir
  plus bas) : 28-71 au premier demi-tour, 49-62 à celui du texte.
- Le profil (`construireProfil` / `avance`) est construit **après** le tracé, sur ses longueurs
  réelles : chaque tronçon coûte « sa longueur divisée par la vitesse voulue », on cumule, on
  normalise (`u(1) = 1` : la fin tombe pile en bas de page et rien ne recule), et `avance(s)`
  inverse le tout. `SOUFFLE` fait respirer la vitesse de ±8 %, `VITESSE_DEPART` (25 % de la
  vitesse normale) et `RAMPE` (12 % du scroll) donnent le démarrage lent, `VIRAGE` /
  `VIRAGE_LARGEUR` / `VIRAGE_LENT` ralentissent le grand virage qui balaie à gauche sous
  « qui suis-je ? » (u ≈ 0,31 : c'est là que la pointe est au plus à gauche, pas à 0,17), et
  `FIN_LENT` / `FIN_RENTREE` font de même pour la remontée finale.
  **Piège vécu** : un ralentissement exprimé en `u` ne ralentit rien du tout — il déplace le
  tracé dans la page, et comme le profil est normalisé, il accélère même tout le reste. Quand un
  endroit paraît trop rapide, mesurer d'abord **où il se trouve en `u`** (relever la position de
  la pointe pendant le scroll), puis régler la cloche à cet endroit-là.
  **Deuxième piège, le 21/11** : un profil fondé sur la seule **longueur** traverse d'un cran les
  endroits où le tracé fait demi-tour sur place. Au virage du texte, la pointe n'y parcourt
  presque aucune longueur quand elle boucle : elle n'y passe donc aucun temps, et le ralenti
  qu'on y voyait — la pointe qui s'arrête le temps de boucler — a disparu (404 px de tracé par
  cran au lieu de 29). D'où **`ARRETS` / `ARRET` / `ARRET_LARGEUR`** : on ajoute au coût de chaque
  pas une part **indépendante de la longueur** (`ARRET` × cloche × longueur moyenne d'un pas), ce
  qui rend au virage son temps d'arrêt sans toucher au reste.
  `ARRETS` contient les **deux** endroits où le tracé fait demi-tour sur place : `0,132` (le
  premier looping, juste au-dessus de « qui suis-je ? », page y ≈ 1 036) et `TEXTE_C` (le virage
  du texte). Ian a demandé que le premier ait le même ralenti que le second : même `ARRET` (4)
  et même `ARRET_LARGEUR` (0,055) pour les deux. Mesuré à 4 / 0,055 : 179 → 71 → **28** → 174 px
  de tracé par cran autour du premier demi-tour (la pointe y est à son point le plus à droite,
  `(469 ; 1 068)`), 221 → 62 → **49** → 177 autour de celui du texte ; max 600 ailleurs (contre
  510 avec un seul arrêt, 404 sans aucun). Chaque arrêt coûte du scroll, donc le reste accélère
  d'autant : c'est le compromis normal du profil (voir le premier piège).
  **La géométrie ne bouge pas** : ces réglages ne touchent que le profil de vitesse, jamais
  `base()` ni `point()`.
  Pour vérifier qu'un trou de vitesse tombe au bon endroit, relever à chaque cran l'avancement
  (`stroke-dashoffset`) **et** la position de la pointe (`transform` du `.fleche-pointe`, en
  coordonnées de page) : le ralenti doit coïncider avec le point le plus à droite du tracé.
  Astuce : quand le scroll piloté par script rend la page trop lente (évaluations coupées à 10 s),
  on peut recalculer le profil hors navigation à partir du `d` du `.fleche-trait` (points →
  `cumul` → `profil` → `avance`) et retrouver les mêmes chiffres sans défiler.
- `DELAI_DEPART` (140 px) décale le départ : le tracé ne bouge pas pendant les premiers pixels
  de scroll, la pointe attend sous le titre. C'est `s` qui est recalculé sur
  `course - DELAI_DEPART`, pas la longueur du tracé.
- **Rattrapage au rechargement** : le navigateur remet la page à la hauteur où l'usager l'avait
  laissée. Sans rien, le tracé apparaît **déjà dessiné** d'un coup (il était posé par le
  `dessiner()` d'initialisation). `rattraper()` le dessine alors tout seul, de 0 jusqu'à
  `avance(s)`, en 0,7 à 2 s (`smoothstep`), et la cible est **relue à chaque image** : si la
  hauteur n'est restaurée qu'après `load`, le tracé y va quand même. Pendant ce temps `dessiner()`
  ne fait rien (`rattrapage` non nul). Un geste de l'usager (`wheel`, `touchstart`, `keydown`,
  `pointerdown`) annule et rend la main au défilement ; `rentrer()` (demi-tour) l'annule aussi.
  Appelé à l'initialisation, sur `load` et sur `pageshow` restauré ; au tout début (< 1,2 s) et
  tant que rien n'est dessiné, un défilement passe aussi par le rattrapage, ce qui couvre la
  restauration tardive de la hauteur.
  **Deux pièges vécus** :
  - un `setTimeout(duree + 500)` sert de filet : si les images s'arrêtent (onglet en arrière-plan,
    appareil en veille), le rattrapage se termine et `dessiner()` reprend, au lieu de laisser le
    tracé figé pour toujours ;
  - `auScroll` a un verrou `attente` levé par l'image suivante. Si cette image n'arrive jamais
    (frames gelées), le tracé **ne suit plus le défilement** : vu en test quand la prévisualisation
    ne rendait plus de frames. Ce n'est pas un bug de page (le navigateur finit par rendre la
    frame), mais c'est ce qui rend les mesures impossibles dans cet environnement — il faut alors
    remplacer `requestAnimationFrame` par des minuteurs dans la console pour tester les animations.
- **Apparition** : le `<svg>` est invisible au chargement (`opacity: 0`, 18 px plus bas, dans le
  `<style>` de `index.html`). `initFlecheGuide` pose la classe **`.fleche-prete`** **en même
  temps que le titre**, pas après : la descente des lettres émet l'événement **`hero:titre-parait`**
  à son départ, et la flèche l'attend (minuterie de secours à 0,9 s). La transition CSS fait
  0,7 s en opacité et 0,8 s en translation, donc la flèche finit de monter à peu près quand la
  descente du titre se termine. Avant ce réglage, la flèche attendait
  `hero:intro-done` (fin de la timeline, ~1,4 s) **puis** son fondu d'une seconde — elle arrivait
  une seconde après le titre, ce que Ian a refusé. `hero:intro-done`, lui, sert toujours (lettres
  manipulables, flèche rouge, étoiles) : ne pas le supprimer en modifiant `hero:titre-parait`.
  Sans la classe, la flèche reste invisible. Le tout vit dans un `<svg>` aux
  mesures du document (`viewBox` = largeur × `scrollHeight`), en `z-index: -1` derrière le
  contenu ; sa longueur de course vaut `scrollHeight - innerHeight` et le trait démarre 64 px
  sous `#hero-title`. Couleurs et épaisseur : `.fleche-trait` / `.fleche-pointe` dans le
  `<style>` de `index.html`, bleu `#1232B4` (le fond de Contact), **sans contour**. Le tracé est
  ré-échantillonné (`PAS` points) à chaque `resize` et au `load`, car il dépend de la hauteur
  réelle de la page.
- **Aucun morceau n'est dessiné en courbe de points de contrôle.** Les deux moments particuliers
  (« qui suis-je ? » et la fin) sont obtenus en **tirant la courbe vers une forme lisse** :
  `point(u)` part de `base(u)` puis ajoute `(cible − point) × poids`, où le poids monte et
  redescend par `lisser()` (dérivée nulle aux deux bouts). Comme la base et la cible sont
  lisses, le raccord l'est aussi : c'est ce qui a remplacé les Catmull-Rom, qui donnaient des
  coudes visibles.
  - **Premier looping** : élargi par la cloche gaussienne `BOSSE` / `BOSSE_X` / `BOSSE_Y` /
    `BOSSE_BAS`. **Ne pas trop l'augmenter** : au-delà de ~0,5 la boucle se referme en pointe
    (les deux branches se rejoignent) et le tracé a l'air cassé. `BOSSE_X` reste modéré.
  - **Fin du tracé : le fil d'un collier qui sort de la page.** À partir de `FIN_U0` (0,88 —
    **après** le passage dans la bulle Photographie), le tracé ne fait plus le tour de « où on va ? »
    : le fil ressort par la **droite** de la perle et monte hors du cadre. La descente par le haut
    à gauche, les trois bulles en perles, la remontée par la droite : c'est la forme de collier
    voulue par Ian (21/11).
    La cible est une **courbe de Bézier cubique** posée dans `placerCibles()`, mélangée avec le
    poids `lisser()` de `FIN_RAMPE` (poids nul aux deux bords) : P0 sur `point(FIN_U0)` (centre de
    la perle), P1 à droite et un peu haut (le coude se fait *derrière* la perle, donc invisible),
    P2 sur la verticale de sortie à 800 px du haut, P3 à `y = −24` (24 px au-dessus du cadre, la
    queue invisible minimale) sur cette même verticale — le fil arrive donc parfaitement vertical.
    La sortie se pose `min(perle + 300, largeur − 90)` : **pas au-dessus de la perle**, parce que
    le tracé y fait un virage (mesuré jusqu'à 1 311 px de large en 1 500–1 800 px de haut) et la
    remontée le traversait. Mesuré à 1 583 et 1 263 px de large : la remontée ne croise plus rien
    du tracé, et le fil quitte le cadre à **99,6 %** de sa longueur, avec `strokeDashoffset` à 0
    seulement quand `scrollY` atteint le bas de la page.
    **Ne pas revenir à un arc de cercle.** La tangente au point de sortie de la bulle part vers la
    **gauche** (≈ 40°), et un cercle tangent à une telle pente ne peut revenir à la verticale qu'en
    décrivant une boucle : l'arc repassait sur le tracé, d'où l'X que Ian voyait près du bloc vert
    (rayons essayés de 900 à 8 000 px, aucun ne donnait une remontée droite dans la largeur de la
    page). Ni un mélange vers un point qui se déplace : mesuré plus tôt, le rayon y variait de 166
    à 316 px et le tour sortait en œuf.
- **Passage dans la présentation** (le paragraphe « J'aime mélanger… », à droite du `f`) : le
  tracé y faisait un repli qui barrait une ligne de texte. Il est maintenant **aplati** autour de
  l'interligne par `TEXTE_C` / `TEXTE_LARGEUR` / `TEXTE_PLAT` (0,38) : son parcours ne change pas,
  seule son épaisseur verticale est écrasée, ce qui le fait glisser entre « … sublimer » et
  « … et restera ». `placerCibles()` repère la ligne qui porte le mot « sublimer » (donc quel que
  soit le retour à la ligne) et `calerTexte()` décale ensuite le centre du repli jusqu'à ce que
  son passage tombe vraiment dans l'interligne. Baisser `TEXTE_PLAT` aplatit davantage ; le
  remonter redonne au repli sa hauteur d'origine, mais il retombe sur les lignes.
- **Passage dans les trois bulles** : le tracé entre une fois dans chaque case, **dans l'ordre du
  geste** — Numérique (u ≈ 0,70–0,76), **Plastique (u ≈ 0,77–0,82, 13 px de son centre)** puis
  Photographie (u ≈ 0,83–0,87) — et en **un seul U continu** : il plonge dans Plastique puis
  remonte vers Photographie, au lieu de relier les deux bulles du haut par un trait horizontal
  qui passait 130 px au-dessus de Plastique (la version que Ian a raturée). Chaque case reçoit
  une **cloche en cosinus** qui déplace le voisinage du tracé vers son centre puis le relâche,
  avec un décalage constant repris du `motionPath` de la bulle dans `initSpirale` :
  - `PLAST_U` / `PLAST_LARGEUR` / `PLAST_PLONGEE` (0,8 / 0,085 / 0,95) et `PLAST_DECALAGE`
    (0, 250) pour le plongeon dans Plastique ;
  - `PHOTO_U` / `PHOTO_LARGEUR` / `PHOTO_PLONGEE` (0,862 / 0,075 / 0,9) et `PHOTO_DECALAGE`
    (360, 40) pour Photographie, que le tracé ratait de 248 px.
  **Piège corrigé** : `placerCibles()` lisait `getBoundingClientRect()`, qui contient la
  translation de la spirale au moment du chargement — les décallages visaient donc une position
  qui n'existe pas, et le tracé ne faisait que **frôler** Plastique et Photographie (194 px de
  leur centre au lieu de 13 et 20). On retire `gsap.getProperty(bulle, 'x'/'y')` du centre du
  rect pour viser la position de repos. Si Ian redit que « le tracé ne passe plus derrière les
  cases », mesurer d'abord l'écart au centre des trois bulles : il doit rester sous la trentaine
  de pixels.
  **La bulle, elle, ne bouge pas** : un essai de déplacement de 60 px (360,40 → 300,10) pour
  raccourcir le plongeon a été refusé par Ian — la cible du tracé se règle par `PHOTO_PLONGEE`,
  jamais en déplaçant la bulle, dont la position fait partie du dessin de l'accueil.
  Les deux fenêtres se **chevauchent** (0,715–0,885 et 0,787–0,937) : `placerCibles()` calcule
  d'abord le décalage de Plastique puis celui de Photographie, sur un `point()` qui contient
  déjà le premier — sinon la queue d'une cloche déplace le passage de l'autre —, et `point()`
  applique Plastique **avant** Photographie, pour que Photographie garde le dernier mot.
  **Trois pièges vécus, dans l'ordre où ils se sont présentés** :
  - tirer le point vers le centre de la bulle (`p += (centre − p) × poids`) fait une **épingle à
    135°** : la courbe repart de l'autre côté. Un **décalage** (`p += décalage × poids`) garde la
    forme et le sens de marche ;
  - une **cloche gaussienne coupée** (`if (|d| < 1,6)`) laisse encore 7,7 % du décalage au bord :
    le tracé fait un **cran** de 12 px — une vraie cassure, que Ian a vue tout de suite. La
    fenêtre est donc en **cosinus** (`0,5 + 0,5·cos(π·t)`) : poids **et** pente nuls aux deux
    bords, aucun cran possible ;
  - posé **avant** le mélange de la remontée finale, le décalage est combattu par lui (23° de coude à
    u ≈ 0,84) ; posé **après**, c'est lui qui a le dernier mot, il n'y a plus de lutte.
  Résultat mesuré (1600 × 950) : rayon de courbure minimal de **121 px** dans la zone des bulles,
  aucun saut d'angle de plus de **4,6°** d'un point au suivant — le U se lit comme une seule
  courbe — et les trois passages à **13, 62 et 21 px** du centre des bulles.
  Les décalages viennent des `motionPath` de `initSpirale` : une bulle n'a **pas** de position
  propre en CSS (elle est centrée au départ, c'est la spirale qui l'écarte), donc sa position
  finale se lit « centre mesuré + ce décalage ». Si l'on retouche la trajectoire de la spirale,
  mettre les décalages à jour, sinon le plongeon vise à côté. Réglages pensés pour le desktop
  (branche `isDesktop`) : la branche mobile a ses propres trajectoires.
- La pente de la pointe est mesurée par différence finie sur `point()`, pour rester juste malgré
  la boucle et la remontée finale.
- **Demi-tour au départ** : au clic sur une bulle de domaine **sauf la photographie**, `rentrer()`
  fait reculer le tracé jusqu'à zéro en `RETOUR` (380 ms), pointe comprise (elle refait le chemin
  en sens inverse). La variable `recul` bloque `dessiner()` pendant ce temps : la flèche n'est donc
  plus à l'écran pendant la transition de page, et le scroll ne la ramène pas. `pageshow` remet
  `recul` à faux au retour depuis le cache du navigateur. Le clic n'est pas intercepté (pas de
  `preventDefault`) : les transitions existantes continuent de faire la navigation.
- Quand la pointe arrive (`u ≥ 0,985`), `initFlecheGuide` émet l'événement **`fleche-guide:arrivee`**.
  `initFlecheOrbitale` (la flèche rouge) l'attend : sans cet événement, elle reste invisible même
  si le curseur est au niveau du titre. Supprimer ou renommer l'événement empêche la flèche rouge
  d'apparaître ; inversement, si le guide ne tourne pas (pas de `#hero-title`, mouvement réduit),
  la flèche rouge garde son ancien déclenchement.

---

## 8. Contact et 404

- `contact.html` : page statique, aucun contenu structuré. Le contact passe par un
  `mailto:` (`gandou.christian@gmail.com`) et des liens externes.
  - **L'arrivée des blocs n'est plus déclenchée par le défilement** (23/11). Tout passe par une
    seule fonction, `apparait(sel, base, ecart)` dans le `<script>` de la page : état de départ
    explicite, `delay` en cascade, **sans `scrollTrigger`**. Seuls les blocs dont le haut est
    déjà dans la fenêtre au moment du départ (`getBoundingClientRect().top <= innerHeight`)
    jouent l'animation ; les autres reçoivent directement leur état final (`gsap.set`).
    Conséquence voulue par Ian : on ne voit le geste qu'à l'ouverture de la page, le reste
    est déjà en place dès qu'on descend. Pour revenir à des apparitions au scroll, il faudrait
    remettre un `scrollTrigger` (`top 88%`, `once`) et retirer le test de fenêtre. La version
    posée est le **Skew Kinetic** (départ `y: 40`, `skewY: 3°`, ancrage en haut à
    gauche, 0,8 s en `expo.out` — c'est exactement `cubic-bezier(0.16, 1, 0.3, 1)` —, fondu en
    0,4 s). La variante **mise au point optique** (flou 8 px + `scale(1.04)` → net) avait sa copie
    jetable dans `contact-focus.html` : Ian a **choisi le Skew Kinetic** et le fichier a été
    supprimé le 21/11. Ne pas recréer de variante d'essai dans une page en ligne. Une
    modification de texte se
  fait directement dans le HTML ; ne pas ajouter de formulaire (il n'y a pas de backend).
  - **Le CV est décomposé dans la page** (`.cv` → `.cv-tete` / `.cv-corps`), son CSS vit dans
    `styles.css` (chercher `/* ---------- CV décomposé dans la page ---------- */`). C'est une
    **maquette** : elle doit dire la même chose que le PDF téléchargeable, mais elle n'est pas
    générée depuis lui — une nouvelle version du CV se reporte à la main dans le HTML. Ne pas
    changer sa mise en page pour y faire tenir du texte : raccourcir le texte.
    **Tout y est d'aplomb** : le 21/11 Ian a fait retirer *toutes* les rotations du bloc `.cv` —
    le scotch, l'étiquette « curriculum vitæ », le nom, les titres de section et leur numéro,
    les pastilles de date, la note manuscrite et les puces en losange (redevenues des carrés).
    Ne pas les remettre : « je veux rien de penché ».
  - **Téléchargement** : `.cv-telecharger` dans l'en-tête du CV (`href` vers
    `images/cv/CV%20alternance…pdf`, chemins encodés comme partout, `download` pour donner un
    nom propre au fichier). Le PDF doit être **suivi par git**, sinon le bouton renvoie une 404
    sur GitHub Pages. Il est calé à droite par le `space-between` déjà présent sur `.cv-tete`.
- `404.html` : page autonome pour GitHub Pages (servie automatiquement pour toute URL
  inconnue). Elle réutilise `styles.css` et la barre de navigation. Son CSS est dans un `<style>`
  inline. Elle est en `noindex` : ne pas l'indexer.
  - **Une seule action** : le bouton `Retour à l'accueil` (`.erreur-btn`) et la flèche rouge
    `.erreur-fleche` qui le désigne. Ian a fait retirer « Choix des domaines » et les quatre
    boutons de domaine (`.retour-domaines` / `.subnav-btn` n'y servent plus) : ne pas les
    remettre, et ne pas dupliquer dans le contenu ce que dit déjà la barre.
  - **Les étoiles tournent** : 12 étoiles violettes réparties sur deux anneaux
    (`.erreur-cercle` porte la rotation, `.erreur-orbite` le rayon, `.erreur-etoile` le motif),
    chacune avec sa durée et son retard (`--duree`, `--retard`) pour qu'elles ne soient pas en
    cortège. Le sens est **horaire** : la rotation va de 0 à 360°, et l'étoile porte une
    contre-rotation (`erreur-contre-tour`) pour rester droite. Les rayons sont donnés en
    `min(40vh, 29vw)` / `min(46vh, 33vw)` : c'est ce qui garde le centre vide **et** les étoiles
    dans l'écran quelle que soit la fenêtre. Vérifié : sur un tour complet, aucune étoile ne
    croise un bloc de contenu (`erreur-manuscrit`, `erreur-numero`, `erreur-titre`,
    `erreur-texte`, `erreur-actions`, `erreur-pied`). Réduire un rayon les fait passer sur le
    texte ; l'augmenter les fait sortir du cadre (la section est en `overflow: hidden`).
    `prefers-reduced-motion` coupe tout.

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
2. **Fichiers orphelins** — **nettoyés le 21/11** : `_archive/`, `photo-pro.html`,
   `photo-expressive.html`, `images/manifest.json`, la vidéo de test et **127 images jamais
   citées** (108 Mo, dont la moitié de `images/plastique/` et la série d'imports de
   `images/accueil/`) ont été supprimés. Un fichier est « orphelin » quand son **nom de fichier
   n'apparaît dans aucune page, feuille ou script** (les chemins sont construits en littéral,
   même quand le dossier est dans une variable : `IMG + 'fichier.jpg'`) ; refaire ce contrôle
   avant toute nouvelle suppression, et garder le fichier en cas de doute.
3. **Pieds de page incohérents** : absents sur `index.html` et `contact.html`, présents ailleurs.
4. **Accessibilité / SEO** : pas de `meta description` ni Open Graph sauf contact, trois `h1`
   sur `photographie.html`, focus clavier à revoir par endroits.
5. **Mobile** : le responsive est prévu en fin de projet ; ne pas entreprendre de refonte
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
