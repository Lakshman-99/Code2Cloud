export interface GitAccount {
    id: string;
    username: string;
    avatarUrl: string;
    installationId: string | null;
};

export interface GitConnectionStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  accounts?: GitAccount[];
}

export interface GitRepository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  sshUrl: string;
  cloneUrl: string;
  language: string | null;
  defaultBranch: string;
  updatedAt: string;
  // New Fields
  framework: string,
  installCommand: string,
  buildCommand: string,
  runCommand: string,
  outputDirectory: string
}

export interface GitFrameworkDetection {
  framework: string,
  installCommand: string,
  buildCommand: string,
  runCommand: string,
  outputDirectory: string
}

export const FRAMEWORKS: Record<string, string> = {
  nextjs: "Next.js",
  nestjs: "NestJS",
  vite: "Vite",
  "create-react-app": "Create React App",
  vue: "Vue.js",
  express: "Express.js",
  angular: "Angular",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  streamlit: "Streamlit",
  node: "Node.js",
  python: "Python",
  golang: "Go",
  fastify: "Fastify",
};

export const FRAMEWORK_ICONS: Record<string, string> = {
  nextjs: "/icons/nextjs_icon_dark.svg",
  nestjs: "/icons/nestjs.svg",
  vite: "/icons/vitejs.svg",
  "create-react-app": "/icons/react_dark.svg",
  vue: "/icons/vue.svg",
  express: "/icons/expressjs_dark.svg",
  angular: "/icons/angular.svg",
  django: "/icons/django.svg",
  flask: "/icons/flask-dark.svg",
  fastapi: "/icons/fastapi.svg",
  streamlit: "/icons/streamlit-mark-color.svg",
  node: "/icons/nodejs.svg",
  python: "/icons/python.svg",
  typescript: "/icons/typescript.svg",
  golang: "/icons/golang_dark.svg",
  fastify: "/icons/fastify_dark.svg",
};

export const FRAMEWORK_PRESETS: Record<string, { install: string; build: string; run: string; output: string }> = {
  // SSR / server frameworks — have their own production servers
  nextjs: { install: 'npm install', build: 'npm run build', run: 'npm start', output: '.next' },
  nestjs: { install: 'npm install', build: 'npm run build', run: 'npm run start:prod', output: 'dist' },
  nuxt: { install: 'npm install', build: 'npm run build', run: 'npm run start', output: '.output/public' },
  express: { install: 'npm install', build: '', run: 'node index.js', output: '.' },
  fastify: { install: 'npm install', build: '', run: 'node app.js', output: '.' },
  node: { install: 'npm install', build: '', run: 'npm start', output: '.' },

  // Static site frameworks — use `serve` for production
  vite: { install: 'npm install', build: 'npm run build', run: 'npx --yes serve -s dist -l tcp://0.0.0.0:$PORT', output: 'dist' },
  vue: { install: 'npm install', build: 'npm run build', run: 'npx --yes serve -s dist -l tcp://0.0.0.0:$PORT', output: 'dist' },
  'create-react-app': { install: 'npm install', build: 'npm run build', run: 'npx --yes serve -s build -l tcp://0.0.0.0:$PORT', output: 'build' },
  angular: { install: 'npm install', build: 'npm run build', run: 'npx --yes serve -s dist -l tcp://0.0.0.0:$PORT', output: 'dist' },
  astro: { install: 'npm install', build: 'npm run build', run: 'npx --yes serve -s dist -l tcp://0.0.0.0:$PORT', output: 'dist' },
  sveltekit: { install: 'npm install', build: 'npm run build', run: 'npx --yes serve -s build -l tcp://0.0.0.0:$PORT', output: 'build' },

  // Python frameworks
  django: { install: 'pip install -r requirements.txt', build: 'python manage.py collectstatic --noinput', run: 'gunicorn app.wsgi', output: 'staticfiles' },
  flask: { install: 'pip install -r requirements.txt', build: '', run: 'gunicorn app:app', output: '.' },
  fastapi: { install: 'pip install -r requirements.txt', build: '', run: 'uvicorn main:app --host 0.0.0.0 --port $PORT', output: '.' },
  streamlit: { install: 'pip install -r requirements.txt', build: '', run: 'streamlit run app.py', output: '.' },
  python: { install: 'pip install -r requirements.txt', build: '', run: 'python main.py', output: '.' },
};

export const PYTHON_FRAMEWORKS = new Set(['django', 'flask', 'fastapi', 'streamlit', 'python']);

export const PYTHON_VERSIONS = [
  { label: 'Auto (latest)', value: '' },
  { label: '3.13', value: '3.13' },
  { label: '3.12', value: '3.12' },
  { label: '3.11', value: '3.11' },
  { label: '3.10', value: '3.10' },
  { label: '3.9', value: '3.9' },
  { label: '3.8', value: '3.8' },
  { label: '3.7', value: '3.7' },
];