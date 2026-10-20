import React, { useState } from 'react';
import { Heart, Search, PlusCircle, ShieldAlert, Phone, MapPin, Filter, PawPrint } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('adoption');
  const [searchTerm, setSearchTerm] = useState('');

  // Dados de exemplo de animais em Ribeirão das Neves
  const [pets] = useState([
    {
      id: 1,
      name: 'Thor',
      type: 'dog',
      status: 'adoption',
      neighborhood: 'Justinópolis',
      description: 'Macho dócil, castrado e vacinado. Adora brincar com crianças.',
      contact: '(31) 99999-8888',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 2,
      name: 'Mel',
      type: 'cat',
      status: 'lost',
      neighborhood: 'Sevilha A',
      description: 'Desapareceu dia 18/10 perto da praça. Usa coleira vermelha.',
      contact: '(31) 98888-7777',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 3,
      name: 'Bob',
      type: 'dog',
      status: 'adoption',
      neighborhood: 'Centro',
      description: 'Resgatado da rua, muito carinhoso. Precisa de um lar amoroso.',
      contact: '(31) 97777-6666',
      image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400'
    }
  ]);

  const filteredPets = pets.filter(pet => {
    const matchesTab = activeTab === 'all' || pet.status === activeTab;
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pet.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      {/* Cabeçalho */}
      <header className="bg-emerald-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PawPrint className="h-8 w-8 text-emerald-200" />
            <div>
              <h1 className="text-xl font-bold leading-tight">Amigo do Igor</h1>
              <p className="text-xs text-emerald-100">Proteção Animal • Ribeirão das Neves</p>
            </div>
          </div>
          <button className="bg-white text-emerald-700 font-semibold px-3 py-1.5 rounded-xl text-sm flex items-center space-x-1 shadow-sm hover:bg-emerald-50 transition">
            <PlusCircle className="h-4 w-4" />
            <span>Cadastrar</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner Informativo */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md">
          <h2 className="text-xl font-bold mb-2">Unidos pela causa animal em Neves 🐾</h2>
          <p className="text-sm text-emerald-50 leading-relaxed mb-4">
            Encontre animais para adoção responsável ou ajude a reencontrar bichinhos perdidos na nossa região.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full backdrop-blur-sm">Adoção</span>
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full backdrop-blur-sm">Resgate</span>
            <span className="bg-white/20 text-xs px-3 py-1 rounded-full backdrop-blur-sm">Comunidade</span>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nome ou bairro (ex: Sevilha, Justinópolis)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('adoption')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'adoption' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🐶 Adoção Responsável
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'lost' 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🔍 Animais Perdidos
            </button>
          </div>
        </div>

        {/* Lista de Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="relative h-48 w-full">
                <img 
                  src={pet.image} 
                  alt={pet.name} 
                  className="w-full h-full object-cover"
                />
                <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-sm ${
                  pet.status === 'adoption' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}>
                  {pet.status === 'adoption' ? 'Para Adoção' : 'Perdido'}
                </span>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{pet.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {pet.neighborhood}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {pet.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <a 
                    href={`https://wa.me/55${pet.contact.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>Entrar em Contato</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
