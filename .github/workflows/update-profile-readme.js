#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate Profile README.md content from config.json
 * This script updates the {username}/{username} repository README
 * Based on the config.json from the portfolio repository
 */

function generateProfileReadme(config) {
  try {
    // Extract social links from config (no hardcoded fallbacks)
    const socialLinks = {
      portfolio: config.site?.seo?.base_url,
      linkedin: config.social_links?.find(link => link.name === 'LinkedIn')?.url,
      twitter: config.social_links?.find(link => link.name === 'Twitter')?.url,
      instagram: config.social_links?.find(link => link.name === 'Instagram')?.url
    };
    
    // Build skills section with better error handling
    const skillsCategories = config.skills?.categories || [];
    const technicalSkills = skillsCategories.find(cat => cat.name === 'Technical')?.items || [];
    const devRelSkills = skillsCategories.find(cat => cat.name === 'Developer Relations')?.items || [];
    
    // Build certifications section
    const certifications = skillsCategories.find(cat => cat.name === 'Certifications')?.items || [];
    const certificationsList = certifications.length > 0 
      ? certifications.map(cert => {
          if (typeof cert === 'object' && cert.name && cert.url) {
            return `- [${cert.name}](${cert.url})`;
          }
          return `- ${cert}`;
        }).join('\n')
      : '- Coming soon...';

    // Build projects section if it exists and is enabled
    let projectsSection = '';
    if (config.features?.projects && config.projects?.items?.length > 0) {
      const projectsList = config.projects.items.map(project => {
        const descriptions = project.description?.map(desc => `- ${desc}`).join('\n') || '';
        let projectContent = `**${project.name}**${project.date ? ` (${project.date})` : ''}\n${descriptions}`;
        
        // Add link if available
        if (project.link?.url) {
          projectContent += `\n- [${project.link.title || 'View Project'}](${project.link.url})`;
        }
        
        return projectContent;
      }).join('\n\n');
      
      projectsSection = `## ${config.projects.title || 'Projects'}

${projectsList}

`;
    }

    // Build skills code block with better formatting
    const skillsCodeBlock = `\`\`\`javascript
const skills = {${technicalSkills.length > 0 ? `
  technical: [${technicalSkills.map(skill => `'${skill}'`).join(', ')}],` : ''}${devRelSkills.length > 0 ? `
  developerRelations: [${devRelSkills.map(skill => `'${skill}'`).join(', ')}],` : ''}
  languages: ['English', 'Hindi']
};
\`\`\``;

    // Use configurable greeting (completely dynamic) - H1 with first name only
    let greeting = `# Hi there! 👋`;
    if (config.header?.greeting) {
      // Extract first name from greeting (assumes first word is the first name)
      const firstName = config.header.greeting.split(' ')[0];
      greeting = `# Hi! I am ${firstName} 👋`;
    }
    
    // Generate about section
    const aboutText = config.about?.paragraphs?.join('\n\n') || 'Welcome to my GitHub profile!';
    
    // Build the complete README with dynamic social links
    const readme = `${greeting}

<div align="left">
  ${socialLinks.portfolio ? `
[![Portfolio](https://img.shields.io/badge/🌐_Visit_Portfolio-Live-brightgreen?style=for-the-badge)](${socialLinks.portfolio})` : ''}${socialLinks.linkedin ? `
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0077B5?style=for-the-badge&logo=linkedin)](${socialLinks.linkedin})` : ''}${socialLinks.twitter ? `
[![Twitter](https://img.shields.io/badge/Twitter-Profile-1DA1F2?style=for-the-badge&logo=twitter)](${socialLinks.twitter})` : ''}${socialLinks.instagram ? `
[![Instagram](https://img.shields.io/badge/Instagram-Profile-E4405F?style=for-the-badge&logo=instagram)](${socialLinks.instagram})` : ''}

</div>

${aboutText}
${config.profile_image ? `
![Profile Banner](${config.profile_image})
` : ''}
## Skills & Technologies

${skillsCodeBlock}

## Certifications
${certificationsList}

${projectsSection}## 📈 GitHub Stats

<div align="left">

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=${config.github_username || 'username'}&theme=dark&hide_border=true&include_all_commits=true&count_private=true)

![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${config.github_username || 'username'}&theme=dark&hide_border=true&include_all_commits=true&count_private=true&layout=compact)

</div>
`;

    return readme;
  } catch (error) {
    console.error('❌ Error in generateProfileReadme:', error.message);
    throw error;
  }
}

function validateConfig(config) {
  const requiredFields = ['github_username'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required config fields: ${missingFields.join(', ')}`);
  }
  
  return true;
}

function main() {
  try {
    // Read config.json from the current repository
    const configPath = path.join(process.cwd(), 'config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('❌ config.json not found in current directory');
      process.exit(1);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    let config;
    
    try {
      config = JSON.parse(configContent);
    } catch (parseError) {
      console.error('❌ Invalid JSON in config.json:', parseError.message);
      process.exit(1);
    }
    
    // Validate config structure
    validateConfig(config);
    
    // Generate Profile README content
    const readmeContent = generateProfileReadme(config);
    
    // Write README.md to the profile repository
    const profileReadmePath = path.join(process.cwd(), 'profile-repo', 'README.md');
    
    // Ensure the profile-repo directory exists
    const profileRepoDir = path.dirname(profileReadmePath);
    if (!fs.existsSync(profileRepoDir)) {
      console.error('❌ profile-repo directory not found');
      console.log('ℹ️  Expected directory:', profileRepoDir);
      process.exit(1);
    }
    
    fs.writeFileSync(profileReadmePath, readmeContent);
    
    console.log('✅ Profile README.md updated successfully!');
    console.log('📝 Generated from config.json and written to profile repository');
    console.log(`📄 README length: ${readmeContent.length} characters`);
    
  } catch (error) {
    console.error('❌ Error generating Profile README:', error.message);
    if (process.env.DEBUG) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateProfileReadme, validateConfig };
