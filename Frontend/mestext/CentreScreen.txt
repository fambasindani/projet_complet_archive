import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Head from "../Composant/Head";
import Menus from "../Composant/Menus";
import Button from "../Composant/Button";
import Input from "../Composant/Input";
import Table from "../Composant/Table";
import { API_BASE_URL } from "../config";
import GetTokenOrRedirect from "../Composant/getTokenOrRedirect";
import Droplist from "../Composant/DropList ";


const CentreScreen = () => {
    const [centres, setCentres] = useState([]);
    const [ministeres, setMinisteres] = useState([]);
    const [nom, setNom] = useState("");
    const [description, setDescription] = useState("");
    const [ministereId, setMinistereId] = useState("");
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
    const [centreEnEdition, setCentreEnEdition] = useState(null);
    const [modeRecherche, setModeRecherche] = useState(false);
    const [valeurtable, setValeurtable] = useState(true);
    const [loading, setLoading] = useState(false);

    const token = GetTokenOrRedirect();

    useEffect(() => {
        if (token) {
            fetchDropdowns();
        }
    }, [pagination.current_page, modeRecherche, token]);

    const fetchDropdowns = async () => {
        if (!token) return;
        setLoading(true);

        try {
            const [resMinisteres, resCentres] = await Promise.all([
                axios.get(`${API_BASE_URL}/article`, { headers: { Authorization: `Bearer ${token}` } }),
                modeRecherche && search.trim() !== ""
                    ? axios.post(`${API_BASE_URL}/centre_ordonnancements/search`, { search, page: pagination.current_page }, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    : axios.get(`${API_BASE_URL}/centre_ordonnancements/all?page=${pagination.current_page}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
            ]);

            setMinisteres(resMinisteres.data.data || resMinisteres.data);
            //setCentres(resCentres.data.data || resCentres.data);
            setCentres(resCentres.data.data.map(centre => ({
                ...centre,
                article_budgetaire: centre.article_budgetaire || {}, // Assurez-vous que l'article budgétaire est défini
            })) || resCentres.data);

            console.log(resCentres);

            setPagination({ current_page: resCentres.data.current_page, last_page: resCentres.data.last_page });
        } catch (err) {
            console.error("Erreur lors du chargement des dropdowns :", err.response || err.message);
            Swal.fire("Erreur", "Erreur lors du chargement des listes", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, current_page: 1 }));
        setModeRecherche(true);
    };

    const actualiser = () => {
        setSearch("");
        setModeRecherche(false);
        setPagination({ current_page: 1, last_page: 1 });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        // Vérifiez si un ministère est sélectionné
       /*  if (!ministereId) {
            Swal.fire("Erreur", "Veuillez sélectionner un ministère.", "error");
            return; // Ne pas continuer si aucun ministère n'est sélectionné
        } */

        try {
            const payload = {
                nom,
                description,
                id_ministere: parseInt(ministereId), // Assurez-vous que c'est un nombre
            };

            if (centreEnEdition) {
                await axios.put(
                    `${API_BASE_URL}/centre_ordonnancements/${centreEnEdition}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire("Succès", "Centre mis à jour avec succès", "success");
            } else {
                await axios.post(
                    `${API_BASE_URL}/centre_ordonnancements`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                Swal.fire("Succès", "Centre ajouté avec succès", "success");
            }

            // Réinitialisation des champs
            setNom("");
            setDescription("");
            setMinistereId(""); // Réinitialiser également le champ
            setCentreEnEdition(null);
            setValeurtable(true);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
            fetchDropdowns();

        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else if (error.response?.data?.message) {
                Swal.fire("Erreur", error.response.data.message, "error");
            } else {
                Swal.fire("Erreur", "Une erreur est survenue", "error");
            }
        }
    };

    const handleEdit = async (id) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/centre_ordonnancements/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNom(res.data.nom);
            setDescription(res.data.description);
            setMinistereId(String(res.data.id_ministere || "")); // Vérifiez ici
            setCentreEnEdition(id);
            setValeurtable(false);

            console.log("Ministere ID:", res.data.id_ministere); // Vérifiez la valeur ici
        } catch (err) {
            console.error(err);
            Swal.fire("Erreur", "Erreur lors du chargement", "error");
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Voulez-vous désactiver ce centre ?",
            text: "Cette action désactivera le centre.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Oui, désactiver",
            cancelButtonText: "Annuler",
        }).then((result) => {
            if (result.isConfirmed) {
                axios.delete(`${API_BASE_URL}/centre_ordonnancements/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then(() => {
                        Swal.fire("Désactivé", "Le centre a été désactivé", "success");
                        setNom("");
                        setDescription("");
                        setMinistereId("");
                        setCentreEnEdition(null);
                        setValeurtable(true);
                        fetchDropdowns();
                    })
                    .catch((error) => {
                        console.error(error);
                        Swal.fire("Erreur", "Erreur lors de la désactivation", "error");
                    });
            }
        });
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.last_page) {
            setPagination((prev) => ({ ...prev, current_page: page }));
        }
    };

    const handleCancelEdit = () => {
        setNom("");
        setDescription("");
        setMinistereId("");
        setCentreEnEdition(null);
        setErrors({});
    };

    const columns = [
        { key: "nom", label: "Nom du Centre" },
        { key: "description", label: "Description" },
        { key: "article_budgetaire.nom", label: "Ministere" }, // Utilisez cette clé pour accéder au nom de l'article budgétaire
    ];

    const actions = [
        { icon: "far fa-edit", color: "info", onClick: (row) => handleEdit(row.id) },
        { icon: "far fa-trash-alt", color: "secondary", onClick: (row) => handleDelete(row.id) },
    ];

    return (
        <div>
            <Menus />
            <Head />
            <div className="content-wrapper" style={{ backgroundColor: "whitesmoke", minHeight: "100vh" }}>
                <div className="content-header">
                    <div className="container-fluid">
                        <h5 className="p-2 mb-3" style={{ backgroundColor: "#343a40", color: "#fff" }}>
                            <i className="ion-ios-toggle-outline mr-2" /> Gestion des Centres d’Ordonnancement
                        </h5>
                    </div>
                </div>

                <section className="content">
                    <div className="container-fluid">
                        <div className="row mb-2">
                            <div className="col-9"></div>
                            <div className="col-3 d-flex justify-content-end">
                                <Button
                                    className={valeurtable ? "btn-info" : "btn-success"}
                                    onClick={() => {
                                        handleCancelEdit();
                                        setValeurtable(!valeurtable);
                                    }}
                                    icon={valeurtable ? "ion-plus-circled" : "ion-arrow-left-b"}
                                >
                                    {valeurtable ? "Ajouter un centre" : "Retour à la liste"}
                                </Button>
                            </div>
                        </div>

                        <div className="row">
                            {valeurtable ? (
                                <div className="col-md-12">
                                    <div className="form-inline mb-2">
                                        <div className="input-group w-50">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Rechercher un centre"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            <div className="input-group-append">
                                                <Button onClick={handleSearch} className="btn-secondary" icon="fa fa-search" block={false} />
                                            </div>
                                            <div className="input-group-append ml-2">
                                                <Button onClick={actualiser} className="btn-success" icon="fa fa-sync" block={false} />
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div style={{ minHeight: "200px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
                                                <span className="sr-only">Chargement...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Table
                                                columns={columns}
                                                data={centres.map(centre => ({
                                                    ...centre,
                                                    article_budgetaire: centre.article_budgetaire || {}, // Inclure l'article budgétaire
                                                }))}
                                                actions={actions}
                                                startIndex={(pagination.current_page - 1) * 10}
                                                emptyMessage="Aucun centre trouvé"
                                            />



                                            <nav>
                                                <ul className="pagination">
                                                    <li className={`page-item ${pagination.current_page === 1 ? "disabled" : ""}`}>
                                                        <button className="page-link" onClick={() => handlePageChange(pagination.current_page - 1)}>
                                                            Précédent
                                                        </button>
                                                    </li>
                                                    {Array.from({ length: pagination.last_page }, (_, i) => (
                                                        <li key={i} className={`page-item ${pagination.current_page === i + 1 ? "active" : ""}`}>
                                                            <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                                                                {i + 1}
                                                            </button>
                                                        </li>
                                                    ))}
                                                    <li className={`page-item ${pagination.current_page === pagination.last_page ? "disabled" : ""}`}>
                                                        <button className="page-link" onClick={() => handlePageChange(pagination.current_page + 1)}>
                                                            Suivant
                                                        </button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="col-md-6 offset-md-3">
                                    <form onSubmit={handleSubmit} className="bg-white p-3 shadow rounded">

                                        <label className="mt-3">
                                            Ministère <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <Droplist
                                            name="id_ministere"
                                            value={ministereId}
                                            onChange={(e) => setMinistereId(e.target.value)}
                                            options={ministeres.map((m) => ({
                                                id: String(m.id),
                                                nom: m.nom,
                                            }))}
                                            placeholder="-- Sélectionnez un ministère --"
                                            error={errors.id_ministere && errors.id_ministere[0]}
                                        />

                                        <label className="mt-3">
                                            Nom du centre <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <Input
                                            name="nom"
                                            placeholder="Nom du centre"
                                            value={nom}
                                            onChange={(e) => setNom(e.target.value)}
                                            icon="fas fa-building"
                                            error={errors.nom && errors.nom[0]}
                                        />

                                        <label className="mt-3">
                                            Description <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <Input
                                            name="description"
                                            placeholder="Description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            icon="fas fa-align-left"
                                            error={errors.description && errors.description[0]}
                                        />

                                        <div className="row mt-3">
                                            {centreEnEdition ? (
                                                <>
                                                    <div className="col-6 px-1">
                                                        <Button type="submit" className="btn-warning w-100 py-2" icon="fas fa-edit">
                                                            Modifier
                                                        </Button>
                                                    </div>
                                                    <div className="col-6 px-1">
                                                        <Button
                                                            type="button"
                                                            className="btn-secondary w-100 py-2"
                                                            onClick={() => {
                                                                handleCancelEdit();
                                                                setValeurtable(true);
                                                            }}
                                                            icon="fas fa-reply"
                                                        >
                                                            Annuler
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="col-12 px-1">
                                                    <Button type="submit" className="btn-primary w-100 py-2" icon="ion-plus">
                                                        Ajouter
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CentreScreen;