-- DEV ONLY: put demo students back to their first-login state.
UPDATE users SET password_hash = (SELECT password_hash FROM users WHERE email = 'coach@blado.test'), must_change_password = 1 WHERE email IN ('mariana@blado.test', 'andres@blado.test');
DELETE FROM auth_sessions;
DELETE FROM rate_limits;
