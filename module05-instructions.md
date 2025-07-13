![Lab Banner](./.assets/images/application-development-banner.png)

# Lab 5: Actions for MFA

[**Table of Contents**](./appdev-workspace.md)

## Dependencies

* This lab uses the same *certificates/localhost-cert-key.pem* and
*certificates/localhost-cert.pem* files
from Module 02 to serve https from the backend API.
* It uses the same *certificates/privatekey.pem* and *certificates/publickey.pem* from Module 03 to
authenticate with Private Key JWT to the authorization server.
* It depends on the *user_metadata.optin_mfa* established in Module 04, although this may also be set manually.

## Synopsis

There are generally two choices for customer-facing applications and multifactor authentication: either force
all customers to use MFA, or allow customers to opt-in if they want it.

## Part 1: The Acme Application, BFF, and API

1. Locate the "Module 05/API/.env" file and open it.

1. Set the missing environment variables with the values from the Auth0 tenant (hint: go back to the corresponding file in Module 04).

1. Set the environment variables for "Module 05/BFF/.env"

## Part 2: Establish an M2M application for actions
## Part 3: Enroll or check MFA

<br>![Stop](./.assets/images/stop.png)
Congratulations, you have completed this lab!

When your instructor says you are ready to start the next Lab,
Close all the editor windows in the right-side panel, and then follow this
link to the lab instructions: [**Module 5 Lab**](./module05-instructions.md).

[**Table of Contents**](./appdev-workspace.md)