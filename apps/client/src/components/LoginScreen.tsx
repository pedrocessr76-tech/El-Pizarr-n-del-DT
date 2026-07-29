import { useState } from 'react';

interface LoginScreenProps {
  onLogin?: (username: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      onLogin(username || 'DT Pro');
    }
  };

  return (
    <main className="relative bg-[#111316] min-h-screen w-full flex items-center justify-center overflow-hidden font-sans text-[#e2e2e6]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#39ff14]/5 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00e3fd]/5 blur-[150px]"></div>
        {/* Grid Overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)"></rect>
        </svg>
      </div>

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-[440px] px-8">
        <div className="bg-[#1e2023]/80 backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl overflow-hidden p-8">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 mb-4 relative">
              <div className="absolute inset-0 bg-[#39ff14]/20 blur-xl rounded-full animate-pulse"></div>
              <img
                alt="El Pizarrón del DT Logo"
                className="relative w-full h-full object-contain"
                src="https://lh3.googleusercontent.com/aida/AP1WRLt2arhaseVvop9MHRP9DiFnCDYGYTiQ-8mLBYDI4pwK1b6gEaz0N-CPHKoYou-NC-yeoW_0ld2aMbsvkUv2OF_6U33QA-1O5a67efWmV6XOg7d4Z2N5I_558aOteJR9l8SnLQWnkuOCoIj5C_uxHaP2K4zJJha3l7nC3nYCv21GFRcCAI1r95EviZLXEf0XfzZ687dzeH_dnCxtVuTV12RxMAfwuWe1KFTar6ZFKSvbiZm4G4D7XV9xCm4"
              />
            </div>
            <div className="text-center">
              <span className="text-[#39ff14] text-xs font-semibold uppercase tracking-[0.3em] mb-1 block">
                Intelligence System
              </span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Acceso Táctico</h1>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username/Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#baccb0] ml-1" htmlFor="username">
                Usuario / Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#39ff14] transition-colors">
                  person
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="coach.javier@el-pizarron.com"
                  className="w-full bg-[#282a2d] border-none rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#39ff14]/50 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#baccb0] ml-1" htmlFor="password">
                Contraseña
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#39ff14] transition-colors">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#282a2d] border-none rounded-lg py-3 pl-12 pr-12 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-[#39ff14]/50 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#39ff14] hover:bg-[#79ff5b] text-[#053900] font-bold text-lg py-3 rounded-lg transition-all shadow-[0_0_20px_-5px_#39ff14] hover:shadow-[0_0_30px_-2px_#39ff14] active:scale-[0.98] mt-2 cursor-pointer"
            >
              INICIAR SESIÓN
            </button>
          </form>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-gray-400">
              ¿Nuevo en el cuerpo técnico?{' '}
              <a className="text-[#39ff14] font-semibold hover:underline ml-1" href="#signup">
                Crear una cuenta
              </a>
            </p>
          </div>
        </div>

        {/* System Status Metadata */}
        <div className="mt-4 flex justify-between px-1 font-mono text-[10px] text-gray-500/40 uppercase tracking-widest">
          <span>Secure Node: 0x82f1</span>
          <span>v4.2.0-STABLE</span>
        </div>
      </div>
    </main>
  );
}
