# SSF Print Bridge

Petit daemon qui tourne sur un Mac/PC du resto et imprime les tickets sur
l'Epson TM-m30 quand une commande passe en `ready` cote cuisine.

## Pourquoi

Le firmware actuel de l'imprimante (`01.30`) ne supporte pas Server Direct
Print (la fonctionnalite ou l'imprimante va elle-meme chercher ses tickets
sur Vercel). Donc on fait l'inverse : le bridge ecoute Supabase et envoie
direct l'XML a l'imprimante via le LAN.

## Pre-requis

- Le Mac/PC doit etre **allume** pendant le service
- Sur le **meme WiFi** que l'imprimante (la box du resto)
- L'imprimante a du papier + est allumee

## Lancement

```bash
bun run bridge
```

Tu dois voir :

```
════════════════════════════════════════════
   SSF PRINT BRIDGE
════════════════════════════════════════════
Imprimante  : http://192.168.1.58/cgi-bin/epos/service.cgi?...
...
🟢 Bridge demarre. En attente de tickets...
✅ Imprimante joignable a 192.168.1.58
📡 Realtime branche
```

Si tu vois `⚠️ Imprimante NON joignable` → vérifie que le Mac est bien sur le
WiFi du resto (`Bbox-XXXXXXXX`).

## Stop

`Ctrl+C` dans le terminal.

## Variables

Si l'IP de l'imprimante change, edit `.env.local` :

```
PRINTER_IP=192.168.1.58
PRINTER_DEVICE_ID=local_printer
```

## Tournage permanent

Pour que ca tourne meme apres redemarrage du Mac, on peut creer un
LaunchAgent macOS. Voir [Apple docs](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html)
ou demander.

Pour l'instant, simple : tu ouvres Terminal au debut du service, tu lances
`bun run bridge`, tu laisses tourner. Tu fermes le soir.
