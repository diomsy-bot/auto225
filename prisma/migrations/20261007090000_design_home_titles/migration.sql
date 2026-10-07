-- Nouveau design : titres de l'accueil. Seuls les titres encore égaux aux valeurs
-- d'origine sont remplacés ; un texte modifié dans l'administration est conservé.
-- Les *astérisques* mettent un mot en valeur (orange).
UPDATE "HomeSection" SET "title" = 'Où allons-nous ?' WHERE "key" = 'search' AND "title" = 'Recherche rapide';
UPDATE "HomeSection" SET "title" = 'À chacun sa route.' WHERE "key" = 'featured' AND "title" = 'Nos véhicules à la une';
UPDATE "HomeSection" SET "subtitle" = '' WHERE "key" = 'featured' AND "subtitle" = 'Berlines, SUV, 4x4… pour tous vos besoins.';
UPDATE "HomeSection" SET "title" = 'Votre voiture peut aller *plus loin.*' WHERE "key" = 'paths' AND "title" = 'Trois façons de rouler avec AUTO225';
UPDATE "HomeSection" SET "title" = 'La prochaine est peut-être ici.' WHERE "key" = 'sale' AND "title" = 'Achetez ou vendez votre véhicule';
UPDATE "HomeSection" SET "title" = 'Votre trajet, en trois étapes.' WHERE "key" = 'steps' AND "title" = 'Réserver en 4 étapes';
UPDATE "HomeSection" SET "title" = 'Pourquoi choisir AUTO225 ?' WHERE "key" = 'advantages' AND "title" = 'Pourquoi choisir AUTO225';
UPDATE "HomeSection" SET "title" = 'Avant de prendre la route.' WHERE "key" = 'faq' AND "title" = 'Questions fréquentes';

-- Ordre du design (étapes avant la vente), uniquement si l'ordre d'origine n'a pas été modifié.
UPDATE "HomeSection" SET "position" = CASE "key" WHEN 'steps' THEN 3 WHEN 'sale' THEN 4 END
WHERE "key" IN ('steps', 'sale')
  AND (SELECT "position" FROM "HomeSection" WHERE "key" = 'sale') = 3
  AND (SELECT "position" FROM "HomeSection" WHERE "key" = 'steps') = 4;
