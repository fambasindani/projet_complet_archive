/* eslint-disable no-restricted-globals */
// @ts-nocheck
// screens/LoginScreen.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useHistory, Link } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logo from '../Images/Logo.png';
import archive from '../Images/archiv.png';
import note from '../Images/note.png';




import {
    FaArchive,
    FaFileInvoiceDollar,
    FaChartBar,
    FaDatabase,
    FaLock,
    FaSearch,
    FaUpload,
    FaBoxOpen,
    FaBuilding,
    FaRegGem,
    FaUserLock,
    FaCalendarAlt,
    FaShieldAlt,
    FaFileContract,
    FaRegFileAlt,
    FaSpinner,
    FaTimes,
    FaChevronDown,
    FaSignInAlt,
    FaEye,
    FaEyeSlash,
    FaEnvelope,
    FaLock as FaLockIcon,
    FaHome,
    FaArrowCircleLeft
} from "react-icons/fa";
import "../style/LoginScreen.css";
import { toast } from "../Composant/Toast";

// Schema de validation avec Zod
const loginSchema = z.object({
    email: z.string()
        .min(1, "L'email est requis")
        .email("Email invalide")
        .toLowerCase(),
    password: z.string()
        .min(1, "Le mot de passe est requis")
        .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    rememberMe: z.boolean().optional(),
});

const LoginScreen = () => {
    const navRouter = useHistory();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginError, setLoginError] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [showModuleSelection, setShowModuleSelection] = useState(true);
    const [currentTime, setCurrentTime] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
        mode: "onChange",
    });

    useEffect(() => {
        // Vérifier si un module est déjà sélectionné
        const module = localStorage.getItem("archive_module");
        if (module) {
            setSelectedModule(module);
            setShowModuleSelection(false);
        }

        // Mettre à jour l'heure (gardé en interne mais pas affiché)
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const dateString = now.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            setCurrentTime(`${dateString} - ${timeString}`);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleModuleSelect = (moduleType) => {
        localStorage.setItem("archive_module", moduleType);
        setSelectedModule(moduleType);
        setShowModuleSelection(false);
    };

    const handleBackToModules = () => {
        setSelectedModule(null);
        setShowModuleSelection(true);
        localStorage.removeItem("archive_module");
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setLoginError(null);

        try {
            const res = await axios.post(`${API_BASE_URL}/connexion`, {
                email: data.email,
                password: data.password,
            });

            const responseData = res.data.data;
            const { user, roles, permissions, departements, token } = responseData;

            // Stocker les informations
            localStorage.setItem("utilisateur", JSON.stringify({
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                full_name: user.full_name,
                email: user.email,
                statut: user.statut,
                avatar: user.avatar
            }));

            if (token) localStorage.setItem("token", token);
            localStorage.setItem("role", JSON.stringify(roles));
            localStorage.setItem("permissions", JSON.stringify(permissions.codes));
            localStorage.setItem("departements", JSON.stringify(departements));

            toast.success(`Bienvenue ${user.prenom} ${user.nom} !`);

            // Redirection
            const module = localStorage.getItem("archive_module");
            const userPermissions = JSON.parse(localStorage.getItem('permissions') || '[]');

            if (module === "ad" && userPermissions.includes('archiv_doc')) {
                navRouter.push("/tableaudebord");
            } else if (module === "np" && userPermissions.includes('note_perception')) {
                navRouter.push("/tableaudebordnote");
            } else {
                toast.error("Vous n'avez pas la permission pour ce module");
            }

        } catch (error) {
            console.error("Login error:", error);

            if (error.response?.status === 401) {
                setLoginError("Email ou mot de passe incorrect");
            } else {
                setLoginError("Une erreur s'est produite");
            }

            reset({ email: data.email, password: "", rememberMe: data.rememberMe });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTestLogin = () => {
        reset({
            email: "pierrpapy@gmail.com",
            password: "password",
            rememberMe: false,
        });
        setTimeout(() => {
            handleSubmit(onSubmit)();
        }, 100);
    };

    return (
        <div className="login-container">
            {/* Plus de header du tout */}

            {/* Contenu principal */}
            <div className="login-main">
                {/* Sélection des modules - Version maquette */}
                {showModuleSelection && (
                    <div className="module-selection">
                        <h1 className="module-title">Bienvenue dans la plateforme d'Archivage</h1>

                        {/* Logo centré comme dans la maquette */}
                        <div className="logo-container">
                            <img src={logo} alt="DGRAD" className="logo-image" />
                        </div>

                        <div className="blink">Sélectionnez un module pour continuer</div>

                        <div className="modules-grid">
                            {/* Module Archivage Ordinaire */}
                            <div
                                className="module-card"
                                onClick={() => handleModuleSelect("ad")}
                            >
                                <img src={archive} alt="Archivage" className="module-card-icon" />
                                <h3>Archivage Ordinaire</h3>
                                <p>Documents administratifs, correspondances, rapports</p>
                                <button className="module-btn btn-blue">
                                    Connexion ➜
                                </button>
                            </div>

                            {/* Module Note de Perception */}
                            <div
                                className="module-card"
                                onClick={() => handleModuleSelect("np")}
                            >
                                <img src={note} alt="Perception" className="module-card-icon" />
                                <h3>Note de Perception</h3>
                                <p>Documents financiers, quittances, pièces comptables</p>
                                <button className="module-btn btn-green">
                                    Connexion ➜
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulaire de connexion */}
                {!showModuleSelection && selectedModule && (
                    <div className="login-form-wrapper">
                        <button
                            className="back-button"
                            onClick={handleBackToModules}
                        >
                            <FaArrowCircleLeft />
                            Changer de module
                        </button>

                        <div className="login-form-container">
                            <div className="form-header">
                                <div className="form-icon">
                                    {selectedModule === "ad" ? <FaArchive size={24} /> : <FaFileInvoiceDollar size={24} />}
                                </div>
                                <h2>
                                    {selectedModule === "ad" ? "Archivage Ordinaire" : "Note de Perception"}
                                </h2>
                                <p>Connectez-vous avec vos identifiants DGRAD</p>
                            </div>

                            {loginError && (
                                <div className="alert alert-danger">
                                    {loginError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="form-group">
                                    <label>Email</label>
                                    <div className="input-group">
                                        <span className="input-icon">
                                            <FaEnvelope size={16} />
                                        </span>
                                        <input
                                            type="email"
                                            className={errors.email ? "error" : ""}
                                            placeholder="email@dgrad.cd"
                                            disabled={isSubmitting}
                                            {...register("email")}
                                        />
                                    </div>
                                    {errors.email && (
                                        <span className="error-message">{errors.email.message}</span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Mot de passe</label>
                                    <div className="input-group">
                                        <span className="input-icon">
                                            <FaLockIcon size={16} />
                                        </span>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={errors.password ? "error" : ""}
                                            placeholder="••••••••"
                                            disabled={isSubmitting}
                                            {...register("password")}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <span className="error-message">{errors.password.message}</span>
                                    )}
                                </div>

                                <div className="form-options">
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            {...register("rememberMe")}
                                        />
                                        <span>Se souvenir de moi</span>
                                    </label>
                                    <Link to="#" className="forgot-link">
                                        Mot de passe oublié?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={isSubmitting || !isValid}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FaSpinner className="spin" />
                                            Connexion...
                                        </>
                                    ) : (
                                        <>
                                            <FaSignInAlt />
                                            Se connecter
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Bouton de test en dev */}
                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    onClick={handleTestLogin}
                                    className="test-button"
                                >
                                    Test: Pierre (DF)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="login-footer">
                <p>© {new Date().getFullYear()} DGRAD - Tous droits réservés</p>
                <p>
                    <FaLock size={12} />
                    Environnement sécurisé
                </p>
            </div>
                    
</div>
    );
};

export default LoginScreen;