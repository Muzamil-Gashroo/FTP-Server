# FTP-Server

A Node.js-based FTP server for managing and sharing files securely. Supports authentication, file uploads/downloads, payment integration, and API rate limiting.

## Features
- User authentication (API key & middleware)
- File upload/download with classification (multer)
- Stripe payment integration (payments & subscriptions)
- Rate limiting for API endpoints
- Organized file storage (documents, images, videos, others)
- RESTful API structure

## Folder Structure
```
LICENSE
package.json
public/
  documents/
  images/
  others/
  videos/
src/
  app.js
  server.js
  connections/
    db.connection.js
  controllers/
    auth.controller.js
    files.controller.js
    stripe_controllers/
      payment.controller.js
      stripeWebhook.controller.js
  middleware/
    apiKey.authenticator.js
    auth.middleware.js
    rateLimiter.js
  models/
    files.model.js
    payments.model.js
    subscriptions.model.js
    user.model.js
  routes/
    auth.routes.js
    files.routes.js
    payment.routes.js
  utils/
    multer.classifictaion.js
```
    - Supports an SDK for easy integration ([SDK Documentation](https://dummy-link.com))
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`.
4. Start the server:
   ```bash
   npm start
    This project also provides an SDK for client-side integration. See the [SDK Documentation](https://dummy-link.com) for usage and examples.
    1. Clone the repository:
      ```bash
      git clone <repo-url>
      ```
    2. Install dependencies:
      ```bash
      npm install
      ```
    3. Configure environment variables in `.env`.
    4. Start the server:
      ```bash
      npm start
      ```

