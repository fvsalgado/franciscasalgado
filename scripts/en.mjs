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
  /* ── partilhado ─────────────────────────────────────────── */
  dz_onde: 'Published in',

  ga_rot: 'In play',
  ga_tit: 'Seven years on the course',
  ga_txt: 'From the national U10 champion, in 2019, to the tee at the English Girls\' Open. Photographs from the Portuguese Golf Federation and the clubs, published with permission and with the credit in plain sight.',

  vi_rot: 'On video',
  vi_tit: 'From nine years old to now',
  vi_txt: 'From the interview at the Super Bock Ladies Open to the oldest footage there is of her on a course — the 2018 Open World Kids Golf, in the Algarve, where she plays alongside Amélia Gabin, today a national-team colleague. Nothing loads from YouTube until you press play.',


  rk_rot: 'Rankings',
  rk_tit: 'The official records, as they stand',
  rk_txt: 'The <strong>WAGR</strong> is the world ranking of amateur golf, run by The R&amp;A and the USGA; the <strong>EGR</strong> is the European one, by age category. These two cards read her records the moment the page opens — not one of these numbers is typed in by hand.',
  rk_txt2: 'Read the moment the page opens. The <strong>WAGR</strong> is the world ranking of amateur golf, run by The R&amp;A and the USGA; the <strong>EGR</strong> is the European one, by age category, and it decides access to much of the international calendar.',

  /* ── página inicial ─────────────────────────────────────── */
  hero_rot: 'Amateur golfer · Portuguese national team · U18',
  hero_frase: 'From Vale de Janelas to the courses of Europe. Four national titles, and the season is only half done.',
  prox_r: 'Next event',
  prox_carregar: 'Loading…',

  nu_rot: 'The season',
  nu_tit: 'Where she stands',
  nu_txt: 'What counts in an amateur career: the titles, the wins, the lowest round — and how long this has been going on.',

  qu_rot: 'Who she is',
  qu_tit: 'National champion at ten, and again at seventeen',
  qu_txt: 'She won her first national championship in 2019, in the U10 category. She plays for <strong>Vale de Janelas</strong>, in Óbidos, and wears the shirt of the <strong>Portuguese women\'s amateur national team</strong>. In 2026 she added two more titles: the Amateur Pairs and the U18.',
  qu_bt: 'See her story',

  re_rot: 'Results',
  re_tit: 'The latest events',
  re_txt: 'The most recent ones, with the rounds and the score against par. The full record, season by season and with filters, is on the results page.',
  re_bt: 'See every result',
  re_carregar: 'Loading results…',

  pa_rot: 'Honours',
  pa_tit: 'What she has won',
  pa_txt: 'Events she finished on top of — four national championships, the GJG Algarve Juniors, the Drive Tour and the Aquapor Circuit, where she also won a whole season\'s ranking.',

  dz_rot: 'Press',
  dz_tit: 'What has been written',
  dz_txt: 'High-resolution photographs, biography and results record are on the press page.',
  dz_bt: 'See the press kit',

  in_rot: 'Instagram',
  in_tit: 'Day to day',
  in_txt: 'Practice, travel, and whatever happens between tournaments. The posts are loaded from Instagram.',

  ap_rot: 'Support',
  ap_tit: 'Taking Portugal further',
  ap_txt: 'An amateur career is built on travel, entry fees and hours on the course. Partners go on the bag, on the playing apparel and into the tournament photographs — at home and abroad.',
  ap_bt: 'How to support',

  /* ── resultados ─────────────────────────────────────────── */
  rs_rot: 'Results',
  rs_tit: 'Event by event, season by season',
  rs_txt: 'Everything on the record: the rounds, the total and the score against par. Where a final placing has not been published, the card stays and the position box says it does not know — less pretty than inventing a number, and the right thing to do.',
  rs_egr: 'European Golf Rankings profile',
  rs_fpg: 'Portuguese Golf Federation profile',

  /* ── percurso ───────────────────────────────────────────── */
  pc_rot: 'Her story',
  pc_tit: 'National champion at ten, and again at seventeen',
  pc_sub: 'Amateur golfer from Vale de Janelas, in Óbidos. Portuguese women\'s amateur national team. Reigning national U18 champion.',
  bio_l: 'She won her first national championship at ten. Seven years on she has four, plays the European calendar, and has not yet outgrown the U18 category.',
  bio_1: 'Francisca Salgado plays for <strong>Vale de Janelas</strong>, in Óbidos, and represents the <strong>Portuguese women\'s amateur national team</strong>. She started early: in 2018 she was national U10 runner-up, at the Jamor, and was playing the Open World Kids Golf in Amendoeira. The following year, at Miramar, she won her first national title. In 2021 she added the U12 and, in 2022, was U14 runner-up.',
  bio_2: 'Her international debut for Portugal came in 2023, at the Belgian International U14 Championship: sixth, and the best Portuguese player there, lowering her score day after day — 78, 75, 73. <strong>2024 was the year she won everything</strong>: the first two Aquapor Circuit tournaments, the women\'s season-long “Gold” ranking, and the GJG Algarve Juniors International, in Castro Marim, where she was the only one of the twelve women to sign a sub-par round on Seve Ballesteros\'s design. In between, national U16 runner-up.',
  bio_3: 'In 2025 she made her senior European team debut, at sixteen, and was invited to play, as an amateur, the Super Bock Ladies Open at Vidago Palace — the first women\'s European professional event in Portugal in eight years. She won the Drive Tour at the Tejo, was runner-up in the FPG Cup and third in Asturias.',
  bio_4: '2026 brought two national titles in two months: the <strong>Amateur Pairs</strong>, at Montado, with Rodrigo Constantino, and the <strong>U18</strong>, at Aroeira, led from start to finish. The season took her to Penina, Guadalmina, Saint-Cloud, Slieve Russell with the national team, Prestbury — where she stood fifth at one point in the English Girls\' Open and finished 28th — and Málaga. She is supported by the Fundação do Desporto.',
  fq_rot: 'Questions',
  fq_tit: 'The essentials, in six answers',
  fq_txt: 'What you need to know without reading the whole page. Every answer is sourced elsewhere on this site.',
  fq_1p: 'Who is Francisca Salgado?',
  fq_1r: 'She is a Portuguese amateur golfer from Vale de Janelas, in Óbidos. At seventeen she has four national titles and plays for the Portuguese women\'s amateur national team, with which she plays the European calendar.',
  fq_2p: 'How many national titles does she have?',
  fq_2r: 'Four. U10 in 2019, U12 in 2021, and in 2026 both the Amateur Pairs — with Rodrigo Constantino — and the U18, which she won at Aroeira leading from start to finish.',
  fq_3p: 'What club does she play for?',
  fq_3r: 'Vale de Janelas, in Óbidos, on Portugal\'s west coast. She started at Paço do Lumiar, where she won her first national title in 2019.',
  fq_4p: 'Where does she stand in the rankings?',
  fq_4r: 'She is on the World Amateur Golf Ranking, the world ranking of amateur golf, and on the European Golf Rankings. Both positions are read from the official profiles the moment the page opens, and are on the <a class="lig" href="resultados.html">results page</a>.',
  fq_5p: 'What are her best international results?',
  fq_5r: 'Sixth, and the best Portuguese player, at the Belgian International U14 Championship in 2023; third at the Memorial Celia Barquín, in Asturias, in 2025; and 28th at the 2026 English Girls\' Open, one of the strongest girls\' U18 events in Europe, where she stood fifth at one point.',
  fq_6p: 'How do you reach her about sponsorship or press?',
  fq_6r: 'Through the form on the <a class="lig" href="parcerias.html#contacto">partnerships page</a> or by direct message on Instagram, at <a class="lig" href="https://www.instagram.com/francisca_salgado_/" target="_blank" rel="noopener">@francisca_salgado_</a>. Requests for high-resolution photographs go through the <a class="lig" href="imprensa.html">press page</a>.',

  pc_lt: 'Year by year',
  pc_fim: 'Every result, with rounds and cards, is on the <a class="lig" href="resultados.html">results page</a>.',

  /* ── imprensa ───────────────────────────────────────────── */
  im_rot: 'Press',
  im_tit: 'For people who write about golf',
  im_txt: 'Short biography, checkable facts, sourced quotes and the official profiles. For high-resolution photographs, just ask.',
  im_bt: 'Request photographs',
  im_bio_rot: 'Short biography',
  im_bio: 'Francisca Salgado is an amateur golfer from Vale de Janelas, in Óbidos, and a member of the Portuguese women\'s amateur national team. She has four national titles: U10 in 2019, U12 in 2021 and, in 2026, the Amateur Pairs — alongside Rodrigo Constantino — and the U18. She won the GJG Algarve Juniors International in 2024, was runner-up in the FPG Cup in 2025 and third at the Memorial Celia Barquín, in Asturias. In 2026 she finished the English Girls\' Open in 28th. She is supported by the Fundação do Desporto.',
  im_factos: 'Facts',
  im_cit_rot: 'In her own words',
  im_cit_tit: 'Quotes',
  im_cit_txt: 'Every quote on this page links to the piece it came from. They may be reproduced with the source named.',
  im_fot_rot: 'Photographs',
  im_fot_tit: 'High resolution',
  im_fot_txt: 'Published with the permission of the Portuguese Golf Federation and the clubs. They may be reproduced in pieces about the player, always with the credit visible, exactly as it appears beneath each one. For the files at original resolution, just ask.',
  im_cl_rot: 'Clipping',
  im_cl_tit: 'What has run',
  im_lig_rot: 'Links',
  im_lig_tit: 'Official profiles',
  im_lig_txt: 'To check results and placings at the source, without going through here.',

  /* ── parcerias ──────────────────────────────────────────── */
  ap2_rot: 'Partnerships',
  ap2_tit: 'Taking Portugal further',
  ap2_txt: 'At seventeen she has four national titles and plays the European calendar. The events that give world-ranking points are played in Spain, France, England and Ireland, and each one is a journey, an entry fee and a week away. That is where a partner comes in — on the bag, on the playing apparel and into the tournament photographs.',
  ap2_bt1: 'Talk about a partnership',
  ap2_bt2: 'See the ways in',
  ap2_cit: 'She led from start to finish on her way to the girls U18 title.',
  ap2_cit_f: 'Portuguese Golf Federation · National Youth Championship, 2026',
  ap2_e_rot: 'Ways in',
  ap2_e_tit: 'Three ways',
  ap2_e_txt: 'There is no fixed price list on this page, deliberately: every partnership is drawn up with whoever comes in. Say what you have in mind and you get a concrete proposal — with events, dates, and what gets seen.',
  ap2_e_bt: 'Talk about it',
  pr_rot: 'On Instagram',
  pr_tit: 'What it looks like',
  pr_txt: 'The work with the brands, exactly as it goes out on her Instagram. It is the most concrete argument for anyone thinking of coming in: not a promise of visibility, but visibility already delivered.',

  ap2_q_rot: 'Already on board',
  ap2_q_tit: 'Good company',
  ap2_q_txt: 'Those already walking the road with her, grouped by the nature of the relationship.',

  ct_rot: 'Contact',
  ct_tit: 'Talk to the team',
  ct_txt: 'Partnerships, press, invitations and photograph requests. The more concrete the request, the more concrete the answer.',
  ct_lig: 'Official links',
  ct_nota: 'This form is not yet connected to a delivery service. In the meantime, the quickest route is a direct message on Instagram.',

  c1: 'Name', c2: 'Email', c3: 'Subject',
  c3a: 'Partnership or sponsorship', c3b: 'Press and photographs',
  c3c: 'Invitation to an event', c3d: 'Other',
  c4: 'Organisation', c5: 'What you have in mind', c6: 'Send',
  c9: 'By sending, your data is used only to answer this request. See the <a href="privacidade.html">privacy policy</a>.',

  /* ── páginas legais ─────────────────────────────────────── */
  pv_rot: 'Privacy',
  pv_tit: 'How we handle your data',
  pv_sub: 'What is collected, what it is for, and what you can demand. In plain language, no small print.',
  pv_1: 'Who handles the data',
  pv_1t: 'This site belongs to the golfer Francisca Salgado. For anything about personal data, or to exercise the rights below, use the <a class="lig" href="parcerias.html#contacto">contact form</a> or a direct message on Instagram.',
  pv_2: 'What is collected',
  pv_2t: 'Two sets only, and neither is collected unless the visitor causes it:',
  pv_2a: '<b>What you type into the contact form:</b> name, email and, if you fill them in, organisation and message.',
  pv_2b: '<b>Usage measurement,</b> if you allow it: pages viewed, time spent, device type, where the visit came from and a truncated IP address.',
  pv_3: 'What it is for',
  pv_3t: 'Form data is used to answer your request and, if it goes ahead, to handle whatever was agreed. It is not used for newsletters and is not sold to anyone. Measurement is used to see which pages get read and to improve the site.',
  pv_4: 'On what grounds',
  pv_4t: 'Handling form data rests on pre-contractual steps and on the legitimate interest of answering whoever writes. Measurement rests on consent alone, which you can give or withdraw whenever you like, from the “Cookies” button at the foot of any page.',
  pv_5: 'Cookies',
  pv_5t: 'Until somebody consents, this site writes no cookie that is not essential to make it work. Your language and theme preference stay in your own browser and never leave it.',
  pv_6: 'Third-party content',
  pv_6t: 'Some pages show content hosted elsewhere — Instagram posts, for instance. Those services may set their own cookies, under their own policies.',
  pv_7: 'For how long',
  pv_7t: 'Contact requests are kept for as long as the relationship lasts and, after that, for the applicable legal period. Measurement data, where it exists, is deleted after fourteen months.',
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
  tm_5t: 'The contact form is for asking or proposing. A request sent is not a commitment by either party: there is an agreement only after a written agreement.',
  tm_6: 'Applicable law',
  tm_6t: 'Portuguese law applies. In a consumer dispute, you may turn to an alternative dispute resolution body, under Law 144/2015.',
  tm_data: 'Last updated: August 2026.',
};
