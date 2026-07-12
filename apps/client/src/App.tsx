import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('Cargando...');

  useEffect(() => {
    fetch('http://localhost:3000')
      .then((res) => res.text())
      .then((text) => setMessage(text))
      .catch(() => setMessage('No se pudo conectar con NestJS'));
  }, []);

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <h1>El Pizarrón del DT</h1>
      <p>Monorepo con NestJS + React + TypeScript</p>
      <p>Respuesta del backend: {message}</p>
    </main>
  );
}

export default App;
