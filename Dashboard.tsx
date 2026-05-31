// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useAuthStore, User } from '../store/authStore';
import client from '../api/client';
import { Search, MapPin, Star, MessageSquare, Zap } from 'lucide-react';

interface Mechanic extends User {
  distance?: number;
  score?: number;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 50,
    specialities: [] as string[],
    minRating: 0,
  });

  const specialitiesOptions = [
    'Moteur', 'Boîte de vitesses', 'Freins', 'Suspension',
    'Électricité', 'Carrosserie', 'Pneus', 'Révision'
  ];

  const searchMechanics = async () => {
    setLoading(true);
    try {
      const response = await client.post('/matching/search', filters);
      setMechanics(response.data);
    } catch (error) {
      console.error('Erreur recherche:', error);
    }
    setLoading(false);
  };

  const contactMechanic = async (mechanicId: string) => {
    try {
      await client.post('/matching/contact', {
        mechanicId,
        message: 'Je suis intéressé par vos services',
      });
      alert('Mécanicien contacté !');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors du contact');
    }
  };

  useEffect(() => {
    searchMechanics();
  }, []);

  if (user?.userType !== 'COMPANY') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Accès réservé aux entreprises</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-gray-600">Bienvenue, {user.firstName}</p>
        </div>

        {/* Filtres */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Rechercher des mécaniciens</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Distance max (km)</label>
              <input
                type="number"
                value={filters.maxDistance}
                onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Note minimale</label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                className="input"
              >
                <option value={0}>Toutes les notes</option>
                <option value={3}>3+ ⭐</option>
                <option value={4}>4+ ⭐</option>
                <option value={4.5}>4.5+ ⭐</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Spécialités</label>
              <div className="flex flex-wrap gap-2">
                {specialitiesOptions.map(spec => (
                  <button
                    key={spec}
                    onClick={() => {
                      const newSpecialities = filters.specialities.includes(spec)
                        ? filters.specialities.filter(s => s !== spec)
                        : [...filters.specialities, spec];
                      setFilters({ ...filters, specialities: newSpecialities });
                    }}
                    className={`px-3 py-1 rounded text-sm ${
                      filters.specialities.includes(spec)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={searchMechanics}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Search size={20} />
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Résultats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mechanics.map((mechanic) => (
            <div key={mechanic.id} className="card p-6 hover:shadow-lg transition-shadow">
              {mechanic.profileImage && (
                <img
                  src={mechanic.profileImage}
                  alt={mechanic.firstName}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              )}

              <h3 className="text-lg font-bold mb-2">
                {mechanic.firstName} {mechanic.lastName}
              </h3>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  {mechanic.city} {mechanic.distance && `(${mechanic.distance.toFixed(1)} km)`}
                </div>

                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-500" />
                  {mechanic.averageRating > 0 ? (
                    <span>{mechanic.averageRating.toFixed(1)}/5 ({mechanic.totalRatings})</span>
                  ) : (
                    <span>Pas d'avis</span>
                  )}
                </div>
              </div>

              {mechanic.specialities && mechanic.specialities.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">Spécialités:</p>
                  <div className="flex flex-wrap gap-1">
                    {mechanic.specialities.slice(0, 3).map(spec => (
                      <span key={spec} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => contactMechanic(mechanic.id)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  Contacter
                </button>
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {mechanics.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun mécanicien trouvé. Ajustez vos filtres.</p>
          </div>
        )}
      </div>
    </div>
  );
}
