#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TOP_REPOS_START = '<!-- TOP-REPOS:START -->';
const TOP_REPOS_END = '<!-- TOP-REPOS:END -->';
const DEFAULT_TOP_REPOS_COMMENT =
  '<!-- Portfolio feed: data/top-repos.json is generated from the same ranked repository list. -->';

function findByName(items, name) {
  return items?.find((item) => item.name === name);
}

function socialUrl(config, name) {
  return findByName(config.social_links, name)?.url || '';
}

function getHandle(url) {
  if (!url) {
    return '';
  }

  return url.replace(/\/$/, '').split('/').pop() || '';
}

function certificationList(config) {
  const certifications =
    findByName(config.skills?.categories, 'Certifications')?.items || [];

  if (certifications.length === 0) {
    return '- Coming soon...';
  }

  return certifications
    .map((certification) => {
      if (typeof certification === 'object' && certification.name && certification.url) {
        return `- [${certification.name}](${certification.url})`;
      }

      return `- ${certification}`;
    })
    .join('\n');
}

function currentCompany(config) {
  return config.experience?.jobs?.[0]?.company || 'Databricks';
}

function topReposFromReadme(readme) {
  const start = readme.indexOf(TOP_REPOS_START);
  const end = readme.indexOf(TOP_REPOS_END);

  if (start === -1 || end === -1 || end < start) {
    return '';
  }

  const sectionEnd = end + TOP_REPOS_END.length;
  const afterMarker = readme.slice(sectionEnd).match(/^\n(<!-- Portfolio feed:.*? -->)/);

  return `${readme.slice(start, sectionEnd)}${
    afterMarker ? `\n${afterMarker[1]}` : `\n${DEFAULT_TOP_REPOS_COMMENT}`
  }`;
}

function escapeMarkdown(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatStars(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function topReposFromData(profileRepoDir) {
  const dataPath = path.join(profileRepoDir, 'data', 'top-repos.json');

  if (!fs.existsSync(dataPath)) {
    return `${TOP_REPOS_START}
| Repository | Stars | Description | Language |
| --- | ---: | --- | --- |
${TOP_REPOS_END}
${DEFAULT_TOP_REPOS_COMMENT}`;
  }

  const repos = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const rows = repos.map((repo) => {
    const description = repo.description || 'No description provided.';
    const language = repo.language || 'Mixed';

    return `| [${escapeMarkdown(repo.name)}](${repo.url}) | ${formatStars(repo.stars)} | ${escapeMarkdown(description)} | ${escapeMarkdown(language)} |`;
  });

  return `${TOP_REPOS_START}
| Repository | Stars | Description | Language |
| --- | ---: | --- | --- |
${rows.join('\n')}
${TOP_REPOS_END}
${DEFAULT_TOP_REPOS_COMMENT}`;
}

function topReposSection(profileRepoDir) {
  const readmePath = path.join(profileRepoDir, 'README.md');

  if (fs.existsSync(readmePath)) {
    const section = topReposFromReadme(fs.readFileSync(readmePath, 'utf8'));

    if (section) {
      return section;
    }
  }

  return topReposFromData(profileRepoDir);
}

function generateSocialBadges(config) {
  const linkedin = socialUrl(config, 'LinkedIn');
  const twitter = socialUrl(config, 'Twitter');
  const instagram = socialUrl(config, 'Instagram');

  return [
    linkedin
      ? `[![LinkedIn](https://img.shields.io/badge/LinkedIn-${getHandle(linkedin)}-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](${linkedin})`
      : '',
    twitter
      ? `[![X](https://img.shields.io/badge/X-${getHandle(twitter)}-111111?style=for-the-badge&logo=x&logoColor=white)](${twitter})`
      : '',
    instagram
      ? `[![Instagram](https://img.shields.io/badge/Instagram-${getHandle(instagram)}-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](${instagram})`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function generateProfileReadme(config, options = {}) {
  const username = config.github_username || 'yashrajnayak';
  const name = config.header?.greeting || 'Yashraj Nayak';
  const role = config.header?.tagline || 'Program Manager, Developer Relations';
  const company = currentCompany(config);
  const profileRepoDir = options.profileRepoDir || path.join(process.cwd(), 'profile-repo');

  return `<img src="./images/linkedin-cover.jpeg" alt="${name} banner" width="100%" />

# Hi, I'm ${name}

${role} at ${company}. I work at the intersection of developer communities, data and AI education, university programs, and practical tooling that helps teams run better developer experiences.

<div align="left">

${generateSocialBadges(config)}

</div>

## About

- I lead University Alliances and Student Programs for ${company} in India, helping build a stronger pipeline of data and AI talent across institutions.
- I have 9+ years of experience building and scaling developer communities across India and APAC.
- Previously, I supported MongoDB User Groups globally, contributed to GitHub Developer Relations programs in India, grew OutSystems' APAC community, and helped Progate reach 200,000+ learners in India.
- I enjoy turning repeatable community operations into lightweight tools, automations, playbooks, and products.
- Based in Bangalore, India.

## What I Work With

\`\`\`javascript
const yashraj = {
  currentFocus: ['Databricks', 'University Alliances', 'Student Programs', 'Data + AI education'],
  devRel: ['Program Management', 'Developer Engagement', 'Community Building', 'Technical Events'],
  technical: ['JavaScript', 'React', 'C#', 'GitHub Actions', 'Microsoft Azure'],
  languages: ['English', 'Hindi']
};
\`\`\`

## Most Starred Repos

${topReposSection(profileRepoDir)}

## Selected DevRel Work

- **GitHub Constellation 2024** - supported GitHub's Bengaluru developer conference with 20+ speakers and 900+ in-person attendees.
- **GitTogether Meetups Automation System** - built a GitHub Actions pipeline for multi-repository event operations, issue creation, assignment, and lifecycle tracking.
- **GitTogethers Registration Web Platform** - built a responsive event registration and check-in platform with GitHub API integration.
- **MongoDB User Groups** - supported 40 existing user groups globally and helped launch or revive chapters in Seoul, Abu Dhabi, Rio de Janeiro, and Cape Town.

## Certifications

${certificationList(config)}

## GitHub Stats

<div align="left">

![GitHub Stats](https://github-readme-stats-fast.vercel.app/api?username=${username}&theme=dark&hide_border=true&include_all_commits=true&count_private=true)

![Top Languages](https://github-readme-stats-fast.vercel.app/api/top-langs/?username=${username}&theme=dark&hide_border=true&include_all_commits=true&count_private=true&layout=compact)

</div>
`;
}

function validateConfig(config) {
  const requiredFields = ['github_username'];
  const missingFields = requiredFields.filter((field) => !config[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required config fields: ${missingFields.join(', ')}`);
  }

  return true;
}

function main() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');

    if (!fs.existsSync(configPath)) {
      console.error('config.json not found in current directory');
      process.exit(1);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    let config;

    try {
      config = JSON.parse(configContent);
    } catch (parseError) {
      console.error('Invalid JSON in config.json:', parseError.message);
      process.exit(1);
    }

    validateConfig(config);

    const profileRepoDir = path.join(process.cwd(), 'profile-repo');
    const readmeContent = generateProfileReadme(config, { profileRepoDir });
    const profileReadmePath = path.join(profileRepoDir, 'README.md');

    if (!fs.existsSync(profileRepoDir)) {
      console.error('profile-repo directory not found');
      console.log('Expected directory:', profileRepoDir);
      process.exit(1);
    }

    fs.writeFileSync(profileReadmePath, readmeContent);

    console.log('Profile README.md updated successfully.');
    console.log('Generated from config.json and written to profile repository.');
    console.log(`README length: ${readmeContent.length} characters.`);
  } catch (error) {
    console.error('Error generating Profile README:', error.message);

    if (process.env.DEBUG) {
      console.error('Stack trace:', error.stack);
    }

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateProfileReadme, validateConfig };
