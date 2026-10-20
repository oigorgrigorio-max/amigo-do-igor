import React, { useState, useEffect } from 'react';
import { Heart, Search, PlusCircle, Phone, MapPin, PawPrint, X, Camera, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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

  // Seleção e preview da foto do celular
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

  // Enviar cadastro
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.neighborhood || !formData.contact) {
      alert('Por favor, preencha os campos obrigatórios!');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = previewUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400';

      await addDoc(collection(db, "pets"), {
        ...formData,
        image: finalImageUrl,
        isCompleted: false, // Define status inicial de concluído como falso
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

  // Marcar pet como Adotado / Encontrado
  const handleToggleCompleted = async (pet) => {
    const nextState = !pet.isCompleted;
    const msg = nextState 
      ? (pet.status === 'adoption' ? 'Marcar este animal como ADOTADO?' : 'Marcar este animal como ENCONTRADO?')
      : 'Reabrir o anúncio deste animal?';

    if (window.confirm(msg)) {
      try {
        const petRef = doc(db, "pets", pet.id);
        await updateDoc(petRef, { isCompleted: nextState });
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        alert("Erro ao alterar o status.");
      }
    }
  };

  // Excluir pet diretamente do aplicativo
  const handleDeletePet = async (id) => {
    if (window.confirm("Deseja realmente excluir este anúncio do aplicativo?")) {
      try {
        await deleteDoc(doc(db, "pets", id));
      } catch (error) {
        console.error("Erro ao excluir do Firebase:", error);
        alert("Erro ao excluir o anúncio.");
      }
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
              <div 
                key={pet.id} 
                className={`rounded-2xl overflow-hidden shadow-sm border transition relative ${
                  pet.isCompleted 
                    ? 'bg-emerald-50 border-emerald-300' 
                    : 'bg-white border-slate-100 hover:shadow-md'
                }`}
              >
                {/* Imagem do Pet com Efeito de Concluído */}
                <div className="relative h-48 w-full bg-slate-100">
                  <img 
                    src={pet.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'} 
                    alt={pet.name} 
                    className={`w-full h-full object-cover ${pet.isCompleted ? 'grayscale opacity-75' : ''}`}
                  />
                  
                  {/* Etiqueta Principal */}
                  {pet.isCompleted ? (
                    <span className="absolute top-3 left-3 bg-emerald-700 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md flex items-center space-x-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{pet.status === 'adoption' ? 'JÁ ADOTADO! 🎉' : 'ENCONTRADO! 🎉'}</span>
                    </span>
                  ) : (
                    <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full text-white shadow-sm ${
                      pet.status === 'adoption' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}>
                      {pet.status === 'adoption' ? 'Para Adoção' : 'Perdido'}
                    </span>
                  )}

                  {/* Botão de Apagar no canto superior */}
                  <button 
                    onClick={() => handleDeletePet(pet.id)}
                    title="Excluir Anúncio"
                    className="absolute top-3 right-3 bg-white/80 hover:bg-red-500 hover:text-white text-slate-600 p-1.5 rounded-full shadow-sm transition backdrop-blur-xs"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center justify-between">
                      <span>{pet.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center mt-0.5">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {pet.neighborhood}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {pet.description}
                  </p>

                  {/* Botões de Ação no Card */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
                    {/* Bot
