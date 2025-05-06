import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-Grayscale-Gray90 text-Grayscale-Gray10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-Grayscale-Gray80 p-8 md:p-12 rounded-lg shadow-xl">
        <Link to="/" className="inline-flex items-center text-sky-400 hover:text-sky-300 mb-6 group">
          <ArrowLeft size={20} className="mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
          Wróć do strony głównej
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 border-b border-Grayscale-Gray60 pb-4">
          Polityka Prywatności Platformy YouNeed
        </h1>

        <div className="prose prose-invert prose-lg max-w-none text-Grayscale-Gray30 space-y-6">
          <p>Data ostatniej aktualizacji: 03.05.2025</p>

          <h2 className="text-2xl font-semibold text-white pt-4">1. Wprowadzenie</h2>
          <p>
            Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych Użytkowników korzystających z platformy internetowej YouNeed, dostępnej pod adresem youneed.com.pl (dalej „Platforma YouNeed” lub „Serwis”).
          </p>
          <p>
            Administratorem Danych Osobowych (dalej „Administrator” lub „Operator”) jest YouNeed Spółka Cywilna, z siedzibą w Pierwoszynie, ul. Szmaragdowa 14, 81-198 Pierwoszyno, NIP: 5871751456, REGON: 541228193.
          </p>
          <p>
            Dbamy o prywatność naszych Użytkowników i dokładamy wszelkich starań, aby chronić ich dane osobowe zgodnie z obowiązującymi przepisami prawa, w szczególności z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych – dalej „RODO”).
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">2. Jakie dane zbieramy?</h2>
          <p>
            W zależności od sposobu korzystania z Serwisu (jako Klient lub Usługodawca) oraz udzielonych zgód, możemy zbierać następujące dane osobowe:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Dane podawane podczas rejestracji Konta:</strong> imię, nazwisko, adres e-mail, hasło (w formie zaszyfrowanej), numer telefonu (opcjonalnie lub wymagane dla Usługodawców), nazwa firmy (dla Usługodawców), branża (dla Usługodawców), adres (dla Usługodawców).</li>
            <li><strong>Dane podawane w profilu Użytkownika:</strong> dodatkowe informacje kontaktowe, opis działalności (dla Usługodawców), zdjęcia profilowe/firmowe, zakres świadczonych usług, lokalizacja świadczenia usług, godziny otwarcia, informacje o pracownikach (jeśli dotyczy), cele biznesowe.</li>
            <li><strong>Dane związane z korzystaniem z Serwisu:</strong> publikowane zapytania ofertowe, składane oferty, treść wiadomości wymienianych za pośrednictwem komunikatora w Serwisie, wystawiane opinie i oceny, historia transakcji (jeśli dotyczy płatności).</li>
            <li><strong>Dane zbierane automatycznie:</strong> adres IP, typ przeglądarki, system operacyjny, dane o lokalizacji (jeśli Użytkownik wyrazi zgodę), pliki cookies i podobne technologie (więcej informacji w sekcji „Pliki Cookies”).</li>
            <li><strong>Dane związane z płatnościami (dla Usługodawców):</strong> informacje niezbędne do przetworzenia płatności przez zewnętrznego operatora płatności (np. PayU), takie jak dane do faktury (jeśli wymagane). Nie przechowujemy pełnych danych kart płatniczych.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white pt-4">3. W jakim celu i na jakiej podstawie prawnej przetwarzamy dane?</h2>
          <p>Przetwarzamy Twoje dane osobowe w następujących celach i na podstawie następujących podstaw prawnych (zgodnie z art. 6 RODO):</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Świadczenie usług drogą elektroniczną (umowa):</strong>
              <ul>
                <li>Rejestracja i zarządzanie Kontem Użytkownika (art. 6 ust. 1 lit. b RODO).</li>
                <li>Umożliwienie publikowania zapytań i ofert (art. 6 ust. 1 lit. b RODO).</li>
                <li>Udostępnianie narzędzi komunikacji (art. 6 ust. 1 lit. b RODO).</li>
                <li>Obsługa płatności (jeśli dotyczy) (art. 6 ust. 1 lit. b RODO).</li>
                <li>Rozpatrywanie reklamacji dotyczących działania Serwisu (art. 6 ust. 1 lit. b lub f RODO – prawnie uzasadniony interes Administratora).</li>
              </ul>
            </li>
            <li>
              <strong>Prawnie uzasadniony interes Administratora (art. 6 ust. 1 lit. f RODO):</strong>
              <ul>
                <li>Analiza statystyczna i poprawa jakości działania Serwisu.</li>
                <li>Zapewnienie bezpieczeństwa Serwisu, przeciwdziałanie oszustwom i nadużyciom.</li>
                <li>Marketing bezpośredni własnych usług (jeśli nie wyrażono sprzeciwu).</li>
                <li>Dochodzenie lub obrona przed roszczeniami prawnymi.</li>
                <li>Kontakt w sprawach organizacyjnych i technicznych dotyczących Serwisu.</li>
              </ul>
            </li>
            <li>
              <strong>Zgoda Użytkownika (art. 6 ust. 1 lit. a RODO):</strong>
              <ul>
                <li>Przetwarzanie danych w celach marketingowych (np. wysyłka newslettera, informacji o promocjach) – jeśli wyrażono odrębną zgodę.</li>
                <li>Przetwarzanie danych w celu otrzymywania informacji handlowych od partnerów – jeśli wyrażono odrębną zgodę.</li>
                <li>Wykorzystanie plików cookies w celach analitycznych i marketingowych – zgodnie z ustawieniami przeglądarki i udzielonymi zgodami.</li>
                <li>Udostępnianie danych o lokalizacji.</li>
              </ul>
            </li>
             <li>
              <strong>Obowiązek prawny (art. 6 ust. 1 lit. c RODO):</strong>
              <ul>
                <li>Wypełnianie obowiązków wynikających z przepisów prawa, np. podatkowych czy rachunkowych.</li>
              </ul>
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-white pt-4">4. Komu udostępniamy dane?</h2>
          <p>Twoje dane osobowe mogą być udostępniane następującym kategoriom odbiorców:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Innym Użytkownikom Serwisu:</strong> W zakresie niezbędnym do realizacji celu Platformy (np. dane kontaktowe Usługodawcy widoczne dla Klienta po zaakceptowaniu oferty, treść zapytań widoczna dla Usługodawców, publiczne opinie).</li>
            <li><strong>Podmiotom przetwarzającym dane na zlecenie Administratora (procesorzy):</strong> Dostawcom usług IT (hosting, poczta e-mail, systemy CRM), operatorom płatności (np. PayU), firmom analitycznym i marketingowym, firmom windykacyjnym, kancelariom prawnym – podmioty te przetwarzają dane na podstawie umowy z Administratorem i wyłącznie zgodnie z jego poleceniami.</li>
            <li><strong>Organom państwowym:</strong> Jeśli jest to wymagane przez obowiązujące przepisy prawa (np. sądy, prokuratura, organy podatkowe).</li>
          </ul>
          <p>Nie przekazujemy Twoich danych osobowych poza Europejski Obszar Gospodarczy (EOG), chyba że jest to konieczne i zapewnimy odpowiedni stopień ochrony (np. na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską).</p>

          <h2 className="text-2xl font-semibold text-white pt-4">5. Jak długo przechowujemy dane?</h2>
          <p>
            Przechowujemy Twoje dane osobowe przez okres niezbędny do realizacji celów, dla których zostały zebrane:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Przez czas posiadania Konta w Serwisie oraz po jego usunięciu przez okres wymagany przepisami prawa (np. dla celów rozliczeniowych, dochodzenia roszczeń) lub do czasu wygaśnięcia ewentualnych roszczeń.</li>
            <li>W przypadku przetwarzania danych na podstawie zgody – do czasu jej wycofania.</li>
            <li>W przypadku przetwarzania danych na podstawie prawnie uzasadnionego interesu – do czasu wniesienia skutecznego sprzeciwu.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white pt-4">6. Twoje prawa (RODO)</h2>
          <p>W związku z przetwarzaniem Twoich danych osobowych przysługują Ci następujące prawa:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Prawo dostępu do danych:</strong> Możesz uzyskać informacje o przetwarzanych przez nas danych oraz kopię tych danych.</li>
            <li><strong>Prawo do sprostowania danych:</strong> Możesz żądać poprawienia nieprawidłowych lub uzupełnienia niekompletnych danych.</li>
            <li><strong>Prawo do usunięcia danych („prawo do bycia zapomnianym”):</strong> Możesz żądać usunięcia swoich danych, jeśli nie ma już podstawy prawnej do ich przetwarzania (np. wycofano zgodę, wniesiono sprzeciw, dane nie są już niezbędne do celów, dla których je zebrano).</li>
            <li><strong>Prawo do ograniczenia przetwarzania:</strong> Możesz żądać ograniczenia przetwarzania danych w określonych przypadkach (np. gdy kwestionujesz prawidłowość danych, przetwarzanie jest niezgodne z prawem, ale nie chcesz ich usuwać).</li>
            <li><strong>Prawo do przenoszenia danych:</strong> Jeśli przetwarzanie odbywa się na podstawie zgody lub umowy i w sposób zautomatyzowany, masz prawo otrzymać swoje dane w ustrukturyzowanym, powszechnie używanym formacie nadającym się do odczytu maszynowego oraz przesłać je innemu administratorowi.</li>
            <li><strong>Prawo do sprzeciwu:</strong> Możesz wnieść sprzeciw wobec przetwarzania danych na podstawie prawnie uzasadnionego interesu Administratora (w tym marketingu bezpośredniego). W przypadku marketingu bezpośredniego sprzeciw jest bezwzględnie skuteczny. W innych przypadkach rozważymy, czy nasz uzasadniony interes nie jest nadrzędny wobec Twoich praw i wolności.</li>
            <li><strong>Prawo do wycofania zgody:</strong> Jeśli przetwarzanie odbywa się na podstawie zgody, możesz ją wycofać w dowolnym momencie. Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania dokonanego przed jej wycofaniem.</li>
            <li><strong>Prawo do wniesienia skargi do organu nadzorczego:</strong> Masz prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa), jeśli uważasz, że przetwarzanie Twoich danych narusza przepisy RODO.</li>
          </ul>
          <p>Aby skorzystać ze swoich praw, skontaktuj się z nami pod adresem e-mail: eyouneeed@gmail.com lub adresem korespondencyjnym: YouNeed Spółka Cywilna, ul. Szmaragdowa 14, 81-198 Pierwoszyno. Telefon kontaktowy: +48 534 252 388.</p>

          <h2 className="text-2xl font-semibold text-white pt-4">7. Pliki Cookies</h2>
          <p>
            Platforma YouNeed wykorzystuje pliki cookies (małe pliki tekstowe zapisywane na urządzeniu Użytkownika) oraz podobne technologie. Używamy ich w celu:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Zapewnienia prawidłowego działania Serwisu (cookies niezbędne).</li>
            <li>Utrzymania sesji Użytkownika po zalogowaniu (cookies funkcjonalne).</li>
            <li>Analizy statystyk odwiedzin i zachowań Użytkowników (cookies analityczne, np. Google Analytics).</li>
            <li>Dostosowywania treści reklamowych (cookies marketingowe/reklamowe).</li>
          </ul>
          <p>
            Podczas pierwszej wizyty w Serwisie wyświetlany jest baner informujący o stosowaniu plików cookies i umożliwiający zarządzanie zgodami. Możesz również zmienić ustawienia cookies w swojej przeglądarce internetowej. Ograniczenie stosowania cookies może wpłynąć na niektóre funkcjonalności Serwisu.
          </p>
          <p>
            Więcej informacji o zarządzaniu plikami cookies znajdziesz w ustawieniach swojej przeglądarki lub na stronach jej producenta.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">8. Bezpieczeństwo Danych</h2>
          <p>
            Stosujemy odpowiednie środki techniczne i organizacyjne, aby chronić Twoje dane osobowe przed nieuprawnionym dostępem, utratą, zniszczeniem lub zmianą. Obejmuje to m.in. szyfrowanie połączenia (SSL), stosowanie bezpiecznych haseł, regularne tworzenie kopii zapasowych, ograniczenie dostępu do danych tylko dla upoważnionych osób.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">9. Zmiany w Polityce Prywatności</h2>
          <p>
            Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. O wszelkich zmianach będziemy informować poprzez publikację nowej wersji Polityki w Serwisie oraz, w przypadku istotnych zmian, poprzez dodatkowe powiadomienie (np. e-mail). Zalecamy regularne sprawdzanie treści Polityki Prywatności.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">10. Kontakt</h2>
          <p>
            W razie pytań dotyczących przetwarzania danych osobowych lub realizacji swoich praw, prosimy o kontakt:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Adres e-mail: eyouneeed@gmail.com</li>
            <li>Adres korespondencyjny: YouNeed Spółka Cywilna, ul. Szmaragdowa 14, 81-198 Pierwoszyno</li>
            <li>Telefon: +48 534 252 388</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
