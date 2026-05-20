# Setup imprimante cuisine — Server Direct Print

**Solution :** L'imprimante thermique en cuisine polle elle-même un endpoint Vercel toutes les 10 secondes et récupère les tickets à imprimer. **Aucune intervention de l'iPad nécessaire** pendant le service.

## Hardware requis

L'imprimante doit être **connectée au réseau du resto** (Ethernet ou WiFi). Le Bluetooth seul ne suffit pas.

**Compatibles :**
- ✅ Epson TM-m30III-NT (Ethernet) — **recommandé**
- ✅ Epson TM-m30III-W (WiFi)
- ✅ Epson TM-m30III-H (USB + Ethernet + WiFi)
- ✅ Epson TM-m30II avec module Ethernet/WiFi
- ✅ Epson TM-m30 (M335A) avec module UB-E04 ou OT-WL05

**Pas compatibles :**
- ❌ Epson TM-m30-BT (Bluetooth uniquement)
- ❌ Imprimantes USB seules

## Étape 1 — Configurer la variable d'environnement Vercel

Avant tout, génère un token secret long (50+ chars) qui protège l'endpoint :

```bash
openssl rand -hex 32
# → ex: a3f9b8c2... (sauvegarde ce token)
```

Dans le dashboard Vercel du projet south-street-food :

1. Settings → Environment Variables
2. Ajoute :
   - **Name :** `PRINTER_POLL_SECRET`
   - **Value :** `<le token généré>`
   - **Environment :** Production + Preview + Development
3. Save
4. Redéploie le projet (ou attends le prochain push)

## Étape 2 — Connecter l'imprimante au réseau du resto

### Si Ethernet (recommandé)

1. Branche un câble RJ45 entre l'imprimante et la box internet (ou un switch du resto)
2. Allume l'imprimante (bouton derrière)
3. **Imprime la page de config** : appuie sur le bouton "Feed" derrière l'imprimante pendant ~3 secondes
4. Note l'**adresse IP** affichée sur la page (ex: 192.168.1.42)

### Si WiFi

1. Téléchargle l'app **Epson TM Utility** sur l'iPad (App Store)
2. Lance l'app, sélectionne l'imprimante
3. Configure les paramètres WiFi du resto (SSID + mot de passe)
4. L'imprimante redémarre et imprime sa nouvelle IP

## Étape 3 — Accéder à l'interface admin de l'imprimante

1. Sur un ordi ou iPad **sur le même réseau** que l'imprimante, ouvre Safari/Chrome
2. Tape l'URL : `http://<IP-imprimante>/` (ex: `http://192.168.1.42/`)
3. **Login par défaut :**
   - Username : `epson`
   - Password : laisser vide ou `epson`
4. Tu arrives sur l'interface admin Epson

## Étape 4 — Activer Server Direct Print

Dans l'interface admin Epson :

1. Menu : **TM-Intelligent** ou **Système** (selon firmware)
2. Sous-menu : **Server Direct Print** (parfois "Cloud Print" ou "Web Service")
3. Active : ☑️ **Activer Server Direct Print**
4. **URL du serveur :** colle l'URL de poll fournie dans `/admin/printer` :

```
https://southstreetfood.vercel.app/api/printer/poll?token=<TON_PRINTER_POLL_SECRET>
```

5. **Intervalle de polling :** `10` secondes
6. **Method :** `POST`
7. **Content-Type :** `text/xml; charset=utf-8`
8. **Format de réponse :** `ePOS-Print XML`
9. Save

## Étape 5 — Vérifier que ça marche

1. Sur l'interface admin Epson, vérifie le statut Server Direct Print : devrait afficher "Connected" ou "Polling" après quelques secondes
2. Va sur `https://southstreetfood.vercel.app/admin/printer` (login admin)
3. Clique **"Test impression"** → un job apparaît en queue
4. Attends 10-15 secondes
5. **Le ticket sort de l'imprimante cuisine** 🎉
6. Le job passe de "Pending" → "Envoyé" → "Imprimé" sur la page admin

## Étape 6 — Test en conditions réelles

1. Passe une vraie commande sur le storefront `/menu` (paie même 0.01€ si possible)
2. La commande passe en statut "paid"
3. **Trigger automatique :** un print_job est créé
4. Dans les 10 secondes, l'imprimante imprime le ticket
5. Vérifie sur `/admin/printer` que le job est bien "Imprimé"

## Troubleshooting

### Le job reste en "Pending" indéfiniment

→ L'imprimante ne polle pas l'URL. Vérifier :
- L'imprimante a accès à internet (test : ouvre `http://example.com` depuis l'admin Epson)
- L'URL de poll est correctement configurée (avec le bon token)
- Server Direct Print est bien activé
- Le firewall du resto autorise les connexions sortantes sur port 443

### Le job passe en "Envoyé" mais rien n'imprime

→ L'imprimante reçoit le XML mais ne le comprend pas. Vérifier :
- Le format de réponse est bien "ePOS-Print XML"
- L'imprimante a du papier
- Le firmware est à jour (Epson Customer Support si nécessaire)

### Ticket imprime mais mal formatté

→ Tester avec un autre rouleau papier 80mm (peut-être un mauvais lot)
→ Vérifier la calibration de l'imprimante : maintenir le bouton Feed 5 secondes au démarrage

### Le job passe en "Échec"

→ Vérifie l'erreur affichée sur `/admin/printer` (colonne `lastError`)
→ Clic **"Retry"** pour réessayer
→ Si répétitif : reset du firmware imprimante

## Architecture technique

```
┌─────────────────┐
│ Client commande │  → /api/orders
│  (storefront)   │     ↓
└─────────────────┘     status='paid'
                        ↓
                  ┌────────────────────┐
                  │ Trigger DB Supabase│
                  │  → INSERT print_job│
                  │  (status=pending)   │
                  └────────────────────┘
                        ↓
                  ┌────────────────────────────┐
                  │ Imprimante cuisine         │
                  │  POST /api/printer/poll    │  ← toutes les 10s
                  │  (avec token)              │
                  └────────────────────────────┘
                        ↓
                  ┌────────────────────────────┐
                  │ /api/printer/poll          │
                  │  - récupère plus ancien job│
                  │  - status: pending→in_flight│
                  │  - génère XML ePOS-Print   │
                  │  - retourne au printer     │
                  └────────────────────────────┘
                        ↓
                  ┌────────────────────────────┐
                  │ Imprimante exécute le XML  │
                  │  → ticket sort 🖨️          │
                  │  → POST /api/printer/done  │
                  │    (confirmation success)  │
                  └────────────────────────────┘
                        ↓
                  ┌────────────────────────────┐
                  │ /api/printer/done          │
                  │  - status: in_flight→printed│
                  └────────────────────────────┘
```

## Monitoring

Le dashboard `/admin/printer` montre en temps réel :
- Nombre de jobs en attente
- Jobs envoyés (en cours d'impression)
- Jobs imprimés (success)
- Jobs en échec (avec raison)

Bouton **"Retry"** pour ré-essayer les jobs ratés.
Bouton **"Test impression"** pour vérifier la chaîne sans passer commande.

## Sécurité

- L'endpoint `/api/printer/poll` est protégé par `PRINTER_POLL_SECRET` (token long dans l'URL)
- L'endpoint ne retourne QUE des tickets de commande (info non sensible)
- RLS Supabase : seul admin/kitchen peut voir la table `print_jobs`
- Pas de stockage de données client sensibles dans le payload XML

## FAQ

**Q : Et si l'imprimante tombe en panne pendant le service ?**
R : Les jobs s'accumulent en queue (`pending`). Quand l'imprimante revient, elle dépile tout.

**Q : Et si la commande est annulée après le print ?**
R : Le ticket est déjà sorti, mais c'est OK : la cuisine voit l'annulation sur leur board en temps réel.

**Q : Plusieurs imprimantes en cuisine ?**
R : Possible — chaque imprimante polle indépendamment. La logique `in_flight` empêche le double-print.

**Q : Et si Vercel est down ?**
R : L'imprimante continue de poller mais ne reçoit rien. Quand Vercel revient, elle dépile la queue accumulée.
