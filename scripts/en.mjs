/* O inglês do sítio.
 *
 * O português é o que está escrito no HTML das páginas; aqui vive só o inglês,
 * indexado pela chave `data-t` do elemento correspondente.
 *
 * Isto era carregado pelo browser e aplicado ao vivo quando se carregava no
 * botão da língua. Deixou de ser: o inglês passou a ter endereço próprio, em
 * /en/, e estas linhas são usadas uma vez, por scripts/traduzir.mjs, para
 * escrever essas páginas. Deixaram de viajar para o browser de quem lê o sítio
 * em português — e o inglês passou a ser uma página que o Google pode indexar,
 * em vez de um estado de JavaScript que ele nunca vê.
 */

export const EN = {
  rc_wi_rot: "What's in the bag",
  rc_wi_tit: 'What she carries',
  rc_wi_txt: 'The clubs, the ball and the rest of the kit she plays.',

  /* A página do saco, que é a mesma secção sozinha — para ser partilhada. */
  wb_rot: "What's in the bag",
  wb_tit: 'What she carries',
  wb_txt: 'Her clubs one by one, with the loft and shaft of each — plus the ball, the glove and the bag.',
  wb_ma_rot: 'More',
  wb_ma_tit: 'The rest is one link away',
  wb_ma_txt: 'Handicap, rankings, schedule and every result, season by season, with the source of each.',
  wb_ma_b1: 'Her player page',
  wb_ma_b2: 'Season by season',
  rc_eq_rot: 'Coaching team',
  rc_eq_tit: 'Who she works with',
  rc_eq_txt: 'At the club, at the national High-Performance Centre, and on what never shows on the course.',

  rc_sw_rot: "Coach's corner",
  rc_sw_tit: 'The swing, face-on and down the line',
  rc_sw_txt: 'For anyone assessing technique.',
  rc_rot: 'The player',
  rc_tit: 'Class of 2027',
  rc_txt: 'Portuguese amateur golfer, Portugal U18 national team. Five-time national champion — with a handicap brushing zero.',
  rc_bt1: 'Write to Francisca',
  rc_bt2: 'See the results',
  rc_ev_rot: 'Progression',
  rc_ev_tit: 'How it has moved',
  rc_ev_txt: 'The <strong>WAGR</strong> is the world ranking of amateur golf, run by The R&amp;A and the USGA; the <strong>EGR</strong> is the European one, by age category. The lower the number the better the position — the axis here is inverted, so good news goes up.',
  rc_pa_rot: 'Record',
  rc_pa_tit: 'Eighteen wins, five national titles',
  rc_pa_txt: 'She plays for <strong>Vale de Janelas</strong> — Praia D\'El Rey and West Cliffs, in Óbidos — and '
    + 'for the <strong>Portuguese women\'s amateur national team</strong>. Every event she has played, with the '
    + 'source of each, is in <a class="lig" href="resultados.html">season by season</a>, year by year since 2018.',
  rc_ct_rot: 'Contact',
  rc_ct_tit: 'Getting in touch',
  rc_ct_txt: 'Write to <a class="lig" href="mailto:birdie@franciscasalgado.golf?subject=Francisca%20Salgado">birdie@franciscasalgado.golf</a>. Swing videos and transcripts, on request.',
  saltar: 'Skip to content',
  ig_ns: '@francisca_salgado_ on Instagram',
  /* ── partilhado ─────────────────────────────────────────── */

  vi_rot: 'On video',
  vi_tit: 'From nine years old to now',
  vi_txt: 'From the interview at the Super Bock Ladies Open to the oldest footage there is of her on a course — the 2018 Open World Kids Golf, in the Algarve, where she plays alongside Amélia Gabin, today a national-team colleague.',

  rk_rot: 'Rankings',
  rk_tit: 'Where she stands today',

  /* ── página inicial ─────────────────────────────────────── */
  hero_rot: 'Amateur golfer · Portuguese national team · U18',
  hero_frase: 'From Lisbon to the courses of Europe. At seventeen, five national titles — the latest the U18 — '
    + 'and four national runner-up finishes. She plays for the national team and has competed in eight countries.',
  prox_r: 'Next event',
  prox_carregar: 'Loading…',

  qu_rot: 'Who she is',
  qu_ver: 'Season by season <i aria-hidden="true">\u2192</i>',

  qu_bio: 'She took up golf at seven, at the <strong>Jamor</strong>, and won her first national title at ten. '
    + 'She is currently part of the <strong>Portuguese women\'s amateur national team</strong> and trains at the '
    + '<strong>National Golf Training Centre</strong>, at the Jamor, and at the <strong>Academia de Lisboa</strong>, '
    + 'where she builds her preparation for elite competition.',

  in_rot: 'Instagram',
  in_tit: 'Day to day',
  in_txt: 'Practice, travel, and whatever happens between events.',

  /* ── resultados ─────────────────────────────────────────── */
  rs_rot: 'Season by season',
  rs_tit: 'Nine seasons, event by event',
  rs_txt: 'From her first federated event, in 2018, to the national U18 title.',
  im_rot: 'Press',
  im_tit: 'For people who write about golf',
  im_txt: 'Biography, facts and quotes, all sourced. High-resolution photographs on request.',
  im_bt: 'Request photographs',
  im_bio_rot: 'Short biography',
  im_bio: '<p>Francisca Salgado is an amateur golfer from Vale de Janelas, in Óbidos, and a member of the Portuguese women\'s amateur national team. She has five national titles: U10 in 2019, U12 and the 3rd Category in 2021 and, in 2026, the Amateur Pairs — alongside Rodrigo Constantino — and the U18.</p><p>She won the first Drive Tour of 2024, at Penina, with the lowest round on her record — 70, three under par — and the GJG Algarve Juniors International later that year, was runner-up in the FPG Cup in 2025 and third at the Memorial Celia Barquín, in Asturias.</p><p>She has played for the national team since 2021, in eight countries — Spain, France, Belgium, Slovakia, Finland, Ireland and England as well as Portugal — including two European Young Masters, two Amundi Evian Juniors Cups and two European Ladies\' Team Championships. In 2026 she finished the English Girls\' Open in 28th. She is supported by the Fundação do Desporto.</p>',
  im_factos: 'Facts',
  im_cit_rot: 'In her own words',
  im_cit_tit: 'Quotes',
  im_cit_txt: 'Each quote links to the piece it came from. Free to reproduce, with the source named.',
  im_fot_rot: 'Photographs',
  im_fot_tit: 'High resolution',
  im_fot_txt: 'Published with the permission of the Portuguese Golf Federation and the clubs. Free to reproduce in pieces about the player, with the credit visible. Original resolution on request.',
  im_lig_rot: 'Links',
  im_lig_tit: 'Official profiles',
  im_lig_txt: 'Results and placings can be checked at source. The <strong>pieces already published</strong> about her are in <a class="lig" href="resultados.html">season by season</a>, under the year they ran.',

  /* ── parcerias ──────────────────────────────────────────── */
  ap2_rot: 'Partnerships',
  ap2_tit: 'Taking Portugal further',
  ap2_txt: 'The events that count for the world ranking are played abroad — each one a journey, an entry fee and a week away from home. That is where a backer comes in: on the bag, on the playing kit and in the tournament photographs.',
  ap2_bt1: 'I want to support',
  ap2_bt2: 'What it can cover',
  ap2_cit: 'She led from start to finish on her way to the girls U18 title.',
  ap2_cit_f: 'Portuguese Golf Federation · National Youth Championship, 2026',
  ap2_e_rot: 'What it can cover',
  ap2_e_tit: 'A season, an event, or the training',
  ap2_e_txt: 'There is no price list: say what you have in mind and the proposal comes with events, dates, and what gets seen.',
  ap2_e_bt: 'Ask for a proposal',
  pr_rot: 'On Instagram',
  pr_tit: 'What a brand gets',
  pr_txt: 'Posts made with brands that already back her, on her own account. Not a promise of visibility — what has already gone out.',

  ap2_q_rot: 'Already on board',
  ap2_q_tit: 'Good company',
  ap2_q_txt: 'The brands and institutions already behind her, and what each one covers.',

  ct_rot: 'Contact',
  ct_tit: 'Write to Francisca',
  ct_txt: 'Partnerships, press, invitations to events and photograph requests.',
  ct_v1r: 'Email',
  ct_v2r: 'Instagram',

  /* ── páginas legais ─────────────────────────────────────── */
  pv_rot: 'Privacy',
  pv_tit: 'How we handle your data',
  pv_sub: 'What is collected, what it is for, and what you can demand. In plain language, no small print.',
  pv_1: 'Who handles the data',
  pv_1t: 'This site belongs to the golfer Francisca Salgado. For anything about personal data, or to exercise the rights below, write to <a class="lig" href="mailto:birdie@franciscasalgado.golf">birdie@franciscasalgado.golf</a> or send a direct message on Instagram.',
  pv_2: 'What is collected',
  pv_2t: 'This site has no forms and no fields to fill in, so nothing you write to her passes through here: an email leaves your own mail programme straight for her inbox, and a message on Instagram stays on Instagram. This site collects one thing only, and not without the visit giving cause for it:',
  pv_2b: '<b>Usage measurement,</b> if you allow it: pages viewed, time spent, device type, where the visit came from and a truncated IP address.',
  pv_3: 'What it is for',
  pv_3t: 'Measurement is there to understand which pages are read and to improve the site. An email you send is there so she can reply and, if it goes ahead, to handle whatever is agreed. None of it is used for newsletters or sold to anyone.',
  pv_4: 'On what grounds',
  pv_4t: 'Measurement rests on consent alone, which you can give or withdraw whenever you like, through the “Cookies” button at the foot of any page. Replying to an email you send rests on the legitimate interest of answering the people who write, and, where there is a proposal, on pre-contractual steps.',
  pv_5: 'Cookies',
  pv_5t: 'Until somebody consents, this site writes no cookie that is not essential to make it work. Your language and theme preference stay in your own browser and never leave it.',
  pv_6: 'Third-party content',
  pv_6t: 'Some pages show content hosted elsewhere — Instagram posts, for instance. Those services may set their own cookies, under their own policies.',
  pv_7: 'For how long',
  pv_7t: 'Messages that arrive by email are kept for as long as the relationship lasts and, after that, for the applicable legal period. Measurement data, where it exists, is deleted after fourteen months.',
  pv_8: 'Your rights',
  pv_8t: 'You may ask for access to your data, correction, erasure, restriction or objection, and portability. You may withdraw consent at any time. If you believe your rights have not been respected, you may complain to the Portuguese data protection authority at <a class="lig" href="https://www.cnpd.pt" target="_blank" rel="noopener">cnpd.pt</a>.',
  pv_9: 'Changes',
  pv_9t: 'This policy may be updated. The version in force is always the one on this page.',
  pv_data: 'Last updated: August 2026.',

  tm_rot: 'Terms',
  tm_tit: 'Conditions of use',
  tm_sub: 'What you can expect from this site, and what is asked of whoever uses it.',
  tm_1: 'Purpose',
  tm_1t: 'These conditions apply to browsing this site. By using it, you accept them. If you disagree with any of them, the remedy is simple: do not use the site.',
  tm_2: 'Content and results',
  tm_2t: 'Results published here are taken from the official records of the Portuguese Golf Federation, the European Golf Rankings, the organising federations and the sports press, and every event names its source. Even so, placings can be corrected by the bodies that publish them: for official purposes, those bodies\' records govern, not this page.',
  tm_3: 'Copyright',
  tm_3t: 'The texts on this site belong to those who wrote them. Photographs belong to the photographers and to the bodies that produced them, and are credited where they appear. None of it may be reused without permission, with one exception: material identified as press material is free for journalistic publication, provided the author is credited.',
  tm_4: 'Third-party content',
  tm_4t: 'This site shows content hosted elsewhere and links to sites it does not control. It is not answerable for what is found there, nor for those services\' policies.',
  tm_5: 'Contact and proposals',
  tm_5t: 'The email address and Instagram are there to ask or to propose. A message sent is not a commitment by either side: there is an agreement only once there is a written agreement.',
  tm_6: 'Applicable law',
  tm_6t: 'Portuguese law applies. In a consumer dispute, you may turn to an alternative dispute resolution body, under Law 144/2015.',
  tm_data: 'Last updated: August 2026.',
};
