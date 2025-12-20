import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  en: {
    translation: {
      nav: { home: 'Home', about: 'About', projects: 'Projects', contact: 'Contact' },
      common: { loading: 'Loading…', backHome: 'Back to Home' },

      home: {
        title: 'Home',
        body: 'Welcome to PermitParser. This is the landing page.',
      },

      about: {
        title: 'About',
        body:
          'Munera Intelligence builds market intelligence for Canadian real estate and infrastructure. ' +
          'This PMS turns municipal sources into structured, verifiable project records with OCR-backed documents, ' +
          'quality signals, and customer-safe publishing.',
      },

      projects: {
        title: 'Projects',
        body: 'Explore planned and active projects. Use filters, map view, and document overlays to verify data.',
        searchPlaceholder: 'Search projects…',
      },

      userMenu: {
        login: 'Login',
        signup: 'Sign Up',
        logout: 'Logout',
        profile: 'Profile',
        settings: 'Account settings',
      },

      auth: {
        login: {
          title: 'Login',
          email: 'Email',
          password: 'Password',
          submit: 'Sign in',
          noAccount: 'No account?',
          signUp: 'Sign up',
        },
        signup: {
          title: 'Sign Up',
          firstName: 'First name',
          lastName: 'Last name',
          email: 'Email',
          password: 'Password',
          repeatPassword: 'Repeat password',
          submit: 'Create account',
          haveAccount: 'Already have an account?',
          login: 'Login',
          mismatch: 'Passwords must match',
        },
      },

      contact: {
        title: 'Contact',
        body: 'Questions or partnerships? Reach us via the form below or email support@munera.ai.',
      },

      notFound: {
        title: '404 — Page Not Found',
        body: 'The page you’re looking for doesn’t exist.',
      },
    },
  },

  fr: {
    translation: {
      nav: { home: 'Accueil', about: 'À propos', projects: 'Projets', contact: 'Contact' },
      common: { loading: 'Chargement…', backHome: 'Retour à l’accueil' },

      home: {
        title: 'Accueil',
        body: 'Bienvenue sur PermitParser. Ceci est la page d’accueil.',
      },

      about: {
        title: 'À propos',
        body:
          'Munera Intelligence fournit de l’intelligence de marché pour l’immobilier et les infrastructures au Canada. ' +
          'Ce PMS transforme les sources municipales en dossiers de projets structurés et vérifiables avec documents OCR, ' +
          'indicateurs de qualité et publication contrôlée pour les clients.',
      },

      projects: {
        title: 'Projets',
        body: 'Parcourez les projets planifiés et actifs. Utilisez filtres, carte et superposition des documents pour vérifier les données.',
        searchPlaceholder: 'Rechercher des projets…',
      },

      userMenu: {
        login: 'Connexion',
        signup: 'Créer un compte',
        logout: 'Déconnexion',
        profile: 'Profil',
        settings: 'Paramètres du compte',
      },

      contact: {
        title: 'Contact',
        body: 'Questions ou partenariats ? Contactez-nous via le formulaire ci-dessous ou par courriel : support@munera.ai.',
      },

      notFound: {
        title: '404 — Page introuvable',
        body: 'La page que vous recherchez n’existe pas.',
      },

      auth: {
        login: {
          title: 'Connexion',
          email: 'Courriel',
          password: 'Mot de passe',
          submit: 'Se connecter',
          noAccount: 'Pas de compte ?',
          signUp: 'Créer un compte',
        },
        signup: {
          title: 'Créer un compte',
          firstName: 'Prénom',
          lastName: 'Nom',
          email: 'Courriel',
          password: 'Mot de passe',
          repeatPassword: 'Confirmez le mot de passe',
          submit: 'Créer le compte',
          haveAccount: 'Vous avez déjà un compte ?',
          login: 'Connexion',
          mismatch: 'Les mots de passe doivent correspondre',
        },
      },
    },
  },
}

i18n
  .use(LanguageDetector) // detect from navigator, localStorage, etc.
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: { order: ['querystring', 'localStorage', 'navigator'], caches: ['localStorage'] },
    interpolation: { escapeValue: false },
  })

export default i18n
