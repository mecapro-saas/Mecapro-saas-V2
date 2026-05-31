// src/pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, MapPin } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    userType: 'MECHANIC',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    latitude: 0,
    longitude: 0,
    siret: '',
    phoneNumber: '',
    specialities: [] as string[],
  });
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      // Récupérer la géolocalisation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          registerUser({ ...formData, latitude, longitude });
        });
      } else {
        registerUser(formData);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  };

  const registerUser = async (data: any) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  };

  const specialitiesOptions = [
    'Moteur',
    'Boîte de vitesses',
    'Freins',
    'Suspension',
    'Électricité',
    'Carrosserie',
    'Pneus',
    'Révision',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <h1 className="text-3xl font-bold mb-2">MECAPRO</h1>
          <p className="text-gray-600 mb-8">Créer votre compte</p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type d'utilisateur */}
            <div>
              <label className="block text-sm font-medium mb-2">Je suis...</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="input"
              >
                <option value="MECHANIC">Un mécanicien poids lourds</option>
                <option value="COMPANY">Une entreprise de transport</option>
              </select>
            </div>

            {/* Infos personnelles */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            {/* SIRET pour entreprises */}
            {formData.userType === 'COMPANY' && (
              <div>
                <label className="block text-sm font-medium mb-2">SIRET</label>
                <input
                  type="text"
                  name="siret"
                  value={formData.siret}
                  onChange={handleChange}
                  className="input"
                  placeholder="XXXXXXXXXXXXXXX"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Sera vérifié via la base Sirene</p>
              </div>
            )}

            {/* Spécialités pour mécaniciens */}
            {formData.userType === 'MECHANIC' && (
              <div>
                <label className="block text-sm font-medium mb-2">Spécialités</label>
                <div className="grid grid-cols-2 gap-2">
                  {specialitiesOptions.map(spec => (
                    <label key={spec} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.specialities.includes(spec)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              specialities: [...prev.specialities, spec]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              specialities: prev.specialities.filter(s => s !== spec)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Localisation */}
            <div>
              <label className="block text-sm font-medium mb-2">Ville</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="Paris"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Téléphone</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="input"
                placeholder="+33 6 XX XX XX XX"
              />
            </div>

            {/* Mot de passe */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirmer</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? 'Inscription...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
