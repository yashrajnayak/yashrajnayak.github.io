// Theme Switcher
const themeSwitch = document.querySelector('.theme-switch');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');
const themeText = document.querySelector('.theme-text');
const root = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
root.setAttribute('data-theme', savedTheme);
updateThemeUI(savedTheme);

themeSwitch.addEventListener('click', () => {
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
});

function updateThemeUI(theme) {
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
        themeText.textContent = 'Light Mode';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
        themeText.textContent = 'Dark Mode';
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Fetch GitHub projects with error handling and loading states
async function fetchGitHubProjects() {
    const projectsContainer = document.getElementById('projects');
    
    try {
        const response = await fetch(`https://api.github.com/users/yashrajnayak/repos?sort=updated&per_page=6`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }
        
        const repos = await response.json();
        
        // Clear loading message
        projectsContainer.innerHTML = '';
        
        // Add projects with staggered animation
        repos.forEach((repo, index) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            card.innerHTML = `
                <h3>${repo.name}</h3>
                <div class="project-meta">
                    <span>Published ${formatDate(repo.created_at)}</span>
                    <span class="project-stars">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        ${repo.stargazers_count}
                    </span>
                </div>
                <p>${repo.description || 'No description available'}</p>
                <div class="project-links">
                    <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">View Repository</a>
                    ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''}
                </div>
            `;
            
            projectsContainer.appendChild(card);
        });
    } catch (error) {
        projectsContainer.innerHTML = `
            <div class="loading">
                Failed to load projects. Please check your GitHub username and try again.
            </div>
        `;
        console.error('Error fetching GitHub projects:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchGitHubProjects);