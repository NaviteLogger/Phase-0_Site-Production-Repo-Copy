# Law Firm Cosmetics Consents

Welcome to our Law Firm's Cosmetics Consents platform. Designed exclusively for businesses and individuals seeking cosmetics-related legal consents, our platform offers an easy and efficient way to purchase individual consents or subscribe for online consent forms that can be filled and sent directly to your email.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up The MySQL Database](#setting-up-a-virtual-environment)
  - [Installing Dependencies](#installing-dependencies)
  - [Database Setup](#database-setup)
- [Usage](#usage)
  - [Running the Web Server](#running-the-web-scraper)
- [Security](#security)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Getting Started

Follow these steps to set up and run CodeNews on your local machine.

### Prerequisites

- Node.js & npm installed
- MySQL server up and running

### Setting Up The MySQL Database

1. Clone this repository:

   ```bash
   git clone https://github.com/NaviteLogger/Website-Production-Repo-Copy.git
   ```

2. Set up the MySQL database:

- Start your MySQL server (depends on your installation, e.g., sudo service mysql start or mysql.server start).
- Create a database for the project.
- Import any necessary data (if provided as an SQL dump or similar).
- Update the database connection details in the project configuration (usually found in a config or .env file).

### Install Dependencies

1. Install project dependencies:

   ```bash
   npm install
   ```

### Database Setup

1. Configure your MySQL database settings in `.env`. Update the following fields with your database information:

```javascript
DB_HOST="your_host"
DB_PORT="your_port"
DB_DATABASE="your_database"
DB_USER="your_username"
DB_PASSWORD="your_password"
SENDGRID_USERNAME="your_sendgrid_username"
SENDGRID_API_KEY="your_sendgrid_api_key"
SESSION_SECTER="your_session_secret"
POS_ID="your_pos_id"
SECOND_KEY="your_second_key"
CLIENT_ID="your_client_id"
CLIENT_SECRET="your_client_secret"
INDIVIDUAL_AGREEMENTS_PAYMENT_NOTIFY_URL="your_individual_agreements_payment_notify_url"
SUBSCRIPTION_PAYMENT_NOTIFY_URL="your_subscription_payment_notify_url"
DEFAULT_EMAIL="your_default_email"
```

2. The database schema looks like this:
+--------------------------+
| Tables_in_CosmeticsLawDB |
+--------------------------+
| Admins                   |
| Agreements               |
| AgreementsOwnerships     |
| Clients                  |
| EmailVerifications       |
| OrderedProducts          |
| Orders                   |
| Questions                |
| Subscriptions            |
| SubscriptionsOwnerships  |
+--------------------------+

## Usage

### Running the Web Server:

1. Start the web server using the command:

```bash
node server.js
```

Visit http://localhost:3000 (or whichever port you've set) in your browser to see the website in action.

## Security

We take security seriously. To protect your application from common exploits:

- Always use secure connections over HTTPS.
- Ensure all dependencies are always up-to-date and no security vulnerabilities are present.
- Store all sensitive data (like database passwords) securely, e.g., using environment variables.

## Contributing

Contributions are welcome! Feel free to submit issues, suggest improvements, or make pull requests to help enhance this project.

## Support

If you have any questions or concerns, please contact us at [pomoc@prawokosmetyczne.pl](mailto:prawokosmetyczne.pl).

## License

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.
