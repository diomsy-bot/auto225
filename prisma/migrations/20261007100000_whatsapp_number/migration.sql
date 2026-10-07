-- Numéro WhatsApp du site : +225 05 55 79 16 10. Remplace aussi la valeur
-- enregistrée depuis Administration > Paramètres, si elle existe.
UPDATE "Setting" SET "value" = jsonb_set("value"::jsonb, '{whatsapp}', '"2250555791610"')
WHERE "key" = 'contact';
