-- Vincular a loja existente ao usuário correto
UPDATE lojistas 
SET user_id = '2fef152e-d2c8-4e76-b31e-d36d7c9bff12',
    email = 'gilmedeiros75@hotmail.com'
WHERE id = '75f9c894-ba26-4eeb-a2fd-fdd5aafe97b5' 
AND nome_loja = 'Loja Teste Gil';