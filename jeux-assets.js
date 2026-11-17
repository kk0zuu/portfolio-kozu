/* Assets du « Rayon perdu » — une seule source de vérité, réutilisée
   par le jeu et par le carnet de conception affiché sous la fenêtre. */
(function () {
  'use strict';

  /* une lettre = un pixel, '.' = transparent */
  var PALETTE = {
    k: '#0b0b0c',
    w: '#f4f4f4',
    m: '#ff00ff',
    g: '#8bd450',
    o: '#c9a227',
    b: '#8a5a2b',
    c: '#5fd3e0',
    d: '#1b1b1f',
    e: '#e8801f',
    s: '#8a5a3b',
    v: '#243024',
    n: '#4a4a52',
    p: '#e4f6d0',
    q: '#f7f3ea',
    u: '#c8c2b6',
    j: '#7a756c',
    B: '#9c1dbd',
    C: '#ff5ce1',
    D: '#4f7f2e',
    G: '#f2d16b',
    P: '#a8dbe8',
    R: '#b23a2e'
  };

  var COULEURS = [
    { cle: 'k', nom: 'Encre', valeur: '#0b0b0c' },
    { cle: 'd', nom: 'Cheveux', valeur: '#1b1b1f' },
    { cle: 'e', nom: 'Bandeau', valeur: '#e8801f' },
    { cle: 's', nom: 'Peau', valeur: '#8a5a3b' },
    { cle: 'v', nom: 'Veste', valeur: '#243024' },
    { cle: 'b', nom: 'Bois', valeur: '#8a5a2b' },
    { cle: 'o', nom: 'Or', valeur: '#c9a227' },
    { cle: 'm', nom: 'Magenta', valeur: '#ff00ff' },
    { cle: 'g', nom: 'Vert', valeur: '#8bd450' },
    { cle: 'c', nom: 'Cyan', valeur: '#5fd3e0' },
    { cle: 'n', nom: 'Métal', valeur: '#4a4a52' },
    { cle: 'p', nom: 'Os', valeur: '#e4f6d0' },
    { cle: 'q', nom: 'Papier', valeur: '#f7f3ea' },
    { cle: 'j', nom: 'Crayon', valeur: '#7a756c' },
    { cle: 'D', nom: 'Vert foncé', valeur: '#4f7f2e' },
    { cle: 'R', nom: 'Rouge brique', valeur: '#b23a2e' },
    { cle: 'w', nom: 'Blanc', valeur: '#f4f4f4' }
  ];

  /* 12 x 16, agrandi x2 dans le jeu */
  var JOUEUR = [
    '....dddd....',
    '...dddddd...',
    '...dddddd...',
    '...eeeeee...',
    '...ssssss...',
    '...skssks...',
    '...ssssss...',
    '...vvvvvv...',
    '..vvvvvvvv..',
    '..vvvvvvvv..',
    '..vvvvvvvv..',
    '...vvvvvv...',
    '...dd..dd...',
    '...dd..dd...',
    '...dd..dd...',
    '...kk..kk...'
  ];

  var COFFRE_FERME = [
    '..........',
    '..........',
    '..bbbbbb..',
    '.bbbbbbbb.',
    '.bboooobb.',
    '.bbbbbbbb.',
    '.bbboobbb.',
    '.bbbbbbbb.',
    '.kkkkkkkk.',
    '..........'
  ];

  var COFFRE_OUVERT = [
    '..........',
    '.bboooobb.',
    '.bbbbbbbb.',
    '.bbbbbbbb.',
    '.bbboobbb.',
    '.bbbbbbbb.',
    '.kkkkkkkk.',
    '..........',
    '..........',
    '..........'
  ];

  var PORTE_FERMEE = [
    '..nnnnnn..',
    '.nddddddn.',
    '.nddddddn.',
    '.nddddddn.',
    '.nddddddn.',
    '.nddddddn.',
    '.nddddddn.',
    '.nddddddn.',
    '.ndddodnn.',
    '.nnnnnnnn.'
  ];

  var PORTE_OUVERTE = [
    '..mmmmmm..',
    '.mkkkkkkm.',
    '.mkkkkkkm.',
    '.mkkkkkkm.',
    '.mkkkkkkm.',
    '.mkkkkkkm.',
    '.mkkkkkkm.',
    '.mkkkkkkm.',
    '.mkkkkkkm.',
    '.mmmmmmmm.'
  ];

  /* la côte de Bobby l’hybride, qui sert d’épée */
  var COTE = [
    '............',
    '............',
    '..pp....pp..',
    '.pppp.ppppp.',
    '.pppppppppp.',
    '.pppppppppp.',
    '.pppp.ppppp.',
    '..pp....pp..',
    '............',
    '............'
  ];

  /* les blobs, en deux temps de respiration */
  var BLOB_A = [
    '..........',
    '..mmmmmm..',
    '.mmmmmmmm.',
    '.mkwmkwmm.',
    '.mmmmmmmm.',
    '..mmmmmm..',
    '...mmmm...',
    '..........'
  ];

  var BLOB_B = [
    '..........',
    '..........',
    '.mmmmmmmm.',
    'mmmmmmmmmm',
    'mmkwmkwmmm',
    '.mmmmmmmm.',
    '..mmmmmm..',
    '..........'
  ];

  /* cœurs : même géométrie, deux lettres pour plein / vide */
  var COEUR = [
    '.mm..mm.',
    'mmmmmmmm',
    'mwwmmmmm',
    'mmmmmmmm',
    '.mmmmmm.',
    '..mmmm..',
    '...mm...'
  ];

  var COEUR_VIDE = [
    '.nn..nn.',
    'nnnnnnnn',
    'nddnnnnn',
    'nnnnnnnn',
    '.nnnnnn.',
    '..nnnn..',
    '...nn...'
  ];

  var TRESORS = [
    {
      nom: 'Un t-shirt kozu™, encore chaud.',
      icone: [
        '....................',
        '....................',
        '.....kkkkkkkkkk.....',
        '..kkkkwwwwwwwwkkkk..',
        '.kwwwwwwwwwwwwwwwwk.',
        '.kwwwwwwkkkkwwwwwwk.',
        '.kwwwwwwwkkwwwwwwwk.',
        '..kwwwwwwwwwwwwwwk..',
        '..kwwwmmmmmmmmwwwk..',
        '..kwwwmBBBBBBmwwwk..',
        '..kwwwmBCBBCCmwwwk..',
        '..kwwwmBBBBBBmwwwk..',
        '..kwwwmmmmmmmmwwwk..',
        '..kwwwwwwwwwwwwwwk..',
        '..kwwwwwwwwwwwwwwk..',
        '..kwwwwwwwwwwwwwwk..',
        '..kwuuuuuuuuuuuuuk..',
        '..kkuuuuuuuuuuuukk..',
        '...kkkkkkkkkkkkkk...',
        '....................'
      ]
    },
    {
      nom: 'L’affiche « Les moches sont de sortie ».',
      icone: [
        '....................',
        '.kkkkkkkkkkkkkkkkkk.',
        '.kmmmmmmmmmmmmmmmmk.',
        '.kmmkkkkkkkkkkkkmmk.',
        '.kmkkkkkkkkkkkkkkmk.',
        '.kmkkkwwkkkkwwkkkmk.',
        '.kmkkkwwkkkkwwkkkmk.',
        '.kmkkkkkkkkkkkkkkmk.',
        '.kmkkkkkkkkkkkkkkmk.',
        '.kmkkkkkkkwkkkkkkmk.',
        '.kmkkkkkkwwkkkkkkmk.',
        '.kmkkkkkkkkkkkkkkmk.',
        '.kmkkkkkkkkkkkkkkmk.',
        '.kmmkkkkkkkkkkkkmmk.',
        '.kmmmBBmmmmmmBBmmmk.',
        '.kmmmmmmmmmmmmmmmmk.',
        '.kwwwwwwwwwwwwwwwwk.',
        '.kwkkkkkkkkkkkkkkwk.',
        '.kwwwwwwwwwwwwwwwwk.',
        '.kkkkkkkkkkkkkkkkkk.'
      ]
    },
    {
      nom: 'Un polaroïd pris de travers.',
      icone: [
        '....................',
        '..kkkkkkkkkkkkkkkk..',
        '..kwwwwwwwwwwwwwwk..',
        '..kwwwwwwwwwwwwwwk..',
        '..kwkkkkkkkkkkkkwk..',
        '..kwkcccccccccckwk..',
        '..kwkccccmmcccckwk..',
        '..kwkccccmmmmcckwk..',
        '..kwkccccmmcccckwk..',
        '..kwkccccmmcccckwk..',
        '..kwkcccccccccckwk..',
        '..kwkDDDDDDDDDDkwk..',
        '..kwkDDDDDDDDDDkwk..',
        '..kwkkkkkkkkkkkkwk..',
        '..kwwwwwwwwwwwwwwk..',
        '..kwwwwwwwwwwwwwwk..',
        '..kwuuuuuuuuuuuuuk..',
        '..kwwwwwwwwwwwwwwk..',
        '..kkkkkkkkkkkkkkkk..',
        '....................'
      ]
    },
    {
      nom: 'Un rough d’O.K.O., annoté au crayon.',
      icone: [
        '....................',
        '..kkkkkkkkkkkkkkkk..',
        '..kqqqqqqqqqqqqqqk..',
        '..kqqqqqjjjjqqqqqk..',
        '..kqqqqjqqqqjqqqqk..',
        '..kqqqqjqkkqjqqqqk..',
        '..kqqqqjqqqqjqqqqk..',
        '..kqqqqqjjjjqqqqqk..',
        '..kqqqqqqjjqqqqqqk..',
        '..kqqqqqjjjjqqqqqk..',
        '..kqqqqjqqqqjqqqqk..',
        '..kqqqjqqqqqqjqqqk..',
        '..kqqqjqqqqqqjqqqk..',
        '..kqqqqjqqqqjqqqqk..',
        '..kqqqqqjjjjqqqqqk..',
        '..kqqqqqjqqjqqqqqk..',
        '..kqqqqqjqqjqqqqqk..',
        '..kuuuuuuuuuuuuuuk..',
        '..kkkkkkkkkkkkkkkk..',
        '....................'
      ]
    },
    {
      nom: 'Une pelote de fil magenta.',
      icone: [
        '....................',
        '.......kkkkkk.......',
        '.....kkmmmmmmkk.....',
        '....kmmCmmmmmmmk....',
        '...kmmCmmmmBmmmk....',
        '..kmmmCmmmmBmmmmk...',
        '..kmmmmCmmmmBmmmk...',
        '..kmmBmmCmmmBmmmmk..',
        '..kmmBmmmCmmBmmmmk..',
        '..kmmmBmmmCmmmmmk...',
        '..kmmmmBmmmmBmmmk...',
        '...kmmmmBmmmmBmk....',
        '....kmmmmBmmmmk.....',
        '.....kkmmmmmkk......',
        '.......kkkkk........',
        '..........mm........',
        '........mm..........',
        '......mm............',
        '....mm..............',
        '....................'
      ]
    },
    {
      nom: 'La statue de 2 m, en réduction.',
      icone: [
        '....................',
        '.......kkkkkk.......',
        '......kwqqqqwk......',
        '......kwqqqqqk......',
        '......kqqqqqqk......',
        '.......kqqqqk.......',
        '......kqqqqqqk......',
        '.....kqqqqqqqqk.....',
        '....kqqqqqqqqqqk....',
        '....kqqqqqqqqqqk....',
        '.....kqqqqqqqqk.....',
        '......kqqqqqqk......',
        '.......kqqqqk.......',
        '......kuuuuuuk......',
        '.....kuuuuuuuuk.....',
        '....kuuuuuuuuuuk....',
        '....kkuuuuuuuukk....',
        '.....kkkkkkkkkk.....',
        '....knnnnnnnnnnk....',
        '....kkkkkkkkkkkk....'
      ]
    },
    {
      nom: 'Un négatif oublié dans la chambre noire.',
      icone: [
        '....................',
        '..kkkkkkkkkkkkkkkk..',
        '..kwkwkwkwkwkwkwkk..',
        '..kkkkkkkkkkkkkkkk..',
        '..kmmmmkRRRRkPPPPk..',
        '..kmCCmkRRRRkPPcck..',
        '..kmCCmkRRRRkPPcck..',
        '..kmmmmkRRRRkPPPPk..',
        '..kmCCmkRRRRkPPPPk..',
        '..kkkkkkkkkkkkkkkk..',
        '..kwkwkwkwkwkwkwkk..',
        '..kkkkkkkkkkkkkkkk..',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................'
      ]
    },
    {
      nom: 'Un storyboard, page 12.',
      icone: [
        '....................',
        '..kkkkkkkkkkkkkkkk..',
        '..kqqqqqqqqqqqqqqk..',
        '..kkkkkkkqkkkkkkqk..',
        '..kkjjjkkqkjjjjkqk..',
        '..kkjjjkkqkjjjjkqk..',
        '..kkkkkkkqkkkkkkqk..',
        '..kqqqqqqqqqqqqqqk..',
        '..kkkkkkkqkkkkkkqk..',
        '..kkjjjkkqkjjjjkqk..',
        '..kkjjjkkqkjjjjkqk..',
        '..kkkkkkkqkkkkkkqk..',
        '..kqqqqqqqqqqqqqqk..',
        '..kuuuuuuuuuuuuuuk..',
        '..kkkkkkkkkkkkkkkk..',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................'
      ]
    },
    {
      nom: 'Un ticket du festival, 2022.',
      icone: [
        '....................',
        '....................',
        '..kkkkkkkkkkkkkkkk..',
        '..kooooooooookoook..',
        '..kooooooooookoook..',
        '..kommmmmmmokooook..',
        '..komBBBBBBokooook..',
        '..komBBBBBBokooook..',
        '..kooooooooookoook..',
        '..kooooooooookoook..',
        '..kooooooooookoook..',
        '..kooooooooookoook..',
        '..kkkkkkkkkkkkkkkk..',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................'
      ]
    },
    {
      nom: 'Un badge « prix de la technique ».',
      icone: [
        '....................',
        '.......kkkkkk.......',
        '.....kkmmmmmmkk.....',
        '....kmmmmmmmmmmk....',
        '...kmmkkkkkkkkmmk...',
        '...kmkoGGGGGokmmk...',
        '...kmkoGwGGwGokmk...',
        '...kmkoGGwGGGokmk...',
        '...kmkoGwGGwGokmk...',
        '...kmkoGGGGGokmmk...',
        '...kmmkkkkkkkkmmk...',
        '....kmmmmmmmmmmk....',
        '.....kkmmmmmmkk.....',
        '.......kmmmmk.......',
        '......kmmkkmmk......',
        '......kmmk.kmmk.....',
        '......kmmk.kmmk.....',
        '......kkkk.kkkk.....',
        '....................',
        '....................'
      ]
    }
  ];

  var NIVEAUX = [
    {
      nom: 'Rayon 01',
      plan: [
        '####################',
        '#..................#',
        '#..C..............C#',
        '#..................#',
        '#.....########.....#',
        '#.....########.....#',
        '#.....########.....#',
        '#.....########.....#',
        '#..................#',
        '#..C...........C...#',
        '#..P...........D...#',
        '####################'
      ]
    },
    {
      nom: 'Rayon 02',
      plan: [
        '####################',
        '#..................#',
        '#..C............C..#',
        '#....####..####....#',
        '#....#........#....#',
        '#....#..C..C..#....#',
        '#....#........#....#',
        '#....####..####....#',
        '#..................#',
        '#.......P..........#',
        '#..C............D..#',
        '####################'
      ]
    },
    {
      nom: 'Rayon 03',
      plan: [
        '####################',
        '#........#.........#',
        '#..C.....#.....C...#',
        '#........#.........#',
        '#....##..#..##.....#',
        '#....#......#......#',
        '#....#..C...#...C..#',
        '#....#......#......#',
        '#....##..#..##.....#',
        '#........#.........#',
        '#..P.....#.....C..D#',
        '####################'
      ]
    }
  ];

  var TUILES = {
    solA: '#191512',
    solB: '#1d1815',
    solGrain: 'rgba(255,255,255,0.035)',
    mur: '#3b2c22',
    murHaut: '#6b4d38',
    murBas: '#2a1f19'
  };

  /* dessine une grille de caractères sur un contexte 2D */
  function dessiner(ctx, sprite, x, y, echelle) {
    for (var r = 0; r < sprite.length; r++) {
      var ligne = sprite[r];
      for (var c = 0; c < ligne.length; c++) {
        var coul = PALETTE[ligne.charAt(c)];
        if (!coul) continue;
        ctx.fillStyle = coul;
        ctx.fillRect(Math.round(x + c * echelle), Math.round(y + r * echelle), echelle, echelle);
      }
    }
  }

  /* fabrique un canevas autonome à partir d'un sprite (pour les planches) */
  function vignette(sprite, echelle, fond) {
    var c = document.createElement('canvas');
    c.width = sprite[0].length * echelle;
    c.height = sprite.length * echelle;
    var g = c.getContext('2d');
    if (fond) {
      g.fillStyle = fond;
      g.fillRect(0, 0, c.width, c.height);
    }
    dessiner(g, sprite, 0, 0, echelle);
    return c;
  }

  window.JeuxAssets = {
    palette: PALETTE,
    couleurs: COULEURS,
    joueur: JOUEUR,
    coffreFerme: COFFRE_FERME,
    coffreOuvert: COFFRE_OUVERT,
    porteFermee: PORTE_FERMEE,
    porteOuverte: PORTE_OUVERTE,
    cote: COTE,
    blobA: BLOB_A,
    blobB: BLOB_B,
    coeur: COEUR,
    coeurVide: COEUR_VIDE,
    tresors: TRESORS,
    niveaux: NIVEAUX,
    tuiles: TUILES,
    dessiner: dessiner,
    vignette: vignette
  };
})();
