// Configuration Manager Module
class ConfigManager {
    constructor() {
        this.config = null;
    }

    // Load and parse config
    async loadConfig() {
        try {
            const response = await fetch('./config.json');
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
            }
            
            this.config = await response.json();
            
            if (!this.config) {
                throw new Error('Failed to parse config file - empty or invalid JSON');
            }
            
            return this.config;
        } catch (error) {
            console.error('Error loading config:', error);
            this.showErrorMessage(error.message);
            return null;
        }
    }

    // Display error message to user
    showErrorMessage(message) {
        document.body.innerHTML = `
            <div style="color: red; padding: 20px; text-align: center;">
                <h1>Error Loading Configuration</h1>
                <p>${message}</p>
                <p>If the problem persists, please check your config.json file format.</p>
            </div>`;
    }

    // Helper function to get section title with fallback
    getSectionTitle(sectionKey) {
        const titles = {
            about: 'About',
            projects: this.config?.projects?.title || 'Projects',
            experience: this.config?.experience?.title || 'Experience',
            skills: this.config?.skills?.title || 'Skills',
            github_projects: this.config?.github_projects?.title || 'GitHub Projects'
        };
        return titles[sectionKey] || '';
    }
}

// SEO Manager Module
class SEOManager {
    // Update SEO meta tags
    updateSEOTags(config) {
        const seo = config.site.seo;
        
        // Update basic meta tags
        document.title = seo.title;
        document.querySelector('meta[name="description"]').content = seo.description;
        document.querySelector('meta[name="keywords"]').content = seo.keywords;
        document.querySelector('meta[name="author"]').content = seo.author;

        // Update Open Graph tags
        document.querySelector('meta[property="og:title"]').content = seo.title;
        document.querySelector('meta[property="og:description"]').content = seo.description;
        document.querySelector('meta[property="og:image"]').content = seo.og_image;
        document.querySelector('meta[property="og:url"]').content = seo.base_url;

        // Update Twitter Card tags
        document.querySelector('meta[property="twitter:title"]').content = seo.title;
        document.querySelector('meta[property="twitter:description"]').content = seo.description;
        document.querySelector('meta[property="twitter:image"]').content = seo.og_image;
        document.querySelector('meta[property="twitter:card"]').content = seo.twitter_card;
        document.querySelector('meta[property="twitter:url"]').content = seo.base_url;

        // Build sameAs array dynamically
        const sameAs = config.social_links?.map(link => link.url).filter(Boolean) || [];

        // Update JSON-LD
        const jsonLD = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": config.header.greeting,
            "url": seo.base_url,
            "image": seo.og_image,
            "sameAs": sameAs,
            "knowsAbout": [
                "Developer Relations",
                "Developer Communities",
                "Program Management",
                "University Alliances",
                "Data and AI"
            ]
        };

        // Add work info if available
        if (config.experience?.jobs?.[0]) {
            jsonLD.jobTitle = config.experience.jobs[0].role;
            jsonLD.worksFor = {
                "@type": "Organization",
                "name": config.experience.jobs[0].company
            };
        }
        
        document.querySelector('script[type="application/ld+json"]').textContent = JSON.stringify(jsonLD, null, 2);
    }
}

// Theme Manager Module
class ThemeManager {
    constructor() {
        this.themeSwitch = null;
        this.root = document.documentElement;
    }

    init() {
        this.themeSwitch = document.querySelector('.theme-switch');
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.root.setAttribute('data-theme', savedTheme);
        this.updateToggleState(savedTheme);

        // Add event listener for theme switch
        if (this.themeSwitch) {
            this.themeSwitch.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        const currentTheme = this.root.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateToggleState(newTheme);
    }

    updateToggleState(theme) {
        if (!this.themeSwitch) return;

        const isDark = theme === 'dark';
        this.themeSwitch.setAttribute('aria-pressed', String(isDark));
        this.themeSwitch.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }
}

// Loading Manager Module
class LoadingManager {
    // Hide loading screen and show content
    hideLoadingScreen(success = true) {
        const loadingScreen = document.getElementById('loading-screen');
        const container = document.querySelector('.container');
        
        if (success) {
            // Add a small delay to ensure all content has been rendered
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                container.classList.remove('content-hidden');
                container.classList.add('content-visible');
            }, 500);
        } else {
            // Just hide the loading screen on error (error message is already shown)
            loadingScreen.classList.add('hidden');
        }
    }
}

// Section Manager Module
class SectionManager {
    constructor(configManager) {
        this.configManager = configManager;
    }

    // Toggle section visibility based on feature flags
    toggleSection(sectionClass, isEnabled) {
        const section = document.querySelector(`.${sectionClass}`);
        if (section) {
            if (isEnabled) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        }
    }

    // Update page content from config with feature flags
    updatePageContent(config) {
        // Ensure features object exists with defaults
        const features = {
            about: true,
            projects: true,
            experience: true,
            skills: true,
            github_projects: true,
            ...config.features
        };

        // Handle sections based on feature flags
        this.toggleSection('about', features.about);
        this.toggleSection('projects', features.projects);
        this.toggleSection('experience', features.experience);
        this.toggleSection('skills', features.skills);
        this.toggleSection('projects-on-github', features.github_projects);

        // Update sections that are enabled and have content
        if (features.about) {
            this.updateAboutSection(config);
        }

        if (features.projects) {
            this.updateProjectsSection(config);
        }

        if (features.experience) {
            this.updateExperienceSection(config);
        }

        if (features.skills) {
            this.updateSkillsSection(config);
        }

        // Update "Projects on GitHub" section title from config if available
        if (features.github_projects && config.github_projects?.title) {
            const githubProjectsTitle = document.querySelector('.projects-on-github h2');
            if (githubProjectsTitle) {
                githubProjectsTitle.textContent = config.github_projects.title;
            }
        }
    }

    // Update about section
    updateAboutSection(config) {
        const aboutSection = document.querySelector('.about');
        if (config.about?.paragraphs?.length) {
            aboutSection.innerHTML = config.about.paragraphs.map(p => `<p>${p}</p>`).join('');
        } else {
            aboutSection.innerHTML = '<p>Welcome to my portfolio!</p>';
        }
    }

    // Update projects section dynamically
    updateProjectsSection(config) {
        const projectsSection = document.querySelector('.projects');
        const titleElement = projectsSection.querySelector('h2');

        if (titleElement) {
            titleElement.textContent = this.configManager.getSectionTitle('projects');
        }

        // Clear existing project items
        const existingProjectItems = projectsSection.querySelectorAll('.project-item');
        existingProjectItems.forEach(item => item.remove());

        // Create document fragment
        const fragment = document.createDocumentFragment();

        // Add all project items to fragment
        if (config.projects?.items?.length) {
            config.projects.items.forEach(project => {
                const projectItem = this.createProjectItem(project);
                fragment.appendChild(projectItem);
            });
        } else {
            // Show placeholder for empty projects
            const emptyState = document.createElement('div');
            emptyState.className = 'project-item';
            emptyState.innerHTML = `
                <div class="project-content">
                    <h3>Your Projects Will Appear Here</h3>
                    <p class="date">Coming Soon</p>
                    <ul>
                        <li>Add your projects to the config.json file</li>
                        <li>Include project descriptions and images</li>
                        <li>Showcase your best work</li>
                    </ul>
                </div>
            `;
            fragment.appendChild(emptyState);
        }

        // Append all projects at once for better performance
        projectsSection.appendChild(fragment);
    }

    // Create individual project item
    createProjectItem(project) {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';

        const descriptionHtml = Array.isArray(project.description)
            ? project.description.map(desc => `<li>${desc}</li>`).join('')
            : `<li>${project.description}</li>`;

        projectItem.innerHTML = `
            <details class="project-details">
                <summary class="project-header">
                    <div class="project-header-content">
                        <h3>${project.name}</h3>
                        ${project.date ? `<p class="date">${project.date}</p>` : ''}
                    </div>
                    <div class="project-accordion-toggle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </div>
                </summary>
                <div class="project-content">
                    <div class="project-content-desktop">
                        <h3>${project.name}</h3>
                        ${project.date ? `<p class="date">${project.date}</p>` : ''}
                    </div>
                    <ul>
                        ${descriptionHtml}
                    </ul>
                    ${project.link ? `
                    <div class="project-links">
                        <a href="${typeof project.link === 'object' ? project.link.url : project.link}" target="_blank" rel="noopener noreferrer" aria-label="View ${project.name} project">
                            ${typeof project.link === 'object' ? (project.link.title || 'View Project') : 'View Project'}
                        </a>
                    </div>
                    ` : ''}
                </div>
            </details>
            ${project.picture ? `
            <div class="project-image">
                <img src="${project.picture}" alt="${project.name} project screenshot" loading="lazy">
            </div>
            ` : ''}
        `;

        return projectItem;
    }

    // Update experience section dynamically
    updateExperienceSection(config) {
        const experienceSection = document.querySelector('.experience');
        const titleElement = experienceSection.querySelector('h2');

        if (titleElement) {
            titleElement.textContent = this.configManager.getSectionTitle('experience');
        }

        // Clear existing experience items
        const existingItems = experienceSection.querySelectorAll('.experience-item');
        existingItems.forEach(item => item.remove());

        // Create document fragment
        const fragment = document.createDocumentFragment();

        // Add all experience items to fragment
        if (config.experience?.jobs?.length) {
            config.experience.jobs.forEach(job => {
                const experienceItem = this.createExperienceItem(job);
                fragment.appendChild(experienceItem);
            });
        } else {
            // Show placeholder for empty experience
            const emptyState = document.createElement('div');
            emptyState.className = 'experience-item';
            emptyState.innerHTML = `
                <div class="experience-content">
                    <h3>Your Experience Will Appear Here</h3>
                    <p class="date">Ready to showcase your career</p>
                    <ul>
                        <li>Add your work experience to the config.json file</li>
                        <li>Include company logos and job descriptions</li>
                        <li>Highlight your achievements and responsibilities</li>
                    </ul>
                </div>
            `;
            fragment.appendChild(emptyState);
        }

        // Append all experience items at once
        experienceSection.appendChild(fragment);
    }

    // Create individual experience item
    createExperienceItem(job) {
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';

        const responsibilitiesHtml = Array.isArray(job.responsibilities)
            ? job.responsibilities.map(resp => `<li>${resp}</li>`).join('')
            : `<li>${job.responsibilities}</li>`;

        let logoHtml = '';
        if (job.logo || job.logo_dark) {
            logoHtml = `
                <div class="company-logo">
                    ${job.logo ? `<img src="${job.logo}" alt="${job.company} logo" class="light-mode-logo" loading="lazy">` : ''}
                    ${job.logo_dark ? `<img src="${job.logo_dark}" alt="${job.company} logo" class="dark-mode-logo" loading="lazy">` : ''}
                </div>
            `;
        }

        experienceItem.innerHTML = `
            <details class="experience-details">
                <summary class="experience-header">
                    <div class="experience-header-content">
                        <h3>${job.company} | ${job.role}</h3>
                        ${job.date ? `<p class="date">${job.date}</p>` : ''}
                    </div>
                    ${logoHtml}
                    <div class="accordion-toggle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </div>
                </summary>
                <div class="experience-content">
                    <ul>
                        ${responsibilitiesHtml}
                    </ul>
                </div>
            </details>
        `;

        return experienceItem;
    }

    // Update skills section dynamically
    updateSkillsSection(config) {
        const skillsSection = document.querySelector('.skills');
        const titleElement = skillsSection.querySelector('h2');

        if (titleElement) {
            titleElement.textContent = this.configManager.getSectionTitle('skills');
        }

        const skillsGrid = skillsSection.querySelector('.skills-grid');
        const fragment = document.createDocumentFragment();

        // Clear existing skills
        skillsGrid.innerHTML = '';

        // Create skill categories
        if (config.skills?.categories?.length) {
            config.skills.categories.forEach(category => {
                const categoryDiv = this.createSkillCategory(category);
                fragment.appendChild(categoryDiv);
            });
        } else {
            // Show placeholder for empty skills
            const emptyState = document.createElement('div');
            emptyState.className = 'skill-category';
            emptyState.innerHTML = `
                <h3>Your Skills Will Appear Here</h3>
                <ul>
                    <li>Add your technical skills to the config.json file</li>
                    <li>Organize them into categories</li>
                    <li>Include certifications with links</li>
                    <li>Showcase your expertise</li>
                </ul>
            `;
            fragment.appendChild(emptyState);
        }

        // Append all skill categories at once
        skillsGrid.appendChild(fragment);
    }

    // Create individual skill category
    createSkillCategory(category) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skill-category';

        const itemsHtml = Array.isArray(category.items)
            ? category.items.map(item => {
                // Check if item is an object with name and url properties (certification link)
                if (typeof item === 'object' && item.name && item.url) {
                    return `<li><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.name}</a></li>`;
                } else {
                    return `<li>${item}</li>`;
                }
            }).join('')
            : `<li>${category.items}</li>`;

        categoryDiv.innerHTML = `
            <h3>${category.name}</h3>
            <ul>
                ${itemsHtml}
            </ul>
        `;

        return categoryDiv;
    }
}

// Resume Manager Module
class ResumeManager {
    constructor() {
        this.config = null;
    }

    updateResumeSection(config) {
        this.config = config;
        const resumeSection = document.querySelector('.resume-profile');
        if (!resumeSection) return;

        const features = { resume: true, ...config.features };
        if (!features.resume) {
            resumeSection.hidden = true;
            return;
        }

        resumeSection.hidden = false;
        resumeSection.innerHTML = this.createResumeHtml(config);

        const downloadButton = resumeSection.querySelector('.resume-download-button');
        downloadButton?.addEventListener('click', () => this.downloadResumePdf(downloadButton));
    }

    createResumeHtml(config) {
        const name = this.escapeHtml(config.header?.greeting || config.site?.title || 'Yashraj Nayak');
        const title = this.escapeHtml(config.header?.tagline || '');
        const summary = this.escapeHtml(config.about?.paragraphs?.[0] || '');
        const jobs = config.experience?.jobs || [];
        const projects = config.projects?.items || [];
        const contactLinks = this.getContactLinks(config).slice(0, 4);
        const technicalSkills = this.getSkillCategory(config, 'Technical').slice(0, 6);
        const devRelSkills = this.getSkillCategory(config, 'Developer Relations').slice(0, 6);
        const certifications = this.getSkillCategory(config, 'Certifications').slice(0, 3);

        return `
            <div class="resume-toolbar">
                <h2>One-Page Resume</h2>
                <button class="resume-download-button" type="button">
                    <span class="material-symbols-outlined" aria-hidden="true">download</span>
                    <span>Download PDF</span>
                </button>
            </div>
            <article class="resume-page" id="resume-preview" aria-label="Resume preview">
                <header class="resume-page-header">
                    <div class="resume-identity">
                        <h3>${name}</h3>
                        <p>${title}</p>
                    </div>
                    <ul class="resume-contact-list">
                        ${contactLinks.map(link => `
                            <li>
                                <a href="${this.escapeAttribute(link.url)}" target="_blank" rel="noopener noreferrer">
                                    ${this.escapeHtml(link.label)}
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                </header>
                <p class="resume-summary">${summary}</p>
                <div class="resume-layout">
                    <div class="resume-main-column">
                        <section class="resume-block" aria-label="Resume experience">
                            <h4>Experience</h4>
                            <div class="resume-timeline">
                                ${jobs.map((job, index) => this.createResumeRoleHtml(job, index)).join('')}
                            </div>
                        </section>
                    </div>
                    <aside class="resume-side-column">
                        <section class="resume-block" aria-label="Resume skills">
                            <h4>Skills</h4>
                            ${this.createSkillGroupHtml('Developer Relations', devRelSkills)}
                            ${this.createSkillGroupHtml('Technical', technicalSkills)}
                        </section>
                        <section class="resume-block" aria-label="Resume projects">
                            <h4>Selected Projects</h4>
                            <div class="resume-project-list">
                                ${projects.slice(0, 3).map(project => this.createProjectHtml(project)).join('')}
                            </div>
                        </section>
                        <section class="resume-block" aria-label="Resume certifications">
                            <h4>Certifications</h4>
                            <div class="resume-chip-list">
                                ${certifications.map(item => `<span>${this.escapeHtml(item)}</span>`).join('')}
                            </div>
                        </section>
                    </aside>
                </div>
            </article>
        `;
    }

    createResumeRoleHtml(job, index) {
        const responsibilities = Array.isArray(job.responsibilities)
            ? job.responsibilities.slice(0, index < 3 ? 2 : 1)
            : [job.responsibilities].filter(Boolean);

        return `
            <article class="resume-role">
                <span class="resume-role-dot" aria-hidden="true"></span>
                <div class="resume-role-body">
                    <div class="resume-role-header">
                        <h5>${this.escapeHtml(job.company)}</h5>
                        <span>${this.escapeHtml(job.date || '')}</span>
                    </div>
                    <p>${this.escapeHtml(job.role || '')}</p>
                    <ul>
                        ${responsibilities.map(item => `<li>${this.escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
            </article>
        `;
    }

    createSkillGroupHtml(label, items) {
        if (!items.length) return '';

        return `
            <div class="resume-skill-group">
                <h5>${this.escapeHtml(label)}</h5>
                <div class="resume-chip-list">
                    ${items.map(item => `<span>${this.escapeHtml(item)}</span>`).join('')}
                </div>
            </div>
        `;
    }

    createProjectHtml(project) {
        const description = Array.isArray(project.description) ? project.description[0] : project.description;

        return `
            <article class="resume-project">
                <h5>${this.escapeHtml(project.name)}</h5>
                <p>${this.escapeHtml(description || '')}</p>
            </article>
        `;
    }

    async downloadResumePdf(button) {
        if (!this.config) return;

        button.disabled = true;
        button.classList.add('is-loading');

        try {
            const JsPdf = window.jspdf?.jsPDF;
            if (!JsPdf) {
                this.printResumeFallback();
                return;
            }

            const doc = new JsPdf({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4',
                compress: true
            });

            this.drawResumePdf(doc, this.config);
            doc.save(`${this.slugify(this.config.header?.greeting || 'Yashraj-Nayak')}-Resume.pdf`);
        } catch (error) {
            console.error('Error generating resume PDF:', error);
            this.printResumeFallback();
        } finally {
            button.disabled = false;
            button.classList.remove('is-loading');
        }
    }

    printResumeFallback() {
        document.body.classList.add('resume-print-mode');
        window.print();
        window.setTimeout(() => document.body.classList.remove('resume-print-mode'), 1000);
    }

    drawResumePdf(doc, config) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const colors = {
            background: '#f8fafc',
            surface: '#ffffff',
            text: '#1e293b',
            muted: '#64748b',
            primary: '#2563eb',
            border: '#dbe4ef',
            subtle: '#eff6ff'
        };

        const name = config.header?.greeting || config.site?.title || 'Yashraj Nayak';
        const title = config.header?.tagline || '';
        const summary = config.about?.paragraphs?.[0] || '';
        const contactLinks = this.getContactLinks(config).slice(0, 4);
        const jobs = config.experience?.jobs || [];
        const projects = config.projects?.items || [];
        const currentFocus = Array.isArray(jobs[0]?.responsibilities) ? jobs[0].responsibilities.slice(0, 3) : [];
        const technicalSkills = this.getSkillCategory(config, 'Technical').slice(0, 7);
        const devRelSkills = this.getSkillCategory(config, 'Developer Relations').slice(0, 7);
        const certifications = this.getSkillCategory(config, 'Certifications').slice(0, 2);

        this.setFill(doc, colors.background);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        this.setFill(doc, colors.surface);
        doc.roundedRect(24, 24, pageWidth - 48, pageHeight - 48, 12, 12, 'F');
        this.setDraw(doc, colors.border);
        doc.roundedRect(24, 24, pageWidth - 48, pageHeight - 48, 12, 12, 'S');

        const margin = 44;
        const rightColumnX = 390;
        const rightColumnWidth = pageWidth - rightColumnX - margin;
        const mainWidth = rightColumnX - margin - 22;

        this.setText(doc, colors.text);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(27);
        doc.text(name, margin, 64);

        this.setText(doc, colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title.toUpperCase(), margin, 82);

        let summaryY = this.drawWrappedText(doc, summary, margin, 106, 330, {
            size: 8.7,
            color: colors.text,
            lineHeight: 12,
            maxLines: 4
        });

        let contactY = 54;
        contactLinks.forEach(link => {
            this.setText(doc, colors.primary);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.2);
            const label = this.getDisplayUrl(link.url);
            if (typeof doc.textWithLink === 'function') {
                doc.textWithLink(label, rightColumnX, contactY, { url: link.url });
            } else {
                doc.text(label, rightColumnX, contactY);
            }
            contactY += 14;
        });

        const dividerY = Math.max(summaryY + 12, 134);
        this.setDraw(doc, colors.border);
        doc.line(margin, dividerY, pageWidth - margin, dividerY);

        let y = dividerY + 28;
        y = this.drawPdfSectionHeading(doc, 'Experience', margin, y, mainWidth, colors);

        jobs.forEach((job, index) => {
            if (y > 605) return;

            this.setFill(doc, colors.primary);
            doc.circle(margin + 3, y - 3, 2.4, 'F');

            this.setText(doc, colors.text);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.3);
            doc.text(job.company || '', margin + 14, y);

            this.setText(doc, colors.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.2);
            doc.text(job.date || '', margin + 14, y + 11);

            this.setText(doc, colors.primary);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.6);
            doc.text(this.truncate(job.role || '', 58), margin + 96, y + 11);

            y += 24;

            const responsibilities = Array.isArray(job.responsibilities)
                ? job.responsibilities.slice(0, index < 3 ? 2 : 1)
                : [job.responsibilities].filter(Boolean);

            responsibilities.forEach(item => {
                y = this.drawBullet(doc, item, margin + 18, y, mainWidth - 20, colors, 2);
            });

            y += 9;
        });

        y += 4;
        y = this.drawPdfSectionHeading(doc, 'Selected Projects', margin, y, mainWidth, colors);
        projects.slice(0, 3).forEach(project => {
            if (y > 760) return;

            this.setText(doc, colors.text);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.2);
            doc.text(project.name || '', margin, y);
            y += 11;
            const description = Array.isArray(project.description) ? project.description[0] : project.description;
            y = this.drawWrappedText(doc, description || '', margin, y, mainWidth, {
                size: 7.1,
                color: colors.muted,
                lineHeight: 9,
                maxLines: 2
            }) + 8;
        });

        let sideY = dividerY + 28;
        sideY = this.drawPdfSectionHeading(doc, 'Skills', rightColumnX, sideY, rightColumnWidth, colors);
        sideY = this.drawSkillChips(doc, 'Developer Relations', devRelSkills, rightColumnX, sideY, rightColumnWidth, colors);
        sideY = this.drawSkillChips(doc, 'Technical', technicalSkills, rightColumnX, sideY + 8, rightColumnWidth, colors);

        sideY += 10;
        sideY = this.drawPdfSectionHeading(doc, 'Certifications', rightColumnX, sideY, rightColumnWidth, colors);
        certifications.forEach(item => {
            sideY = this.drawWrappedText(doc, item, rightColumnX, sideY, rightColumnWidth, {
                size: 7.2,
                color: colors.text,
                lineHeight: 9.5,
                maxLines: 2
            }) + 6;
        });

        sideY += 12;
        sideY = this.drawPdfSectionHeading(doc, 'Current Focus', rightColumnX, sideY, rightColumnWidth, colors);
        currentFocus.forEach(item => {
            sideY = this.drawBullet(doc, item, rightColumnX, sideY, rightColumnWidth, colors, 2);
        });

        const footerY = pageHeight - 46;
        this.setDraw(doc, colors.border);
        doc.line(margin, footerY - 14, pageWidth - margin, footerY - 14);
        this.setText(doc, colors.muted);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.text('Generated from yashrajnayak.com profile data', margin, footerY);
        doc.text('yashrajnayak.com', pageWidth - margin, footerY, { align: 'right' });
    }

    drawPdfSectionHeading(doc, label, x, y, width, colors) {
        this.setText(doc, colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.4);
        const heading = label.toUpperCase();
        doc.text(heading, x, y);
        this.setDraw(doc, colors.border);
        doc.line(x + doc.getTextWidth(heading) + 9, y - 3, x + width, y - 3);
        return y + 17;
    }

    drawSkillChips(doc, label, items, x, y, width, colors) {
        this.setText(doc, colors.text);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.6);
        doc.text(label, x, y);
        y += 11;

        let cursorX = x;
        items.forEach(item => {
            const chipWidth = Math.min(doc.getTextWidth(item) + 14, width);
            if (cursorX + chipWidth > x + width) {
                cursorX = x;
                y += 17;
            }

            this.setFill(doc, colors.subtle);
            this.setDraw(doc, '#bfdbfe');
            doc.roundedRect(cursorX, y - 9, chipWidth, 13, 6, 6, 'FD');
            this.setText(doc, colors.primary);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.4);
            doc.text(this.truncate(item, 36), cursorX + 7, y);
            cursorX += chipWidth + 5;
        });

        return y + 18;
    }

    drawBullet(doc, text, x, y, width, colors, maxLines = 2) {
        this.setFill(doc, colors.primary);
        doc.circle(x, y - 3, 1.4, 'F');
        return this.drawWrappedText(doc, text, x + 8, y, width - 8, {
            size: 7.1,
            color: colors.text,
            lineHeight: 9,
            maxLines
        }) + 2;
    }

    drawWrappedText(doc, text, x, y, width, options = {}) {
        const {
            size = 8,
            color = '#1e293b',
            style = 'normal',
            lineHeight = size * 1.25,
            maxLines = Infinity
        } = options;

        this.setText(doc, color);
        doc.setFont('helvetica', style);
        doc.setFontSize(size);

        let lines = doc.splitTextToSize(String(text || ''), width);
        if (lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            lines[lines.length - 1] = this.truncate(lines[lines.length - 1], 62);
        }

        doc.text(lines, x, y);
        return y + (lines.length * lineHeight);
    }

    getSkillCategory(config, categoryName) {
        const category = config.skills?.categories?.find(item => item.name === categoryName);
        if (!category?.items) return [];

        return category.items.map(item => typeof item === 'string' ? item : item.name).filter(Boolean);
    }

    getContactLinks(config) {
        const preferred = ['LinkedIn', 'GitHub', 'Twitter', 'Instagram'];
        const links = config.social_links || [];

        return preferred
            .map(name => links.find(link => link.name === name))
            .filter(Boolean)
            .map(link => ({
                label: link.name,
                url: link.url
            }));
    }

    getDisplayUrl(url) {
        try {
            const parsed = new URL(url);
            return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname}`.replace(/\/$/, '');
        } catch {
            return url;
        }
    }

    setFill(doc, hex) {
        doc.setFillColor(...this.hexToRgb(hex));
    }

    setDraw(doc, hex) {
        doc.setDrawColor(...this.hexToRgb(hex));
    }

    setText(doc, hex) {
        doc.setTextColor(...this.hexToRgb(hex));
    }

    hexToRgb(hex) {
        const value = hex.replace('#', '');
        return [
            parseInt(value.slice(0, 2), 16),
            parseInt(value.slice(2, 4), 16),
            parseInt(value.slice(4, 6), 16)
        ];
    }

    truncate(text, maxLength) {
        const value = String(text || '');
        return value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 3))}...` : value;
    }

    slugify(value) {
        return String(value || 'resume')
            .trim()
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '');
    }

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    escapeAttribute(value) {
        return this.escapeHtml(value).replace(/`/g, '&#96;');
    }
}

// Header Manager Module
class HeaderManager {
    // Update header section
    updateHeaderSection(config) {
        // Extract GitHub username for profile image
        const githubUsername = config.github_username || this.extractGithubUsername(config.social_links);
        
        // Update profile image
        if (githubUsername) {
            document.querySelector('.profile-img').src = `https://avatars.githubusercontent.com/${githubUsername}?s=320`;
        }
        
        // Update header text
        document.querySelector('h1').textContent = config.header.greeting;
        document.querySelector('.tagline').textContent = config.header.tagline;

        // Update social links
        this.updateSocialLinks(config);
    }

    // Extract GitHub username from social links
    extractGithubUsername(socialLinks) {
        const githubLink = socialLinks?.find(link => link.icon === 'github');
        if (githubLink?.url) {
            const match = githubLink.url.match(/github\.com\/([^\/]+)/);
            return match?.[1];
        }
        return null;
    }

    // Update social links dynamically
    updateSocialLinks(config) {
        const socialLinks = document.querySelector('.social-links');
        const fragment = document.createDocumentFragment();
        
        // Clear existing links
        socialLinks.innerHTML = '';

        // Process social links from config
        if (config.social_links && config.social_links.length > 0) {
            config.social_links.forEach(linkConfig => {
                const link = this.createSocialLink(linkConfig);
                if (link) {
                    fragment.appendChild(link);
                }
            });
        }

        // Append all links at once
        socialLinks.appendChild(fragment);
    }

    // Create individual social link element
    createSocialLink(linkConfig) {
        const iconTemplate = document.querySelector(`#${linkConfig.icon}-icon`);
        if (!iconTemplate) {
            console.warn(`Icon template not found for: ${linkConfig.icon}`);
            return null;
        }

        const iconClone = iconTemplate.content.cloneNode(true);
        const link = document.createElement('a');
        
        link.href = linkConfig.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${linkConfig.name} Profile`);
        
        link.appendChild(iconClone);
        link.appendChild(document.createTextNode(linkConfig.name));
        
        return link;
    }
}

// GitHub Projects Manager Module
class GitHubProjectsManager {
    constructor() {
        this.projectsContainer = null;
        this.requestTimeoutMs = 5000;
        this.defaultMaxRepos = 6;
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

    getSettings(config) {
        const settings = config.github_projects || {};
        const username = config.github_username;
        const excludedRepos = new Set([
            username,
            ...(settings.excluded_repos || [])
        ].filter(Boolean));

        return {
            sourceUrl: settings.source_url,
            maxRepos: Number.isInteger(settings.max_repos) ? settings.max_repos : this.defaultMaxRepos,
            excludedRepos
        };
    }

    normalizeRepo(repo) {
        return {
            name: repo.name,
            description: repo.description || '',
            url: repo.html_url || repo.url,
            homepage: repo.homepage || '',
            language: repo.language || '',
            stars: repo.stars ?? repo.stargazers_count ?? 0,
            forks: repo.forks ?? repo.forks_count ?? 0,
            topics: repo.topics || [],
            updatedAt: repo.updatedAt || repo.updated_at || '',
            pushedAt: repo.pushedAt || repo.pushed_at || ''
        };
    }

    getDisplayRepos(repos, settings) {
        return repos
            .map(repo => this.normalizeRepo(repo))
            .filter(repo => repo.name && repo.url)
            .filter(repo => !settings.excludedRepos.has(repo.name))
            .sort((a, b) => {
                if (b.stars !== a.stars) {
                    return b.stars - a.stars;
                }

                const bDate = Date.parse(b.pushedAt || b.updatedAt) || 0;
                const aDate = Date.parse(a.pushedAt || a.updatedAt) || 0;
                return bDate - aDate;
            })
            .slice(0, settings.maxRepos);
    }

    async fetchFromProfileFeed(settings) {
        if (!settings.sourceUrl) {
            return [];
        }

        const repos = await this.fetchJson(settings.sourceUrl);
        if (!Array.isArray(repos)) {
            throw new Error('Top repositories feed must return an array');
        }

        return this.getDisplayRepos(repos, settings);
    }

    async fetchFromGitHubSearch(username, settings) {
        const query = encodeURIComponent(`user:${username} fork:false archived:false`);
        const perPage = Math.min(100, settings.maxRepos + settings.excludedRepos.size + 5);
        const data = await this.fetchJson(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=${perPage}`);

        return this.getDisplayRepos(data.items || [], settings);
    }

    async fetchFromGitHubRepos(username, settings) {
        const repos = await this.fetchJson(`https://api.github.com/users/${username}/repos?type=owner&sort=updated&per_page=100`);
        const publicRepos = repos.filter(repo => !repo.fork && !repo.archived);

        return this.getDisplayRepos(publicRepos, settings);
    }

    // Fetch most-starred GitHub projects from the profile feed, then fall back to GitHub APIs.
    async fetchGitHubProjects(config) {
        this.projectsContainer = document.getElementById('projects');
        const username = config.github_username;
        const settings = this.getSettings(config);

        if (!this.projectsContainer) {
            console.warn('Projects container not found, skipping GitHub projects');
            return;
        }
        
        if (!username) {
            console.warn('No GitHub username provided, skipping GitHub projects');
            return;
        }
        
        try {
            this.projectsContainer.innerHTML = '';

            const topRepos = await this.fetchFromProfileFeed(settings);

            if (topRepos.length > 0) {
                this.renderProjects(topRepos, username);
                return;
            }

            throw new Error('Top repositories feed did not return any projects');
        } catch (error) {
            console.warn('Top repositories feed failed, falling back to GitHub Search API', error);
            return this.fetchGitHubProjectsFallback(username, settings);
        }
    }

    // Fallback method to fetch most-starred repos if the profile feed is unavailable
    async fetchGitHubProjectsFallback(username, settings) {
        try {
            const topRepos = await this.fetchFromGitHubSearch(username, settings);

            if (topRepos.length > 0) {
                this.renderProjects(topRepos, username);
                return;
            }

            throw new Error('GitHub Search API did not return any projects');
        } catch (error) {
            console.warn('GitHub Search API failed, falling back to user repositories', error);
            return this.fetchGitHubProjectsReposFallback(username, settings);
        }
    }

    async fetchGitHubProjectsReposFallback(username, settings) {
        try {
            const topRepos = await this.fetchFromGitHubRepos(username, settings);

            if (topRepos.length > 0) {
                this.renderProjects(topRepos, username);
            } else {
                this.setMessage('No public repositories found.');
            }
        } catch (error) {
            this.setMessage('GitHub projects are temporarily unavailable.');
            console.error('Error loading GitHub projects:', error);
        }
    }

    formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(value || 0);
    }

    createProjectMeta(repo) {
        const meta = document.createElement('div');
        meta.className = 'project-meta';

        const stats = [
            { icon: 'star', label: `${this.formatNumber(repo.stars)} stars` },
            { icon: 'call_split', label: `${this.formatNumber(repo.forks)} forks` }
        ];

        if (repo.language) {
            stats.push({ icon: 'code', label: repo.language });
        }

        stats.forEach(stat => {
            const item = document.createElement('span');
            item.className = 'project-stat';

            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = stat.icon;

            const label = document.createElement('span');
            label.textContent = stat.label;

            item.append(icon, label);
            meta.appendChild(item);
        });

        return meta;
    }

    createTopics(repo) {
        const topics = repo.topics.slice(0, 3);
        if (topics.length === 0) {
            return null;
        }

        const topicList = document.createElement('div');
        topicList.className = 'project-topics';

        topics.forEach(topic => {
            const item = document.createElement('span');
            item.textContent = topic;
            topicList.appendChild(item);
        });

        return topicList;
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
        const titleLink = document.createElement('a');
        titleLink.href = repo.url;
        titleLink.target = '_blank';
        titleLink.rel = 'noopener noreferrer';
        titleLink.setAttribute('aria-label', `View ${repo.name} repository on GitHub`);
        titleLink.textContent = repo.name;
        title.appendChild(titleLink);

        const meta = this.createProjectMeta(repo);

        const description = document.createElement('p');
        description.textContent = repo.description || 'No description provided.';

        const topics = this.createTopics(repo);

        const links = document.createElement('div');
        links.className = 'project-links';

        const repositoryLink = document.createElement('a');
        repositoryLink.href = repo.url;
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

        card.append(title, meta, description);
        if (topics) {
            card.appendChild(topics);
        }
        card.appendChild(links);
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

// Footer Manager Module
class FooterManager {
    updateFooterSection(config) {
        if (!config.footer) return;

        const footer = document.querySelector('.footer');
        if (!footer) return;

        // Update footer tagline
        this.updateFooterTagline(config.footer);

        // Update footer social links
        if (config.footer.show_social_links) {
            this.updateFooterSocialLinks(config);
        }

        // Update footer bottom content
        this.updateFooterBottom(config.footer);
    }

    updateFooterTagline(footerConfig) {
        const taglineElement = document.querySelector('.footer-tagline');
        if (taglineElement && footerConfig.tagline) {
            taglineElement.textContent = footerConfig.tagline;
        }
    }

    updateFooterSocialLinks(config) {
        const footerSocial = document.querySelector('.footer-social');
        if (!footerSocial) return;

        // Clear existing social links
        footerSocial.innerHTML = '';

        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();

        // Use main social_links array (same as header)
        const socialLinks = config.social_links;
        
        if (socialLinks && Array.isArray(socialLinks)) {
            socialLinks.forEach(social => {
                const socialLink = this.createSocialLink(social);
                if (socialLink) {
                    fragment.appendChild(socialLink);
                }
            });
        }

        // Add Source Code link only in footer
        if (config.github_username) {
            const sourceCodeLink = this.createSocialLink({
                name: 'Source Code',
                url: `https://github.com/${config.github_username}/${config.github_username}.github.io`,
                icon: 'code'
            });
            if (sourceCodeLink) {
                fragment.appendChild(sourceCodeLink);
            }
        }

        // Fallback: Add GitHub link if no social_links array exists but github_username is present
        if ((!socialLinks || socialLinks.length === 0) && config.github_username) {
            const githubLink = this.createSocialLink({
                name: 'GitHub',
                url: `https://github.com/${config.github_username}`,
                icon: 'github'
            });
            if (githubLink) {
                fragment.appendChild(githubLink);
            }
        }

        footerSocial.appendChild(fragment);
    }

    createSocialLink(social) {
        const iconTemplate = document.querySelector(`#${social.icon}-icon`);
        if (!iconTemplate) return null;

        const link = document.createElement('a');
        link.href = social.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', social.name === 'Source Code' ? 'View source code' : `${social.name} Profile`);

        const icon = iconTemplate.content.cloneNode(true);
        link.appendChild(icon);

        return link;
    }

    updateFooterBottom(footerConfig) {
        // Update "built with" text
        const builtWithElement = document.querySelector('.footer-built-with');
        if (builtWithElement) {
            if (footerConfig.show_built_with && footerConfig.built_with_text) {
                builtWithElement.textContent = footerConfig.built_with_text;
                builtWithElement.style.display = 'block';
            } else {
                builtWithElement.style.display = 'none';
            }
        }
    }
}

// Main Application Module

class PortfolioApp {
    constructor() {
        this.configManager = new ConfigManager();
        this.seoManager = new SEOManager();
        this.themeManager = new ThemeManager();
        this.loadingManager = new LoadingManager();
        this.sectionManager = new SectionManager(this.configManager);
        this.resumeManager = new ResumeManager();
        this.headerManager = new HeaderManager();
        this.githubProjectsManager = new GitHubProjectsManager();
        this.footerManager = new FooterManager();
    }

    async init() {
        try {
            // Initialize theme first
            this.themeManager.init();

            // Load configuration
            const config = await this.configManager.loadConfig();
            if (!config) return;

            // Update SEO tags first
            this.seoManager.updateSEOTags(config);

            // Update header section
            this.headerManager.updateHeaderSection(config);

            // Update page content from config
            this.sectionManager.updatePageContent(config);

            // Render one-page resume from the same profile data
            this.resumeManager.updateResumeSection(config);

            // Update footer section
            this.footerManager.updateFooterSection(config);

            // Initialize Scroll to Top
            this.initScrollToTop();
            
            // Open project details on desktop
            this.handleProjectDetailsDisplay();

            // Hide loading screen after content has loaded
            this.loadingManager.hideLoadingScreen();

            // Load GitHub projects after the main portfolio is visible.
            const features = { github_projects: true, ...config.features };
            if (features.github_projects && config.github_username) {
                this.githubProjectsManager.fetchGitHubProjects(config).catch(error => {
                    console.error('Error loading GitHub projects:', error);
                });
            }

        } catch (error) {
            console.error('Error initializing portfolio:', error);
            this.loadingManager.hideLoadingScreen(false);
        }
    }

    // Handle project details visibility based on viewport
    handleProjectDetailsDisplay() {
        const openDetailsOnDesktop = () => {
            const isDesktop = window.innerWidth >= 769;
            const projectDetails = document.querySelectorAll('.project-details');
            projectDetails.forEach(details => {
                details.open = isDesktop;
            });
        };
        
        // Run on load
        openDetailsOnDesktop();
        
        // Run on resize
        window.addEventListener('resize', openDetailsOnDesktop);
    }

    initScrollToTop() {
        const scrollBtn = document.getElementById('scroll-to-top');
        if (!scrollBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PortfolioApp();
    app.init();
});
