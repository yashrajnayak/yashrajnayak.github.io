// Resume Manager Module
export class ResumeManager {
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
