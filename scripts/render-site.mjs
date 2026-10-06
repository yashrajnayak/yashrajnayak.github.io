import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const escape = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines = v => (Array.isArray(v)?v:[v]).map(escape).join('<br />');
const json = v => JSON.stringify(v).replace(/</g,'\\u003c');
const icon = (down=false) => `<svg class="link-icon${down?' link-icon-down':''}" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 19 19 5M5 5h14v14"/></svg>`;
const link = (l, cls='text-link', extra='', down=false) => `<a class="${cls}" href="${escape(l.url)}" ${extra}>${escape(l.label)} ${icon(down)}</a>`;
const responsive = m => m.sources ? `srcset="${escape(m.sources.map(s=>`${s.src} ${s.width}w`).join(', '))}" sizes="${escape(m.sizes)}"` : '';
const img = (m,extra='') => `<img ${responsive(m)} src="${escape(m.src)}" alt="${escape(m.alt)}" width="${escape(m.width)}" height="${escape(m.height)}" ${extra} />`;
const label = s => `<div class="section-label"><span class="eyebrow">${escape(s.label)}</span><p>${lines(s.note)}</p></div>`;
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0,10);
export function validateConfig(c) {
  for (const key of ['site','person','navigation','hero','atlas','work','tools','about','contact','footer','download','ui','profile']) if(!c[key]) throw Error(`Missing config.${key}`);
  if(c.version!==1) throw Error('Unsupported config version');
  if(!/^https:\/\/[^/]+\/$/.test(c.site.url)) throw Error('site.url must be an HTTPS origin with trailing slash');
  for(const [key,items] of [['projects',c.tools.projects],['stories',c.work.stories],['career',c.about.career],['atlas',c.atlas.items]]) if(!Array.isArray(items)||!items.length) throw Error(`Missing ${key}`);
  const ids=['main','name','work','tools','about','contact',...c.work.stories.map(s=>s.id)];
  if(new Set(ids).size!==ids.length || ids.some(id=>!/^[-a-z0-9]+$/.test(id))) throw Error('Invalid or duplicate section id');
  if(c.work.stories.filter(s=>s.media.type==='video').length>1) throw Error('Use one highlights video');
  for(const s of c.work.stories) if(!['standard','split'].includes(s.layout)||!['image','video'].includes(s.media.type)) throw Error('Unknown story layout or media');
  for (const media of [...c.work.stories.map(s=>s.media), ...c.atlas.items]) {
    if (!media.sources) continue;
    if (!Array.isArray(media.sources) || !media.sources.length || typeof media.sizes !== 'string' || !media.sizes.trim()) throw Error('Responsive images require sources and sizes');
    let previous = 0;
    for (const candidate of media.sources) {
      if (!Number.isInteger(candidate.width) || candidate.width <= previous || !/^assets\/[a-zA-Z0-9/_.-]+$/.test(candidate.src) || candidate.src.includes('..') || !existsSync(candidate.src)) throw Error('Invalid responsive image candidate');
      previous = candidate.width;
    }
  }
  const atlasIds=c.atlas.items.map(i=>i.id);
  if(new Set(atlasIds).size!==atlasIds.length || atlasIds.some(id=>!/^[-a-z0-9]+$/.test(id))) throw Error('Invalid atlas ids');
  const walk=(value,key='')=>{
    if(typeof value==='string') {
      if(['url','link','src','path','poster','image','banner'].includes(key)) {
        if(!/^(https:\/\/|#[a-z0-9-]+$|assets\/|images\/)/.test(value)||value.includes('..')) throw Error(`Unsafe URL: ${key}`);
        if(value.startsWith('#')&&!ids.includes(value.slice(1))) throw Error(`Unknown anchor: ${value}`);
        if(value.startsWith('assets/')&&!existsSync(value)) throw Error(`Missing asset: ${value}`);
      }
    } else if(Array.isArray(value)) value.forEach(v=>walk(v,key));
    else if(value&&typeof value==='object') Object.entries(value).forEach(([k,v])=>walk(v,k));
  };walk(c);
  if(c.about.career.some(x=>x.name==='ANSR')) throw Error('ANSR must not be structured experience');
  if(c.download.enabled) {
    if(!existsSync(c.download.path)||readFileSync(c.download.path).subarray(0,5).toString()!=='%PDF-') throw Error('Download must point to an existing PDF');
  }
  return c;
}
export function renderSite(c) {
 validateConfig(c);
 const {site:s,hero:h,ui:u}=c, first=c.atlas.items[0];
 const absolute=p=>new URL(p,s.url).href;
 const meta=(key,value,property=false)=>`<meta ${property?'property':'name'}="${key}" content="${escape(value)}" />`;
 const og={type:'website',url:s.url,title:s.title,description:s.description,site_name:s.name,locale:s.locale,image:absolute(s.socialImage.src),'image:width':s.socialImage.width,'image:height':s.socialImage.height,'image:type':'image/png','image:alt':s.socialImage.alt};
 const twitter={card:'summary_large_image',url:s.url,title:s.title,description:s.description,image:absolute(s.socialImage.src),'image:alt':s.socialImage.alt,creator:s.twitter};
 const faviconVersion=JSON.parse(readFileSync('site.webmanifest')).icons[0].src.split('?v=')[1];
 const download=c.download.enabled?`<div class="profile-download">${link({label:c.download.label,url:c.download.path},'text-link',`download="${escape(c.download.filename)}"`)}<p>${escape(c.download.note)} · <time datetime="${escape(c.download.date)}">${escape(c.download.date)}</time></p></div>`:'';
 const story=st=>{
  const m=st.media, film=m.type==='video';
  const visual=film?`<figure class="story-film"><video id="btw-film" class="ambient-video" muted loop playsinline controls preload="none" poster="${escape(m.poster)}" width="${m.width}" height="${m.height}" aria-label="${escape(m.alt)}"><source src="${escape(m.src)}" type="video/mp4" />${link(m.fallback)}</video><figcaption><span>${escape(st.caption)}</span><span class="film-controls" hidden><button type="button" data-film-action="play">${escape(u.play)}</button><button type="button" data-film-action="sound">${escape(u.soundOn)}</button><button type="button" data-film-action="fullscreen">${escape(u.fullscreen)}</button></span></figcaption></figure>`:`<figure class="${st.layout==='split'?'portrait-photo':'story-photo'}">${img(m,'loading="lazy"')}<figcaption>${escape(st.caption)}</figcaption></figure>`;
  const paragraphs=st.paragraphs.map((p,i)=>`<p${st.layout==='split'&&i===0?' class="large-copy"':st.optionalParagraphs?.includes(i)?' class="optional-copy"':''}>${escape(p)}</p>`).join('');
  return `<article class="work-story${st.layout==='split'?' education-story':''}" id="${st.id}"><div class="story-heading"><span class="eyebrow">${escape(st.label)}</span><h3>${escape(st.title)}</h3></div>${st.layout==='split'?`<div class="split-story">${visual}<div class="story-side">${paragraphs}${link(st.link)}</div></div>`:`${visual}<div class="story-bottom">${paragraphs}${link(st.link)}</div>`}</article>`;
 };
 return `<!doctype html>
<!-- Generated from config.json. Run npm run build; edit the config, not this file. -->
<html lang="${escape(s.language)}"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
${meta('description',s.description)}${meta('author',s.name)}${meta('robots','index, follow, max-image-preview:large')}${meta('theme-color',s.theme)}
<link rel="canonical" href="${escape(s.url)}" />
${Object.entries(og).map(([k,v])=>meta(`og:${k}`,v,true)).join('\n')}
${Object.entries(twitter).map(([k,v])=>meta(`twitter:${k}`,v)).join('\n')}
<title>${escape(s.title)}</title>
<link rel="icon" href="assets/favicons/favicon.ico?v=${faviconVersion}" sizes="any" /><link rel="icon" href="assets/favicons/favicon-32x32.png?v=${faviconVersion}" type="image/png" sizes="32x32" /><link rel="icon" href="assets/favicons/favicon.svg?v=${faviconVersion}" type="image/svg+xml" /><link rel="apple-touch-icon" href="assets/favicons/favicon-180x180.png?v=${faviconVersion}" sizes="180x180" /><link rel="manifest" href="site.webmanifest" />
<link rel="stylesheet" href="css/bundle.css?v=${hash('css/bundle.css')}" />
<script type="application/ld+json">${json({...c.person,name:s.name,url:s.url,'@id':s.url+'#person'})}</script>
<script type="application/ld+json">${json({'@context':'https://schema.org','@type':'WebSite','@id':s.url+'#website',url:s.url,name:s.name,description:s.description,inLanguage:s.language,publisher:{'@id':s.url+'#person'}})}</script>
</head><body>
<a class="skip" href="#main">${escape(u.skip)}</a>
<header class="site-header"><a class="identity" href="#" aria-label="${escape(s.name+' '+u.home)}">${escape(s.monogram)}</a><nav aria-label="${escape(u.navigation)}">${c.navigation.map(n=>link(n,'')).join('')}</nav></header>
<main id="main"><section class="hero brand-hero" aria-labelledby="name"><div class="hero-name"><p class="eyebrow">${escape(h.eyebrow)}</p><h1 id="name" aria-label="${escape(s.name)}"><button class="name-button" type="button" disabled role="presentation"><span class="wordmark">${escape(s.name)}</span><canvas id="name-particles" aria-hidden="true"></canvas></button></h1></div></section>
<div class="hero-intro wrap"><p class="intro">${escape(h.intro)}</p><p class="current">${lines(h.roles)}</p>${link(h.cta,'text-link','',true)}</div>
<section class="atlas" aria-label="${escape(h.cta.label)}"><div class="atlas-inner wrap"><div class="atlas-map"><div class="map-heading"><span class="eyebrow">${escape(c.atlas.label)}</span><span class="map-subtitle">${escape(c.atlas.subtitle)}</span></div><div class="map-nodes" aria-label="${escape(u.chooseProject)}">${c.atlas.items.map((p,i)=>`<button disabled class="map-pin pin-${i}" data-project="${p.id}" aria-pressed="${i===0}"><span class="pin-square" aria-hidden="true"></span><span><small>${escape(p.category)}</small> ${escape(p.label)}</span></button>`).join('')}</div><div class="map-key"><span class="crosshair" aria-hidden="true">+</span>${escape(c.atlas.note)}<span class="map-scale" aria-hidden="true">└────┴────┘</span></div></div>
<article class="map-card" id="map-card" aria-live="polite" aria-atomic="true"><div class="map-media">${img({src:first.image,alt:first.alt,width:800,height:450,sources:first.sources,sizes:first.sizes},'id="map-image"')}</div><div class="map-card-copy"><p class="eyebrow" id="map-category">${escape(first.category)}</p><h2 id="map-title">${escape(first.title)}</h2><p id="map-description">${escape(first.description)}</p>${link({label:c.atlas.cta,url:first.link},'text-link','id="map-link"')}</div></article></div></section>
<section id="work" class="section wrap">${label(c.work)}<div class="section-content"><h2 class="section-title">${lines(c.work.title)}</h2>${c.work.stories.map(story).join('\n')}</div></section>
<section id="tools" class="section tools-section"><div class="wrap section-grid">${label(c.tools)}<div class="section-content"><h2 class="section-title">${lines(c.tools.title)}</h2><div class="tool-list">${c.tools.projects.map((p,i)=>`<a class="tool-row" href="${escape(p.url)}"><span class="tool-number">${String(i+1).padStart(2,'0')}</span><div><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p><span class="eyebrow">${escape(p.tags)}</span><span class="tool-action">${escape(p.action || "Explore project")}</span></div>${icon()}</a>`).join('')}</div>${link(c.tools.more,'text-link all-tools')}</div></div></section>
<section id="about" class="section wrap">${label(c.about)}<div class="section-content"><h2 class="section-title">${lines(c.about.title)}</h2><p class="about-lead">${escape(c.about.lead)}</p><p class="about-copy">${escape(c.about.copy)}</p><div class="career" aria-label="${escape(u.career)}">${c.about.career.map(j=>`<div class="career-row"><span>${escape(j.period)}</span><h3 class="company-logo">${img(j.logo,'loading="lazy"')}</h3><p>${escape(j.role)}</p></div>`).join('')}</div><div class="profile-links">${link(c.about.link)}${download}</div></div></section>
<section id="contact" class="contact"><div class="wrap"><p class="eyebrow">${escape(c.contact.label)}</p><h2>${lines(c.contact.title)}</h2><div class="contact-bottom"><p>${lines(c.contact.copy)}</p>${link(c.contact.link,'contact-link')}</div></div></section></main>
<footer class="wrap footer"><a class="identity" href="#" aria-label="${escape(u.backToTop)}">${escape(s.monogram)}</a><p>${escape(s.name)} <span aria-hidden="true">/</span> ${escape(c.footer.note)}</p><nav aria-label="${escape(u.social)}">${c.footer.social.map(n=>`<a href="${escape(n.url)}">${escape(n.label)}</a>`).join('')}</nav></footer>
<script id="site-data" type="application/json">${json({projects:Object.fromEntries(c.atlas.items.map(p=>[p.id,p])),ui:u})}</script><script src="js/bundle.js?v=${hash('js/bundle.js')}" defer></script></body></html>\n`;
}
export function renderProfile(c) {
 validateConfig(c);
 const md=v=>String(v).replace(/[\\`*_[\]<>|]/g,'\\$&').replace(/\s+/g,' ');
 const mdlink=(label,url)=>`[${md(label)}](${url})`;
 return `<!-- Generated from the website config.json. Do not edit by hand. -->\n<img src="${c.profile.banner}" alt="${escape(c.site.name)}" width="100%" />\n\n# ${md(c.site.name)}\n\n${c.hero.roles.map(md).join(' ')}\n\n${md(c.hero.intro)}\n\n${mdlink(c.profile.websiteLabel,c.site.url)}${c.download.enabled?' · '+mdlink(c.download.label,new URL(c.download.path,c.site.url).href):''}\n\n${c.footer.social.map(n=>mdlink(n.label,n.url)).join(' · ')}\n\n## ${md(c.profile.aboutHeading)}\n\n${md(c.about.lead)} ${md(c.about.copy)}\n\n## ${md(c.profile.workHeading)}\n\n${c.work.stories.map(st=>`### ${mdlink(st.title,st.link.url)}\n\n${st.paragraphs.map(md).join('\n\n')}`).join('\n\n')}\n\n## ${md(c.profile.projectsHeading)}\n\n${c.tools.projects.map(p=>`- **${mdlink(p.name,p.url)}** — ${md(p.description)}`).join('\n')}\n\n## ${md(c.profile.certificationsHeading)}\n\n${c.profile.certifications.map(x=>'- '+(typeof x==='string'?md(x):mdlink(x.name,x.url))).join('\n')}\n`;
}
