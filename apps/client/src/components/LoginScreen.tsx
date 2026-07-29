import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email || 'Coach Javier');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#111316',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#e2e2e6',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Stadium Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/images/stadium_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.25,
          filter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      />

      {/* Decorative Subtle Tactical Wave SVG */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
        preserveAspectRatio="none"
        viewBox="0 0 1000 1000"
      >
        <path d="M-100,550 Q450,200 1100,750" fill="none" stroke="#39ff14" strokeDasharray="6 6" strokeWidth="1.5" />
      </svg>

      {/* Centered Login Card - Exact 1-to-1 Match with image_9.png */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '400px',
          maxWidth: '92vw',
          backgroundColor: '#1e2023',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          margin: 'auto',
        }}
      >
        {/* Header & Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Neon Glow behind logo */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(57, 255, 20, 0.2)', filter: 'blur(20px)', borderRadius: '9999px' }} />
            <img
              alt="El Pizarrón del DT Logo"
              src="https://lh3.googleusercontent.com/aida/AP1WRLt2arhaseVvop9MHRP9DiFnCDYGYTiQ-8mLBYDI4pwK1b6gEaz0N-CPHKoYou-NC-yeoW_0ld2aMbsvkUv2OF_6U33QA-1O5a67efWmV6XOg7d4Z2N5I_558aOteJR9l8SnLQWnkuOCoIj5C_uxHaP2K4zJJha3l7nC3nYCv21GFRcCAI1r95EviZLXEf0XfzZ687dzeH_dnCxtVuTV12RxMAfwuWe1KFTar6ZFKSvbiZm4G4D7XV9xCm4"
              style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(57, 255, 20, 0.4))' }}
            />
          </div>

          <span style={{ color: '#39ff14', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 800, marginBottom: '4px', display: 'block' }}>
            INTELLIGENCE SYSTEM
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            Acceso Táctico
          </h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Username/Email Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="email" style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db', marginLeft: '2px' }}>
              Usuario / Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', color: '#9ca3af', fontSize: '20px', pointerEvents: 'none' }}>
                person
              </span>
              <input
                id="email"
                placeholder="coach.javier@el-piza..."
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#282a2d',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 14px 12px 44px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="password" style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db', marginLeft: '2px' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '14px', color: '#9ca3af', fontSize: '20px', pointerEvents: 'none' }}>
                lock
              </span>
              <input
                id="password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#282a2d',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 44px 12px 44px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: '#39ff14', width: '16px', height: '16px' }} />
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Mantener sesión</span>
            </label>
            <a href="#" style={{ fontSize: '12px', color: '#00e3fd', textDecoration: 'none', fontWeight: 600 }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#39ff14',
              color: '#053900',
              fontWeight: 900,
              fontSize: '14px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(57, 255, 20, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '6px',
            }}
          >
            INICIAR SESIÓN
          </button>
        </form>

        {/* Footer Actions */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
            ¿Nuevo en el cuerpo técnico?{' '}
            <a href="#" style={{ color: '#39ff14', fontWeight: 800, textDecoration: 'none', marginLeft: '4px' }}>
              Crear una cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
