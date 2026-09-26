#!/usr/bin/env node

import inquirer from 'inquirer';
import cfonts from 'cfonts';
import axios from 'axios';
import { exec } from 'child_process';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'users.json');

const dict = {
  'Portugues': {
    noUsers: ' Nenhuma conta encontrada. Vamos criar a primeira!',
    accountMgmt: 'Gerenciamento de Contas:',
    loginOption: 'Entrar em uma conta existente',
    createOption: 'Criar nova conta',
    newAccountPrompt: 'Digite o nome da nova conta:',
    emptyNameError: 'O nome nao pode estar vazio.',
    folderPrompt: 'Pasta padrao de downloads (ex: C:/Jogos ou Downloads):',
    accountCreated: (name) => `\n Conta "${name}" criada com sucesso!\n`,
    selectAccount: 'Selecione a conta:',
    welcomeBack: (name) => `\n Bem-vindo de volta, ${name}!\n`,
    bannerAccount: 'Account',
    bannerLang: 'Language',
    bannerFolder: 'Folder',
    mainMenuPrompt: 'O que você deseja fazer?',
    menuSearch: '1. Pesquisar jogo',
    menuClients: '2. Torrent Clients (Baixar / Acessar site oficial)',
    menuAccount: '3. Trocar / Gerenciar Conta',
    menuSettings: '4. Configurações',
    menuExit: '5. Sair',
    searchPrompt: 'Digite o nome do jogo que deseja buscar (ou deixe vazio para voltar):',
    searching: (term) => `\nBuscando por "${term}"...`,
    gameNotFound: '\nNenhum jogo encontrado com esse nome.',
    selectGame: 'Selecione o jogo desejado:',
    backMenu: 'Voltar ao menu principal',
    accessingPage: (title) => `\nAcessando pagina de: ${title}...`,
    noMagnet: '\nNenhum link Magnet valido foi encontrado nesta pagina.',
    magnetFound: '\nLink Magnet encontrado! Abrindo cliente de torrent...',
    torrentSuccess: 'Cliente de torrent aberto com sucesso!',
    torrentError: 'Erro ao abrir o torrent:',
    searchError: '\nErro na busca:',
    pressEnter: 'Pressione ENTER para continuar...',
    clientsMgmt: 'Gerenciamento de Clientes Torrent (Abrir site oficial):',
    installQbit: 'Baixar qBittorrent (Recomendado - Abre o site oficial)',
    installTrans: 'Baixar Transmission (Abre o site oficial)',
    installDeluge: 'Baixar Deluge (Abre o site oficial)',
    browserStart: (name) => `\nAbrindo navegador para baixar: ${name}...\n`,
    browserSuccess: 'Site oficial aberto no navegador com sucesso!',
    browserError: 'Erro ao abrir o navegador:',
    settingsTitle: 'Configuracoes:',
    changeFolder: (folder) => `Mudar pasta de downloads (Atual: ${folder})`,
    changeLang: (lang) => `Mudar idioma / Change language (Atual: ${lang})`,
    newFolderPrompt: 'Digite o caminho da nova pasta:',
    folderUpdated: 'Pasta atualizada com sucesso!',
    selectLang: 'Selecione o idioma / Select language:',
    langUpdated: 'Idioma atualizado com sucesso!'
  },
  'English': {
    noUsers: ' No accounts found. Let\'s create the first one!',
    accountMgmt: 'Account Management:',
    loginOption: 'Login to existing account',
    createOption: 'Create new account',
    newAccountPrompt: 'Enter the new account name:',
    emptyNameError: 'The name cannot be empty.',
    folderPrompt: 'Default download folder (e.g., C:/Games or Downloads):',
    accountCreated: (name) => `\n Account "${name}" successfully created!\n`,
    selectAccount: 'Select account:',
    welcomeBack: (name) => `\n Welcome back, ${name}!\n`,
    bannerAccount: 'Account',
    bannerLang: 'Language',
    bannerFolder: 'Folder',
    mainMenuPrompt: 'What do you want to do?',
    menuSearch: '1. Search game',
    menuClients: '2. Torrent Clients (Download / Official website)',
    menuAccount: '3. Switch / Manage Account',
    menuSettings: '4. Settings',
    menuExit: '5. Exit',
    searchPrompt: 'Enter the name of the game you want to search (or leave empty to go back):',
    searching: (term) => `\nSearching for "${term}"...`,
    gameNotFound: '\nNo games found with that name.',
    selectGame: 'Select the desired game:',
    backMenu: 'Back to main menu',
    accessingPage: (title) => `\nAccessing page for: ${title}...`,
    noMagnet: '\nNo valid Magnet link was found on this page.',
    magnetFound: '\nMagnet link found! Opening torrent client...',
    torrentSuccess: 'Torrent client opened successfully!',
    torrentError: 'Error opening torrent:',
    searchError: '\nSearch error:',
    pressEnter: 'Press ENTER to continue...',
    clientsMgmt: 'Torrent Clients Management (Open official website):',
    installQbit: 'Download qBittorrent (Recommended - Opens official site)',
    installTrans: 'Download Transmission (Opens official site)',
    installDeluge: 'Download Deluge (Opens official site)',
    browserStart: (name) => `\nOpening browser to download: ${name}...\n`,
    browserSuccess: 'Official website opened in browser successfully!',
    browserError: 'Error opening browser:',
    settingsTitle: 'Settings:',
    changeFolder: (folder) => `Change download folder (Current: ${folder})`,
    changeLang: (lang) => `Change language / Mudar idioma (Current: ${lang})`,
    newFolderPrompt: 'Enter the new folder path:',
    folderUpdated: 'Folder updated successfully!',
    selectLang: 'Select language / Selecionar idioma:',
    langUpdated: 'Language updated successfully!'
  }
};

function loadUsers() {
  if (!fs.existsSync(dbPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveUsers(users) {
  fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
}

let session = {
  user: null,
  language: 'Portugues',
  downloadFolder: 'Downloads'
};

const t = () => dict[session.language] || dict['Portugues'];

async function initApp() {
  console.clear();
  cfonts.say('FITGIRL CLI', {
    font: 'block',
    align: 'left',
    colors: ['green'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 1,
    space: true,
    maxLength: '0',
  });
  console.log('-------------------------------------------------------------');

  const users = loadUsers();
  const userKeys = Object.keys(users);

  if (userKeys.length === 0) {
    console.log(dict['Portugues'].noUsers);
    await createAccountFlow();
  } else {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Account Management / Gerenciamento de Contas:',
        choices: [
          { name: 'Entrar em conta existente / Login to existing', value: 'login' },
          { name: 'Criar nova conta / Create new account', value: 'create' }
        ]
      }
    ]);

    if (action === 'create') {
      await createAccountFlow();
    } else {
      await loginFlow(users, userKeys);
    }
  }

  await mainMenu();
}

async function createAccountFlow() {
  const langChoice = await inquirer.prompt([
    {
      type: 'list',
      name: 'lang',
      message: 'Escolha o idioma / Choose your language:',
      choices: ['Portugues', 'English']
    }
  ]);

  session.language = langChoice.lang;
  const currentT = t();

  const { username, folder } = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: currentT.newAccountPrompt,
      validate: (input) => input.trim() !== '' ? true : currentT.emptyNameError
    },
    {
      type: 'input',
      name: 'folder',
      message: currentT.folderPrompt,
      default: 'Downloads'
    }
  ]);

  const users = loadUsers();
  users[username] = {
    language: session.language,
    downloadFolder: folder,
    createdAt: new Date().toISOString()
  };
  saveUsers(users);

  session.user = username;
  session.downloadFolder = folder;
  console.log(currentT.accountCreated(username));
}

async function loginFlow(users, userKeys) {
  const { selectedUser } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedUser',
      message: 'Selecione a conta / Select account:',
      choices: userKeys
    }
  ]);

  session.user = selectedUser;
  session.downloadFolder = users[selectedUser].downloadFolder || 'Downloads';
  session.language = users[selectedUser].language || 'Portugues';
  console.log(t().welcomeBack(selectedUser));
}

async function mainMenu() {
  console.clear();
  cfonts.say('FITGIRL CLI', {
    font: 'block',
    align: 'left',
    colors: ['green'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 1,
    space: true,
    maxLength: '0',
  });

  const currentT = t();
  console.log('-------------------------------------------------------------');
  console.log(` ${currentT.bannerAccount}: ${session.user} | ${currentT.bannerLang}: ${session.language} | ${currentT.bannerFolder}: ${session.downloadFolder}`);
  console.log('-------------------------------------------------------------');

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'option',
      message: currentT.mainMenuPrompt,
      choices: [
        { name: currentT.menuSearch, value: 'search' },
        { name: currentT.menuClients, value: 'clients' },
        { name: currentT.menuAccount, value: 'account' },
        { name: currentT.menuSettings, value: 'settings' },
        { name: currentT.menuExit, value: 'exit' }
      ]
    }
  ]);

  switch (answers.option) {
    case 'search':
      await searchGameFlow();
      break;
    case 'clients':
      await torrentClientsFlow();
      break;
    case 'account':
      await initApp();
      break;
    case 'settings':
      await settingsFlow();
      break;
    case 'exit':
      console.log('\nBye! / Ate mais!\n');
      process.exit(0);
  }
}

async function searchGameFlow() {
  const currentT = t();
  const { searchTerm } = await inquirer.prompt([
    {
      type: 'input',
      name: 'searchTerm',
      message: currentT.searchPrompt
    }
  ]);

  if (!searchTerm.trim()) {
    return mainMenu();
  }

  console.log(currentT.searching(searchTerm));

  try {
    const searchResponse = await axios.get('https://fitgirl-repacks.site/wp-json/wp/v2/posts', {
      params: { search: searchTerm, per_page: 5 },
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const posts = searchResponse.data;

    if (posts.length === 0) {
      console.log(currentT.gameNotFound);
      await pressEnterToReturn();
      return mainMenu();
    }

    const choices = posts.map(post => ({
      name: post.title.rendered.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'"),
      value: post
    }));
    choices.push({ name: currentT.backMenu, value: 'back' });

    const selected = await inquirer.prompt([
      {
        type: 'list',
        name: 'game',
        message: currentT.selectGame,
        choices: choices
      }
    ]);

    if (selected.game === 'back') {
      return mainMenu();
    }

    const chosenGame = selected.game;
    console.log(currentT.accessingPage(chosenGame.title.rendered));

    const pageResponse = await axios.get(chosenGame.link, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    const $ = cheerio.load(pageResponse.data);
    let magnetLink = null;

    $('.entry-content a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('magnet:')) {
        magnetLink = href;
        return false;
      }
    });

    if (!magnetLink) {
      console.log(currentT.noMagnet);
    } else {
      console.log(currentT.magnetFound);
      const comando = `start "" "${magnetLink}"`;
      exec(comando, (error) => {
        if (error) {
          console.error(currentT.torrentError, error.message);
        } else {
          console.log(currentT.torrentSuccess);
        }
      });
    }

    await pressEnterToReturn();
    mainMenu();

  } catch (error) {
    console.error(currentT.searchError, error.message);
    await pressEnterToReturn();
    mainMenu();
  }
}

async function torrentClientsFlow() {
  const currentT = t();
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: currentT.clientsMgmt,
      choices: [
        { name: currentT.installQbit, value: 'qbittorrent' },
        { name: currentT.installTrans, value: 'transmission' },
        { name: currentT.installDeluge, value: 'deluge' },
        { name: currentT.backMenu, value: 'back' }
      ]
    }
  ]);

  if (action === 'back') {
    return mainMenu();
  }

  // Links oficiais dos clientes de torrent
  const urlMap = {
    qbittorrent: 'https://www.qbittorrent.org/download',
    transmission: 'https://transmissionbt.com/download/',
    deluge: 'https://deluge-torrent.org/'
  };

  const targetUrl = urlMap[action];
  console.log(currentT.browserStart(action));

  // Comando do Windows para abrir o navegador padrão na URL oficial
  const openCommand = `start "" "${targetUrl}"`;

  exec(openCommand, (error) => {
    if (error) {
      console.error(currentT.browserError, error.message);
    } else {
      console.log(currentT.browserSuccess);
    }
    pressEnterToReturn().then(() => mainMenu());
  });
}

async function settingsFlow() {
  const currentT = t();
  const { setting } = await inquirer.prompt([
    {
      type: 'list',
      name: 'setting',
      message: currentT.settingsTitle,
      choices: [
        { name: currentT.changeFolder(session.downloadFolder), value: 'folder' },
        { name: currentT.changeLang(session.language), value: 'lang' },
        { name: currentT.backMenu, value: 'back' }
      ]
    }
  ]);

  const users = loadUsers();

  if (setting === 'folder') {
    const { newFolder } = await inquirer.prompt([{ type: 'input', name: 'newFolder', message: currentT.newFolderPrompt }]);
    if (newFolder) {
      session.downloadFolder = newFolder;
      if (users[session.user]) {
        users[session.user].downloadFolder = newFolder;
        saveUsers(users);
      }
      console.log(currentT.folderUpdated);
    }
  } else if (setting === 'lang') {
    const { newLang } = await inquirer.prompt([
      {
        type: 'list',
        name: 'newLang',
        message: currentT.selectLang,
        choices: ['Portugues', 'English']
      }
    ]);
    if (newLang) {
      session.language = newLang;
      if (users[session.user]) {
        users[session.user].language = newLang;
        saveUsers(users);
      }
      console.log(t().langUpdated);
    }
  }

  mainMenu();
}

async function pressEnterToReturn() {
  const currentT = t();
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: currentT.pressEnter
    }
  ]);
}

initApp();