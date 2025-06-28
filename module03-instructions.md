![Lab Banner](./.assets/images/application-development-banner.png)

# Lab 3: Securing Tokens

[**Table of Contents**](./appdev-workspace.md)

## Synopsis

Access tokens are *bearer tokens*, which means that without any additional constraints any application
which obtains a token may use it to gain the token privileges at the API.

There are some ways to mitigate this outside of the protocols, including limiting API access to particular
internal network addresses where applications are running.

Here the effort addresses two areas addressed by the protocol: ensuring the token is only received by
the requesting application, and enhancing the assurance that an authentic application is
making the token request.

## A word... Proof Key for Code Exchange (PKCE)

PKCE is a mechanism designed to ensure that the single-page or native applications that asks for
a token is the same application that receives the token.
This is accomplished by sending a hashed, random value (the *code challenge* or "h")
with the request, and then the original value used to create the challenge
(the *code verifier* or "v") when the tokens are retrieved.
In the authorization server if a new hash of the code verifier matches the code challenge (already hashed)
from the original request, it must be the same application because it passed the real code verifier.

For native applications this is fairly secure, they use an embedded web browser to handle the authentication
flow and they do not leave memory so the code verifier is very difficult to compromise.
For SPAs this is not so secure; the code verifier has to be held in browser local storage while the user
goes to other pages in the flow.
Browser local storage is by definition not secure, check the Chrome and Firefox documentation!

But newer architectures negate the need for PKCE...

## Backend for Frontend (BFF)


## For DPoP applications DPoP is uses a signature We are not going to implement DPoP



## Beyond client secrets

The problem with client secrets is they must be available to the client, so that immediately
rules out "public" clients (single page and native applications).
A secret needs to be provided to the authorization server, so that puts it at risk during transit.
The channel carrying a secret must be encrypted using HTTPS, or more correctly Transmission
Layer Security (TLS).
But, TLS can still be subverted with a proxy, so the secret may still be at risk.

There are two possible solutions that accomplish the same goal: *Private Key JWT* and *Mutual TLS (mTLS)*.
mTLS uses public-key cryptography to identify the client as TLS is established.
Private Key JWT
uses public-key cryptography to sign an identity token and pass it in place of a secret after TLS
is established.
Both eliminate passing secret information over the channel, the lab will address using Private Key JWT.

### Private Key JWT

1. Locate and open the *Module 03/Acme/app.js* file.

1. Open a terminal, navigate to the Module 03 application, and install the dependency packages ($ is
the command prompt)

    ```bash
    $ cd "Module 03/Acme"
    $ npm install
    ```

1. Use *openssl* to create a public/private key pair and separate the public key
into a file to give to Auth0:

    ```bash
    $ openssl genrsa -out keypair.pem 2048
    $ openssl rsa -in keypair.pem -pubout -out publickey.pem
    ```




<div style="text-align: center"><img src="./.assets/images/vscode-rundebug-toolbar-restart.png" /></div>

<br>![Stop](./.assets/images/stop.png)
Congratulations, you have completed this lab!

When your instructor says you are ready to start the next Lab,
Close all the editor windows in the right-side panel, and then follow this
link to the lab instructions: [**Module 3 Lab**](./module03-instructions.md).

[**Table of Contents**](./appdev-workspace.md)