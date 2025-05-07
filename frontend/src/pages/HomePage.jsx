import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Briefcase, UserCheck, ShieldCheck, Zap, BarChart2 } from 'lucide-react';
import Logo from '../assets/images/youneed_logo_white.png'; // Adjust path as needed
import HeroImage from '../assets/images/hero-image.png'; // Replace with your actual hero image path
import FeatureImage1 from '../assets/images/feature-1.png'; // Replace with your actual feature image path
import FeatureImage2 from '../assets/images/feature-1.png'; // Replace with your actual feature image path
import FeatureImage3 from '../assets/images/feature-1.png'; // Replace with your actual feature image path

const HomePage = () => {
  return (
    <div className="bg-Grayscale-Gray80 text-white min-h-screen">
      {/* Header */}
       <header className="container mx-auto px-4 py-3 sm:py-4 flex flex-wrap justify-between items-center">
        <img src={Logo} alt="YouNeed Logo" className="h-12 sm:h-16 md:h-20" />
        <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end mt-2 sm:mt-0">
          <Link 
            to="/login?role=client" 
            className="text-xs sm:text-sm bg-neutral-900 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 hover:text-sky-400 transition-colors"
          >
            Zaloguj się (Klient)
          </Link>
          <Link 
            to="/login?role=provider" 
            className="text-xs sm:text-sm bg-neutral-900 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 hover:text-sky-400 transition-colors"
          >
            Zaloguj się (Specjalista)
          </Link>
          <Link
            to="/register/client"
            className="bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors flex items-center gap-1"
          >
            Zarejestruj się <ArrowRight size={14} className="hidden sm:inline" />
          </Link>
        </nav>
      </header>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 text-center flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
          Znajdź <span className="text-sky-400">idealnego</span> usługodawcę lub <span className="text-sky-400">zdobywaj</span> zlecenia
        </h1>
        <p className="text-lg md:text-xl text-Grayscale-Gray40 mb-8 max-w-3xl">
          YouNeed łączy klientów poszukujących sprawdzonych specjalistów z profesjonalistami gotowymi do realizacji zleceń. Szybko, bezpiecznie i efektywnie.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/register/client"
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Szukam Usługodawcy <Search size={20} />
          </Link>
          <Link
            to="/register/provider"
            className="bg-Grayscale-Gray70 hover:bg-Grayscale-Gray60 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Jestem Usługodawcą <Briefcase size={20} />
          </Link>
        </div>
        <img src={HeroImage} alt="Platforma YouNeed w użyciu" className="mt-16 rounded-lg shadow-xl w-full max-w-4xl" />
      </section>

      {/* Features Section */}
      <section className="bg-Grayscale-Gray70 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Dlaczego YouNeed?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-sky-500/20 p-4 rounded-full mb-4">
                <UserCheck size={32} className="text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Weryfikowani Specjaliści</h3>
              <p className="text-Grayscale-Gray40 text-sm">
                Dostęp do bazy sprawdzonych usługodawców z różnych branż, z potwierdzonymi umiejętnościami i opiniami.
              </p>
              <img src={FeatureImage1} alt="Weryfikowani specjaliści" className="mt-6 rounded-lg  w-full h-48 object-contain"/>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-sky-500/20 p-4 rounded-full mb-4">
                <ShieldCheck size={32} className="text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bezpieczne Transakcje</h3>
              <p className="text-Grayscale-Gray40 text-sm">
                System bezpiecznych płatności i transparentne warunki współpracy chronią obie strony.
              </p>
               <img src={FeatureImage2} alt="Bezpieczne transakcje" className="mt-6 rounded-lg  w-full h-48 object-contain"/>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-sky-500/20 p-4 rounded-full mb-4">
                <Zap size={32} className="text-sky-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Szybkość i Wygoda</h3>
              <p className="text-Grayscale-Gray40 text-sm">
                Intuicyjny interfejs, łatwe zarządzanie zleceniami i szybka komunikacja oszczędzają Twój czas.
              </p>
               <img src={FeatureImage3} alt="Szybkość i wygoda" className="mt-6 rounded-lg w-full h-48 object-contain"/>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Jak to działa?</h2>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* For Clients */}
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-sky-400">Dla Klientów</h3>
            <ol className="list-decimal list-inside space-y-3 text-Grayscale-Gray30">
              <li><span className="font-semibold text-white">Opisz Zlecenie:</span> Podaj szczegóły dotyczące potrzebnej usługi.</li>
              <li><span className="font-semibold text-white">Otrzymaj Oferty:</span> Przeglądaj propozycje od zainteresowanych usługodawców.</li>
              <li><span className="font-semibold text-white">Wybierz Najlepszą:</span> Porównaj oferty, profile i opinie, aby wybrać idealnego wykonawcę.</li>
              <li><span className="font-semibold text-white">Realizuj i Oceń:</span> Po wykonaniu usługi, dokonaj płatności i wystaw opinię.</li>
            </ol>
            <Link
              to="/register?role=client"
              className="mt-6 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
            >
              Zacznij jako Klient <ArrowRight size={18} />
            </Link>
          </div>
          {/* For Providers */}
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-sky-400">Dla Usługodawców</h3>
            <ol className="list-decimal list-inside space-y-3 text-Grayscale-Gray30">
              <li><span className="font-semibold text-white">Stwórz Profil:</span> Zaprezentuj swoje umiejętności, doświadczenie i portfolio.</li>
              <li><span className="font-semibold text-white">Przeglądaj Zlecenia:</span> Znajdź interesujące projekty pasujące do Twojej specjalizacji.</li>
              <li><span className="font-semibold text-white">Składaj Oferty:</span> Proponuj swoje warunki i przekonaj klientów do współpracy.</li>
              <li><span className="font-semibold text-white">Realizuj i Zarabiaj:</span> Wykonuj zlecenia na najwyższym poziomie i otrzymuj płatności.</li>
            </ol>
             <Link
              to="/register/provider"
              className="mt-6 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-semibold transition-colors"
            >
              Dołącz jako Usługodawca <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-sky-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Gotowy dołączyć do YouNeed?</h2>
          <p className="text-lg text-sky-100 mb-8">
            Zarejestruj się już dziś i odkryj nowe możliwości – niezależnie od tego, czy potrafisz jedną rzecz, czy oferujesz wiele usług.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link
              to="/register/provider"
              className="bg-white text-sky-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Zarejestruj się Zleceniodawco <ArrowRight size={20} />
            </Link>
             <Link
              to="/login?role=provider" // General login link, user chooses role on the login page
              className="bg-sky-700 hover:bg-sky-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-Grayscale-Gray90 py-10 mt-10">
        <div className="container mx-auto px-4 text-center text-Grayscale-Gray50 text-sm">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 mb-4">
            <Link to="/terms" className="hover:text-sky-400 transition-colors">Regulamin</Link>
            <Link to="/privacy" className="hover:text-sky-400 transition-colors">Polityka Prywatności</Link>
            {/* Add more links if needed, e.g., FAQ, Contact */}
            {/* <Link to="/faq" className="hover:text-sky-400 transition-colors">FAQ</Link> */}
            {/* <Link to="/contact" className="hover:text-sky-400 transition-colors">Kontakt</Link> */}
          </div>
          <p>&copy; {new Date().getFullYear()} YouNeed Spółka Cywilna. Wszelkie prawa zastrzeżone.</p>
          <p className="mt-1">ul. Szmaragdowa 14, 81-198 Pierwoszyno | NIP: 5871751456 | REGON: 541228193</p>
          <p className="mt-1">Kontakt: <a href="mailto:eyouneeed@gmail.com" className="hover:text-sky-400">eyouneeed@gmail.com</a> | <a href="tel:+48534252388" className="hover:text-sky-400">+48 535 188 923</a></p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
