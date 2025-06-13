![Lab Banner](./.assets/images/application-development-banner.png)

# Synopsis

This repository contains the framework for completing the labs in the
*Auth0 Application Development* course.
There are sub-projects for each module in the course.
The applications are written in JavaScript, the underlying framework is NodeJS.

Complete and verify these two sections to proceed with the coursework:

1. [General Prerequisites](#general-prerequisites)
1. [Setting Up the Workspace](#setting-up-the-workspace)

# General Prerequisites

* Major browser (Chrome, Edge, Firefox)
* A GitHub account and access to GitHub
* Access to Auth0, and an Auth0 admin account with a new, clean Auth0 tenant

## GitHub

You must have a GitHub account if you choose to use the GitHub Codespace option for the
course workspace (below).
This account must have the ability to launch and use a GitHub Codespace.
A GitHub Codespace is a virtual computer with Linux as the operating system.
Sometimes enterprise accounts are blocked from GitHub Codespaces because they are
trying to prevent leakage into virtual computers in the cloud.

You can test a Codespace from your GitHub account using the respository
[Verify GitHub Codespaces](https://github.com/jmussman/verify-github-codespaces).

If you need a new personal GitHub account to work outside of enterprise resources,
just go to https://github.com, click the *Sign up* button, and use a personal email address.

## Auth0

If you have an Auth0 admin account, log in and see if you can create a new, clean tenant.
Click the tenant menu button at the top left, and choose *Create tenant*.
If that works you will get a new free developer tenant.
Name the tenant anything you want, for example
"dev-lab-\<accountnamne>-\<year #>\<month #>\<day #>".

If you do not have an admin login, or cannot create a new tenant, go to https://auth0.com
and click the *Sign up* button.
Register with a personal email address and Auth0 will give you an account with a
new developer tenant already created.

# Setting Up the WorkSpace

## Workspace Options

There are three options for working on the labs.
The first and simplest is to run the workspace using a GitHub Codespace in the cloud (for free).

The second option is to work on the project in a container runtime, like Docker, on your own computer.
Of course a container runtime must be available.

The third option is to work on the project on your local computer,
if you have the prerequisites run the workspace on your own computer.
Your choice.

## GitHub Codespace

Look to the upper right on this GitHub page for the green *\<> Code* button and
click it.

Make sure the *Codespaces* tab is selected, and click the green button
*Create codespace on main*.
This will launch Visual Studio Code in a new tab in your browser, and connect it to a virtual
computer running Linux in the cloud.
VS Code is your interface to the files and actions on that Linux computer; when you edit a file you are editing it on that computer, and when you run a command in a terminal window
you are running the command in a shell on that Linux.
The files are persistent until the Codespace is deleted.

Codespaces will time out and shut down if you are not using them.
If you are still on the page in the browser there is a button to restart it.
Otherwise, back in GitHub you can manage the Codespace from the tab in the
*\<> Code* button at the repository.
Or, in your GitHub account you can click the *hamburger* menu button
next to the GitHub Cat icon and choose *Codespaces*.

## Run in a Container Runtime

### Additional Prerequisites

* Visual Studio Code

If you have a container runtime installed, clone this repository to your local computer.
You may use Git inside of VS Code, or *git* at the command line.
When you open the folder in VS Code it will detect you have the container runtime and offer to
relaunch the project in it.

## Run a Local Workspace

### Additional Prerequisites

* Visual Studio Code
* NodeJS.
Long-Term Support (LTS) is sufficient, and the latest current version will also work.
* Ngrok or CloudFlare network proxy (both require free accounts).

Clone this repository to your local computer.
You may use Git inside of VS Code, or *git* at the command line.
Open the folder in VS Code,
the instructions for using the workspace will present themselves.

## Publishing Container Runtime and Local Workspace APIs

Warning: since you are running on your local computer or forwarding to your local computer
a port from the container runtime, the URLs for the applications
and services are always http://localhost (no encryption).
Your browser is accessing the pages locally.
To connect the Auth0 tenant to web services, you will need to configure a cloud-based
proxy service for external systems (like Auth0) to connect to and reach to your local services.

Using Ngrok, CloudFlare, or some other external service is outside the scope of this
course.
Follow their documentation to configure an encrypted tunnel from a public
Internet address to your local services.
We will indicate in the lab instructions where this needs to be performed.