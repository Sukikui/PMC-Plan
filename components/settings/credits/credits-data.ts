import packageMetadata from '@/package.json';

export type CreditVisual =
  | { kind: 'brand'; name: string }
  | { kind: 'emoji'; value: string }
  | { kind: 'image'; src: string };

export interface CreditItem {
  name: string;
  description: string;
  visual: CreditVisual;
  href?: string;
  version?: string;
}

export interface CreditGroup {
  title: string;
  items: CreditItem[];
}

const packageVersions: Record<string, string> = {
  ...packageMetadata.dependencies,
  ...packageMetadata.devDependencies,
};

const dependencyVersion = (name: string) =>
  packageVersions[name]?.replace(/^[^\d]*/, '');

const brand = (name: string): CreditVisual => ({ kind: 'brand', name });
const emoji = (value: string): CreditVisual => ({ kind: 'emoji', value });

export const creditGroups: CreditGroup[] = [
  {
    title: 'Stack applicative',
    items: [
      { name: 'Next.js', description: 'Framework full-stack de l’application.', visual: brand('nextdotjs'), version: dependencyVersion('next'), href: 'https://nextjs.org' },
      { name: 'TypeScript', description: 'Langage partagé entre frontend et backend.', visual: brand('typescript'), version: dependencyVersion('typescript'), href: 'https://www.typescriptlang.org' },
    ],
  },
  {
    title: 'Frontend',
    items: [
      { name: 'React', description: 'Composants et interface utilisateur.', visual: brand('react'), version: dependencyVersion('react'), href: 'https://react.dev' },
      { name: 'Tailwind CSS', description: 'Styles, thèmes clair et sombre.', visual: brand('tailwindcss'), version: dependencyVersion('tailwindcss'), href: 'https://tailwindcss.com' },
      { name: 'TanStack Query', description: 'Chargement, cache et synchronisation des données côté client.', visual: brand('reactquery'), version: dependencyVersion('@tanstack/react-query'), href: 'https://tanstack.com/query/latest' },
      { name: 'Canvas 2D', description: 'Rendu natif des cartes et des itinéraires.', visual: emoji('🎨'), href: 'https://developer.mozilla.org/fr/docs/Web/API/Canvas_API' },
    ],
  },
  {
    title: 'Backend et API',
    items: [
      { name: 'Node.js', description: 'Environnement des routes serveur.', visual: brand('nodedotjs'), href: 'https://nodejs.org' },
      { name: 'Auth.js', description: 'Authentification et sessions Discord.', visual: emoji('🔐'), version: dependencyVersion('next-auth'), href: 'https://authjs.dev' },
      { name: 'Zod', description: 'Validation des données et des API.', visual: brand('zod'), version: dependencyVersion('zod'), href: 'https://zod.dev' },
    ],
  },
  {
    title: 'Couche de données',
    items: [
      { name: 'Prisma', description: 'Accès typé à la base de données.', visual: brand('prisma'), version: dependencyVersion('prisma'), href: 'https://www.prisma.io' },
      { name: 'PostgreSQL', description: 'Stockage persistant de l’application.', visual: brand('postgresql'), href: 'https://www.postgresql.org' },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { name: 'GitHub', description: 'Code source et pipelines CI/CD.', visual: brand('github'), href: 'https://github.com' },
      { name: 'Vercel', description: 'Hébergement, analytics et déploiement automatisé depuis GitHub.', visual: brand('vercel'), href: 'https://vercel.com' },
      { name: 'Supabase', description: 'Hébergement de la base de données PostgreSQL.', visual: brand('supabase'), href: 'https://supabase.com' },
    ],
  },
  {
    title: 'API et intégrations',
    items: [
      { name: 'Discord', description: 'Connexion OAuth et données de profil des utilisateurs.', visual: brand('discord'), href: 'https://discord.com' },
      { name: 'Mojang Studios', description: 'Manifest des versions officielles de Minecraft.', visual: emoji('⛏️'), href: 'https://www.minecraft.net' },
      { name: 'mcasset.cloud', description: 'Textures, modèles et traductions Minecraft.', visual: emoji('🧱'), href: 'https://mcasset.cloud' },
      { name: 'MC Heads', description: 'Rendus des joueurs Minecraft.', visual: emoji('👤'), href: 'https://mcheads.org' },
    ],
  },
  {
    title: 'Écosystème Minecraft',
    items: [
      { name: 'PlayerCoordsAPI', description: 'Mod client transmettant la position du client Minecraft du joueur.', visual: { kind: 'image', src: '/integrations/pcapi_icon.jpeg' }, href: 'https://modrinth.com/mod/playercoordsapi' },
      { name: 'MineVerify', description: 'Plugin serveur vérifiant les comptes Minecraft lors de leur liaison.', visual: { kind: 'image', src: '/integrations/mineverify_icon.jpeg' }, href: 'https://modrinth.com/plugin/mineverify' },
      { name: 'BiomeMap', description: 'Plugin serveur générant les rendus des cartes interactives.', visual: emoji('🗺️'), href: 'https://modrinth.com/plugin/biomemap' },
    ],
  },
  {
    title: 'Assets UI',
    items: [
      { name: 'Inter', description: 'Typographie de l’interface.', visual: brand('googlefonts'), href: 'https://fonts.google.com/specimen/Inter' },
      { name: 'Simple Icons', description: 'Logos vectoriels utilisés dans cet onglet.', visual: brand('simpleicons'), href: 'https://simpleicons.org' },
    ],
  },
  {
    title: 'Outillage et qualité',
    items: [
      { name: 'npm', description: 'Gestion des dépendances et exécution des scripts du projet.', visual: brand('npm'), href: 'https://www.npmjs.com' },
      { name: 'Jest', description: 'Tests unitaires et d’intégration.', visual: brand('jest'), version: dependencyVersion('jest'), href: 'https://jestjs.io' },
      { name: 'ESLint', description: 'Analyse statique et règles de qualité.', visual: brand('eslint'), version: dependencyVersion('eslint'), href: 'https://eslint.org' },
      { name: 'Knip', description: 'Détection du code et des dépendances inutilisés.', visual: brand('knip'), version: dependencyVersion('knip'), href: 'https://knip.dev' },
    ],
  },
];
