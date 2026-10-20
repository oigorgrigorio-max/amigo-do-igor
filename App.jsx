import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Phone, MapPin, PawPrint, X, Camera, Loader2, CheckCircle2, Trash2, LogIn, LogOut, User, Edit3 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

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
const auth = getAuth(app);

export default function App() {
  const [pets, setPets] = useState([]);
  const [activeTab, setActiveTab] = useState('adoption');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais e Estados do Usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingPetId, setEditingPetId] = useState(null);

  // Formulário de Autenticação (Login / Cadastro)
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Formulário de Pet
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'dog',
    status: 'adoption',
    neighborhood: '',
    description: '',
    contact: ''
  });

  // Monitorar estado da Autenticação do Usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Buscar pets em tempo real no Firestore
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

  // Handler de Login / Registro
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        alert('Conta criada com sucesso!');
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        alert('Login efetuado com sucesso!');
      }
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      console.error("Erro de Autenticação:", error);
      alert('Erro: ' + (error.message.includes('auth/wrong-password') ? 'Senha incorreta!' : 'Verifique os dados ou se a conta já existe.'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // Processar Imagem
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

  // Abrir modal de edição com dados preenchidos
  const handleOpenEditModal = (pet) => {
    setEditingPetId(pet.id);
    setFormData({
      name: pet.name,
      type: pet.type || 'dog',
      status: pet.status,
      neighborhood: pet.neighborhood,
      description: pet.description,
      contact: pet.contact
    });
    setPreviewUrl(pet.image || '');
    setIsModalOpen(true);
  };

  // Abrir modal para novo cadastro
  const handleOpenNewModal = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setEditingPetId(null);
    setFormData({ name: '', type: 'dog', status: 'adoption', neighborhood: '', description: '', contact: '' });
    setPreviewUrl('');
    setImageFile(null);
    setIsModalOpen(true);
  };

  // Salvar ou Atualizar Pet
  const handleSubmitPet = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('É necessário fazer login para cadastrar ou editar!');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = previewUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400';

      if (editingPetId) {
        // Atualizar anúncio existente
        const petRef = doc(db, "pets", editingPetId);
        await updateDoc(petRef, {
          ...formData,
          image: finalImageUrl,
          updatedAt: new Date()
        });
        alert('Anúncio atualizado com sucesso!');
      } else {
        // Criar novo anúncio
        await addDoc(collection(db, "pets"), {
          ...formData,
          image: finalImageUrl,
          userId: currentUser.uid, // Guarda o ID único do dono
          userEmail: currentUser.email,
          isCompleted: false,
          createdAt: new Date()
        });
        alert('Animal cadastrado com sucesso!');
      }

      setIsModalOpen(false);
      setEditingPetId(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert('Erro ao salvar os dados.');
    } finally {
      setLoading(false);
    }
  };

  // Alternar Status (Adotado / Encontrado)
  const handleToggleCompleted = async (pet) => {
    if (!currentUser || pet.userId !== currentUser.uid) {
      alert("Apenas o autor do anúncio pode alterar este status.");
      return;
    }

    const nextState = !pet.isCompleted;
    try {
      const petRef = doc(db, "pets", pet.id);
      await updateDoc(petRef, { isCompleted: nextState });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  // Excluir anúncio
  const handleDeletePet = async (pet) => {
    if (!currentUser || pet.userId !== currentUser.uid) {
      alert("Apenas o autor do anúncio pode excluir este registro.");
      return;
    }

    if (window.confirm("Tem certeza que deseja excluir este anúncio permanentemente?")) {
      try {
        await deleteDoc(doc(db, "pets", pet.id));
      } catch (error) {
        console.error("Erro ao excluir:", error);
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

          <div className="flex items-center space-x-2">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleOpenNewModal}
                  className="bg-white text-emerald-700 font-semibold px-3 py-1.5 rounded-xl text-sm flex items-center space-x-1 shadow-sm hover:bg-emerald-50 transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Cadastrar</span>
                </button>
                <button 
                  onClick={handleLogout}
                  title="Sair"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white p-2 rounded-xl text-xs flex items-center transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-white text-emerald-700 font-semibold px-3 py-1.5 rounded-xl text-sm flex items-center space-x-1 shadow-sm hover:bg-emerald-50 transition"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar / Criar Conta</span>
              </button>
            )}
          </div>
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
                onClick={handleOpenNewModal}
                className="mt-3 text-emerald-600 font-bold text-sm underline"
              >
                Seja o primeiro a cadastrar um bichinho!
              </button>
            </div>
          ) : (
            filteredPets.map((pet) => {
              const isOwner = currentUser && pet.userId === currentUser.uid;

              return (
                <div 
                  key={pet.id} 
                  className={`rounded-2xl overflow-hidden shadow-sm border transition relative ${
                    pet.isCompleted 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-white border-slate-100 hover:shadow-md'
                  }`}
                >
                  <div className="relative h-48 w-full bg-slate-100">
                    <img 
                      src={pet.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'} 
                      alt={pet.name} 
                      className={`w-full h-full object-cover ${pet.isCompleted ? 'grayscale opacity-75' : ''}`}
                    />
                    
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

                    {/* Botões de Ação Exclusivos do Autor */}
                    {isOwner && (
                      <div className="absolute top-3 left-3 flex space-x-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(pet)}
                          title="Editar Anúncio"
                          className="bg-white/90 hover:bg-emerald-600 hover:text-white text-slate-700 p-1.5 rounded-full shadow-sm transition backdrop-blur-xs"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePet(pet)}
                          title="Excluir Anúncio"
                          className="bg-white/90 hover:bg-red-500 hover:text-white text-slate-700 p-1.5 rounded-full shadow-sm transition backdrop-blur-xs"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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

                    <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
                      {!pet.isCompleted && (
                        <a 
                          href={`https://wa.me/55${pet.contact.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-xs"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Contato via WhatsApp</span>
                        </a>
                      )}

                      {/* Apenas o dono pode alterar o status de adotado/encontrado */}
                      {isOwner && (
                        <button
                          onClick={() => handleToggleCompleted(pet)}
                          className={`w-full font-semibold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition ${
                            pet.isCompleted 
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            {pet.isCompleted 
                              ? 'Desfazer Status' 
                              : (pet.status === 'adoption' ? 'Marcar como Já Adotado' : 'Marcar como Encontrado')}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Modal de Autenticação (Login / Cadastro) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-800">
                {isRegistering ? 'Criar Conta' : 'Entrar no Sistema'}
              </h3>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">E-mail *</label>
                <input 
                  type="email" 
                  required
                  placeholder="seuemail@gmail.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Senha *</label>
                <input 
                  type="password" 
                  required
                  placeholder="Sua senha secreta"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>{isRegistering ? 'Cadastrar' : 'Entrar'}</span>}
              </button>
            </form>

            <div className="text-center pt-2 border-t">
              <button 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-emerald-700 font-bold underline"
              >
                {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se grátis'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Formulário de Pet (Cadastro e Edição) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[9
