import {personalInfo,experience,projects,education,hobbies,poker,contact} from '../content/portfolio';
import type {Section} from '../config/world';

export const sectionTitles:Record<Section,string>={about:'About',experience:'Experience',projects:'Projects',education:'Education',hobbies:'Hobbies',poker:'Poker'};
export const sectionLabels:Record<Section,string>={...sectionTitles};
export const portfolioMeta={personalInfo,experience,projects,education,hobbies,poker,contact};
export const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function link(url:string,label:string,cls=''){return `<a class="${cls}" href="${escape(url)}"${url.startsWith('https')?' target="_blank" rel="noopener noreferrer"':''}>${escape(label)}</a>`;}

function entry(title:string,meta:string,body:string,detail=''){
  return `<article class="content-entry"><div class="entry-heading"><h3>${escape(title)}</h3><span>${escape(meta)}</span></div>${body}${detail}</article>`;
}

export function contentMarkup(section:Section){
  switch(section){
    case 'about':return `<p class="panel-intro">${escape(personalInfo.intro)}</p><p>${escape(personalInfo.aside)}</p><footer class="about-contact" aria-label="Contact"><div class="panel-links">${link('mailto:'+contact.email,'email')}${link(contact.github,'github')}${link(contact.linkedin,'linkedin')}</div></footer>`;
    case 'experience':return experience.map(job=>entry(job.company,job.date,`<p class="entry-role">${escape(job.role)}</p><p>${escape(job.detail)}</p>`,`<p class="entry-stack">${escape(job.stack)}</p>`)).join('');
    case 'projects':return projects.map((project,i)=>`<article class="content-entry project-entry"><div class="entry-heading"><h3>${link(project.github,project.title)}</h3><span>${String(i+1).padStart(2,'0')}</span></div><p class="project-summary">${escape(project.summary)}</p><p>${escape(project.description)}</p><p class="entry-stack">${escape(project.stack)}</p></article>`).join('');
    case 'education':return `${entry(education.institution,'',`<p class="entry-role">${escape(education.degree)}</p>`)}<div class="scholarship-line"><h3>${escape(education.award)}</h3><p>${escape(education.awardDetail)}</p></div><div class="coursework"><h3>coursework</h3><p>${escape(education.courses)}</p></div>`;
    case 'hobbies':return hobbies.map(hobby=>entry(hobby.title,'',`<p>${escape(hobby.detail)}</p>`)).join('')+`<p class="compact-note">Look for the tabletop and cube shelf around the station.</p>`;
    case 'poker':return `<p class="panel-intro">${escape(poker.intro)}</p><ul class="plain-list">${poker.topics.map(topic=>`<li>${escape(topic)}</li>`).join('')}</ul><p>${escape(poker.closing)}</p><p class="compact-note">Try Redshift Draw at the lounge table: build poker hands, collect bonuses, and chase a high score.</p>`;
  }
}
