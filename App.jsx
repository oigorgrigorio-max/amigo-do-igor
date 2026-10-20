import React, { useEffect, useRef, useState } from "react";
import {
  PawPrint,
  Loader2,
  X,
  Search,
  PlusCircle,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Smartphone,
  Globe,
  Camera,
  CheckCircle2,
  Edit3,
  Trash2,
} from "lucide-react";

import { initializeApp, getApps, getApp } from "firebase/app";

import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
} from "firebase/auth";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// Copie os valores completos em:
// Firebase → Configurações do projeto → Seus aplicativos.
const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_API_KEY_COMPLETA",
  authDomain: "amigo-do-igor.firebaseapp.com",
  projectId: "amigo-do-igor",
  storageBucket: "amigo-do-igor.firebasestorage.app",
  messagingSenderId: "291214168997",
  appId: "COLE_AQUI_SEU_APP_ID_COMPLETO",
  measurementId: "G-1HVDEYGRSC",
};

const configured =
  !firebaseConfig.apiKey.includes("COLE_AQUI") &&
  !firebaseConfig.appId.includes("COLE_AQUI");

const app = configured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

if (auth) auth.languageCode = "pt-BR";

const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-emerald-700";

const primaryClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 font-semibold hover:bg-stone-50 disabled:opacity-50";

const statusLabels = {
  all: "Todos",
  lost: "Perdidos",
  seen: "Vistos na rua",
  adoption: "Para adoção",
};

const emptyPet = () => ({
  name: "",
  type: "dog",
  status: "adoption",
  neighborhood: "",
  description: "",
  image: "",
});

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");

  if (/^55\d{10,11}$/.test(digits)) return `+${digits}`;
  if (/^\d{10,11}$/.test(digits)) return `+55${digits}`;

  return null;
}

function errorMessage(error) {
  const messages = {
    "auth/invalid-api-key": "Confira a chave API na configuração do Firebase.",
    "auth/unauthorized-domain":
      "Este domínio precisa ser autorizado no Firebase Authentication.",
    "auth/operation-not-allowed":
      "Este método de login ainda não foi ativado no Firebase.",
    "auth/popup-blocked":
      "O navegador bloqueou a janela. Permita pop-ups e tente novamente.",
    "auth/popup-closed-by-user": "A janela de login foi fechada.",
    "auth/cancelled-popup-request":
      "Outra tentativa de login foi aberta. Tente novamente.",
    "auth/invalid-email": "Digite um e-mail válido.",
    "auth/email-already-in-use":
      "Este e-mail já tem cadastro. Escolha Entrar.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/weak-password": "Escolha uma senha mais forte.",
    "auth/too-many-requests":
      "Muitas tentativas. Aguarde um pouco antes de tentar novamente.",
    "auth/network-request-failed":
      "Não foi possível conectar. Confira sua internet.",
    "auth/invalid-phone-number": "Confira o celular e o DDD.",
    "auth/invalid-verification-code": "O código SMS está incorreto.",
    "auth/code-expired": "O código expirou. Solicite outro.",
    "auth/quota-exceeded":
      "O limite de SMS do projeto foi atingido.",
    "auth/billing-not-enabled":
      "O envio de SMS precisa de faturamento habilitado no Firebase.",
    "auth/captcha-check-failed":
      "A verificação de segurança falhou. Tente novamente.",
    "permission-denied":
      "O Firebase bloqueou esta operação. Confira as regras do Firestore.",
    unavailable: "O serviço está indisponível. Tente novamente.",
  };

  return messages[error.code] || `Não foi possível concluir (${error.code || "erro"}).`;
}

// Reduz a foto antes de salvar no documento.
// Limita o tamanho para não ultrapassar o limite do Firestore.
async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem.");
  }

  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Escolha uma foto de até 12 MB.");
  }

  const url = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Não foi possível abrir a foto."));
      element.src = url;
    });

    const scale = Math.min(1, 900 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);

    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.8, 0.65, 0.5, 0.35]) {
      const result = canvas.toDataURL("image/jpeg", quality);
      if (result.length <= 450000) return result;
    }

    throw new Error("A foto ficou muito grande. Escolha uma imagem menor.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
        <PawPrint size={28} />
      </div>
      <div>
        <h1 className="text-xl font-black sm:text-2xl">Amigo do Igor</h1>
        <p className="text-sm opacity-80">Encontre, adote ou ajude</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

export default function App() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileRetry, setProfileRetry] = useState(0);

  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const [loginMethod, setLoginMethod] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  const recaptchaRef = useRef(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    neighborhood: "",
    phone: "",
  });

  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [petModal, setPetModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [petForm, setPetForm] = useState(emptyPet);

  const profileComplete = Boolean(
    userProfile?.fullName?.trim() &&
      userProfile?.neighborhood?.trim() &&
      normalizePhone(userProfile?.phone || "")
  );

  function clearRecaptcha() {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  }

  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }

    let revision = 0;
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const request = ++revision;

      setCheckingAuth(true);
      setCurrentUser(user);
      setUserProfile(null);
      setProfileError("");
      setPets([]);
      setPetModal(false);
      setConfirmation(null);
      setOtpCode("");

      if (!user) {
        setProfileData({ fullName: "", neighborhood: "", phone: "" });
        setCheckingAuth(false);
        return;
      }

      try {
        // Apenas lê o perfil. A criação ocorre no formulário abaixo.
        // Evita gravações simultâneas pelos diferentes métodos de login.
        const snapshot = await getDoc(doc(db, "users", user.uid));

        if (!active || request !== revision) return;

        const saved = snapshot.exists() ? snapshot.data() : null;
        setUserProfile(saved);
        setProfileData({
          fullName: saved?.fullName || user.displayName || "",
          neighborhood: saved?.neighborhood || "",
          phone: saved?.phone || user.phoneNumber || "",
        });
      } catch (error) {
        if (active && request === revision) {
          setProfileError(errorMessage(error));
        }
      } finally {
        if (active && request === revision) setCheckingAuth(false);
      }
    });

    return () => {
      active = false;
      revision++;
      unsubscribe();
    };
  }, [profileRetry]);

  useEffect(() => {
    return () => clearRecaptcha();
  }, []);

  useEffect(() => {
    if (currentUser || loginMethod !== "phone") clearRecaptcha();
  }, [currentUser, loginMethod]);

  useEffect(() => {
    if (!currentUser || !profileComplete) return;

    setPetsLoading(true);
    setPetsError("");

    return onSnapshot(
      collection(db, "pets"),
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        }));

        list.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) -
            (a.createdAt?.toMillis?.() || 0)
        );

        setPets(list);
        setPetsLoading(false);
        setPetsError("");
      },
      (error) => {
        setPetsError(errorMessage(error));
        setPetsLoading(false);
      }
    );
  }, [currentUser, profileComplete]);

  async function runAction(action) {
    setBusy(true);
    setNotice("");

    try {
      await action();
    } catch (error) {
      console.error(error);
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function handleGoogleLogin() {
    runAction(() => signInWithPopup(auth, googleProvider));
  }

  function handleEmailAuth(event) {
    event.preventDefault();

    runAction(async () => {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    });
  }

  function handlePasswordReset() {
    if (!email.trim()) {
      setNotice("Digite seu e-mail no campo acima para recuperar a senha.");
      return;
    }

    runAction(async () => {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice("Solicitação recebida. Confira seu e-mail e a pasta de spam.");
    });
  }

  function handleSendCode(event) {
    event.preventDefault();
    const formatted = normalizePhone(phoneNumber);

    if (!formatted) {
      setNotice("Informe um celular válido com DDD.");
      return;
    }

    runAction(async () => {
      clearRecaptcha();

      recaptchaRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );

      try {
        const result = await signInWithPhoneNumber(
          auth,
          formatted,
          recaptchaRef.current
        );

        setConfirmation(result);
        setNotice("Código enviado por SMS.");
      } finally {
        clearRecaptcha();
      }
    });
  }

  function handleVerifyCode(event) {
    event.preventDefault();

    if (!confirmation || !/^\d{6}$/.test(otpCode)) {
      setNotice("Digite os seis números recebidos por SMS.");
      return;
    }

    runAction(() => confirmation.confirm(otpCode));
  }

  function handleSaveProfile(event) {
    event.preventDefault();
    const formatted = normalizePhone(profileData.phone);

    if (
      !profileData.fullName.trim() ||
      !profileData.neighborhood.trim() ||
      !formatted
    ) {
      setNotice("Preencha nome, bairro e um WhatsApp válido com DDD.");
      return;
    }

    runAction(async () => {
      const data = {
        uid: currentUser.uid,
        email: currentUser.email || "",
        fullName: profileData.fullName.trim(),
        neighborhood: profileData.neighborhood.trim(),
        phone: formatted,
        updatedAt: serverTimestamp(),
      };

      if (!userProfile) data.createdAt = serverTimestamp();

      await setDoc(doc(db, "users", currentUser.uid), data, { merge: true });
      setUserProfile(data);
      setNotice("");
    });
  }

  function handleLogout() {
    runAction(async () => {
      await signOut(auth);
      setLoginMethod(null);
      setPassword("");
      setConfirmation(null);
      setOtpCode("");
      setNotice("");
    });
  }

  function openNewPet(status = "adoption") {
    setNotice("");
    setEditingId(null);
    setPetForm({
      ...emptyPet(),
      status,
      neighborhood: userProfile.neighborhood,
    });
    setPetModal(true);
  }

  function openEditPet(pet) {
    if (pet.userId !== currentUser.uid) return;

    setNotice("");
    setEditingId(pet.id);
    setPetForm({
      name: pet.name || "",
      type: pet.type || "dog",
      status: pet.status,
      neighborhood: pet.neighborhood || "",
      description: pet.description || "",
      image: pet.image || "",
    });
    setPetModal(true);
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageBusy(true);
    setNotice("");

    try {
      const image = await compressImage(file);
      setPetForm((previous) => ({ ...previous, image }));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setImageBusy(false);
      event.target.value = "";
    }
  }

  function handleSavePet(event) {
    event.preventDefault();

    if (!petForm.name.trim() || !petForm.neighborhood.trim()) {
      setNotice("Informe a identificação do animal e o bairro.");
      return;
    }

    runAction(async () => {
      const data = {
        ...petForm,
        name: petForm.name.trim(),
        neighborhood: petForm.neighborhood.trim(),
        description: petForm.description.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        const original = pets.find((pet) => pet.id === editingId);

        if (!original || original.userId !== currentUser.uid) {
          setNotice("Você só pode editar seus próprios anúncios.");
          return;
        }

        await updateDoc(doc(db, "pets", editingId), data);
      } else {
        await addDoc(collection(db, "pets"), {
          ...data,
          userId: currentUser.uid,
          ownerName: userProfile.fullName,
          contact: userProfile.phone,
          isCompleted: false,
          createdAt: serverTimestamp(),
        });
      }

      setPetModal(false);
      setEditingId(null);
      setPetForm(emptyPet());
      setNotice("Anúncio salvo com sucesso!");
    });
  }

  function toggleCompleted(pet) {
    if (pet.userId !== currentUser.uid) return;

    runAction(() =>
      updateDoc(doc(db, "pets", pet.id), {
        isCompleted: !pet.isCompleted,
        updatedAt: serverTimestamp(),
      })
    );
  }

  function deletePet(pet) {
    if (pet.userId !== currentUser.uid) return;
    if (!window.confirm("Deseja excluir este anúncio?")) return;

    runAction(() => deleteDoc(doc(db, "pets", pet.id)));
  }

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");

  const filteredPets = pets.filter((pet) => {
    const matchesTab = activeTab === "all" || pet.status === activeTab;
    const text = `${pet.name || ""} ${pet.neighborhood || ""} ${
      pet.description || ""
    }`.toLocaleLowerCase("pt-BR");

    return matchesTab && text.includes(normalizedSearch);
  });

  const noticeBox = notice ? (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950"
    >
      {notice}
    </div>
  ) : null;

  if (!configured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50 p-6">
        <div className="max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-sm">
          <Brand />
          <h2 className="text-xl font-bold">Finalize a configuração</h2>
          <p className="text-stone-600">
            Preencha a apiKey e o appId completos no firebaseConfig para
            conectar o Amigo do Igor ao Firebase.
          </p>
        </div>
      </main>
    );
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50 text-emerald-950">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin" />
          <span>Carregando Amigo do Igor...</span>
        </div>
      </main>
    );
  }

  // PRIMEIRA TELA: visitantes sem sessão precisam fazer login.
  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0] p-4 text-emerald-950">
        <section className="w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg">
          <header className="space-y-5 bg-emerald-950 p-7 text-white">
            <Brand />
            <p className="text-sm text-emerald-100">
              Uma rede de cuidado para os animais de Ribeirão das Neves.
            </p>
          </header>

          <div className="space-y-5 p-6">
            <div>
              <h2 className="text-2xl font-black">Faça seu login</h2>
              <p className="mt-2 text-sm text-stone-600">
                Entre para encontrar, cadastrar ou ajudar um animal.
              </p>
            </div>

            {noticeBox}

            {loginMethod === null && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={busy}
                  className={`${secondaryClass} w-full`}
                >
                  {busy ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Globe size={20} />
                  )}
                  Entrar com Google (Gmail)
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setLoginMethod("phone");
                    setNotice("");
                  }}
                  className={`${secondaryClass} w-full`}
                >
                  <Smartphone size={20} />
                  Entrar com celular
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setLoginMethod("email");
                    setNotice("");
                  }}
                  className={`${secondaryClass} w-full`}
                >
                  <Mail size={20} />
                  Entrar com e-mail e senha
                </button>
              </div>
            )}

            {loginMethod === "email" && (
              <
