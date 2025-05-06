const express = require('express');
    const router = express.Router();
    const { body, validationResult } = require('express-validator');
    const { Op } = require('sequelize');
    const crypto = require('crypto');
    const axios = require('axios'); // Import axios
    const { SmsCode, User } = require('../models'); // Adjust path as needed
    const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
    const { logAuditAction } = require('../utils/audit'); // Adjust path as needed
    const authenticate = require('../middleware/authenticate'); // CORRECTED: Use authenticate.js

    // --- SMS Sending Service (Actual Implementation) ---
    const sendSms = async (phoneNumber, message) => {
      // --- NOWY LOG --- Sprawdź, czy ten log pojawia się w konsoli po restarcie
      console.log(`--- Attempting to send SMS via SMSAPI ---`);
      console.log(`To: ${phoneNumber}`);
      console.log(`Message: ${message}`);
      console.log(`---------------------------------------`);

      const smsapiToken = process.env.SMSAPI_TOKEN;

      if (!smsapiToken) {
         console.error("SMS Sending Failed: SMSAPI_TOKEN not configured in .env file.");
         // W środowisku produkcyjnym rzucamy błąd, aby zatrzymać proces
         if (process.env.NODE_ENV !== 'development') {
            throw new Error("SMS service is not configured.");
         } else {
            // W trybie deweloperskim możemy zwrócić błąd, ale nie zatrzymywać serwera
            console.warn("SMS Sending Skipped in Development due to missing SMSAPI_TOKEN.");
            // Zwracamy obiekt błędu, aby można było go obsłużyć w `catch`
            return Promise.reject(new Error("SMS service not configured (dev mode)."));
         }
      }

      // Formatowanie numeru: SMSAPI zazwyczaj oczekuje numeru bez '+48' lub '+'.
      // Sprawdź dokumentację SMSAPI dla pewności, ale często jest to sam numer 9-cyfrowy.
      const formattedPhoneNumber = phoneNumber.startsWith('+48')
        ? phoneNumber.substring(3)
        : phoneNumber.replace('+', ''); // Usuń '+' jeśli nie ma '+48'

      const senderName = '2WAY'; // Upewnij się, że to pole nadawcy jest zarejestrowane w SMSAPI!

      try {
        // Używamy GET zgodnie z poprzednią implementacją, ale POST z nagłówkiem Authorization jest zalecany przez SMSAPI
        const response = await axios.get('https://api.smsapi.pl/sms.do', {
          params: {
            access_token: smsapiToken, // Token jako parametr dla GET
            to: formattedPhoneNumber,
            from: senderName, // Nazwa nadawcy (musi być zarejestrowana w SMSAPI)
            message: message,
            format: 'json', // Prośba o odpowiedź w formacie JSON
          },
          // Dodaj timeout na wszelki wypadek
          timeout: 10000 // 10 sekund
        });

        // --- NOWY LOG --- Sprawdź odpowiedź z API
        console.log("SMSAPI Response Data:", response.data);

        // Sprawdzenie odpowiedzi SMSAPI na błędy
        if (response.data.error) {
          // Logowanie szczegółowego błędu z SMSAPI
          const errorMessage = `SMSAPI Error ${response.data.error}: ${response.data.message}`;
          console.error(errorMessage);
          // Rzucenie błędu, aby został złapany przez blok catch w endpointcie
          throw new Error(errorMessage);
        }

        // Sprawdzenie, czy wiadomość została wysłana (struktura odpowiedzi może się różnić)
        if (response.data.list && response.data.list.length > 0 && response.data.list[0].status === 'QUEUE') {
           console.log(`SMS successfully queued by SMSAPI. Message ID: ${response.data.list[0].id}`);
           return { success: true, messageId: response.data.list[0].id };
        } else if (response.data.count && response.data.count > 0) {
           // Starsza wersja API mogła zwracać tylko 'count'
           console.log(`SMS successfully sent/queued by SMSAPI (count: ${response.data.count}).`);
           // Może brakować ID wiadomości w tej odpowiedzi
           return { success: true, messageId: `smsapi_${Date.now()}` };
        } else {
           // Nieoczekiwana odpowiedź sukcesu
           console.warn("SMSAPI returned success, but the response format was unexpected:", response.data);
           throw new Error("SMS sending failed: Unexpected success response from SMSAPI.");
        }

      } catch (error) {
        // Obsługa błędów sieciowych axios lub błędów rzuconych po sprawdzeniu response.data.error
        // --- NOWY LOG --- Sprawdź błędy wysyłki
        console.error("Error sending SMS via SMSAPI:", error.message);
        // Rzucenie błędu dalej, aby został obsłużony w endpointcie
        // Można dodać więcej kontekstu, jeśli to błąd axios
        if (error.response) {
          // Błąd odpowiedzi z serwera SMSAPI (np. 4xx, 5xx)
          console.error("SMSAPI Response Status:", error.response.status);
          console.error("SMSAPI Response Body:", error.response.data);
          throw new Error(`SMSAPI request failed with status ${error.response.status}: ${error.response.data?.message || error.message}`);
        } else if (error.request) {
          // Błąd wysłania żądania (np. brak połączenia)
          console.error("SMSAPI request failed to send:", error.request);
          throw new Error("SMS sending failed: Could not reach SMSAPI server.");
        } else {
          // Inny błąd (np. w konfiguracji axiosa, lub błąd rzucony wyżej)
          throw error; // Rzuć oryginalny błąd
        }
      }
    };

    // --- Send SMS Verification Code ---
    router.post(
      '/send-code',
      authenticate,
      [
        body('phoneNumber').isMobilePhone('pl-PL').withMessage('Nieprawidłowy numer telefonu (oczekiwany format polski)'),
      ],
      async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return sendErrorResponse(res, 400, 'Błąd walidacji', errors.array());
        }

        const { phoneNumber } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return sendErrorResponse(res, 401, 'Użytkownik nie uwierzytelniony.');
        }

        console.log(`Received request to send SMS code to ${phoneNumber} for userId: ${userId}`);

        try {
          const user = await User.findByPk(userId);
          if (!user) {
             await logAuditAction(userId, 'sms_send_code_failed_user_not_found', { phoneNumber }, req.ip);
             return sendErrorResponse(res, 404, 'Nie znaleziono użytkownika.');
          }

          const existingVerifiedUser = await User.findOne({
             where: {
                phoneNumber: phoneNumber,
                phoneNumberVerified: true,
                id: { [Op.ne]: userId }
             }
          });
          if (existingVerifiedUser) {
             await logAuditAction(userId, 'sms_send_code_failed_number_in_use', { phoneNumber }, req.ip);
             return sendErrorResponse(res, 409, 'Ten numer telefonu jest już powiązany z innym zweryfikowanym kontem.');
          }

          const code = crypto.randomInt(100000, 999999).toString();
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

          // Najpierw oznacz stare, niezweryfikowane kody dla tego numeru i użytkownika jako zweryfikowane (nieaktywne)
          // Zmieniono logikę - oznaczamy jako zweryfikowane, aby nie kolidowały, zamiast usuwać
          await SmsCode.update(
             { verified: true }, // Oznaczamy jako zweryfikowane (nieaktywne dla nowych prób)
             { where: { phoneNumber: phoneNumber, userId: userId, verified: false } }
          );

          // Stwórz nowy kod
          await SmsCode.create({
            phoneNumber,
            code,
            expiresAt,
            userId,
            verified: false, // Nowy kod jest niezweryfikowany
          });

          // Zaktualizuj numer telefonu użytkownika i oznacz jako niezweryfikowany, jeśli się zmienił
          if (user.phoneNumber !== phoneNumber || !user.phoneNumberVerified) {
              user.phoneNumber = phoneNumber;
              user.phoneNumberVerified = false; // Zawsze resetuj weryfikację przy wysyłaniu nowego kodu
              await user.save();
              await logAuditAction(userId, 'user_phone_number_updated_pending_verification', { phoneNumber }, req.ip);
          }

          // Wyślij kod SMS używając zaktualizowanej funkcji sendSms
          const message = `Twój kod weryfikacyjny YouNeed to: ${code}`;
          await sendSms(phoneNumber, message); // <--- Użycie zaktualizowanej funkcji

          await logAuditAction(userId, 'sms_send_code_success', { phoneNumber }, req.ip);
          sendSuccessResponse(res, null, 'Kod weryfikacyjny został wysłany na podany numer telefonu.');

        } catch (err) {
          // Logowanie błędu, który mógł pochodzić z sendSms
          console.error("Send SMS Code Endpoint Error:", err);
          await logAuditAction(userId, 'sms_send_code_failed', { phoneNumber, error: err.message }, req.ip);

          // Sprawdzenie konkretnych błędów z SMSAPI lub konfiguracji
          if (err.message.includes("SMS service not configured")) {
             sendErrorResponse(res, 503, 'Usługa wysyłania SMS jest nieskonfigurowana.', { details: err.message });
          } else if (err.message.includes("SMSAPI Error")) {
             // Błąd zwrócony przez API SMSAPI
             sendErrorResponse(res, 502, 'Błąd podczas wysyłania SMS przez dostawcę.', { details: err.message });
          } else if (err.message.includes("Could not reach SMSAPI server")) {
             // Błąd połączenia z SMSAPI
             sendErrorResponse(res, 504, 'Nie można połączyć się z serwisem SMS.', { details: err.message });
          } else {
             // Inny, ogólny błąd serwera
             sendErrorResponse(res, 500, 'Nie udało się wysłać kodu weryfikacyjnego.', { details: err.message });
          }
        }
      }
    );

    // --- Verify SMS Code ---
    router.post(
      '/verify-code',
      authenticate,
      [
        body('code').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Kod weryfikacyjny musi składać się z 6 cyfr'),
      ],
      async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return sendErrorResponse(res, 400, 'Błąd walidacji', errors.array());
        }

        const { code } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return sendErrorResponse(res, 401, 'Użytkownik nie uwierzytelniony.');
        }

        console.log(`Received request to verify SMS code ${code} for userId: ${userId}`);

        try {
          const user = await User.findByPk(userId);
          // Sprawdź, czy użytkownik istnieje i czy ma przypisany numer telefonu *przed* szukaniem kodu
          if (!user || !user.phoneNumber) {
             await logAuditAction(userId, 'sms_verify_failed_user_or_phone_missing', { code }, req.ip);
             // Zwróć 404 lub 400 - 400 wydaje się bardziej odpowiednie, bo problem jest z danymi wejściowymi do weryfikacji
             return sendErrorResponse(res, 400, 'Nie znaleziono użytkownika lub użytkownik nie ma przypisanego numeru telefonu do weryfikacji.');
          }

          const phoneNumber = user.phoneNumber; // Użyj numeru zapisanego w profilu użytkownika

          // Znajdź NAJNOWSZY, aktywny (niezweryfikowany i niewygasły) kod dla tego użytkownika i numeru telefonu
          const storedCode = await SmsCode.findOne({
            where: {
              userId: userId,
              phoneNumber: phoneNumber, // Użyj numeru z profilu użytkownika
              code: code,
              expiresAt: { [Op.gt]: new Date() }, // Sprawdź, czy nie wygasł
              verified: false, // Sprawdź, czy nie został już użyty/zdezaktywowany
            },
            order: [['createdAt', 'DESC']] // Pobierz najnowszy pasujący kod
          });

          if (!storedCode) {
            // Logowanie nieudanego znalezienia kodu
            console.log(`SMS code not found, expired, or already verified for user ${userId}, phone ${phoneNumber}, code ${code}`);
            await logAuditAction(userId, 'sms_verify_failed_invalid_or_expired', { phoneNumber, code }, req.ip);
            return sendErrorResponse(res, 400, 'Nieprawidłowy, wygasły lub już użyty kod weryfikacyjny dla tego numeru telefonu.');
          }

          // Oznacz kod jako zweryfikowany (użyty)
          storedCode.verified = true;
          await storedCode.save();
          await logAuditAction(userId, 'sms_verify_code_marked_verified', { smsCodeId: storedCode.id }, req.ip);


          // Zaktualizuj status weryfikacji numeru telefonu użytkownika
          // Tylko jeśli numer w profilu zgadza się z numerem, dla którego kod został zweryfikowany
          if (user.phoneNumber === storedCode.phoneNumber) {
             user.phoneNumberVerified = true;
             await user.save();
             await logAuditAction(userId, 'sms_verify_user_phone_updated', { phoneNumber: user.phoneNumber }, req.ip);
          } else {
             // Sytuacja awaryjna - numer w profilu zmienił się między wysłaniem a weryfikacją?
             console.warn(`User ${userId} verified code for ${storedCode.phoneNumber}, but their current profile number is ${user.phoneNumber}.`);
             await logAuditAction(userId, 'sms_verify_warning_phone_mismatch', { verifiedNumber: storedCode.phoneNumber, currentNumber: user.phoneNumber }, req.ip);
          }


          // Opcjonalnie: Usuń stare, zweryfikowane kody dla tego użytkownika i numeru, aby utrzymać porządek
          // await SmsCode.destroy({ where: { userId: userId, phoneNumber: phoneNumber, verified: true, id: { [Op.ne]: storedCode.id } } });

          await logAuditAction(userId, 'sms_verify_success', { phoneNumber: storedCode.phoneNumber }, req.ip);
          sendSuccessResponse(res, { verified: true }, 'Numer telefonu został pomyślnie zweryfikowany.');

        } catch (err) {
          console.error("Verify SMS Code Error:", err);
          await logAuditAction(userId, 'sms_verify_failed', { code, error: err.message }, req.ip);
          sendErrorResponse(res, 500, 'Wystąpił błąd podczas weryfikacji kodu.', err);
        }
      }
    );

    module.exports = router;
