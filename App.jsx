import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Phone, MapPin, PawPrint, X, Camera, Loader2, CheckCircle2, Trash2, LogOut, Edit3, ShieldCheck } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
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
  
  // Estado de Autenticação e Usuário
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(true);

  // Formulário de Cadastro / Login do Usuário
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [profileData, setProfileData] = useState({
    fullName: '',
    neighborhood: '',
    phone: ''
  });

  // Modal de Pet (Cadastro/Edição)
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [petFormData, setPetFormData] = useState({
    name: '',
    type: 'dog',
    status: 'adoption',
    description: ''
  });

  // Monitorar estado da Autenticação do Usuário e carregar o perfil
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (e) {
          console.error("Erro ao buscar perfil:", e);
        }
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Buscar pets do Firestore em tempo real
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, "pets"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const petList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setPets(petList);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Erro ao carregar pets:", e);
    }
  }, [currentUser]);

  // Login e Cadastro do Usuário
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPassword = authPassword.trim();

    if (cleanPassword.length < 6) {
      alert('A senha precisa ter no mínimo 6 dígitos! (Pode ser só números, ex: 123456)');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        if (!profileData.fullName || !profileData.neighborhood || !profileData.phone) {
          alert('Por favor, preencha todos os seus dados pessoais (Nome, Bairro e Telefone)!');
          setLoading(false);
          return;
        }

        const res = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        
        // Salva os dados do morador no Firestore
        const userDocData = {
          uid: res.user.uid,
          email: cleanEmail,
          fullName: profileData.fullName,
          neighborhood: profileData.neighborhood,
          phone: profileData.phone,
          createdAt: new Date()
        };

        await setDoc(doc(db, "users", res.user.uid), userDocData);
        setUserProfile(userDocData);
        alert('Conta criada com sucesso! Seja bem-vindo(a).');
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      }
    } catch (error) {
      console.error("Erro de Autenticação:", error);
      
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado! Clique em "Já possui cadastro?" para entrar.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'A senha deve ter pelo menos 6 dígitos (números ou letras).';
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = 'O método E-mail/senha ainda não foi ativado no painel do Firebase Console.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        msg = 'E-mail ou senha incorretos.';
      }

      alert('Atenção: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  // Tratar Seleção de Foto
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

  // Salvar ou Editar Pet
  const handleSubmitPet = async (e) => {
    e.preventDefault();
    if (!petFormData.name) {
      alert('Por favor, informe o nome do bichinho!');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = previewUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400';

      if (editingPetId) {
        await updateDoc(doc(db, "pets", editingPetId), {
          ...petFormData,
          image: finalImageUrl,
          updatedAt: new Date()
        });
        alert('Anúncio atualizado com sucesso!');
      } else {
        await addDoc(collection(db, "pets"), {
          ...petFormData,
          image: finalImageUrl,
          userId: currentUser.uid,
          ownerName: userProfile?.fullName || 'Morador de Neves',
          neighborhood: userProfile?.neighborhood || 'Ribeirão das Neves',
          contact: userProfile?.phone || '',
          isCompleted: false,
          createdAt: new Date()
        });
        alert('Animal cadastrado com sucesso!');
      }

      setIsPetModalOpen(false);
      setEditingPetId(null);
      setPetFormData({ name: '', type: 'dog', status: 'adoption', description: '' });
      setPreviewUrl('');
    } catch (error) {
      console.error("Erro ao salvar pet:", error);
      alert('Erro ao salvar o anúncio.');
    } finally {
      setLoading(false);
    }
  };

  // Marcar como Adotado / Encontrado
  const handleToggleCompleted = async (pet) => {
    if (pet.userId !== currentUser.uid) {
      alert("Apenas a pessoa que cadastrou este pet pode alterar a situação dele.");
      return;
    }

    try {
      await updateDoc(doc(db, "pets", pet.id), { isCompleted: !pet.isCompleted });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  // Excluir Pet
  const handleDeletePet = async (pet) => {
    if (pet.userId !== currentUser.uid) {
      alert("Apenas a pessoa que cadastrou este pet pode excluí-lo.");
      return;
    }

    if (window.confirm("Deseja realmente excluir este anúncio do aplicativo?")) {
      try {
        await deleteDoc(doc(db, "pets", pet.id));
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  // Abrir Modal de Edição
  const handleOpenEditModal = (pet) => {
    setEditingPetId(pet.id);
    setPetFormData({
      name: pet.name,
      type: pet.type || 'dog',
      status: pet.status,
      description: pet.description
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

  // 🔒 TELA DE REGISTRO / LOGIN (Bloqueia até cadastrar)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
          <div className="bg-emerald-600 p-6 text-white text-center space-y-2">
            <div className="flex justify-center">
              <PawPrint className="h-12 w-12 text-emerald-200" />
            </div>
            <h1 className="text-2xl font-black">Amigo do Igor</h1>
            <p className="text-xs text-emerald-100">Proteção Animal • Ribeirão das Neves</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-800">
                {isRegistering ? 'Cadastre-se para ter acesso ao app' : 'Entrar na sua conta'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isRegistering 
                  ? 'Preencha seus dados para poder ver, cadastrar e adotar animais na cidade.' 
                  : 'Digite seu e-mail e senha para acessar o aplicativo.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-3 text-sm">
              {isRegistering && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Seu Nome Completo *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: João da Silva"
                      value={profileData.fullName}
                      onChange={e => setProfileData({...profileData, fullName: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Bairro em Neves *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Justinópolis"
                        value={profileData.neighborhood}
                        onChange={e => setProfileData({...profileData, neighborhood: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">WhatsApp / Celular *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="(31) 99999-9999"
                        value={profileData.phone}
                        onChange={e => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">E-mail *</label>
                <input 
                  type="email" 
                  required
                  placeholder="seuemail@gmail.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Criar Senha * (Mín. 6 números)</label>
                <input 
                  type="password" 
                  required
                  placeholder="Ex: 123456"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>{isRegistering ? 'Criar Cadastro e Entrar' : 'Entrar no Aplicativo'}</span>}
              </button>
            </form>

            <div className="text-center pt-3 border-t">
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-emerald-700 font-bold underline"
              >
                {isRegistering ? 'Já possui cadastro? Clique aqui para entrar' : 'Ainda não tem conta? Clique aqui para cadastrar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 📱 APLICATIVO LIBERADO (Após o usuário se cadastrar e logar)
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

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                setEditingPetId(null);
                setPetFormData({ name: '', type: 'dog', status: 'adoption', description: '' });
                setPreviewUrl('');
                setIsPetModalOpen(true);
              }}
              className="bg-white text-emerald-700 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-sm hover:bg-emerald-50 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Cadastrar Pet</span>
            </button>

            <button 
              onClick={handleLogout}
              title="Sair da Conta"
              className="bg-emerald-700 hover:bg-emerald-800 text-white p-2 rounded-xl text-xs flex items-center transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-5 space-y-5">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md flex justify-between items-center">
          <div>
            <span className="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Usuário Conectado</span>
            <h2 className="text-lg font-bold">Olá, {userProfile?.fullName || 'Protetor(a)'}! 👋</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Bairro: <strong>{userProfile?.neighborhood}</strong> • Contato: {userProfile?.phone}
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
            filteredPets.map((pet) => {
              const isMyPet = pet.userId === currentUser.uid;

              return (
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

                    {isMyPet && (
                      <div className="absolute top-3 left-3 flex space-x-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(pet)}
                          title="Editar Anúncio"
                          className="bg-white/90 hover:bg-emerald-600 hover:text-white text-slate-700 p-1.5 rounded-full shadow-sm transition"
                        >
                          <E
