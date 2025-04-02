# Yashraj Nayak - Developer Portfolio

A minimalist, modern developer portfolio that's easily configurable through YAML. Built with vanilla JavaScript and designed for GitHub Pages.

## Features

- 🌓 Dark/Light mode with smooth transitions and persistent preferences
- 📱 Fully responsive design optimized for all devices
- 🚀 Dynamic GitHub projects integration using GitHub GraphQL API
- 🔗 Professional links (GitHub, LinkedIn)
- ⚡ Fast and lightweight with minimal dependencies
- 🎨 Company logos with dark/light mode support
- ⚙️ Easy configuration through YAML
- 🖼️ Automatic GitHub avatar fetching
- 🔄 CI/CD workflow using GitHub Actions

## Quick Start

1. Fork this repository
2. Update `config.yml` with your information
3. Create a fine-grained personal access token with read-only `Metadata` permission
4. Add the token as a repository secret named `PORTFOLIO_WEBSITE_TOKEN`
5. Go to the "Actions" tab, select the "Update Pinned Repositories" workflow, and run it manually to populate your pinned projects
6. Enable GitHub Pages in your repository settings with source set to "Deploy from a branch" and select "main" as the branch
7. Your portfolio will be live at `yourusername.github.io` with your pinned repositories displayed

## Local Development

You can use any static file server to run the portfolio locally. For example:
- VS Code's Live Server extension
- Python's built-in server: `python -m http.server`
- Node.js http-server: `npx http-server`

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
        light: "assets/logos/CompanyName_Logo.png"
        dark: "assets/logos/CompanyName_Logo_White.png"

# Skills Section
skills:
  title: "Section Title"
  categories:
    - name: "Category Name"
      items:
        - "Skill 1"
        - "Skill 2"
    - name: "Certifications"
      items:
        - name: "Certification Name"
          url: "https://certification-url.com"

# Projects Section (Added manually)
projects:
  title: "Latest Projects"
  items:
    - name: "Project Name"
      date: "Project Date"
      description:
        - "Description Point 1"
        - "Description Point 2"
      picture: "assets/projects/Project_Image.jpeg"

# GitHub Projects (Added automatically by GitHub Actions)
github_projects:
  title: "Projects on GitHub"
  pinned_repos: [] # This will be populated by GitHub Actions
```

### Important Notes

1. **GitHub Integration**:
   - Your GitHub username is used to:
     - Fetch your profile picture automatically
     - Display your pinned repositories (using GitHub Actions)
     - Link to your GitHub profile
   - You need to add a repository secret named `PORTFOLIO_WEBSITE_TOKEN` with a personal access token that has `Metadata` permission

2. **Company Logos and Project Images**:
   - Store logos in the `assets/logos/` directory
   - Store project images in the `assets/projects/` directory
   - Provide both light and dark versions for proper theme support for logos
   - Recommended format: PNG with transparent background for logos
   - Project images should have a 4:1 aspect ratio
   - Naming convention: `CompanyName_Logo.png` and `CompanyName_Logo_White.png`

3. **Certifications**:
   - Add certifications using the object format with `name` and `url` properties
   - They will appear as underlined links with the same color as normal text
   - Example: `{ name: "Certification Name", url: "https://certification-url.com" }`

4. **Assets Structure**:
   ```
   assets/
   ├── js/
   │   └── js-yaml.min.js
   ├── logos/
   │   ├── CompanyName_Logo.png       # Light mode logo
   │   └── CompanyName_Logo_White.png # Dark mode logo
   └── projects/
       └── Project_Image.jpeg         # 4:1 aspect ratio image
   ```

5. **Projects Sections**:
   - **Latest Projects**: Manually configured in config.yml
   - **Projects on GitHub**: Automatically fetches and displays your pinned GitHub repositories
   - The GitHub Actions workflow updates config.yml with your pinned repositories

6. **GitHub Actions Workflow**:
   - Located in `.github/workflows/update-pinned-repos.yml`
   - Automatically runs on pushes to the main branch
   - Fetches your pinned repositories and updates the config.yml file
   - Site deployment is handled by GitHub Pages settings in your repository

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Icons provided by [Feather Icons](https://feathericons.com/)
- YAML parsing by [js-yaml](https://github.com/nodeca/js-yaml)
