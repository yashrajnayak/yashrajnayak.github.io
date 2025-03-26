// Load and parse config
async function loadConfig() {
    try {
        const response = await fetch('config.yml');
        const yamlText = await response.text();
        return jsyaml.load(yamlText);
    } catch (error) {
        console.error('Error loading config:', error);
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

    // Update experience section
    const experienceSection = document.querySelector('.experience');
    experienceSection.querySelector('h2').textContent = config.experience.title;
    const experienceItems = experienceSection.querySelectorAll('.experience-item');
    
    experienceItems.forEach((item, index) => {
        const job = config.experience.jobs[index];
        if (!job) return;

        const content = item.querySelector('.experience-content');
        content.querySelector('h3').textContent = `${job.company} | ${job.role}`;
        content.querySelector('.date').textContent = job.date;
        content.querySelector('ul').innerHTML = job.responsibilities
            .map(resp => `<li>${resp}</li>`)
            .join('');

        const logo = item.querySelector('.company-logo');
        logo.querySelector('.light-mode-logo').src = job.logo.light;
        logo.querySelector('.dark-mode-logo').src = job.logo.dark;
    });

    // Update skills section
    const skillsSection = document.querySelector('.skills');
    skillsSection.querySelector('h2').textContent = config.skills.title;
    const skillsGrid = skillsSection.querySelector('.skills-grid');
    skillsGrid.innerHTML = config.skills.categories.map(category => `
        <div class="skill-category">
            <h3>${category.name}</h3>
            <ul>
                ${category.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

// Fetch GitHub projects
async function fetchGitHubProjects(config) {
    const projectsContainer = document.getElementById('projects');
    const username = config.github;
    
    try {
        const response = await fetch(
            `https://api.github.com/users/${username}/repos?sort=created&direction=desc&per_page=6`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        
        const allRepos = await response.json();
        
        // Clear loading message
        projectsContainer.innerHTML = '';
        
        // Filter out portfolio repository
        const filteredRepos = allRepos.filter(repo => 
            repo.name !== `${username}.github.io`
        );
        
        // Add projects with staggered animation
        filteredRepos.forEach((repo, index) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <h3>${repo.name}</h3>
                ${repo.description ? `<p>${repo.description}</p>` : '<p>No description available</p>'}
                <div class="project-links">
                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">View Repository</a>
                    ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
                </div>
            `;
            
            projectsContainer.appendChild(card);
        });

        if (filteredRepos.length === 0) {
            projectsContainer.innerHTML = '<div class="loading">No projects found</div>';
        }
        
        // Add "See all repositories" link
        const seeAllLink = document.createElement('div');
        seeAllLink.className = 'see-all-repos';
        seeAllLink.innerHTML = `<a href="https://github.com/${username}?tab=repositories" target="_blank" rel="noopener noreferrer">See all repositories →</a>`;
        projectsContainer.parentNode.insertBefore(seeAllLink, projectsContainer.nextSibling);
    } catch (error) {
        projectsContainer.innerHTML = '<div class="loading">Failed to load projects. Please try again later.</div>';
        console.error('Error fetching GitHub projects:', error);
    }
}