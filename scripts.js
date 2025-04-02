// Load and parse config
async function loadConfig() {
    try {
        // Check if js-yaml is available
        if (typeof jsyaml === 'undefined') {
            throw new Error('js-yaml library not loaded. Please check your internet connection and refresh the page.');
        }

        const response = await fetch('./config.yml');
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
        }
        const yamlText = await response.text();
        const config = jsyaml.load(yamlText);
        if (!config) {
            throw new Error('Failed to parse config file - empty or invalid YAML');
        }
        console.log('Config loaded successfully:', config);
        return config;
    } catch (error) {
        console.error('Error loading config:', error);
        document.body.innerHTML = `
            <div style="color: red; padding: 20px; text-align: center;">
                <h1>Error Loading Configuration</h1>
                <p>${error.message}</p>
                <p>If the problem persists, please check your config.yml file format.</p>
            </div>`;
        return null;
    }
}

// Theme Switcher
document.addEventListener('DOMContentLoaded', async function() {
    const config = await loadConfig();
    if (!config) return;

    const themeSwitch = document.querySelector('.theme-switch');
    const root = document.documentElement;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    root.setAttribute('data-theme', savedTheme);

    themeSwitch.addEventListener('click', () => {
        const currentTheme = root.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Update page content from config
    updatePageContent(config);

    // Fetch GitHub projects
    fetchGitHubProjects(config);
});

// Update page content from config
function updatePageContent(config) {
    // Update document title and meta description
    document.title = config.site.title;
    document.querySelector('meta[name="description"]').content = config.site.description;

    // Update header section with GitHub avatar
    document.querySelector('.profile-img').src = `https://avatars.githubusercontent.com/${config.github}`;
    document.querySelector('h1').textContent = config.header.greeting;
    document.querySelector('.tagline').textContent = config.header.tagline;

    // Update social links with icons from templates
    const socialLinks = document.querySelector('.social-links');
    socialLinks.innerHTML = '';

    // Add GitHub link first
    if (config.github) {
        const githubIcon = document.querySelector('#github-icon').content.cloneNode(true);
        const githubLink = document.createElement('a');
        githubLink.href = `https://github.com/${config.github}`;
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        githubLink.appendChild(githubIcon);
        githubLink.appendChild(document.createTextNode('GitHub'));
        socialLinks.appendChild(githubLink);
    }

    // Add LinkedIn link second
    if (config.linkedin_url) {
        const linkedinIcon = document.querySelector('#linkedin-icon').content.cloneNode(true);
        const linkedinLink = document.createElement('a');
        linkedinLink.href = config.linkedin_url;
        linkedinLink.target = '_blank';
        linkedinLink.rel = 'noopener noreferrer';
        linkedinLink.appendChild(linkedinIcon);
        linkedinLink.appendChild(document.createTextNode('LinkedIn'));
        socialLinks.appendChild(linkedinLink);
    }

    // Update about section
    const aboutSection = document.querySelector('.about');
    aboutSection.innerHTML = config.about.paragraphs.map(p => `<p>${p}</p>`).join('');
    
    // Update projects section
    const projectsSection = document.querySelector('.projects');
    projectsSection.querySelector('h2').textContent = config.projects.title;
    
    // Clear any existing project items
    const existingProjectItems = projectsSection.querySelectorAll('.project-item');
    existingProjectItems.forEach(item => item.remove());
    
    // Dynamically generate project items from config
    config.projects.items.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        
        projectItem.innerHTML = `
            <div class="project-content">
                <h3>${project.name}</h3>
                <p class="date">${project.date}</p>
                <ul>
                    ${project.description.map(desc => `<li>${desc}</li>`).join('')}
                </ul>
            </div>
            <div class="project-image">
                <img src="${project.picture}" alt="${project.name}">
            </div>
        `;
        
        projectsSection.appendChild(projectItem);
    });

    // Update experience section
    const experienceSection = document.querySelector('.experience');
    experienceSection.querySelector('h2').textContent = config.experience.title;
    
    // Clear any existing experience items
    const existingItems = experienceSection.querySelectorAll('.experience-item');
    existingItems.forEach(item => item.remove());
    
    // Dynamically generate experience items from config
    config.experience.jobs.forEach(job => {
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';
        
        experienceItem.innerHTML = `
            <div class="experience-content">
                <h3>${job.company} | ${job.role}</h3>
                <p class="date">${job.date}</p>
                <ul>
                    ${job.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                </ul>
            </div>
            <div class="company-logo">
                <img src="${job.logo.light}" alt="${job.company} logo" class="light-mode-logo">
                <img src="${job.logo.dark}" alt="${job.company} logo" class="dark-mode-logo">
            </div>
        `;
        
        experienceSection.appendChild(experienceItem);
    });

    // Update skills section
    const skillsSection = document.querySelector('.skills');
    skillsSection.querySelector('h2').textContent = config.skills.title;
    const skillsGrid = skillsSection.querySelector('.skills-grid');
    skillsGrid.innerHTML = config.skills.categories.map(category => `
        <div class="skill-category">
            <h3>${category.name}</h3>
            <ul>
                ${category.items.map(item => {
                    // Check if item is an object with name and url properties (certification link)
                    if (typeof item === 'object' && item.name && item.url) {
                        return `<li><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.name}</a></li>`;
                    } else {
                        // Handle regular text items
                        return `<li>${item}</li>`;
                    }
                }).join('')}
            </ul>
        </div>
    `).join('');
}

// Fetch GitHub projects - now uses data from config.yml
async function fetchGitHubProjects(config) {
    const projectsContainer = document.getElementById('projects');
    const username = config.github;
    
    try {
        // Clear loading message
        projectsContainer.innerHTML = '';
        
        // Check if we have pinned repos data from config
        if (config.github_projects && config.github_projects.pinned_repos && config.github_projects.pinned_repos.length > 0) {
            const pinnedRepos = config.github_projects.pinned_repos;
            
            // Add projects with staggered animation
            pinnedRepos.forEach((repo, index) => {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.style.animationDelay = `${index * 0.1}s`;
                
                card.innerHTML = `
                    <h3>${repo.name}</h3>
                    ${repo.description ? `<p>${repo.description}</p>` : '<p>No description available</p>'}
                    <div class="project-links">
                        <a href="${repo.url}" target="_blank" rel="noopener noreferrer">View Repository</a>
                        ${repo.homepageUrl ? `<a href="${repo.homepageUrl}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
                    </div>
                `;
                
                projectsContainer.appendChild(card);
            });
            
            // Add "See all repositories" link
            const projectsSection = document.querySelector('.projects-on-github');
            
            // Check if the "See all repositories" link already exists
            let seeAllLink = projectsSection.querySelector('.see-all-repos');
            if (!seeAllLink) {
                seeAllLink = document.createElement('div');
                seeAllLink.className = 'see-all-repos';
                seeAllLink.innerHTML = `<a href="https://github.com/${username}?tab=repositories" target="_blank" rel="noopener noreferrer">See all repositories →</a>`;
                projectsSection.appendChild(seeAllLink);
            }
        } else {
            // If no pinned repos data in config yet (first run before GitHub Actions has updated it)
            projectsContainer.innerHTML = '<div class="loading">No pinned projects found. They will appear after the first GitHub Actions build.</div>';
            console.warn('No pinned repositories found in config. They will be added after the GitHub Actions workflow runs.');
        }
    } catch (error) {
        projectsContainer.innerHTML = '<div class="loading">Failed to load projects. Please try again later.</div>';
        console.error('Error loading GitHub projects:', error);
    }
}