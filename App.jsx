import React, { useState, useEffect } from 'react';
import { Heart, Search, PlusCircle, Phone, MapPin, PawPrint, X, Camera, Loader2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query } from 'firebase/firestore';

// ⚙️ Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDakLTDxIpYx0dIvvdqx...",
  authDomain: "amigo-do-igor.firebaseapp.com",
  projectId: "amigo-do-igor",
  storageBucket: "amigo-do-igor.firebasestorage.app",
  messagingSenderId: "291214168997",
  appId: "1:291214168997:web:e18bc2f...",
  measurementId: "G-1HVDEYGRSC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [pets, setPets] = useState([]);
  const [activeTab, setActiveTab] = useState('adoption');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: '',
    type: 'dog',
    status: 'adoption',
    neighborhood: '',
    description: '',
    contact: ''
  });

  // Buscar pets do Firebase em tempo real
  useEffect(() => {
    try {
      const q = query(collection(db, "pets"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const petList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPets(petList);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Erro ao carregar do Firebase:", e);
    }
  }, []);

  // Processar imagem da galeria e converter para URL de visualização/armazenamento
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar cadastro para o banco de dados
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.neighborhood || !formData.contact) {
      alert('Por favor, preencha os campos obrigatórios!');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = previewUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400';

      // Salva os dados no Cloud Firestore sem precisar do Firebase Storage
      await addDoc(collection(db, "pets"), {
        ...formData,
        image: finalImageUrl,
        createdAt: new Date()
      });

      setIsModalOpen(false);
      setFormData({ name: '', type: 'dog', status: 'adoption', neighborhood: '', description: '', contact: '' });
      setImageFile(null);
      setPreviewUrl('');
      alert('Animal cadastrado com sucesso!');
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      alert('Erro ao salvar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = pets.filter(pet => {
    const matchesTab = activeTab === 'all' || pet.status === activeTab;
    const matchesSearch = (pet.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (pet.neighborhood || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      {/* Cabeçalho */}
      <header className="bg-emerald-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PawPrint className="h-8 w-8 text-emerald-200" />
            <div>
              <h1 className="text-xl font-bold leading-tight">Amigo do Igor</h1>
              <p className="text-xs text-emerald-100">Proteção Animal • Ribeirão das Neves</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-emerald-700 font-semibold px-3 py-1.5 rounded-xl text-sm flex items-center space-x-1 shadow-sm hover:bg-emerald-50 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Cadastrar</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md">
          <h2 className="text-xl font-bold mb-2">Unidos pela causa animal em Neves 🐾</h2>
          <p className="text-sm text-emerald-50 leading-relaxed">
            Cadastre animais para adoção responsável ou nos ajude a localizar bichinhos perdidos em nossa cidade.
          </p>
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
                activeTab === 'adoption' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🐶 Adoção Responsável
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'lost' ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🔍 Animais Perdidos
            </button>
          </div>
        </div>

        {/* Lista de Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPets.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100 p-6">
              <p className="text-slate-500 text-sm">Nenhum animal cadastrado nesta categoria ainda.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-3 text-emerald-600 font-bold text-sm underline"
              >
                Seja o primeiro a cadastrar um bichinho!
              </button>
            </div>
          ) : (
            filteredPets.map((pet) => (
              <div key={pet.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="relative h-48 w-full bg-slate-100">
                  <img 
                    src={pet.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'} 
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
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{pet.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {pet.neighborhood}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {pet.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100">
                    <a 
                      href={`https://wa.me/55${pet.contact.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Contato via WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal / Formulário de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">Cadastrar Animal</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome do Pet *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Thor, Mel..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Situação</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  >
                    <option value="adoption">Para Adoção</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bairro em Neves *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Justinópolis, Sevilha"
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">WhatsApp de Contato *</label>
                <input 
                  type="text" 
                  required
                  placeholder="(31) 99999-9999"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                />
              </div>

              {/* Botão de Anexo de Foto do Celular */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Foto do Pet (Galeria)</label>
                <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition text-emerald-700 font-medium">
                  <Camera className="h-5 w-5 mr-2" />
                  <span>{imageFile ? imageFile.name : "Escolher foto do celular"}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {previewUrl && (
                  <img src={previewUrl} alt="Pré-visualização" className="mt-2 h-32 w-full object-cover rounded-xl border" />
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Descrição</label>
                <textarea 
                  rows="3"
                  placeholder="Detalhes sobre a história, vacinas, temperamento..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>A guardar registo...</span>
                  </>
                ) : (
                  <span>Salvar Cadastro</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 className="block font-medium text-slate-700 mb-1">Situação</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  >
                    <option value="adoption">Para Adoção</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bairro em Neves *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Justinópolis, Sevilha"
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">WhatsApp de Contato *</label>
                <input 
                  type="text" 
                  required
                  placeholder="(31) 99999-9999"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Link da Foto (URL)</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Descrição</label>
                <textarea 
                  rows="3"
                  placeholder="Detalhes sobre a história, vacinas, temperamento..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
