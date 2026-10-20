import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Phone, MapPin, PawPrint, X, Camera, Loader2, CheckCircle2, Trash2, LogOut, Edit3, ShieldCheck, Mail, Smartphone, Globe } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// ⚙️ Credenciais do Firebase
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
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Tipo de login escolhido: null (escolha inicial), 'phone' ou 'email'
  const [loginMethod, setLoginMethod] = useState(null);
  const [isRegistering, setIsRegistering] = useState(true);

  // Estados para E-mail e Palavra-passe
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Estados para Telemóvel / SMS
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Perfil do utilizador
  const [profileData, setProfileData] = useState({
    fullName: '',
    neighborhood: '',
    phone: ''
  });

  // Modal de Pet
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            const basicProfile = {
              uid: user.uid,
              email: user.email || '',
              phone: user.phoneNumber || '',
              fullName: user.displayName || profileData.fullName || 'Morador de Neves',
              neighborhood: profileData.neighborhood || 'Ribeirão das Neves',
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

  // 1️⃣ Login com Google (Gmail)
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
      console.error("Erro no Google Login:", error);
      alert('Erro ao entrar com Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Configurar Recaptcha para Telemóvel
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      });
    }
  };

  const handleSendPhoneCode = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Insira um número de telemóvel válido com DDD (ex: +5531999999999)');
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+55${phoneNumber.replace(/\D/g, '')}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      alert('Código SMS enviado com sucesso!');
    } catch (error) {
      console.error("Erro ao enviar SMS:", error);
      alert('Erro ao enviar SMS: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      alert('Insira o código de 6 dígitos recebido por SMS.');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otpCode);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const defaultProfile = {
          uid: user.uid,
          phone: user.phoneNumber,
          fullName: profileData.fullName || 'Morador de Neves',
          neighborhood: profileData.neighborhood || 'Ribeirão das Neves',
          createdAt: new Date()
        };
        await setDoc(userDocRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
      alert('Autenticado com sucesso!');
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      alert('Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Login / Cadastro Tradicional com E-mail
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPassword = authPassword.trim();

    if (cleanPassword.length < 6) {
      alert('A palavra-passe precisa ter no mínimo 6 caracteres!');
      setLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        if (!profileData.fullName || !profileData.neighborhood || !profileData.phone) {
          alert('Por favor, preencha todos os seus dados pessoais (Nome, Bairro e Telemóvel)!');
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
        msg = 'Este e-mail já está registado! Tente entrar.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        msg = 'E-mail ou palavra-passe incorretos.';
      }
      alert('Atenção: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setLoginMethod(null);
  };

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

  const handleToggleCompleted = async (pet) => {
    if (pet.userId !== currentUser.uid) {
      alert("Apenas quem cadastrou este pet pode alterar a situação.");
      return;
    }

    try {
      await updateDoc(doc(db, "pets", pet.id), { isCompleted: !pet.isCompleted });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const handleDeletePet = async (pet) => {
    if (pet.userId !== currentUser.uid) {
      alert("Apenas quem cadastrou este pet pode excluí-lo.");
      return;
    }

    if (window.confirm("Deseja realmente excluir este anúncio?")) {
      try {
        await deleteDoc(doc(db, "pets", pet.id));
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

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

  // 🔒 TELA DE SELEÇÃO DE ENTRADA
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div id="recaptcha-container"></div>
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
          <div className="bg-emerald-600 p-6 text-white text-center space-y-2">
            <div className="flex justify-center">
              <PawPrint className="h-12 w-12 text-emerald-200" />
            </div>
            <h1 className="text-2xl font-black">Amigo do Igor v2</h1>
            <p className="text-xs text-emerald-100">Proteção Animal • Ribeirão das Neves</p>
          </div>

          <div className="p-6 space-y-5">
            {loginMethod === null && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-slate-800">Como deseja entrar no app?</h2>
                  <p className="text-xs text-slate-500 mt-1">Escolha uma das opções abaixo para continuar.</p>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-300 transition shadow-xs flex items-center justify-center space-x-3 text-sm"
                  >
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span>Entrar com o Google (Gmail)</span>
                  </button>

                  <button 
                    onClick={() => setLoginMethod('phone')}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-300 transition shadow-xs flex items-center justify-center space-x-3 text-sm"
                  >
                    <Smartphone className="h-5 w-5 text-emerald-600" />
                    <span>Entrar com Número de Telemóvel</span>
                  </button>

                  <button 
                    onClick={() => setLoginMethod('email')}
                    className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border border-slate-300 transition shadow-xs flex items-center justify-center space-x-3 text-sm"
                  >
                    <Mail className="h-5 w-5 text-amber-600" />
                    <span>Entrar com E-mail e Palavra-passe</span>
                  </button>
                </div>
              </div>
            )}

            {loginMethod === 'phone' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-sm font-bold text-slate-800">Login por Telemóvel (SMS)</h2>
                  <button onClick={() => setLoginMethod(null)} className="text-xs text-emerald-600 font-semibold underline">Voltar</button>
                </div>

                {!confirmationResult ? (
                  <form onSubmit={handleSendPhoneCode} className="space-y-3 text-sm">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Telemóvel (com DDD) *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+5531999999999"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center space-x-2"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Enviar Código SMS</span>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneCode} className="space-y-3 text-sm">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Código SMS *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="6 dígitos"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-widest text-lg font-bold"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center space-x-2"
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Confirmar e Entrar</span>}
                    </button>
                  </form>
                )}
              </div>
            )}

            {loginMethod === 'email' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-sm font-bold text-slate-800">
                    {isRegistering ? 'Criar Conta por E-mail' : 'Entrar com E-mail'}
                  </h2>
                  <button onClick={() => setLoginMethod(null)} className="text-xs text-emerald-600 font-semibold underline">Voltar</button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3 text-sm">
                  {isRegistering && (
                    <>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">Nome Completo *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Seu nome"
                          value={profileData.fullName}
                          onChange={e => setProfileData({...profileData, fullName: e.target.value})}
                          className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">Bairro *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Seu bairro"
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
                            classN
