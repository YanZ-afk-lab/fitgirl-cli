import axios from 'axios';
import * as cheerio from 'cheerio';
import { exec } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import figlet from 'figlet';

// Função para gerar o banner com efeito degradê/colorido por dentro
function printHeader() {
  console.clear();
  
  // Gera o texto em ASCII usando a fonte "Standard" ou "Slant"
  const text = figlet.textSync('FITGIRL CLI', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true
  });

  // Divide o texto linha por linha para colorir com tons progressivos de laranja (estilo wordmark)
  const lines = text.split('\n');
  const colors = [
    chalk.hex('#FF4500'), // Laranja avermelhado escuro (borda/fundo)
    chalk.hex('#FF6B00'), 
    chalk.hex('#FF8C00'), 
    chalk.hex('#FFA500'), // Laranja vibrante
    chalk.hex('#FFB733'), 
    chalk.hex('#FFD700')  // Amarelo dourado (topo/centro)
  ];

  lines.forEach((line, index) => {
    // Aplica uma cor baseada na linha para dar efeito de volume/degradê interno
    const colorFn = colors[index % colors.length];
    console.log(colorFn(line));
  });

  console.log(chalk.gray('─────────────────────────────────────────────────────────────'));
  console.log(chalk.white.bold('  Seu gerenciador de downloads direto no terminal v1.0.0\n'));
}

async function run() {
  try {
    printHeader();

    // 1. Pergunta o nome do jogo usando o Inquirer
    const { searchTerm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerm',
        message: chalk.hex('#38BDF8')('🔍 Digite o nome do jogo que deseja buscar:'),
        validate: (input) => input.trim() !== '' || 'Por favor, digite um nome válido.'
      }
    ]);

    const spinner = ora({
      text: chalk.gray(`Consultando a base de dados para "${searchTerm}"...`),
      color: 'yellow'
    }).start();

    // 2. Busca na API do WordPress
    const searchResponse = await axios.get('https://fitgirl-repacks.site/wp-json/wp/v2/posts', {
      params: { search: searchTerm, per_page: 5 },
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    spinner.stop();
    const posts = searchResponse.data;

    if (posts.length === 0) {
      console.log(chalk.red('\n  ✖ Nenhum jogo encontrado com esse termo.\n'));
      return;
    }

    // 3. Formata as opções para o menu de setas
    const choices = posts.map((post) => ({
      name: `${chalk.bold.white(post.title.rendered)}  ${chalk.gray(`(${post.link})`)}`,
      value: post
    }));

    choices.push(new inquirer.Separator(chalk.gray('─────────────────────────────────────────────────────────────')));
    choices.push({ name: chalk.red('✖ Cancelar e sair'), value: null });

    console.log(chalk.green(`\n  ✔ Encontrado(s) ${posts.length} resultado(s). Use as setas para selecionar:\n`));

    const { selectedGame } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedGame',
        message: chalk.hex('#38BDF8')('Selecione o jogo desejado:'),
        choices: choices,
        pageSize: 6
      }
    ]);

    if (!selectedGame) {
      console.log(chalk.yellow('\n  Operação cancelada.\n'));
      return;
    }

    console.log(chalk.gray(`\n  Selecionado: `) + chalk.white(selectedGame.title.rendered));

    const pageSpinner = ora({
      text: chalk.gray('Acessando a página e extraindo o Magnet Link...'),
      color: 'yellow'
    }).start();

    // 4. Acessa a página do jogo escolhido
    const pageResponse = await axios.get(selectedGame.link, {
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

    pageSpinner.stop();

    if (!magnetLink) {
      console.log(chalk.red('\n  ✖ Nenhum link Magnet válido foi encontrado nesta página.\n'));
      return;
    }

    console.log(chalk.hex('#10B981')('  ✔ Link Magnet capturado com sucesso!'));
    console.log(chalk.cyan('  🚀 Acionando o seu cliente de torrent padrão...\n'));

    // 5. Abre no cliente de torrent padrão do Windows
    const comando = `start "" "${magnetLink}"`;

    exec(comando, (error) => {
      if (error) {
        console.log(chalk.red('  ✖ Erro ao abrir o cliente de torrent:'), error.message);
      } else {
        console.log(chalk.bgHex('#047857').hex('#FFFFFF').bold(' SUCESSO! O cliente de torrent foi aberto. '));
        console.log(chalk.gray('  Dica: Você já pode fechar esta janela do PowerShell.\n'));
      }
    });

  } catch (error) {
    console.error(chalk.red('\n  ✖ Ocorreu um erro:'), error.message);
  }
}

run();