import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, Phone, MapPin, PawPrint, X, Camera, Loader2, CheckCircle2, Trash2, LogOut, User, Edit3, ShieldCheck } from 'lucide-react';
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

    try {
      if (isRegistering) {
        if (!profileData.fullName || !profileData.neighborhood || !profileData.phone) {
          alert('Por favor, preencha todos os seus dados pessoais (Nome, Bairro e Telefone)!');
          setLoading(false);
          return;
        }

        const res = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        
        // Salva os dados do morador de Neves no banco
        const userDocData = {
          uid: res.user.uid,
          email: authEmail,
          fullName: profileData.fullName,
          neighborhood: profileData.neighborhood,
          phone: profileData.phone,
          createdAt: new Date()
        };

        await setDoc(doc(db, "users", res.user.uid), userDocData);
        setUserProfile(userDocData);
        alert('Conta criada com sucesso! Seja bem-vindo(a).');
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (error) {
      console.error("Erro de Autenticação:", error);
      alert('Erro ao processar: ' + (error.message.includes('email-already-in-use') ? 'Este e-mail já está cadastrado!' : 'Verifique os dados informados.'));
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
        // Atualiza anúncio existente
        await updateDoc(doc(db, "pets", editingPetId), {
          ...petFormData,
          image: finalImageUrl,
          updatedAt: new Date()
        });
        alert('Anúncio atualizado com sucesso!');
      } else {
        // Cria novo anúncio vinculando ao perfil do usuário cadastrado
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
  const handleToggleCompleted = async (pet
                                       
