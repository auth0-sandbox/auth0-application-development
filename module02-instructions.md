![Lab Banner](./.assets/images/application-development-banner.png)

# Lab 2: API Access Management

[**Table of Contents**](./appdev-workspace.md)

## Synopsis

Now the project is extended to leverage a backend API to get the expenses (and totals).
The API needs to be protected so that only authorized users may access it.

1. Define the backend permissions and map out user access.
1. Set up the backend API configuration at Auth0.
1. Support securing the API with access tokens.
1. Ask for an access token to for the API in the application and call it.

## Define the Acme Backend API and Permissions

Juggling permissions is a three-way negotiation between the API, the identity provider, and
the application.
The API "owns" the permissions; it defines what happens when users present specific permission values.
The identity provider has to define the permission values, and map specific permissions to users.
The application needs to know what permissions to request, and limit the requests a user may make
to the permissions they are granted.

This all must be planned as part of the API development, and the permissions well-defined to configure in the
identity provider.
The only actions the application is looking for right now are the *totals* and *reports*, so here are examples of what we will use for permissions:

* **read:totals**
* **read:reports**

## Configure the API in the Auth0 Tenant

1. In the Auth0 tenant use select *Applications &rarr; APIs*.

1. Click the *+ Create API* button to create a new API integration.

1. Name the new API *ACME FM Backend API*.

1. The identifier may be any string, often it is the public URL of the API.
This is also known as the "audience" in the application and the API itself.

1. Leave the JSON Web Token Profile and the Signing Algorithm as *Auth0* and *RS256*, and
click the *Create* button.

1. The interface lands on the *Quickstart* tab for the new API.
Click on the *Settings* tab; here you can change the name of the API as it appears in the dashboard, the token
expiration, the profile and signing algorithms.
The assigned ID and the Identifier (audience) cannot be changed.

1. On the *Settings* tab:
    * Under *RBAC Settings* choose *Enable RBAC* and *Add Permissions in the Access Token*.
    * Under *Access Settings* enable *Allow Skipping User Consent* and *Allow Offline Access*.
    * Click the *Save* button.

1. Switch to the *Permissions* tab.

1. Set the first permission to *read:totals* and *Read user expense totals*.
Click the *+ Add* button.

1. Set the second permission to *read:reports* and *Read expense reports*.
Click the *+ Add* button.

This completes the API integration.

## Use Role-based Access Control (RBAC) to allow user access

Users may be assigned API permissions directly.
Usually users work in groups, and often everyone in the group requires the same access.
Also, users access changes during their lifecycle and roles work like groups.
Users may be added to and removed from roles and gain or loose access as that happens.

1. In the sidebar select *User Management &rarr; Roles*.

1. Click the *+ Create Role* button.
Name the role *FM User Access* and make the description *Access to user data*.

1. The interface lands on the *Settings* tab for the role.
Click on the *Permissions* tab.

1. Click the *Add Permissions* button.

1. Select the *ACME FM Backend API* created in the last section.

1. Select both permissions, or click the *Select: All* option.

1. Click the *Add Permissions* button to set the permissions for the role.

1. User may be assigned to roles here, or roles to users in the user settings.
It is just semantics.
Click the *Users* tab.

1. Click the *Add Users* button, and select a user that requires permission to access their
information in the application.
It is possible to type and select multiple users in this field.

<div style="text-align: center"><img src="./.assets/images/auth0-assign-users-to-roles.png" /></div>

1. Once the user (or users) has been selected, click the *Assign* button.

## Add Access Token Support to the API

Access tokens must be requested by the application.
Only one access token may be requested at a time, multiple requests may be necessary to make requests
to multiple APIs.



## Obtain and Use the Access Token in the Application

![Stop](./.assets/images/stop.png)
Congratulations, you have completed this lab!

When your instructor says you are ready to start the next Lab,
Close all the editor windows in the right-side panel, and then follow this
link to the lab instructions: [**Module 3 Lab**](./module03-instructions.md).

[**Table of Contents**](./appdev-workspace.md)