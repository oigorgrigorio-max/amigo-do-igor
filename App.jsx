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

  // Tipo de login escolhido: null (escolha inicial), 'google', 'phone' ou 'email'
  const [loginMethod, setLoginMethod] = useState(null);
  const [isRegistering, setIsRegistering] = useState(true);

  // Estados para E-mail e Senha
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Estados para Telefone / SMS
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Perfil do usuário (Nome e Bairro)
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

  // Enviar código SMS para o Telemóvel
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
      alert('Código SMS enviado com sucesso para o seu telemóvel!');
    } catch (error) {
      console.error("Erro ao enviar SMS:", error);
      alert('Erro ao enviar SMS: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Confirmar código SMS recebido
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
      alert('Autenticado com sucesso via telemóvel!');
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      alert('Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Login / Cadastro Tradicional com E-mail e Senha
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
        msg = 'Este e-mail já está registado! Tente entrar.';
      } else if (error.code === 'auth/invalid-credential' || error.code ===
