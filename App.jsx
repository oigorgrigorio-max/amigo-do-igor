import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Phone, MapPin, PawPrint, X, Camera, Loader2, CheckCircle2, Trash2, Edit3, ShieldCheck } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

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
const auth = getAuth(app);

export default function App() {
  const [pets, setPets] = useState([]);
  const [activeTab, setActiveTab] = useState('adoption');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [petFormData, setPetFormData] = useState({
    name: '',
    type: 'dog',
    status: 'adoption',
    description: '',
    ownerName: '',
    neighborhood: '',
    contact: ''
  });

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Auth error:", e);
        }
      }
    });
  }, []);

  useEffect(() => {
    try {
      const q = query(collection(db, "pets"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const petList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPets(petList);
      }, (error) => {
        console.error("Erro ao escutar Firestore:", error);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Erro no q:", e);
    }
  }, []);

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

  const handleSubmitPet = async (e) => {
    e.preventDefault();
    if (!petFormData.name || !petFormData.ownerName || !petFormData.neighborhood || !petFormData.contact) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    setLoading(true);
    try {
      const finalImageUrl = previewUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400';

      const petPayload = {
        name: petFormData.name,
        type: petFormData.type,
        status: petFormData.status,
        description: petFormData.description,
        ownerName: petFormData.ownerName,
        neighborhood: petFormData.neighborhood,
        contact: petFormData.contact,
        image: finalImageUrl,
        isCompleted: false,
        createdAt: Date.now()
      };

      if (editingPetId) {
        await updateDoc(doc(db, "pets", editingPetId), petPayload);
        alert('Anúncio atualizado com sucesso!');
      } else {
        await addDoc(collection(db, "pets"), petPayload);
        alert('Animal publicado com sucesso!');
      }

      setIsPetModalOpen(false);
      setEditingPetId(null);
      setPetFormData({
        name: '',
        type: 'dog',
        status: 'adoption',
        description: '',
        ownerName: '',
        neighborhood: '',
        contact: ''
      });
      setPreviewUrl('');
      setImageFile(null);
    } catch (error) {
      console.error("Erro crítico ao salvar:", error);
      alert('Erro ao salvar no banco de dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompleted = async (pet) => {
    try {
      await updateDoc(doc(db, "pets", pet.id), { isCompleted: !pet.isCompleted });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePet = async (pet) => {
    if (window.confirm("Deseja realmente excluir este anúncio?")) {
      try {
        await deleteDoc(doc(db, "pets", pet.id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleOpenEditModal = (pet) => {
    setEditingPetId(pet.id);
    setPetFormData({
      name: pet.name || '',
      type: pet.type || 'dog',
      status: pet.status || 'adoption',
      description: pet.description || '',
      ownerName: pet.ownerName || '',
      neighborhood: pet.neighborhood || '',
      contact: pet.contact || ''
    });
    setPreviewUrl(pet.image || '');
    setIsPetModalOpen(true);
  };

  const filteredPets = pets.filter(pet => {
    const matchesTab = activeTab === 'all' || pet.status === activeTab;
    const matchesSearch = (pet.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (pet.neighborhood || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      <header className="bg-emerald-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PawPrint className="h-7 w-7 text-emerald-200" />
            <div>
              <h1 className="text-lg font-bold leading-tight">Amigo do Igor</h1>
              <p className="text-[10px] text-emerald-100">Proteção Animal • Ribeirão das Neves</p>
            </div>
          </div>

          <button 
            onClick={() => {
              setEditingPetId(null);
              setPetFormData({ name: '', type: 'dog', status: 'adoption', description: '', ownerName: '', neighborhood: '', contact: '' });
              setPreviewUrl('');
              setImageFile(null);
              setIsPetModalOpen(true);
            }}
            className="bg-white text-emerald-700 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-sm hover:bg-emerald-50 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Cadastrar Pet</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-5">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md flex justify-between items-center">
          <div>
            <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Plataforma Livre</span>
            <h2 className="text-lg font-bold">Bem-vindo(a) ao Amigo do Igor! 👋</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Veja os animais disponíveis para adoção ou ajude a encontrar pets perdidos em Ribeirão das Neves.
            </p>
          </div>
          <ShieldCheck className="h-10 w-10 text-emerald-200 opacity-80" />
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por nome do bichinho ou bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs text-xs"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('adoption')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'adoption' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🐶 Adoção Responsável
            </button>
            <button
              onClick={() => setActiveTab('lost')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'lost' ? 'bg-amber-500 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              🔍 Animais Perdidos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPets.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-slate-500 text-xs">Nenhum pet encontrado nesta categoria.</p>
            </div>
          ) : (
            filteredPets.map((pet) => (
              <div 
                key={pet.id} 
                className={`rounded-2xl overflow-hidden shadow-xs border transition relative ${
                  pet.isCompleted ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className="relative h-48 w-full bg-slate-100">
                  <img 
                    src={pet.image} 
                    alt={pet.name} 
                    className={`w-full h-full object-cover ${pet.isCompleted ? 'grayscale opacity-75' : ''}`}
                  />
                  
                  {pet.isCompleted ? (
                    <span className="absolute top-3 left-3 bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                      {pet.status === 'adoption' ? 'JÁ ADOTADO! 🎉' : 'ENCONTRADO! 🎉'}
                    </span>
                  ) : (
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-xs ${
                      pet.status === 'adoption' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}>
                      {pet.status === 'adoption' ? 'Para Adoção' : 'Perdido'}
                    </span>
                  )}

                  <div className="absolute top-3 left-3 flex space-x-1.5">
                    <button 
                      onClick={() => handleOpenEditModal(pet)}
                      title="Editar Anúncio"
                      className="bg-white/90 hover:bg-emerald-600 hover:text-white text-slate-700 p-1.5 rounded-full shadow-sm transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeletePet(pet)}
                      title="Excluir Anúncio"
                      className="bg-white/90 hover:bg-red-500 hover:text-white text-slate-700 p-1.5 rounded-full shadow-sm transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{pet.name}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center mt-0.5">
                      <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                      {pet.neighborhood} • <span className="ml-1 text-slate-400">Por: {pet.ownerName || 'Morador'}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {pet.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {!pet.isCompleted && pet.contact && (
                      <a 
                        href={`https://wa.me/55${pet.contact.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Falar com Responsável no WhatsApp</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleToggleCompleted(pet)}
                      className={`w-full font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition ${
                        pet.isCompleted ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        {pet.isCompleted 
                          ? 'Reabrir Anúncio' 
                          : (pet.status === 'adoption' ? 'Marcar como Já Adotado' : 'Marcar como Encontrado')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {isPetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingPetId ? 'Editar Anúncio' : 'Cadastrar Pet'}
              </h3>
              <button onClick={() => setIsPetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPet} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome do Pet *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Thor, Mel..."
                  value={petFormData.name}
                  onChange={e => setPetFormData({...petFormData, name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Seu Nome *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: João da Silva"
                    value={petFormData.ownerName}
                    onChange={e => setPetFormData({...petFormData, ownerName: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bairro em Neves *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Justinópolis"
                    value={petFormData.neighborhood}
                    onChange={e => setPetFormData({...petFormData, neighborhood: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">WhatsApp de Contato *</label>
                <input 
                  type="text" 
                  required
                  placeholder="(31) 99999-9999"
                  value={petFormData.contact}
                  onChange={e => setPetFormData({...petFormData, contact: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Situação</label>
                <select 
                  value={petFormData.status}
                  onChange={e => setPetFormData({...petFormData, status: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                >
                  <option value="adoption">Para Adoção</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Foto do Pet (Galeria)</label>
                <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition text-emerald-700 font-medium">
                  <Camera className="h-4 w-4 mr-2" />
                  <span>{imageFile ? imageFile.name : "Escolher foto do telemóvel"}</span>
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
                  placeholder="História do animal, temperamento, vacinas..."
                  value={petFormData.description}
                  onChange={e => setPetFormData({...petFormData, description: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{editingPetId ? 'Salvar Alterações' : 'Publicar Anúncio'}</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
