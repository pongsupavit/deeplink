# Deeplink Tools 🛠️

A collection of developer tools to simplify the development, testing, and debugging of **Deep Links**, **Universal Links (iOS)**, and **App Links (Android)**.

Designed for mobile developers and QA teams to streamline the workflow of testing deep links and validating configuration files.

## 🧰 Tools Included

### 1. [Deeplink Testing Tool](./testing/README.md) 🔗
A web-based tool to quickly test URI schemes and Universal Links on real devices.
- **Features**: Multi-link support, QR code generation for mobile testing, and link history.
- **Try it**: [Launch Testing Tool](./testing/)

### 2. [Deeplink Validator](./validator/README.md) ✅
A validator for `apple-app-site-association` (AASA) and `assetlinks.json` files.
- **Features**: Checks HTTPS, redirects, MIME types, and JSON syntax. Simulates Apple/Google bot scraping behavior.
- **Try it**: [Launch Validator](./validator/)

## 🚀 Getting Started

These tools are static web applications and can be hosted on GitHub Pages or any static hosting service.

### Local Development
To run the tools locally:

1. Clone the repository
   ```bash
   git clone https://github.com/pongsupavit/deeplink.git
   ```

2. Serve the project
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using npx (serve)
   npx serve .
   ```

3. Open in browser
   - **Root**: `http://localhost:8000/`
   - **Testing Tool**: `http://localhost:8000/testing/`
   - **Validator**: `http://localhost:8000/validator/`

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---
Developed by [Pongsupavit](https://github.com/pongsupavit)
