# Developer Portfolio

A minimalist, modern developer portfolio that's easily configurable through YAML. Built with vanilla JavaScript and designed for GitHub Pages.

## Features

- 🌓 Dark/Light mode with smooth transitions and persistent preferences
- 📱 Fully responsive design optimized for all devices
- 🚀 Dynamic GitHub projects integration
- 🔗 Professional links (GitHub, LinkedIn)
- ⚡ Fast and lightweight with zero dependencies
- 🎨 Company logos with dark/light mode support
- ⚙️ Easy configuration through YAML
- 🖼️ Automatic GitHub avatar fetching

## Quick Start

1. Fork this repository
2. Update `config.yml` with your information
3. Enable GitHub Pages in your repository settings
4. Your portfolio will be live at `yourusername.github.io`

## Local Development

You can use any static file server to run the portfolio locally. For example:
- VS Code's Live Server extension
- Python's built-in server: `python -m http.server`
- Any other static file server

## Configuration

All content is configured through `config.yml`. Here's the structure:

```yaml
# Site Configuration
site:
  title: "Your Site Title"
  description: "Your Site Description"

# Header Section
header:
  greeting: "Your Greeting"
  tagline: "Your Tagline"

# Social Links
github: "your-github-username"    # Required for avatar and projects
linkedin_url: "https://www.linkedin.com/in/your-profile/"

# About Section
about:
  paragraphs:
    - "First paragraph"
    - "Second paragraph"

# Experience Section
experience:
  title: "Section Title"
  jobs:
    - company: "Company Name"
      role: "Your Role"
      date: "Date Range"
      responsibilities:
        - "Responsibility 1"
        - "Responsibility 2"
      logo:
        light: "assets/CompanyName_Logo.png"
        dark: "assets/CompanyName_Logo_White.png"

# Skills Section
skills:
  title: "Section Title"
  categories:
    - name: "Category Name"
      items:
        - "Skill 1"
        - "Skill 2"
```

### Important Notes

1. **GitHub Integration**:
   - Your GitHub username is used to:
     - Fetch your profile picture automatically
     - Display your latest repositories
     - Link to your GitHub profile

2. **Company Logos**:
   - Store logos in the `assets/` directory
   - Provide both light and dark versions for proper theme support
   - Recommended format: PNG with transparent background
   - Naming convention: `CompanyName_Logo.png` and `CompanyName_Logo_White.png`

3. **Assets Structure**:
   ```
   assets/
   ├── CompanyName_Logo.png      # Light mode logo
   └── CompanyName_Logo_White.png # Dark mode logo
   ```

4. **Projects Section**:
   - Automatically fetches and displays your 6 most recent GitHub repositories
   - Excludes your portfolio repository
   - Shows repository descriptions and links
   - Includes links to live demos if available

## Customization

### Theme Colors

You can customize the theme colors by modifying the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #1e293b;
    --background-color: #f8fafc;
    --card-background: #ffffff;
    --text-color: #1e293b;
    --text-muted: #64748b;
}
```

### Adding New Sections

1. Add the section configuration to `config.yml`
2. Create the HTML structure in `index.html`
3. Add the corresponding JavaScript in `scripts.js`
4. Style the section in `styles.css`

## Contributing

Feel free to submit issues and pull requests to improve the template.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Icons provided by [Feather Icons](https://feathericons.com/)
- Inspired by modern developer portfolios
