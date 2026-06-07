// backend/prisma/seed.ts
// Données initiales pour Regularena Pro UEMOA

import { PrismaClient, Difficulty } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const seedData = {
  // Quiz sur le Dispositif Prudentiel
  quizzes: [
    {
      id: 'quiz_prudential_1',
      title: 'Dispositif Prudentiel BCEAO - Niveau 1 (Débutant)',
      category: 'prudentiel',
      description: 'Introduction aux concepts fondamentaux du dispositif prudentiel de la BCEAO',
      difficulty: Difficulty.BEGINNER,
      totalQuestions: 15,
      timeLimitMinutes: 12,
      bceaoReference: 'DP-2023-001-BCEAO',
    },
    {
      id: 'quiz_prudential_2',
      title: 'Dispositif Prudentiel BCEAO - Niveau 2 (Intermédiaire)',
      category: 'prudentiel',
      description: 'Exigences de capital, ratios prudentiels et surveillance',
      difficulty: Difficulty.INTERMEDIATE,
      totalQuestions: 20,
      timeLimitMinutes: 15,
      bceaoReference: 'DP-2023-002-BCEAO',
    },
    {
      id: 'quiz_prudential_3',
      title: 'Dispositif Prudentiel BCEAO - Niveau 3 (Avancé)',
      category: 'prudentiel',
      description: 'Gestion des risques, stress testing et conformité réglementaire',
      difficulty: Difficulty.ADVANCED,
      totalQuestions: 25,
      timeLimitMinutes: 20,
      bceaoReference: 'DP-2023-003-BCEAO',
    },
    {
      id: 'quiz_penal_1',
      title: 'Code Pénal UEMOA - Infractions Bancaires',
      category: 'penal',
      description: 'Délits et crimes dans le secteur financier selon le code pénal UEMOA',
      difficulty: Difficulty.INTERMEDIATE,
      totalQuestions: 18,
      timeLimitMinutes: 14,
      bceaoReference: 'PENAL-2023-001-UEMOA',
    },
    {
      id: 'quiz_echanges_1',
      title: 'Réglementation des Échanges Financiers',
      category: 'echanges',
      description: 'Contrôle des changes, devises et transactions internationales',
      difficulty: Difficulty.BEGINNER,
      totalQuestions: 16,
      timeLimitMinutes: 13,
      bceaoReference: 'ECH-2023-001-BCEAO',
    },
    {
      id: 'quiz_residents_1',
      title: 'Résidents et Ressortissants UEMOA',
      category: 'residents',
      description: 'Statuts, droits et obligations des résidents et ressortissants',
      difficulty: Difficulty.INTERMEDIATE,
      totalQuestions: 17,
      timeLimitMinutes: 14,
      bceaoReference: 'RES-2023-001-UEMOA',
    },
  ],

  // Questions et réponses pour Quiz Prudentiel Niveau 1
  questionsLevel1: [
    {
      quizId: 'quiz_prudential_1',
      id: 'q_p1_001',
      questionText:
        'Quel est le principal objectif du dispositif prudentiel de la BCEAO ?',
      questionType: 'MULTIPLE_CHOICE',
      difficultyScore: 10,
      regulatoryReference: 'DP-2023-001, Article 1',
      explanation:
        "Le dispositif prudentiel a pour objectif d'assurer la stabilité financière, la solidité des établissements et la protection des déposants.",
      answers: [
        {
          answerText: 'Assurer la stabilité financière et la solidité des établissements',
          isCorrect: true,
          position: 1,
        },
        {
          answerText: 'Maximiser les profits des banques',
          isCorrect: false,
          position: 2,
        },
        {
          answerText:
            'Réduire le nombre de banques dans la région',
          isCorrect: false,
          position: 3,
        },
        {
          answerText: 'Éliminer la concurrence bancaire',
          isCorrect: false,
          position: 4,
        },
      ],
    },
    {
      quizId: 'quiz_prudential_1',
      id: 'q_p1_002',
      questionText:
        'Quels sont les trois piliers du système prudentiel international de Bâle III ?',
      questionType: 'MULTIPLE_CHOICE',
      difficultyScore: 15,
      regulatoryReference: 'DP-2023-001, Article 3',
      explanation:
        'Les trois piliers de Bâle III sont : (1) Exigences minimales de capital, (2) Processus de surveillance prudentielle, (3) Discipline de marché.',
      answers: [
        {
          answerText:
            'Exigences de capital, surveillance prudentielle et discipline de marché',
          isCorrect: true,
          position: 1,
        },
        {
          answerText: 'Liquidité, profitabilité et croissance',
          isCorrect: false,
          position: 2,
        },
        {
          answerText: 'Inflation, emploi et balance commerciale',
          isCorrect: false,
          position: 3,
        },
        {
          answerText: 'Taux de change, intérêts et change de devises',
          isCorrect: false,
          position: 4,
        },
      ],
    },
    {
      quizId: 'quiz_prudential_1',
      id: 'q_p1_003',
      questionText:
        'Quel est le ratio de capital minimal exigé par Bâle III pour un établissement standard ?',
      questionType: 'MULTIPLE_CHOICE',
      difficultyScore: 12,
      regulatoryReference: 'DP-2023-002, Article 5',
      explanation:
        "Le ratio de capital minimal (Tier 1) exigé est de 10,5% incluant le coussin de fonds propres. Le ratio Core Tier 1 minimum est de 8,5%.",
      answers: [
        {
          answerText: '10,5% (incluant les coussins)',
          isCorrect: true,
          position: 1,
        },
        {
          answerText: '8%',
          isCorrect: false,
          position: 2,
        },
        {
          answerText: '15%',
          isCorrect: false,
          position: 3,
        },
        {
          answerText: '5%',
          isCorrect: false,
          position: 4,
        },
      ],
    },
    {
      quizId: 'quiz_prudential_1',
      id: 'q_p1_004',
      questionText:
        "Qu'est-ce qu'un actif pondéré pour le risque (APR) ?",
      questionType: 'MULTIPLE_CHOICE',
      difficultyScore: 14,
      regulatoryReference: 'DP-2023-001, Article 8',
      explanation:
        "L'Actif Pondéré pour le Risque est le calcul des actifs d'une banque ajusté par un coefficient selon leur niveau de risque. Les actifs sans risque (obligations d'État) ont un coefficient de 0%, tandis que les prêts aux entreprises ont des coefficients plus élevés.",
      answers: [
        {
          answerText:
            'Un actif dont la valeur est ajustée par un coefficient selon son risque',
          isCorrect: true,
          position: 1,
        },
        {
          answerText: 'Un actif qui génère toujours des profits',
          isCorrect: false,
          position: 2,
        },
        {
          answerText: 'Un actif appartenant à un fonds spéculatif',
          isCorrect: false,
          position: 3,
        },
        {
          answerText: 'Un actif sans valeur marchande',
          isCorrect: false,
          position: 4,
        },
      ],
    },
    {
      quizId: 'quiz_prudential_1',
      id: 'q_p1_005',
      questionText:
        'Quel organe supervise le respect du dispositif prudentiel dans la zone UEMOA ?',
      questionType: 'MULTIPLE_CHOICE',
      difficultyScore: 10,
      regulatoryReference: 'DP-2023-001, Article 2',
      explanation:
        'La BCEAO (Banque Centrale des États de l\'Afrique de l\'Ouest) est responsable de la supervision prudentielle dans la zone UEMOA.',
      answers: [
        {
          answerText: 'La Banque Centrale des États de l\'Afrique de l\'Ouest (BCEAO)',
          isCorrect: true,
          position: 1,
        },
        {
          answerText: 'Le Fonds Monétaire International (FMI)',
          isCorrect: false,
          position: 2,
        },
        {
          answerText: 'La Banque Mondiale',
          isCorrect: false,
          position: 3,
        },
        {
          answerText: 'Les banques commerciales locales',
          isCorrect: false,
          position: 4,
        },
      ],
    },
    {
      quizId: 'quiz_prudential_1',
      id: 'q_p1_006',
      questionText:
        'Qu\'est-ce que la "liquidité" dans le contexte prudentiel ?',
      questionType: 'MULTIPLE_CHOICE',
      difficultyScore: 13,
      regulatoryReference: 'DP-2023-003, Article 12',
      explanation:
        'La liquidité est la capacité d\'une banque à faire face à ses obligations à court terme, notamment pouvoir honorer les retraits des dépôts.',
      answers: [
        {
          answerText:
            'La capacité à honorer les obligations à court terme et les retraits de dépôts',
          isCorrect: true,
          position: 1,
        },
        {
          answerText: 'La densité d\'un actif financier',
          isCorrect: false,
          position: 2,
        },
        {
          answerText: 'Le taux d\'inflation',
          isCorrect: false,
          position: 3,
        },
        {
          answerText: 'La valeur des actions en bourse',
          isCorrect: false,
          position: 4,
        },
      ],
    },
    {
      quizId: 'quiz_prudential_1',
      id: 'q_p1_007',
      questionText:
        'Quel est le ratio de couverture de liquidité (LCR) requis par Bâle III ?',
      questionType: 'MULTIPLE_CHOICE',
      difficultyScore: 14,
      regulatoryReference: 'DP-2023-003, Article 13',
      explanation:
        'Le Liquidity Coverage Ratio (LCR) doit être au minimum de 100%, ce qui signifie que les actifs liquides doivent couvrir les sorties de trésorerie nettes sur 30 jours.',
      answers: [
        {
          answerText: '100% minimum',
          isCorrect: true,
          position: 1,
        },
        {
          answerText: '50% minimum',
          isCorrect: false,
          position: 2,
        },
        {
          answerText: '150% minimum',
          isCorrect: false,
          position: 3,
        },
        {
          answerText: '75% minimum',
          isCorrect: false,
          position: 4,
        },
      ],
    },
    {
      quizId: 'quiz_prudential_1',
      id: 'q_p1_008',
      questionText:
        'Qu\'est-ce qu\'un "établissement systémiquement important" (SIFI) ?',
      questionType: 'MULTIPLE_CHOICE',
      difficultyScore: 15,
      regulatoryReference: 'DP-2023-002, Article 9',
      explanation:
        'Un établissement systémiquement important est une institution financière dont l\'effondrement aurait des conséquences majeures sur l\'économie et le système financier.',
      answers: [
        {
          answerText:
            'Une institution dont l\'effondrement affecterait l\'ensemble du système financier',
          isCorrect: true,
          position: 1,
        },
        {
          answerText: 'Une banque qui opère plusieurs pays',
          isCorrect: false,
          position: 2,
        },
        {
          answerText: 'Une institution avec plus de 1000 salariés',
          isCorrect: false,
          position: 3,
        },
        {
          answerText: 'Une banque qui distribue des microcrédits',
          isCorrect: false,
          position: 4,
        },
      ],
    },
  ],

  // Utilisateurs de test
  testUsers: [
    {
      email: 'admin@regularena.com',
      password: 'Admin123!',
      fullName: 'Administrateur Regularena',
      institution: 'BCEAO',
      countryCode: 'SN',
      userType: 'ADMIN',
    },
    {
      email: 'marie.sow@bceao.int',
      password: 'Test123!',
      fullName: 'Marie Sow',
      institution: 'BCEAO',
      countryCode: 'SN',
      userType: 'PROFESSIONNEL',
    },
    {
      email: 'jean.kone@bac-ml.com',
      password: 'Test123!',
      fullName: 'Jean Koné',
      institution: 'Banque Centrale Mali',
      countryCode: 'ML',
      userType: 'PROFESSIONNEL',
    },
    {
      email: 'fatou.diallo@bceao.ci',
      password: 'Test123!',
      fullName: 'Fatoumata Diallo',
      institution: 'BCEAO - Côte d\'Ivoire',
      countryCode: 'CI',
      userType: 'PROFESSIONNEL',
    },
  ],

  // Articles BCEAO
  articles: [
    {
      title: 'Directive sur le Dispositif Prudentiel 2026',
      content:
        '# Directive BCEAO/2026/01 - Dispositif Prudentiel\n\n## Article 1 : Champ d\'application\n\nLe présent dispositif prudentiel s\'applique à tous les établissements de crédit agréés...',
      category: 'prudentiel',
      source: 'BCEAO',
      externalUrl: 'https://bceao.int/directive/2026/01',
    },
    {
      title: 'Exigences minimales de capital - 2026',
      content:
        '# Nouvelles exigences de capital pour 2026\n\nEn conformité avec Bâle III, la BCEAO fixe de nouvelles exigences...',
      category: 'prudentiel',
      source: 'BCEAO',
      externalUrl: 'https://bceao.int/capital/2026',
    },
    {
      title: 'Circulaire sur les sanctions pénales',
      content:
        '# Circulaire BCEAO - Infractions et sanctions pénales\n\nLe non-respect des dispositions prudentielles peut entraîner...',
      category: 'penal',
      source: 'BCEAO',
      externalUrl: 'https://bceao.int/penal/sanctions',
    },
    {
      title: 'Contrôle des changes et réglementation des échanges',
      content:
        '# Réglementation des échanges financiers\n\n## Chapitre 1 : Contrôle des changes\n\nLe contrôle des changes vise à...',
      category: 'echanges',
      source: 'BCEAO',
      externalUrl: 'https://bceao.int/echanges/controle',
    },
    {
      title: 'Guide pratique : Résidents et Ressortissants',
      content:
        '# Guide BCEAO - Statut des résidents et ressortissants\n\n## 1. Définitions\n\nUn résident de la zone UEMOA est...',
      category: 'residents',
      source: 'BCEAO',
      externalUrl: 'https://bceao.int/residents/guide',
    },
  ],
};

async function main() {
  console.log('🌱 Commençant le seed de la base de données...\n');

  try {
    // 1. Créer les quiz
    console.log('📝 Création des quiz...');
    for (const quiz of seedData.quizzes) {
      await prisma.quiz.upsert({
        where: { id: quiz.id },
        update: quiz,
        create: quiz as any,
      });
      console.log(`  ✓ Quiz créé: ${quiz.title}`);
    }

    // 2. Créer les questions et réponses
    console.log('\n❓ Création des questions...');
    for (const question of seedData.questionsLevel1) {
      const { answers, ...questionData } = question;
      const createdQuestion = await prisma.question.upsert({
        where: { id: question.id },
        update: questionData,
        create: questionData as any,
      });

      // Créer les réponses associées
      for (const answer of answers) {
        await prisma.answer.upsert({
          where: {
            questionId_position: {
              questionId: createdQuestion.id,
              position: answer.position || 1,
            },
          },
          update: answer,
          create: {
            questionId: createdQuestion.id,
            ...answer,
          } as any,
        });
      }
    }
    console.log(`  ✓ ${seedData.questionsLevel1.length} questions créées`);

    // 3. Créer les utilisateurs de test
    console.log('\n👥 Création des utilisateurs de test...');
    for (const user of seedData.testUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          email: user.email,
          passwordHash,
          fullName: user.fullName,
          institution: user.institution,
          countryCode: user.countryCode,
          userType: user.userType as any,
        },
      });
      console.log(`  ✓ Utilisateur créé: ${user.fullName}`);
    }

    // 4. Créer les articles
    console.log('\n📰 Création des articles...');
    for (const article of seedData.articles) {
      await prisma.article.create({
        data: article,
      });
      console.log(`  ✓ Article créé: ${article.title}`);
    }

    console.log('\n✅ Seed complété avec succès !');
    console.log('\n📊 Statistiques :');
    console.log(`  - ${seedData.quizzes.length} quiz créés`);
    console.log(`  - ${seedData.questionsLevel1.length} questions créées`);
    console.log(`  - ${seedData.testUsers.length} utilisateurs de test créés`);
    console.log(`  - ${seedData.articles.length} articles créés`);

    console.log('\n🔐 Identifiants de test :');
    seedData.testUsers.forEach((user) => {
      console.log(`  • Email: ${user.email}`);
      console.log(`    Mot de passe: ${user.password}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du seed :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seed
main()
  .catch((e) => {
    console.error('❌ Erreur fatale :', e);
    process.exit(1);
  });

/*
 * INSTRUCTIONS D'UTILISATION :
 *
 * 1. Placer ce fichier dans: backend/prisma/seed.ts
 *
 * 2. Ajouter au package.json du backend:
 *    "prisma": {
 *      "seed": "ts-node prisma/seed.ts"
 *    }
 *
 * 3. Exécuter avec:
 *    npx prisma db seed
 *
 * 4. Les données de test seront insérées :
 *    - 6 quiz (progressif de débutant à avancé)
 *    - 8 questions + réponses pour le premier quiz
 *    - 4 utilisateurs de test
 *    - 5 articles BCEAO
 *
 * 5. Connexion avec les utilisateurs de test:
 *    Email: marie.sow@bceao.int
 *    Mot de passe: Test123!
 */
