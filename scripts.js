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
        
        // Only log in development
        console.log('Config loaded successfully');
        return config;
    } catch (error) {
        console.error('Error loading config:', error);
        showErrorMessage(error.message);
        hideLoadingScreen(false);
        return null;
    }
}

// Display error message to user
function showErrorMessage(message) {
    document.body.innerHTML = `
        <div style="color: red; padding: 20px; text-align: center;">
            <h1>Error Loading Configuration</h1>
            <p>${message}</p>
            <p>If the problem persists, please check your config.yml file format.</p>
        </div>`;
}

// Hide loading screen and show content
function hideLoadingScreen(success = true) {
    const loadingScreen = document.getElementById('loading-screen');
    const container = document.querySelector('.container');
    
    if (success) {
        // Add a small delay to ensure all content has been rendered
        setTimeout(() => {
            // Hide loading screen
            loadingScreen.classList.add('hidden');
            // Show content
            container.classList.remove('content-hidden');
            container.classList.add('content-visible');
            
            // Remove loading screen from DOM after transition
            loadingScreen.addEventListener('transitionend', () => {
                loadingScreen.remove();
            }, { once: true });
        }, 500);
    } else {
        // Just hide the loading screen on error (error message is already shown)
        loadingScreen.classList.add('hidden');
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
    await fetchGitHubProjects(config);
    
    // Hide loading screen after all content has loaded
    hideLoadingScreen();
});

// Update page content from config
function updatePageContent(config) {
    // Update document title and meta description
    document.title = config.site.title;
    document.querySelector('meta[name="description"]').content = config.site.description;

    // Create document fragments for batch DOM operations
    updateHeaderSection(config);
    updateAboutSection(config);
    updateProjectsSection(config);
    updateExperienceSection(config);
    updateSkillsSection(config);
    
    // Update "Projects on GitHub" section title from config if available
    if (config.github_projects && config.github_projects.title) {
        const githubProjectsTitle = document.querySelector('.projects-on-github h2');
        githubProjectsTitle.textContent = config.github_projects.title;
    }
}

// Update header section
function updateHeaderSection(config) {
    // Update profile image
    document.querySelector('.profile-img').src = `https://avatars.githubusercontent.com/${config.github}`;
    
    // Update header text
    document.querySelector('h1').textContent = config.header.greeting;
    document.querySelector('.tagline').textContent = config.header.tagline;

    // Update social links
    updateSocialLinks(config);
}

// Update social links
function updateSocialLinks(config) {
    const socialLinks = document.querySelector('.social-links');
    const fragment = document.createDocumentFragment();
    
    // Clear existing links
    socialLinks.innerHTML = '';

    // Add GitHub link
    if (config.github) {
        const githubIcon = document.querySelector('#github-icon').content.cloneNode(true);
        const githubLink = document.createElement('a');
        githubLink.href = `https://github.com/${config.github}`;
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        githubLink.setAttribute('aria-label', 'GitHub Profile');
        githubLink.appendChild(githubIcon);
        githubLink.appendChild(document.createTextNode('GitHub'));
        fragment.appendChild(githubLink);
    }

    // Add LinkedIn link
    if (config.linkedin_url) {
        const linkedinIcon = document.querySelector('#linkedin-icon').content.cloneNode(true);
        const linkedinLink = document.createElement('a');
        linkedinLink.href = config.linkedin_url;
        linkedinLink.target = '_blank';
        linkedinLink.rel = 'noopener noreferrer';
        linkedinLink.setAttribute('aria-label', 'LinkedIn Profile');
        linkedinLink.appendChild(linkedinIcon);
        linkedinLink.appendChild(document.createTextNode('LinkedIn'));
        fragment.appendChild(linkedinLink);
    }

    // Append all links at once
    socialLinks.appendChild(fragment);
}

// Update about section
function updateAboutSection(config) {
    const aboutSection = document.querySelector('.about');
    aboutSection.innerHTML = config.about.paragraphs.map(p => `<p>${p}</p>`).join('');
}

// Update projects section
function updateProjectsSection(config) {
    const projectsSection = document.querySelector('.projects');
    projectsSection.querySelector('h2').textContent = config.projects.title;
    
    // Clear existing project items
    const existingProjectItems = projectsSection.querySelectorAll('.project-item');
    existingProjectItems.forEach(item => item.remove());
    
    // Create document fragment
    const fragment = document.createDocumentFragment();
    
    // Add all project items to fragment
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
                <img src="${project.picture}" alt="${project.name} project screenshot">
            </div>
        `;
        
        fragment.appendChild(projectItem);
    });
    
    // Append all projects at once
    projectsSection.appendChild(fragment);
}

// Update experience section
function updateExperienceSection(config) {
    const experienceSection = document.querySelector('.experience');
    experienceSection.querySelector('h2').textContent = config.experience.title;
    
    // Clear existing experience items
    const existingItems = experienceSection.querySelectorAll('.experience-item');
    existingItems.forEach(item => item.remove());
    
    // Create document fragment
    const fragment = document.createDocumentFragment();
    
    // Add all experience items to fragment
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
        
        fragment.appendChild(experienceItem);
    });
    
    // Append all experience items at once
    experienceSection.appendChild(fragment);
}

// Update skills section
function updateSkillsSection(config) {
    const skillsSection = document.querySelector('.skills');
    skillsSection.querySelector('h2').textContent = config.skills.title;
    
    const skillsGrid = skillsSection.querySelector('.skills-grid');
    const fragment = document.createDocumentFragment();
    
    // Clear existing skills
    skillsGrid.innerHTML = '';
    
    // Create skill categories
    config.skills.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skill-category';
        
        categoryDiv.innerHTML = `
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
        `;
        
        fragment.appendChild(categoryDiv);
    });
    
    // Append all skill categories at once
    skillsGrid.appendChild(fragment);
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
            const fragment = document.createDocumentFragment();
            
            // Add projects with staggered animation
            pinnedRepos.forEach((repo, index) => {
                const card = document.createElement('div');
                card.className = 'project-card';
                card.style.animationDelay = `${index * 0.1}s`;
                
                // Create content with improved accessibility
                card.innerHTML = `
                    <h3>${repo.name}</h3>
                    ${repo.description ? `<p>${repo.description}</p>` : '<p>No description available</p>'}
                    <div class="project-links">
                        <a href="${repo.url}" target="_blank" rel="noopener noreferrer" aria-label="View ${repo.name} repository on GitHub">View Repository</a>
                        ${repo.homepageUrl ? `<a href="${repo.homepageUrl}" target="_blank" rel="noopener noreferrer" aria-label="View live demo of ${repo.name}">Live Demo</a>` : ''}
                    </div>
                `;
                
                fragment.appendChild(card);
            });
            
            // Append all projects at once for better performance
            projectsContainer.appendChild(fragment);
            
            // Add "See all repositories" link
            addSeeAllRepositoriesLink(username);
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

// Helper function to add "See all repositories" link
function addSeeAllRepositoriesLink(username) {
    const projectsSection = document.querySelector('.projects-on-github');
    
    // Check if the "See all repositories" link already exists
    let seeAllLink = projectsSection.querySelector('.see-all-repos');
    
    if (!seeAllLink) {
        seeAllLink = document.createElement('div');
        seeAllLink.className = 'see-all-repos';
        
        const link = document.createElement('a');
        link.href = `https://github.com/${username}?tab=repositories`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `See all GitHub repositories for ${username}`);
        link.textContent = 'See all repositories →';
        
        seeAllLink.appendChild(link);
        projectsSection.appendChild(seeAllLink);
    }
}