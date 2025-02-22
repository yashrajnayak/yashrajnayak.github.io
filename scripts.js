// Theme Switcher
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

// Fetch GitHub projects
async function fetchGitHubProjects() {
    const projectsContainer = document.getElementById('projects');
    const username = 'yashrajnayak';
    
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        
        const repos = await response.json();
        
        // Clear loading message
        projectsContainer.innerHTML = '';
        
        // Filter out only the portfolio repository
        const filteredRepos = repos.filter(repo => 
            repo.name !== `${username}.github.io`
        );
        
        // Add projects with staggered animation
        filteredRepos.forEach((repo, index) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <h3>${repo.name}</h3>
                ${repo.description ? `<p>${repo.description}</p>` : ''}
                <div class="project-links">
                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">View Repository</a>
                    ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
                </div>
            `;
            
            projectsContainer.appendChild(card);
        });

        if (filteredRepos.length === 0) {
            projectsContainer.innerHTML = '<div class="loading">No projects to display.</div>';
        }
    } catch (error) {
        projectsContainer.innerHTML = '<div class="loading">Failed to load projects. Please try again later.</div>';
        console.error('Error fetching GitHub projects:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchGitHubProjects);