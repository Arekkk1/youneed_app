const dotenv = require('dotenv');
        dotenv.config();

        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'; // Fallback URL

        // Basic HTML wrapper for consistent styling
        const wrapHtml = (content, title = 'YouNeed') => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
            .header h1 { color: #0ea5e9; margin: 0; }
            .content { margin-bottom: 20px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #0ea5e9; color: white !important; text-decoration: none; border-radius: 5px; text-align: center; }
            .footer { text-align: center; font-size: 0.9em; color: #777; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; }
            a { color: #0ea5e9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>YouNeed</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              Dziękujemy za korzystanie z YouNeed!<br>
              Jeśli masz pytania, skontaktuj się z nami. <!-- Add contact link/info if desired -->
            </div>
          </div>
        </body>
        </html>
        `;

        const templates = {
          // --- Registration ---
          welcome: ({ firstName, role }) => {
            const subject = 'Witamy w YouNeed!';
            const htmlContent = wrapHtml(`
              <p>Witaj ${firstName || 'Użytkowniku'},</p>
              <p>Dziękujemy za rejestrację w YouNeed jako ${role === 'provider' ? 'Usługodawca' : 'Klient'}!</p>
              <p>Możesz teraz zalogować się na swoje konto i zacząć korzystać z platformy.</p>
              <p>Jeśli masz jakiekolwiek pytania, nasz zespół wsparcia jest do Twojej dyspozycji.</p>
              <p style="text-align: center; margin-top: 25px;">
                <a href="${FRONTEND_URL}/login" class="button">Zaloguj się</a>
              </p>
            `, subject);
            const textContent = `Witaj ${firstName || 'Użytkowniku'},\n\nDziękujemy za rejestrację w YouNeed jako ${role === 'provider' ? 'Usługodawca' : 'Klient'}!\nMożesz teraz zalogować się na swoje konto: ${FRONTEND_URL}/login\n\nZespół YouNeed`;
            return { subject, htmlContent, textContent };
          },

          // --- Email Verification ---
          emailVerification: ({ firstName, code }) => {
            const subject = 'YouNeed - Kod weryfikacyjny Email';
            const htmlContent = wrapHtml(`
              <p>Witaj ${firstName || 'Użytkowniku'},</p>
              <p>Twój kod weryfikacyjny dla konta YouNeed to:</p>
              <h2 style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 15px 0; text-align: center;">${code}</h2>
              <p>Kod jest ważny przez 10 minut.</p>
              <p>Wprowadź ten kod w aplikacji, aby zweryfikować swój adres email.</p>
              <p>Jeśli nie prosiłeś/aś o ten kod, zignoruj tę wiadomość.</p>
            `, subject);
            const textContent = `Witaj ${firstName || 'Użytkowniku'},\n\nTwój kod weryfikacyjny dla konta YouNeed to: ${code}\n\nKod jest ważny przez 10 minut.\nWprowadź ten kod w aplikacji, aby zweryfikować swój adres email.\nJeśli nie prosiłeś/aś o ten kod, zignoruj tę wiadomość.\n\nZespół YouNeed`;
            return { subject, htmlContent, textContent };
          },

          // --- Password Reset ---
          forgotPassword: ({ email, resetUrl }) => {
            const subject = 'YouNeed - Resetowanie hasła';
            const htmlContent = wrapHtml(`
              <p>Witaj,</p>
              <p>Otrzymaliśmy prośbę o zresetowanie hasła dla konta powiązanego z adresem ${email} w serwisie YouNeed.</p>
              <p>Jeśli to Ty wysłałeś/aś tę prośbę, kliknij poniższy przycisk, aby ustawić nowe hasło. Link jest ważny przez 1 godzinę.</p>
              <p style="text-align: center; margin-top: 25px; margin-bottom: 25px;">
                <a href="${resetUrl}" class="button">Resetuj hasło</a>
              </p>
              <p>Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p>Jeśli nie prosiłeś/aś o reset hasła, zignoruj tę wiadomość. Twoje konto jest bezpieczne.</p>
            `, subject);
            const textContent = `Witaj,\n\nOtrzymaliśmy prośbę o zresetowanie hasła dla konta powiązanego z adresem ${email} w serwisie YouNeed.\n\nKliknij poniższy link, aby ustawić nowe hasło (ważny przez 1 godzinę):\n${resetUrl}\n\nJeśli nie prosiłeś/aś o reset hasła, zignoruj tę wiadomość.\n\nZespół YouNeed`;
            return { subject, htmlContent, textContent };
          },

          passwordResetConfirmation: ({ email }) => {
            const subject = 'YouNeed - Hasło zostało zmienione';
            const htmlContent = wrapHtml(`
              <p>Witaj,</p>
              <p>Potwierdzamy, że hasło do Twojego konta YouNeed (${email}) zostało pomyślnie zmienione.</p>
              <p>Jeśli to nie Ty dokonałeś/aś tej zmiany, skontaktuj się natychmiast z naszym wsparciem.</p>
            `, subject);
            const textContent = `Witaj,\n\nPotwierdzamy, że hasło do Twojego konta YouNeed (${email}) zostało pomyślnie zmienione.\n\nJeśli to nie Ty dokonałeś/aś tej zmiany, skontaktuj się natychmiast z naszym wsparciem.\n\nZespół YouNeed`;
            return { subject, htmlContent, textContent };
          },

          // --- Order Notifications ---
          newOrderProviderNotification: ({ order, clientName, serviceName }) => {
            const subject = `Nowe zlecenie w YouNeed: ${order.title}`;
            const orderUrl = `${FRONTEND_URL}/dashboard/provider/orders/${order.id}`; // Adjust URL as needed
            const htmlContent = wrapHtml(`
              <p>Witaj,</p>
              <p>Otrzymałeś nowe zlecenie od klienta <strong>${clientName}</strong>.</p>
              <ul>
                <li><strong>Tytuł:</strong> ${order.title}</li>
                <li><strong>Usługa:</strong> ${serviceName}</li>
                <li><strong>Data rozpoczęcia:</strong> ${new Date(order.startAt).toLocaleString('pl-PL')}</li>
                <li><strong>Status:</strong> Oczekujące</li>
              </ul>
              <p>Zaloguj się do panelu, aby zaakceptować lub odrzucić zlecenie.</p>
              <p style="text-align: center; margin-top: 25px;">
                <a href="${orderUrl}" class="button">Zobacz zlecenie</a>
              </p>
            `, subject);
            const textContent = `Witaj,\n\nOtrzymałeś nowe zlecenie od klienta ${clientName}.\n\nTytuł: ${order.title}\nUsługa: ${serviceName}\nData rozpoczęcia: ${new Date(order.startAt).toLocaleString('pl-PL')}\nStatus: Oczekujące\n\nZaloguj się do panelu, aby zarządzać zleceniem: ${orderUrl}\n\nZespół YouNeed`;
            return { subject, htmlContent, textContent };
          },

          newOrderClientNotification: ({ order, providerName, serviceName }) => {
            const subject = `Potwierdzenie utworzenia zlecenia: ${order.title}`;
            const orderUrl = `${FRONTEND_URL}/dashboard/client/orders/${order.id}`; // Adjust URL as needed
            const htmlContent = wrapHtml(`
              <p>Witaj,</p>
              <p>Twoje zlecenie dla usługodawcy <strong>${providerName}</strong> zostało utworzone i oczekuje na akceptację.</p>
              <ul>
                <li><strong>Tytuł:</strong> ${order.title}</li>
                <li><strong>Usługa:</strong> ${serviceName}</li>
                <li><strong>Data rozpoczęcia:</strong> ${new Date(order.startAt).toLocaleString('pl-PL')}</li>
                <li><strong>Status:</strong> Oczekujące</li>
              </ul>
              <p>Zostaniesz powiadomiony/a o zmianie statusu zlecenia.</p>
              <p style="text-align: center; margin-top: 25px;">
                <a href="${orderUrl}" class="button">Zobacz zlecenie</a>
              </p>
            `, subject);
            const textContent = `Witaj,\n\nTwoje zlecenie dla usługodawcy ${providerName} zostało utworzone i oczekuje na akceptację.\n\nTytuł: ${order.title}\nUsługa: ${serviceName}\nData rozpoczęcia: ${new Date(order.startAt).toLocaleString('pl-PL')}\nStatus: Oczekujące\n\nZobacz szczegóły: ${orderUrl}\n\nZespół YouNeed`;
            return { subject, htmlContent, textContent };
          },

          orderStatusUpdate: ({ order, recipientRole, serviceName, clientName, providerName, oldStatus, newStatus, updaterName }) => {
            let subject = `Aktualizacja statusu zlecenia: ${order.title}`;
            let introText = '';
            let detailsText = '';
            const orderUrl = `${FRONTEND_URL}/dashboard/${recipientRole}/orders/${order.id}`; // Adjust URL

            const statusMap = {
                pending: 'Oczekujące',
                accepted: 'Zaakceptowane',
                rejected: 'Odrzucone',
                completed: 'Zakończone',
                cancelled: 'Anulowane',
                in_progress: 'W trakcie realizacji' // Add other statuses if used
            };

            if (recipientRole === 'client') {
                introText = `Status Twojego zlecenia u usługodawcy <strong>${providerName}</strong> został zmieniony przez ${updaterName}.`;
            } else { // provider
                introText = `Status zlecenia od klienta <strong>${clientName}</strong> został zmieniony przez ${updaterName}.`;
            }

            detailsText = `Status zmieniono z <strong>${statusMap[oldStatus] || oldStatus}</strong> na <strong>${statusMap[newStatus] || newStatus}</strong>.`;

            const htmlContent = wrapHtml(`
              <p>Witaj,</p>
              <p>${introText}</p>
              <ul>
                <li><strong>Tytuł:</strong> ${order.title}</li>
                <li><strong>Usługa:</strong> ${serviceName}</li>
                <li><strong>Data rozpoczęcia:</strong> ${new Date(order.startAt).toLocaleString('pl-PL')}</li>
              </ul>
              <p>${detailsText}</p>
              <p style="text-align: center; margin-top: 25px;">
                <a href="${orderUrl}" class="button">Zobacz zlecenie</a>
              </p>
            `, subject);

            const textContent = `Witaj,\n\n${introText.replace(/<strong>/g, '').replace(/<\/strong>/g, '')}\n\nTytuł: ${order.title}\nUsługa: ${serviceName}\nData rozpoczęcia: ${new Date(order.startAt).toLocaleString('pl-PL')}\n\n${detailsText.replace(/<strong>/g, '').replace(/<\/strong>/g, '')}\n\nZobacz szczegóły: ${orderUrl}\n\nZespół YouNeed`;

            return { subject, htmlContent, textContent };
          },

        };

        /**
         * Gets the email template content.
         * @param {string} templateName - The name of the template (e.g., 'welcome', 'forgotPassword').
         * @param {object} data - Data to inject into the template placeholders.
         * @returns {{subject: string, htmlContent: string, textContent: string}|null} - Template content or null if not found.
         */
        const getEmailTemplate = (templateName, data = {}) => {
          if (templates[templateName]) {
            return templates[templateName](data);
          }
          console.error(`[EmailTemplate] Template not found: ${templateName}`);
          return null;
        };

        module.exports = { getEmailTemplate };
