// GitHub Projects Manager Module
export class GitHubProjectsManager {
    constructor() {
        this.projectsContainer = null;
        this.requestTimeoutMs = 5000;
    }

    async fetchJson(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            return response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    setMessage(message) {
        if (!this.projectsContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'loading';
        messageElement.setAttribute('role', 'status');
        messageElement.textContent = message;
        this.projectsContainer.replaceChildren(messageElement);
    }

    // Fetch GitHub projects with "featured" topic using Search API
    async fetchGitHubProjects(config) {
        this.projectsContainer = document.getElementById('projects');
        const username = config.github_username;

        if (!this.projectsContainer) {
            console.warn('Projects container not found, skipping GitHub projects');
            return;
        }
        
        if (!username) {
            console.warn('No GitHub username provided, skipping GitHub projects');
            return;
        }
        
        try {
            // Clear loading message
            this.projectsContainer.innerHTML = '';
            
            // Use GitHub Search API to find repositories with the "featured" topic
            // This is more efficient than fetching all repos and filtering in the browser
            const query = encodeURIComponent(`user:${username} topic:featured`);
            const data = await this.fetchJson(`https://api.github.com/search/repositories?q=${query}&sort=updated&order=desc`);
            const featuredRepos = data.items || [];
            
            if (featuredRepos.length > 0) {
                this.renderProjects(featuredRepos, username);
            } else {
                this.setMessage('No featured repositories found.');
            }
        } catch (error) {
            console.warn('GitHub Search API failed, falling back to all repos fetch', error);
            return this.fetchGitHubProjectsFallback(username);
        }
    }

    // Fallback method to fetch all repos if Search API is unavailable
    async fetchGitHubProjectsFallback(username) {
        try {
            const repos = await this.fetchJson(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
            const featuredRepos = repos.filter(repo => repo.topics && repo.topics.includes('featured'));
            
            if (featuredRepos.length > 0) {
                this.renderProjects(featuredRepos, username);
            } else {
                this.setMessage('No featured repositories found.');
            }
        } catch (error) {
            this.setMessage('GitHub projects are temporarily unavailable.');
            console.error('Error loading GitHub projects:', error);
        }
    }

    // Render GitHub projects
    renderProjects(repos, username) {
        const fragment = document.createDocumentFragment();
        
        repos.forEach((repo, index) => {
            const card = this.createGitHubProjectCard(repo, index);
            fragment.appendChild(card);
        });
        
        this.projectsContainer.appendChild(fragment);
        this.addSeeAllRepositoriesLink(username);
    }

    // Create GitHub project card
    createGitHubProjectCard(repo, index) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const title = document.createElement('h3');
        title.textContent = repo.name;

        const description = document.createElement('p');
        description.textContent = repo.description || 'No description available';

        const links = document.createElement('div');
        links.className = 'project-links';

        const repositoryLink = document.createElement('a');
        repositoryLink.href = repo.html_url;
        repositoryLink.target = '_blank';
        repositoryLink.rel = 'noopener noreferrer';
        repositoryLink.setAttribute('aria-label', `View ${repo.name} repository on GitHub`);
        repositoryLink.textContent = 'View Repository';
        links.appendChild(repositoryLink);

        if (repo.homepage) {
            const homepageLink = document.createElement('a');
            homepageLink.href = repo.homepage;
            homepageLink.target = '_blank';
            homepageLink.rel = 'noopener noreferrer';
            homepageLink.setAttribute('aria-label', `View live demo of ${repo.name}`);
            homepageLink.textContent = 'Live Demo';
            links.appendChild(homepageLink);
        }

        card.append(title, description, links);
        return card;
    }

    // Helper function to add "See all repositories" link
    addSeeAllRepositoriesLink(username) {
        const projectsSection = document.querySelector('.projects-on-github');
        if (!projectsSection) return;
        
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
}
