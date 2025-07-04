#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate Profile README.md content from config.json
 * This script updates the yashrajnayak/yashrajnayak repository README
 */

function generateProfileReadme(config) {
  // Extract social links
  const linkedinLink = config.social_links.find(link => link.name === 'LinkedIn')?.url;
  
  // Build skills section - matching exact format from current README
  const technicalSkills = config.skills.categories.find(cat => cat.name === 'Technical')?.items || [];
  const devRelSkills = config.skills.categories.find(cat => cat.name === 'Developer Relations')?.items || [];
  
  // Build certifications section
  const certifications = config.skills.categories.find(cat => cat.name === 'Certifications')?.items || [];
  const certificationsList = certifications.map(cert => {
    if (typeof cert === 'object' && cert.name && cert.url) {
      return `- [${cert.name}](${cert.url})`;
    }
    return `- ${cert}`;
  }).join('\n');

  // Build experience section - matching the current format exactly
  const experienceSection = config.experience.jobs.map(job => {
    const responsibilities = job.responsibilities.map(resp => `- ${resp}`).join('\n');
    return `**${job.company}** | ${job.role} (${job.date})\n${responsibilities}`;
  }).join('\n\n');

  const readme = `## Hi! I am Yashraj 👋

<div align="left">
  
[![Portfolio](https://img.shields.io/badge/🌐_Visit_Portfolio-Live-brightgreen?style=for-the-badge)](${config.site.seo.base_url})
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Profile-0077B5?style=for-the-badge&logo=linkedin)](${linkedinLink})
[![Twitter](https://img.shields.io/badge/Twitter-Profile-1DA1F2?style=for-the-badge&logo=twitter)](https://x.com/yashrajnayak)
[![Instagram](https://img.shields.io/badge/Instagram-Profile-E4405F?style=for-the-badge&logo=instagram)](https://instagram.com/yashrajnayak.dev)

</div>

${config.about.paragraphs.join('\n\n')}

![image](images/linkedin-cover.jpeg)

## Skills & Technologies

\`\`\`javascript
const skills = {
  technical: [${technicalSkills.map(skill => `'${skill}'`).join(', ')}],
  developerRelations: [${devRelSkills.map(skill => `'${skill}'`).join(', ')}],
  languages: ['English', 'Hindi']
};
\`\`\`

## Professional Experience

${experienceSection}

### Certifications
${certificationsList}

## 📈 GitHub Stats

<div align="left">

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=${config.github_username}&theme=dark&hide_border=true&include_all_commits=true&count_private=true)

![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${config.github_username}&theme=dark&hide_border=true&include_all_commits=true&count_private=true&layout=compact)

</div>
`;

  return readme;
}

function main() {
  try {
    // Read config.json from the current repository
    const configPath = path.join(process.cwd(), 'config.json');
    
    if (!fs.existsSync(configPath)) {
      console.error('❌ config.json not found in current directory');
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Generate Profile README content
    const readmeContent = generateProfileReadme(config);
    
    // Write README.md to the profile repository
    const profileReadmePath = path.join(process.cwd(), 'profile-repo', 'README.md');
    
    // Ensure the profile-repo directory exists
    if (!fs.existsSync(path.dirname(profileReadmePath))) {
      console.error('❌ profile-repo directory not found');
      process.exit(1);
    }
    
    fs.writeFileSync(profileReadmePath, readmeContent);
    
    console.log('✅ Profile README.md updated successfully!');
    console.log('📝 Generated from config.json and pushed to yashrajnayak/yashrajnayak repository');
    
  } catch (error) {
    console.error('❌ Error generating Profile README:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateProfileReadme };
