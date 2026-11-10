# Points de sauvegarde du portfolio

Ce dossier est un dépôt git local. Il sert de « CTRL Z » sur les interventions de l'agent.

## Convention

À chaque intervention sur le code :

1. `checkpoint avant : <ce qui est demandé>` — l'état tel qu'il est avant que quoi que ce soit soit modifié.
2. Les modifications.
3. Un commit qui décrit ce qui a changé.

Le commit « checkpoint avant » est donc **toujours** le point de retour.

## Commandes utiles

```bash
# Voir l'historique (le plus récent en haut)
git log --oneline

# Voir ce qui a changé dans le dernier passage
git diff HEAD~1

# Annuler le dernier passage (garde une possibilité de revenir)
git revert --no-commit HEAD && git commit -m "annulation du dernier passage"

# Revenir brutalement à l'état d'avant le dernier passage (écrase les modifs non enregistrées)
git reset --hard HEAD~1

# Récupérer UN seul fichier depuis un point de sauvegarde, sans toucher au reste
git checkout <identifiant-du-commit> -- styles.css

# Voir l'état actuel : fichiers modifiés mais pas encore enregistrés
git status --short
```

Remplacer `<identifiant-du-commit>` par les 7 premiers caractères affichés par `git log --oneline`.

## À savoir

- Les fichiers sont suivis tels quels (`core.autocrlf=false`) : une restauration redonne le fichier à l'octet près, sans conversion de fins de ligne.
- `.gitignore` exclut uniquement les fichiers système (`Thumbs.db`, `desktop.ini`, `*.tmp`).
- Le dépôt n'est lié à aucun serveur distant : tout reste sur cette machine.
