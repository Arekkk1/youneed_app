import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-Grayscale-Gray90 text-Grayscale-Gray10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-Grayscale-Gray80 p-8 md:p-12 rounded-lg shadow-xl">
        <Link to="/" className="inline-flex items-center text-sky-400 hover:text-sky-300 mb-6 group">
          <ArrowLeft size={20} className="mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
          Wróć do strony głównej
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 border-b border-Grayscale-Gray60 pb-4">
          Regulamin Platformy YouNeed
        </h1>

        <div className="prose prose-invert prose-lg max-w-none text-Grayscale-Gray30 space-y-6">
          <p>Data ostatniej aktualizacji: 03.05.2025</p>

          <h2 className="text-2xl font-semibold text-white pt-4">1. Postanowienia Ogólne</h2>
          <p>
            Niniejszy Regulamin określa zasady świadczenia usług drogą elektroniczną przez YouNeed Spółka Cywilna, z siedzibą w Pierwoszynie, ul. Szmaragdowa 14, 81-198 Pierwoszyno, NIP: 5871751456, REGON: 541228193, zwaną dalej „Operatorem”, za pośrednictwem platformy internetowej dostępnej pod adresem youneed.com.pl (dalej „Platforma YouNeed” lub „Serwis”).
          </p>
          <p>
            Platforma YouNeed jest narzędziem umożliwiającym kontakt pomiędzy Użytkownikami poszukującymi usług (dalej „Klienci”) a Użytkownikami oferującymi wykonanie usług (dalej „Usługodawcy”). Operator nie jest stroną umów zawieranych pomiędzy Klientami a Usługodawcami.
          </p>
          <p>
            Korzystanie z Platformy YouNeed oznacza akceptację niniejszego Regulaminu w całości. Użytkownik zobowiązuje się do przestrzegania jego postanowień.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">2. Definicje</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Operator:</strong> YouNeed Spółka Cywilna świadczący usługi drogą elektroniczną za pośrednictwem Platformy YouNeed.</li>
            <li><strong>Platforma YouNeed/Serwis:</strong> Serwis internetowy dostępny pod adresem youneed.com.pl.</li>
            <li><strong>Użytkownik:</strong> Każda osoba fizyczna, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, która korzysta z Platformy YouNeed (Klient lub Usługodawca).</li>
            <li><strong>Klient:</strong> Użytkownik poszukujący Usługodawcy w celu zlecenia wykonania usługi.</li>
            <li><strong>Usługodawca:</strong> Użytkownik oferujący swoje usługi za pośrednictwem Platformy YouNeed.</li>
            <li><strong>Konto:</strong> Indywidualny profil Użytkownika w Serwisie, zabezpieczony hasłem, umożliwiający korzystanie z funkcjonalności Platformy.</li>
            <li><strong>Usługa:</strong> Czynność oferowana przez Usługodawcę lub poszukiwana przez Klienta za pośrednictwem Platformy.</li>
            <li><strong>Regulamin:</strong> Niniejszy dokument.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white pt-4">3. Rejestracja i Konto Użytkownika</h2>
          <p>
            Korzystanie z pełnej funkcjonalności Serwisu wymaga rejestracji i utworzenia Konta. Rejestracja jest dobrowolna i bezpłatna dla Klientów. Rejestracja i utrzymanie Konta Usługodawcy może podlegać opłatom zgodnie z obowiązującym cennikiem.
          </p>
          <p>
            Użytkownik podczas rejestracji zobowiązany jest do podania prawdziwych, aktualnych i kompletnych danych. Użytkownik ponosi pełną odpowiedzialność za podanie nieprawdziwych danych.
          </p>
          <p>
            Użytkownik zobowiązany jest do zachowania poufności danych dostępowych do Konta (login, hasło) i nieudostępniania ich osobom trzecim.
          </p>
          <p>
            Operator zastrzega sobie prawo do weryfikacji danych podanych przez Usługodawców, w tym do żądania przedstawienia odpowiednich dokumentów potwierdzających uprawnienia do wykonywania oferowanych usług.
          </p>
          <p>
            Operator może zawiesić lub usunąć Konto Użytkownika w przypadku naruszenia postanowień Regulaminu, przepisów prawa lub dobrych obyczajów.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">4. Zasady Korzystania z Platformy</h2>
          <p>
            Użytkownicy zobowiązani są do korzystania z Platformy YouNeed zgodnie z jej przeznaczeniem, przepisami prawa oraz niniejszym Regulaminem.
          </p>
          <p>
            Zabronione jest publikowanie treści bezprawnych, obraźliwych, naruszających dobra osobiste osób trzecich, treści o charakterze reklamowym niezwiązanym z oferowanymi usługami, a także podejmowanie działań mogących zakłócić prawidłowe funkcjonowanie Serwisu.
          </p>
          <p>
            Klienci mogą publikować zapytania ofertowe dotyczące usług. Usługodawcy mogą odpowiadać na zapytania i prezentować swoje oferty.
          </p>
          <p>
            Wszelkie ustalenia dotyczące warunków wykonania usługi (zakres, termin, wynagrodzenie) dokonywane są bezpośrednio pomiędzy Klientem a Usługodawcą. Operator nie ponosi odpowiedzialności za treść tych ustaleń ani za ich wykonanie.
          </p>
          <p>
            Operator udostępnia narzędzia komunikacji (np. czat), ale nie monitoruje treści prywatnych wiadomości, chyba że jest to wymagane przez prawo lub w celu rozpatrzenia zgłoszenia naruszenia.
          </p>
          <p>
            Użytkownicy mogą dodawać opinie i oceny dotyczące współpracy. Opinie powinny być rzetelne i oparte na faktycznych doświadczeniach. Zabronione jest publikowanie opinii fałszywych lub mających na celu zaszkodzenie reputacji innego Użytkownika.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">5. Odpowiedzialność Operatora</h2>
          <p>
            Operator dokłada wszelkich starań, aby zapewnić prawidłowe i nieprzerwane funkcjonowanie Platformy YouNeed, jednak nie gwarantuje jej stałej dostępności i nie ponosi odpowiedzialności za ewentualne przerwy techniczne lub awarie.
          </p>
          <p>
            Operator nie ponosi odpowiedzialności za treść ofert, zapytań, opinii i innych materiałów publikowanych przez Użytkowników.
          </p>
          <p>
            Operator nie jest stroną umów zawieranych pomiędzy Klientami a Usługodawcami i nie ponosi odpowiedzialności za ich niewykonanie lub nienależyte wykonanie, jakość świadczonych usług, ani za jakiekolwiek roszczenia wynikające z tych umów.
          </p>
          <p>
            Operator nie ponosi odpowiedzialności za prawdziwość i rzetelność informacji podawanych przez Użytkowników.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">6. Płatności (Dotyczy Usługodawców)</h2>
          <p>
            Korzystanie z niektórych funkcjonalności Serwisu przez Usługodawców (np. promowanie profilu, dostęp do określonych zleceń, subskrypcje) może być płatne zgodnie z cennikiem dostępnym na Platformie.
          </p>
          <p>
            Szczegółowe zasady dotyczące płatności, w tym dostępne metody płatności i warunki subskrypcji, określone są w odrębnym regulaminie płatności lub w cenniku.
          </p>
          <p>
            Operatorem płatności jest [Nazwa Operatora Płatności, np. PayU S.A.].
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">7. Ochrona Danych Osobowych</h2>
          <p>
            Zasady przetwarzania danych osobowych Użytkowników przez Operatora określa <Link to="/privacy" className="text-sky-400 hover:text-sky-300 underline">Polityka Prywatności</Link>, stanowiąca integralną część niniejszego Regulaminu.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">8. Postępowanie Reklamacyjne</h2>
          <p>
            Wszelkie reklamacje dotyczące funkcjonowania Platformy YouNeed należy zgłaszać drogą elektroniczną na adres e-mail: eyouneeed@gmail.com lub za pośrednictwem formularza kontaktowego dostępnego w Serwisie.
          </p>
          <p>
            Reklamacja powinna zawierać co najmniej dane identyfikujące Użytkownika (np. login, adres e-mail) oraz szczegółowy opis problemu.
          </p>
          <p>
            Operator rozpatrzy reklamację w terminie 14 dni roboczych od daty jej otrzymania. Odpowiedź zostanie przesłana na adres e-mail Użytkownika.
          </p>
          <p>
            Reklamacje dotyczące usług świadczonych przez Usługodawców powinny być kierowane bezpośrednio do danego Usługodawcy.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">9. Prawa Autorskie</h2>
          <p>
            Wszelkie prawa do Platformy YouNeed, w tym prawa autorskie do jej elementów (oprogramowanie, grafika, teksty, logo), należą do Operatora lub podmiotów z nim współpracujących i są chronione prawem.
          </p>
          <p>
            Użytkownicy, publikując treści w Serwisie (np. opisy usług, zdjęcia), oświadczają, że posiadają do nich odpowiednie prawa i udzielają Operatorowi niewyłącznej, nieodpłatnej licencji na korzystanie z tych treści w zakresie niezbędnym do świadczenia usług w ramach Platformy YouNeed.
          </p>

          <h2 className="text-2xl font-semibold text-white pt-4">10. Postanowienia Końcowe</h2>
          <p>
            Operator zastrzega sobie prawo do zmiany niniejszego Regulaminu. O wszelkich zmianach Użytkownicy zostaną poinformowani drogą elektroniczną lub poprzez komunikat w Serwisie z odpowiednim wyprzedzeniem.
          </p>
          <p>
            Zmiany Regulaminu wchodzą w życie w terminie wskazanym przez Operatora, nie krótszym niż 14 dni od daty poinformowania Użytkowników. Dalsze korzystanie z Serwisu po wejściu w życie zmian oznacza ich akceptację.
          </p>
          <p>
            W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego.
          </p>
          <p>
            Wszelkie spory wynikające z korzystania z Platformy YouNeed będą rozstrzygane przez sąd właściwy miejscowo dla siedziby Operatora, chyba że przepisy prawa stanowią inaczej (np. w przypadku konsumentów).
          </p>
          <p>
            Kontakt z Operatorem możliwy jest pod adresem e-mail: eyouneeed@gmail.com lub adresem korespondencyjnym: YouNeed Spółka Cywilna, ul. Szmaragdowa 14, 81-198 Pierwoszyno. Telefon kontaktowy: +48 534 252 388.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
