// @ts-nocheck
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom'; // 👈 AJOUTEZ Redirect ICI
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import LoginScreen from './Screens/LoginScreen';
import Tableaudebord from './Screens/Tableaudebord';
import DirectionScreen from './Screens/DirectionScreen';
import ClasseurScreen from './Screens/ClasseurScreen';
import CentreScreen from './Screens/CentreScreen';
import EmplacementScreen from './Screens/EmplacementScreen';
import DocumentScreen from './Screens/DocumentScreen';
import MinistereScreen from './Screens/MinistereScreen';
import NoteperceptionScreen from './Screens/NoteperceptionScreen';
import NotePlusScreen from './Screens/NotePlusScreen';
import ScannerComponent from './Composant/ScannerComponent';
import ListeDocumentScreen from './Screens/ListeDocumentScreen';
import UtilisateurScreen from './Screens/UtilisateurScreen';
import Tableaudebordnote from './Screens/Tableaudebordnote';
import ListenoteScreen from './Screens/ListenoteScreen';
import './style/Loading.css'

import { UserProvider } from './Composant/UserContext';

// Import des nouveaux composants améliorés
import UserManagementLayout from './Composant/UserManagementLayout';
import Users from './Screens/UserScreen';
import Roles from './Screens/RoleScreen';
import Dashboard from './Composant/Dashboard';
import Permissions from './Screens/PermissionScreen';
import RoleCreateScreen from './Screens/RoleCreateScreen';
import FormDocumentScreen from './Screens/FormDocumentScreen';
import DetailScreen from './Screens/DetailDocumentScreen';
import HomeScreen from './Screens/HomeScreen';
import Directions from './Composant/Directions';
import DirectionCreateScreen from './Screens/DirectionCreateScreen';
import DirectionEditScreen from './Screens/DirectionEditScreen';
import DirectionViewScreen from './Screens/DirectionViewScreen';
import ScanViewers from './Composant/ScanViewers';
import RoleForm from './Screens/RoleFormScreen';
import RoleDetailScreen from './Screens/RoleDetailScreen';
import DirectionDetailScreen from './Screens/DirectionDetailScreen';
import ProfilScreen from './Screens/ProfilScreen';
import FormNoteScreen from './Screens/FormNoteScreen';
import DetailNoteScreen from './Screens/DetailNoteScreen';
import JournalScreen from './Screens/JournalScreen';

// Import du composant IdleTimer
import IdleTimer from './Composant/Temps';
// Import du composant ProtectedRoute
import ProtectedRoute from './Composant/ProtectedRoute';
import { ToastContainer } from './Composant/Toast';

function AppContent() {
  const history = useHistory();
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.clear();
    history.push('/');
  };

  return (
    <>
      <ToastContainer />
      {/* IdleTimer uniquement si l'utilisateur est connecté */}
      {isAuthenticated && (
        <IdleTimer 
          timeout={10 * 60 * 1000} // 10 minutes
          onLogout={handleLogout}
        />
      )}
      
      <Switch>
        {/* Routes publiques */}
        <Route exact path="/" component={LoginScreen} />
        <Route path="/scan" component={ScanViewers} />

        {/* Routes protégées */}
        <ProtectedRoute path="/direction" component={DirectionScreen} />
        <ProtectedRoute path="/classeur" component={ClasseurScreen} />
        <ProtectedRoute path="/centre-ordonnancement" component={CentreScreen} />
        <ProtectedRoute path="/emplacement" component={EmplacementScreen} />
        <ProtectedRoute path="/document" component={DocumentScreen} />
        <ProtectedRoute path="/ministere" component={MinistereScreen} />
        <ProtectedRoute path="/tableaudebord" component={Tableaudebord} />
        <ProtectedRoute path="/note-perception" component={NoteperceptionScreen} />
        <ProtectedRoute path="/note-plus" component={NotePlusScreen} />
        <ProtectedRoute path="/scan" component={ScannerComponent} />
        <ProtectedRoute path="/listedocument/:id" component={ListeDocumentScreen} />
        <ProtectedRoute path="/utilisateur" component={UtilisateurScreen} />
        <ProtectedRoute path="/tableaudebordnote" component={Tableaudebordnote} />
        <ProtectedRoute path="/listenote/:id" component={ListenoteScreen} />
        <ProtectedRoute path="/addform" component={FormDocumentScreen} />
        <ProtectedRoute path="/note/form" component={FormNoteScreen} />
        <ProtectedRoute path="/note/detail/:id" component={DetailNoteScreen} />
        <ProtectedRoute path="/detail-document/:id" component={DetailScreen} />
        <ProtectedRoute path="/profil" component={ProfilScreen} />

        {/* Routes de gestion des utilisateurs (protégées) */}
        <ProtectedRoute path="/gestion-utilisateurs">
          <UserManagementLayout>
            <Switch>
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/dashboard"
                component={Dashboard}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/utilisateurs"
                component={Users}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/roles/nouveau"
                component={RoleCreateScreen}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/roles/:id/modifier"
                component={RoleForm}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/roles/:id"
                component={RoleDetailScreen}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/roles"
                component={Roles}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/permissions"
                component={Permissions}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/directions/nouvelle"
                component={DirectionCreateScreen}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/directions/:id/modifier"
                component={DirectionEditScreen}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/directions/:id"
                component={DirectionDetailScreen}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/directions"
                component={Directions}
              />
              <ProtectedRoute
                exact
                path="/gestion-utilisateurs/journal"
                component={JournalScreen}
              />
            </Switch>
          </UserManagementLayout>
        </ProtectedRoute>

        {/* Route 404 - Redirection vers login */}
        <Route path="*">
          <Redirect to="/" />
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <Router basename="/archive">
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;