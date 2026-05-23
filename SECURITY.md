# Security Policy

**ClubLink** is maintained by **Camply**. We take the security of this project seriously, especially given that it handles internal data of Pathfinder Clubs, including member information. We appreciate the responsible disclosure of vulnerabilities by the community.

---

## Supported Versions

Only the latest release on the `main` branch receives security updates. We do not backport security fixes to older versions.

| Version / Branch | Supported          |
|------------------|--------------------|
| `main` (latest)  | ✅ Yes             |
| Older branches   | ❌ No              |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues.**

If you believe you have found a security vulnerability in ClubLink, please report it responsibly using **GitHub Private Security Advisories**:

1. Go to the repository's **Security** tab.
2. Click **"Report a vulnerability"**.
3. Fill in the advisory form with as much detail as possible.

This channel is private and visible only to project maintainers. Your report will be reviewed promptly.

### What to include in your report

To help us triage and resolve the issue efficiently, please include:

- A clear description of the vulnerability and its potential impact
- The component or area affected (e.g., Firebase rules, authentication flow, data access layer)
- Steps to reproduce the issue or a proof-of-concept (if safe to provide)
- The Angular version, Firebase SDK version, and deployment environment if relevant
- Any suggested mitigations, if you have them

### What to avoid

- Do not exploit the vulnerability beyond what is necessary to demonstrate it
- Do not access, modify, or delete data that does not belong to you
- Do not disclose the vulnerability publicly before it has been resolved and a fix has been released

---

## Response Process

Once a report is received, we will:

1. **Acknowledge** the report within **5 business days**
2. **Assess** the severity and scope of the vulnerability
3. **Develop and test** a fix internally
4. **Release** a patch and notify the reporter
5. **Publish** a security advisory (after the fix is available) crediting the reporter, unless they request anonymity

We aim to resolve critical vulnerabilities within **30 days** of confirmation.

---

## Scope

This policy covers vulnerabilities in the **ClubLink source code** as published in this repository, including:

- Angular application logic and components
- Firebase Security Rules configurations
- Authentication and authorization flows
- Data handling and exposure risks

**Out of scope:**

- Vulnerabilities in third-party dependencies (Angular, Firebase SDKs, etc.) — please report those directly to the respective projects
- Issues arising from misconfiguration of a self-hosted/self-deployed instance by the club administrator
- Social engineering attacks

---

## Firebase-Specific Considerations

ClubLink connects directly to Firebase from the client side. Club administrators who self-deploy this application are responsible for:

- Configuring and maintaining their own **Firebase Security Rules**
- Keeping Firebase credentials restricted and not exposed publicly
- Enabling **Firebase App Check** to prevent unauthorized API access
- Reviewing access logs and Firebase usage regularly

If you identify a weakness in the **default Firebase Security Rules** shipped with this repository, please report it via the process above — this is in scope and considered high priority.

---

## Disclosure Policy

We follow a **coordinated disclosure** model. We ask that reporters allow us a reasonable time to investigate and patch the vulnerability before any public disclosure. We will work with reporters to agree on a disclosure timeline.

---

## Credits

We are grateful to security researchers and community members who help keep ClubLink safe. Reporters who responsibly disclose valid vulnerabilities may be credited in the published security advisory, with their permission.

---

**ClubLink™ is a trademark of Camply. All rights reserved.**  
This security policy applies to the ClubLink project as maintained by Camply and does not extend to independent forks or third-party deployments.
