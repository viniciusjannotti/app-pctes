# APP PCTES — MVP v1

Sistema de acompanhamento longitudinal de pacientes, desenvolvido para transformar compromissos futuros em tarefas acionáveis.

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS v4 (Vanilla approach for design system)
- **Backend**: Firebase (Authentication, Firestore)
- **PWA**: vite-plugin-pwa

## ⚙️ Configuração Inicial

### 1. Criar projeto no Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/) e crie um novo projeto.
2. Ative o **Authentication** (método: E-mail/Senha).
3. Ative o **Firestore Database** (em modo de teste ou produção).

### 2. Configurar Regras de Segurança (Firestore)
No painel do Firestore, vá na aba **Regras** e cole o conteúdo do arquivo `firestore.rules` presente na raiz deste repositório. Isso garante o isolamento multiusuário (cada profissional só acessa seus próprios dados).

### 3. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto (como exemplificado abaixo) e adicione as chaves do seu projeto Firebase (encontradas nas configurações do app web no Firebase Console):

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 4. Executando Localmente
Instale as dependências e inicie o servidor:

```bash
npm install
npm run dev
```

## 🌐 Deploy na Vercel

1. Crie uma conta na [Vercel](https://vercel.com/).
2. Conecte seu repositório GitHub contendo este projeto.
3. No painel de configuração do deploy da Vercel:
   - Framework Preset: **Vite**
   - Em **Environment Variables**, adicione todas as variáveis do seu `.env.local` (sem o prefixo `VITE_` não tem problema, mas mantenha os nomes iguais).
4. Clique em **Deploy**.

## 📱 PWA (Instalação no Celular)

O aplicativo já está configurado como PWA. Quando acessado pelo celular (Chrome no Android ou Safari no iOS), ele oferecerá a opção "Adicionar à Tela Inicial", instalando-se como um aplicativo nativo.
