import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Phone, MapPin, PawPrint, X, Camera, Loader2, CheckCircle2, Trash2, LogOut, Edit3, ShieldCheck } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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
const googleProvider = new GoogleAuthProvider();

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
          } else {
            // Se entrou pelo Google e não tem perfil no Firestore, cria um básico
            const basicProfile = {
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || 'Morador de Neves',
              neighborhood: 'Ribeirão das Neves',
              phone: '(31) 99999-9999',
              createdAt: new Date()
            };
            await setDoc(doc(db, "users", user.uid), basicProfile);
            setUserProfile(basicProfile);
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

  // Login com Google
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const defaultProfile = {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || 'Morador de Neves',
          neighborhood: 'Ribeirão das Neves',
          phone: '(31) 99999-9999',
          createdAt: new Date()
        };
        await setDoc(userDocRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Erro no login com Google:", error);
      alert('Erro ao entrar com Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Login e Cadastro com E-mail e Senha
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPassword = authPassword.trim();

    if (cleanPassword.length < 6) {
      alert('A senha precisa ter no mínimo 6 caracteres!');
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
        alert('Conta criada com sucesso!');
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      }
    } catch (error) {
      console.error("Erro de Autenticação:", error);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado! Clique em "Já possui cadastro?" para entrar.';
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
          ownerName: userProfile?.fullName || currentUser.displayName || 'Morador de Neves',
          neighborhood: userProfile?.neighborhood || 'Ribeirão das Neves',
          contact: userProfile?.phone || '(31) 99999-9999',
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

  // 🔒 TELA DE REGISTRO / LOGIN (Bloqueia até autenticar)
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
                {isRegistering ? 'Cadastre-se para acessar o app' : 'Entrar na sua conta'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isRegistering 
                  ? 'Entre com sua conta Google ou preencha seus dados abaixo para ver e adotar animais.' 
                  : 'Digite seu e-mail e senha para acessar o aplicativo.'}
              </p>
            </div>

            {/* BOTÃO DE LOGIN COM GOOGLE */}
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-300 transition shadow-xs flex items-center justify-center space-x-2 text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continuar com o Google</span>
            </button>

            <div className="flex items-center my-3">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="px-3 text-xs text-slate-400 uppercase font-medium">ou e-mail</span>
              <div className="flex-grow border-t border-slate-200"></div>
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
                      <label className="block font-medium text-slate-700 mb-1">WhatsApp *</label>
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
                <label className="block font-medium text-slate-700 mb-1">Senha * (Mín. 6 caracteres)</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 mt-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>{isRegistering ? 'Criar Cadastro e Entrar' : 'Entrar no Aplicativo'}</span>}
              </button>
            </form>

            <div className="text-center pt-2 border-t">
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

  // 📱 APLICATIVO LIBERADO
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
            <h2 className="text-lg font-bold">Olá, {userProfile?.fullName || currentUser?.displayName || 'Protetor(a)'}! 👋</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Bairro: <strong>{userProfile?.neighborhood || 'Ribeirão das Neves'}</strong> • Contato: {userProfile?.phone || 'Não informado'}
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
            
