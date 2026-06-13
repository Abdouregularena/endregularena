/* ============================================================
   QUIZ — Nouveaux textes BCEAO/UMOA 2024-2026
   Sources : Note 013-04-2026 | Instruction 233/07/2024 |
   Décision 003/28-03-2024 CM/UMOA | Avis 002-03-2026 CRAEF |
   Instruction 08/07/2025/RFE (sous-délégataires) |
   Instruction 11/07/2025/RFE (appel public épargne) |
   Avis 003-12-2023 (mandats IOB) |
   Avis 005-04-2025 (levée mesures Niger)
   Format identique à QUIZ_RFE_06_2024 : startQ() compatible.
   ZÉRO doublon avec QUIZ_RFE_06_2024 (38 q existantes).
   Abdou valide le fond.
   ============================================================ */

const QUIZ_BCEAO_2024_2026 = [

/* ══════════════════════════════════════════════════════════════
   NOTE N°013-04-2026 — Paiements extérieurs des non-résidents
   de nationalité étrangère ayant acquis le statut de résident UEMOA
   ══════════════════════════════════════════════════════════════ */
{
  type:"qcm",
  q:"Un ressortissant étranger salarié en UEMOA est considéré résident dès lors que son contrat de travail est :",
  options:[
    "à durée indéterminée ou d'une durée ≥ 1 an",
    "à durée indéterminée uniquement",
    "d'une durée > 6 mois",
    "validé par le Ministre des Finances"
  ],
  correct:0,
  exp:"La Note 013-04-2026 précise que le salarié étranger est résident dès que son contrat est à durée indéterminée ou d'une durée supérieure ou égale à un an.",
  ref:"Note 013-04-2026, §1"
},
{
  type:"vf",
  q:"Un ressortissant étranger devenu résident UEMOA peut maintenir ses comptes bancaires à l'étranger sans autorisation préalable du Ministre chargé des Finances.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. La Note 013-04-2026 confirme que les comptes bancaires à l'étranger ouverts avant l'acquisition du statut de résident peuvent être maintenus, sans autorisation préalable du Ministre chargé des Finances.",
  ref:"Note 013-04-2026, §2"
},
{
  type:"qcm",
  q:"Les paiements entre résidents étrangers et autres résidents UEMOA (ex. règlement de salaires) doivent être libellés en :",
  options:[
    "devises au choix du donneur d'ordre",
    "francs CFA exclusivement, versés dans un compte auprès d'un intermédiaire agréé de l'Union",
    "euros, avec attestation de la BCEAO",
    "la devise du pays d'origine du salarié"
  ],
  correct:1,
  exp:"La Note 013-04-2026 exige que tout paiement entre résidents soit exclusivement libellé en FCFA et versé dans un compte tenu auprès d'un intermédiaire agréé de l'Union.",
  ref:"Note 013-04-2026, §2"
},
{
  type:"qcm",
  q:"Un résident étranger souhaitant approvisionner son compte bancaire étranger à partir d'une épargne constituée sur revenus salariaux doit obtenir l'autorisation préalable de :",
  options:[
    "la BCEAO",
    "la Commission Bancaire UMOA",
    "la Structure chargée des Finances Extérieures du pays d'implantation",
    "aucune autorisation n'est requise"
  ],
  correct:2,
  exp:"La Note 013-04-2026 soumet les transferts d'épargne vers comptes à l'étranger à l'autorisation préalable de la Structure chargée des Finances Extérieures du pays d'implantation.",
  ref:"Note 013-04-2026, §3 — Approvisionnement comptes à l'étranger"
},
{
  type:"qcm",
  q:"Le délai maximum accordé par la Structure chargée des Finances Extérieures pour délivrer l'autorisation de transfert d'épargne d'un résident étranger est de :",
  options:["2 jours ouvrés","5 jours ouvrés","10 jours ouvrés","30 jours ouvrés"],
  correct:1,
  exp:"La Note 013-04-2026 fixe le délai de délivrance de l'autorisation à 5 jours ouvrés maximum.",
  ref:"Note 013-04-2026, §3"
},
{
  type:"qcm",
  q:"La période minimale de constitution de l'épargne pour un transfert vers l'étranger fondé sur des revenus salariaux est de :",
  options:["1 mois","3 mois","6 mois","12 mois"],
  correct:2,
  exp:"La Note 013-04-2026 exige une période de constitution de l'épargne d'au moins six mois. Un délai identique est requis entre deux demandes successives fondées sur ce même motif.",
  ref:"Note 013-04-2026, §3"
},
{
  type:"qcm",
  q:"Un résident étranger quittant définitivement l'UEMOA peut transférer l'intégralité du solde de ses comptes ordinaires en FCFA. Ce transfert est exécuté :",
  options:[
    "librement, sans condition de montant",
    "sans limitation de montant, sous réserve de justifier l'origine des fonds et que ceux-ci proviennent de revenus perçus dans l'Union ou de la liquidation d'investissements réalisés dans l'Union",
    "dans la limite de 50 M FCFA sans justification",
    "après accord préalable de la BCEAO uniquement"
  ],
  correct:1,
  exp:"La Note 013-04-2026 autorise ce transfert sans limitation de montant, sous réserve que les avoirs soient dûment justifiés et proviennent de revenus dont la perception dans l'Union est justifiée, ou du produit de la liquidation d'investissements réalisés dans l'Union.",
  ref:"Note 013-04-2026, §4"
},
{
  type:"qcm",
  q:"Le délai réglementaire de traitement des demandes de transferts de résidents étrangers par l'intermédiaire agréé ne doit pas excéder :",
  options:["2 jours ouvrés","5 jours ouvrés","10 jours ouvrés","30 jours calendaires"],
  correct:1,
  exp:"La lettre SESN 01876 du 23 avril 2026 rappelle que le délai réglementaire de traitement des demandes de transferts ne doit pas excéder 5 jours ouvrés.",
  ref:"Lettre BCEAO SESN 01876, 23 avr. 2026"
},
{
  type:"qcm",
  q:"Parmi les documents justifiant le lien d'un résident étranger avec le pays de destination de ses transferts, lequel N'est PAS mentionné par la Note 013-04-2026 ?",
  options:[
    "Une obligation fiscale",
    "Une attache familiale",
    "Un titre de propriété immobilière dans l'Union",
    "Une obligation financière ou contractuelle dûment établie"
  ],
  correct:2,
  exp:"La Note 013-04-2026 cite trois types de lien : obligation fiscale, attache familiale, obligation financière ou contractuelle. Un titre de propriété dans l'Union n'est pas mentionné comme critère d'éligibilité au lien avec le pays de destination.",
  ref:"Note 013-04-2026, §5 — Critères d'éligibilité"
},
{
  type:"cas",
  q:"Cas — Un expatrié français travaillant à Dakar depuis 18 mois (CDI) souhaite virer 2 M FCFA sur son compte à la BNP Paris pour régler un emprunt immobilier. Votre position ?",
  options:[
    "Refus : un résident ne peut pas alimenter un compte à l'étranger",
    "Exécution libre : dépenses courantes autorisées à titre général, sur présentation des justificatifs (convention d'emprunt, échéancier)",
    "Autorisation BCEAO obligatoire au préalable",
    "Possible uniquement si le montant < 1 M FCFA"
  ],
  correct:1,
  exp:"Il est résident (CDI > 1 an). Le remboursement d'un emprunt bancaire contracté à l'étranger est une opération courante autorisée à titre général (Note 013-04-2026, §3). Le virement peut être réalisé librement par l'intermédiaire agréé sur présentation de la convention d'emprunt et de l'échéancier.",
  ref:"Note 013-04-2026, §3 ; Art. 31 Règlement 06/2024"
},

/* ══════════════════════════════════════════════════════════════
   INSTRUCTION N°233/07/2024 — Seuil paiement en espèces / instruments
   négociables au porteur (LBC/FT)
   ══════════════════════════════════════════════════════════════ */
{
  type:"qcm",
  q:"L'Instruction 233/07/2024 fixe à quel montant le seuil au-delà duquel le paiement d'une dette ne peut être effectué en espèces ou par instruments négociables au porteur ?",
  options:["1 000 000 FCFA","2 000 000 FCFA","5 000 000 FCFA","10 000 000 FCFA"],
  correct:2,
  exp:"L'article premier de l'Instruction 233/07/2024 fixe le seuil à 5 000 000 (cinq millions) de FCFA, qu'il s'agisse d'une opération unique ou de plusieurs opérations apparemment liées.",
  ref:"Instruction 233/07/2024, Art. 1er"
},
{
  type:"vf",
  q:"Le seuil de 5 M FCFA fixé par l'Instruction 233/07/2024 s'applique aussi aux paiements entre particuliers n'agissant pas pour des besoins professionnels.",
  options:["Vrai","Faux"],
  correct:1,
  exp:"FAUX. L'article 2 exempte expressément les paiements effectués entre personnes physiques n'agissant pas pour des besoins professionnels.",
  ref:"Instruction 233/07/2024, Art. 2"
},
{
  type:"qcm",
  q:"L'Instruction 233/07/2024 abroge et remplace :",
  options:[
    "l'Instruction 009-09-2017 du 25 septembre 2017",
    "la Décision 003/2024 CM/UMOA",
    "l'Instruction 015-12-2010/RB",
    "le Règlement 09/2010/CM/UEMOA"
  ],
  correct:0,
  exp:"L'article 4 abroge l'Instruction n°009-09-2017 du 25 septembre 2017 fixant le seuil pour le paiement d'une créance en espèces ou par instruments négociables au porteur.",
  ref:"Instruction 233/07/2024, Art. 4"
},
{
  type:"qcm",
  q:"Le non-respect du seuil de paiement en espèces fixé par l'Instruction 233/07/2024 est passible des sanctions prévues par :",
  options:[
    "le Règlement 06/2024/CM/UEMOA",
    "la Loi uniforme relative à la LBC/FT/P dans les États membres de l'UMOA",
    "la Loi bancaire nationale",
    "le Code pénal de chaque État membre"
  ],
  correct:1,
  exp:"L'article 3 renvoie aux sanctions prévues par la Loi uniforme relative à la lutte contre le blanchiment de capitaux, le financement du terrorisme et de la prolifération des armes de destruction massive dans les États membres de l'UMOA.",
  ref:"Instruction 233/07/2024, Art. 3"
},
{
  type:"cas",
  q:"Cas — Un client souhaite régler en espèces une facture de prestation de services pour 6 M FCFA. Votre réponse réglementaire ?",
  options:[
    "Accepter : aucun plafond espèces pour les entreprises",
    "Refuser : le règlement d'une dette professionnelle > 5 M FCFA en espèces est interdit par l'Instruction 233/07/2024",
    "Accepter si déclaration CENTIF jointe",
    "Accepter jusqu'à 10 M FCFA avec dérogation du Ministre"
  ],
  correct:1,
  exp:"Le montant dépasse le seuil de 5 M FCFA fixé par l'Instruction 233/07/2024. Il s'agit d'une opération professionnelle, l'exemption ne s'applique pas. Le paiement doit être effectué par virement, chèque ou autre instrument non négociable au porteur.",
  ref:"Instruction 233/07/2024, Art. 1er et 2"
},

/* ══════════════════════════════════════════════════════════════
   DÉCISION N°003/28-03-2024/CM/UMOA — Seuils complémentaires LBC/FT
   ══════════════════════════════════════════════════════════════ */
{
  type:"qcm",
  q:"Selon la Décision 003/28-03-2024/CM/UMOA, les agréés de change manuel doivent procéder à l'identification de leurs clients lorsque le montant de l'opération (ou opérations liées) excède :",
  options:["1 000 000 FCFA","2 000 000 FCFA","5 000 000 FCFA","10 000 000 FCFA"],
  correct:2,
  exp:"L'article 2 fixe le seuil de vigilance des agréés de change manuel à 5 000 000 de FCFA, qu'il s'agisse de personnes physiques, morales ou de constructions juridiques.",
  ref:"Décision 003/28-03-2024/CM/UMOA, Art. 2"
},
{
  type:"qcm",
  q:"Pour les négociants en métaux précieux et pierres précieuses, les obligations de vigilance s'appliquent à partir d'une opération en espèces d'un montant supérieur ou égal à :",
  options:["5 000 000 FCFA","9 000 000 FCFA","10 000 000 FCFA","20 000 000 FCFA"],
  correct:1,
  exp:"L'article 3 de la Décision 003/2024 fixe le seuil des négociants en métaux et pierres précieuses à 9 000 000 de FCFA.",
  ref:"Décision 003/28-03-2024/CM/UMOA, Art. 3"
},
{
  type:"qcm",
  q:"Dans les transactions immobilières, la vente d'un bien dont le montant est égal ou supérieur à 20 M FCFA ne peut être réglée qu'au moyen de :",
  options:[
    "espèces ou chèque",
    "virement ou chèque uniquement",
    "espèces en présence d'un notaire",
    "lettre de crédit documentaire"
  ],
  correct:1,
  exp:"L'article 4 de la Décision 003/2024 interdit le paiement en espèces pour les transactions immobilières ≥ 20 M FCFA : seuls le virement ou le chèque sont admis.",
  ref:"Décision 003/28-03-2024/CM/UMOA, Art. 4"
},
{
  type:"qcm",
  q:"La Décision 003/28-03-2024/CM/UMOA complète les seuils fixés par :",
  options:[
    "la Décision n°021 du 21/12/2023/CM/UMOA",
    "l'Instruction 233/07/2024",
    "la Note 013-04-2026",
    "le Règlement 06/2024/CM/UEMOA"
  ],
  correct:0,
  exp:"Le préambule de la Décision 003/2024 indique qu'elle complète les seuils fixés par la Décision n°021 du 21/12/2023/CM/UMOA relative à la même Loi uniforme LBC/FT.",
  ref:"Décision 003/28-03-2024/CM/UMOA, Préambule"
},

/* ══════════════════════════════════════════════════════════════
   AVIS N°002-03-2026 — CRAEF (Reporting automatisé états financiers)
   ══════════════════════════════════════════════════════════════ */
{
  type:"qcm",
  q:"Le CRAEF est la plateforme mise en place par la BCEAO pour :",
  options:[
    "la surveillance des opérations de change en temps réel",
    "la collecte automatisée des états financiers des établissements de crédit et compagnies financières UMOA",
    "le contrôle des transferts internationaux > 5 M FCFA",
    "la déclaration des positions extérieures des banques"
  ],
  correct:1,
  exp:"L'Avis 002-03-2026 crée le Cadre de Reporting Automatisé des États Financiers (CRAEF), plateforme informatique dédiée à la collecte des états financiers des établissements de crédit, holdings bancaires et compagnies financières UMOA.",
  ref:"Avis BCEAO 002-03-2026"
},
{
  type:"qcm",
  q:"À partir de quel arrêté les établissements de crédit UMOA doivent-ils obligatoirement transmettre leurs états financiers via le CRAEF ?",
  options:[
    "Arrêtés annuels 2025",
    "Arrêtés de fin du premier semestre 2026",
    "Arrêtés annuels 2026",
    "Arrêtés trimestriels dès mars 2026"
  ],
  correct:1,
  exp:"L'Avis 002-03-2026 impose la transmission via CRAEF à compter des arrêtés de fin du premier semestre 2026, sans préjudice de la transmission sous format physique.",
  ref:"Avis BCEAO 002-03-2026"
},
{
  type:"vf",
  q:"La transmission des états financiers via CRAEF remplace totalement la transmission sous format physique pour les établissements UMOA.",
  options:["Vrai","Faux"],
  correct:1,
  exp:"FAUX. L'Avis 002-03-2026 précise que la déclaration via CRAEF se fait sans préjudice de la transmission des états sous format physique : les deux canaux coexistent.",
  ref:"Avis BCEAO 002-03-2026"
},
{
  type:"qcm",
  q:"L'obligation de reporting via CRAEF s'impose à :",
  options:[
    "Les établissements de crédit uniquement",
    "Les établissements de crédit (y compris les holdings bancaires) et les compagnies financières de l'UMOA",
    "Les établissements de crédit et les SFD",
    "Toutes les sociétés commerciales de l'UMOA"
  ],
  correct:1,
  exp:"L'Avis 002-03-2026 vise explicitement les établissements de crédit (y compris les holdings bancaires) et les compagnies financières de l'UMOA, en référence à l'Instruction n°035-11-2016.",
  ref:"Avis BCEAO 002-03-2026"
},

/* ══════════════════════════════════════════════════════════════
   INSTRUCTION N°08/07/2025/RFE — Reprise de devises par sous-délégataires
   ══════════════════════════════════════════════════════════════ */
{
  type:"qcm",
  q:"Selon l'Instruction 08/07/2025/RFE, les sous-délégations de reprise de devises peuvent être accordées notamment à :",
  options:[
    "Des particuliers résidents",
    "Des hôtels, commerces en aéroports/ports/gares, agences de voyage recevant régulièrement des devises de voyageurs étrangers",
    "Des SFD et mutuelles d'épargne",
    "Des sociétés d'assurance agréées"
  ],
  correct:1,
  exp:"L'article 2 de l'Instruction 08/07/2025/RFE réserve les sous-délégations aux personnes morales telles que hôtels, commerces installés dans les aéroports/ports/gares autorisés à vendre des produits détaxés, et agences de voyage recevant des paiements en devises.",
  ref:"Instruction 08/07/2025/RFE, Art. 2"
},
{
  type:"vf",
  q:"Un sous-délégataire peut céder des devises à la clientèle dans le cadre de la sous-délégation.",
  options:["Vrai","Faux"],
  correct:1,
  exp:"FAUX. L'article 3 interdit formellement aux sous-délégataires de céder des devises à la clientèle sous quelque forme que ce soit. Ils ne sont autorisés qu'à reprendre (acheter) des devises.",
  ref:"Instruction 08/07/2025/RFE, Art. 3"
},
{
  type:"qcm",
  q:"L'intermédiaire agréé qui accorde une sous-délégation doit notifier cette sous-délégation à la Structure chargée des Finances Extérieures et à la BCEAO dans un délai maximum de :",
  options:["5 jours ouvrés","10 jours ouvrés","30 jours calendaires","60 jours calendaires"],
  correct:1,
  exp:"L'article 4 de l'Instruction 08/07/2025/RFE impose une notification dans un délai maximum de 10 jours ouvrés suivant l'établissement de la relation de sous-délégation.",
  ref:"Instruction 08/07/2025/RFE, Art. 4"
},
{
  type:"qcm",
  q:"Les achats d'euros contre FCFA effectués par les sous-délégataires se font au taux de change officiel. La commission applicable ne peut excéder :",
  options:["1% du montant","2% du montant","3% du montant","Aucun plafond réglementaire"],
  correct:1,
  exp:"L'article 5 de l'Instruction 08/07/2025/RFE fixe le plafond de la commission à deux pour cent (2%) du montant de la transaction pour les achats d'euros contre FCFA.",
  ref:"Instruction 08/07/2025/RFE, Art. 5"
},
{
  type:"qcm",
  q:"L'intermédiaire agréé doit reprendre au sous-délégataire les devises achetées :",
  options:[
    "quotidiennement",
    "au moins une fois par semaine",
    "au moins une fois par mois",
    "à chaque demande du sous-délégataire"
  ],
  correct:1,
  exp:"L'article 7 impose à l'intermédiaire agréé de reprendre les devises au moins une fois par semaine auprès de son sous-délégataire.",
  ref:"Instruction 08/07/2025/RFE, Art. 7"
},
{
  type:"qcm",
  q:"L'Instruction 08/07/2025/RFE entre en vigueur le :",
  options:["7 juillet 2025","1er août 2025","1er janvier 2026","1er juillet 2026"],
  correct:1,
  exp:"L'article 9 fixe l'entrée en vigueur au 1er août 2025. Elle abroge l'Instruction N°07-07-2011/RFE du 13 juillet 2011.",
  ref:"Instruction 08/07/2025/RFE, Art. 9"
},

/* ══════════════════════════════════════════════════════════════
   INSTRUCTION N°11/07/2025/RFE — Autorisation préalable BCEAO
   aux entités non-résidentes souhaitant faire appel public à l'épargne UEMOA
   ══════════════════════════════════════════════════════════════ */
{
  type:"qcm",
  q:"Selon l'Instruction 11/07/2025/RFE, la demande d'autorisation préalable de la BCEAO pour faire appel public à l'épargne dans l'UEMOA doit être déposée par :",
  options:[
    "L'entité non-résidente elle-même",
    "La Société de Gestion et d'Intermédiation (SGI) mandatée par l'entité non-résidente",
    "Le Ministre des Finances du pays d'accueil",
    "L'Autorité des Marchés Financiers de l'UMOA directement"
  ],
  correct:1,
  exp:"L'article 2 précise que la demande est déposée auprès de la BCEAO par la SGI mandatée par l'entité non-résidente pour conduire l'opération de recours au marché.",
  ref:"Instruction 11/07/2025/RFE, Art. 2"
},
{
  type:"qcm",
  q:"Le délai maximum d'instruction de la demande d'autorisation préalable BCEAO pour appel public à l'épargne est de :",
  options:["15 jours ouvrés","30 jours ouvrés","45 jours ouvrés","60 jours ouvrés"],
  correct:2,
  exp:"L'article 4 fixe le délai d'instruction à 45 jours ouvrés maximum. Ce délai est suspendu en cas de demande d'informations complémentaires.",
  ref:"Instruction 11/07/2025/RFE, Art. 4"
},
{
  type:"qcm",
  q:"Après la clôture des souscriptions, la SGI doit communiquer à la BCEAO le compte rendu de l'opération d'émission dans un délai de :",
  options:["10 jours ouvrés","20 jours ouvrés","30 jours ouvrés","60 jours calendaires"],
  correct:2,
  exp:"L'article 6 impose à la SGI de communiquer le compte rendu de l'opération dans un délai de 30 jours ouvrés suivant la clôture des opérations de souscription.",
  ref:"Instruction 11/07/2025/RFE, Art. 6"
},
{
  type:"vf",
  q:"L'Instruction 11/07/2025/RFE exige que l'entité non-résidente mobilise au minimum 75% des fonds à l'étranger.",
  options:["Vrai","Faux"],
  correct:0,
  exp:"VRAI. L'article 3 impose que le dossier précise les modalités de constitution de la quote-part d'au moins soixante-quinze pour cent (75%) à mobiliser à l'étranger, le cas échéant.",
  ref:"Instruction 11/07/2025/RFE, Art. 3"
},
{
  type:"qcm",
  q:"L'Instruction 11/07/2025/RFE abroge :",
  options:[
    "l'Instruction N°09-07-2011/RFE du 13 juillet 2011",
    "l'Instruction N°07-07-2011/RFE du 13 juillet 2011",
    "le Règlement 06/2024/CM/UEMOA",
    "l'Avis 003-12-2023"
  ],
  correct:0,
  exp:"L'article 7 abroge l'Instruction N°09-07-2011/RFE du 13 juillet 2011 relative à la délivrance de l'autorisation aux entités non-résidentes désireuses de faire appel public à l'épargne dans l'UEMOA.",
  ref:"Instruction 11/07/2025/RFE, Art. 7"
},

/* ══════════════════════════════════════════════════════════════
   AVIS N°003-12-2023 — Mandats des intermédiaires en opérations de banque (IOB)
   ══════════════════════════════════════════════════════════════ */
{
  type:"qcm",
  q:"Selon l'Avis 003-12-2023, un intermédiaire en opérations de banque (IOB) souhaitant conclure un nouveau mandat avec un établissement de crédit doit en informer le Ministre chargé des Finances (avec copie à la BCEAO) au moins :",
  options:[
    "7 jours ouvrés avant la conclusion du mandat",
    "15 jours ouvrés avant la conclusion du mandat",
    "30 jours ouvrés avant la conclusion du mandat",
    "60 jours calendaires avant la conclusion du mandat"
  ],
  correct:2,
  exp:"L'Avis 003-12-2023, en application de l'article 4 alinéa 2 de l'Instruction n°015-12-2010/RB, impose une information du Ministre chargé des Finances (copie BCEAO) au moins 30 jours ouvrés avant la date prévue pour la conclusion d'un nouveau mandat.",
  ref:"Avis BCEAO 003-12-2023"
},
{
  type:"qcm",
  q:"La déclaration d'un nouveau mandat IOB est déposée auprès de :",
  options:[
    "La Direction Nationale de la BCEAO de l'État d'implantation de l'établissement de crédit mandant",
    "L'Agence Principale de la BCEAO de l'État d'implantation de l'IOB",
    "Le Ministre des Finances de l'Union",
    "La Commission Bancaire UMOA"
  ],
  correct:1,
  exp:"L'Avis 003-12-2023 précise que la déclaration est déposée auprès de l'Agence Principale de la BCEAO de l'État d'implantation de l'intermédiaire en opérations de banque.",
  ref:"Avis BCEAO 003-12-2023"
},
{
  type:"vf",
  q:"Un IOB doit obtenir une nouvelle autorisation de la BCEAO pour conclure un mandat avec un deuxième établissement de crédit.",
  options:["Vrai","Faux"],
  correct:1,
  exp:"FAUX. L'Instruction n°015-12-2010/RB permet à l'IOB de conclure de nouveaux mandats sans requérir une nouvelle autorisation, à charge de faire la déclaration au Ministre des Finances avec copie à la BCEAO, au moins 30 jours ouvrés avant la conclusion.",
  ref:"Avis BCEAO 003-12-2023 ; Instruction 015-12-2010/RB, Art. 4, al. 2"
},

/* ══════════════════════════════════════════════════════════════
   AVIS N°005-04-2025 — Levée mesures temporaires titres publics Niger
   ══════════════════════════════════════════════════════════════ */
{
  type:"qcm",
  q:"L'Avis 005-04-2025 met fin aux mesures temporaires de traitement comptable et prudentiel des expositions sur les titres publics de l'État du Niger à compter du :",
  options:["1er janvier 2025","15 avril 2025","1er juillet 2025","31 décembre 2025"],
  correct:1,
  exp:"L'Avis 005-04-2025 signé le 3 avril 2025 indique qu'à compter du 15 avril 2025, il est mis fin aux mesures temporaires prévues par l'Avis N°002-01-2024 du 22 janvier 2024.",
  ref:"Avis BCEAO 005-04-2025"
},
{
  type:"qcm",
  q:"Depuis la levée des mesures temporaires (Avis 005-04-2025), les expositions des établissements de crédit sur les titres publics du Niger sont traitées conformément à :",
  options:[
    "l'Instruction N°026-11-2016 du 15 novembre 2016",
    "la Décision 003/28-03-2024/CM/UMOA",
    "l'Avis N°002-01-2024 du 22 janvier 2024",
    "le Règlement 06/2024/CM/UEMOA"
  ],
  correct:0,
  exp:"L'Avis 005-04-2025 précise qu'à compter du 15 avril 2025, toute exposition sur les titres publics de l'État du Niger est traitée conformément aux dispositions de l'Instruction N°026-11-2016 du 15 novembre 2016 (droit commun prudentiel).",
  ref:"Avis BCEAO 005-04-2025"
}

];

/* Lancement : startQ(QUIZ_BCEAO_2024_2026, "Nouveaux textes BCEAO 2024-2026"); */
