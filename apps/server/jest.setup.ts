// Secretos de prueba (sólo para jest). Los módulos auth/notifications hacen
// throw al importarse si no existe un secreto >= 32 caracteres; acá se provee
// uno de test antes de que se cargue cualquier módulo. Nunca se usan en runtime.
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-8f3a1c9e4b7d6a2f5c8e0b1a3d4f6c7a';
process.env.B2B_JWT_SECRET =
  process.env.B2B_JWT_SECRET || 'test-b2b-secret-7d2b4e8a1c5f9a3b6d0e2c8f4a5b7c1d';