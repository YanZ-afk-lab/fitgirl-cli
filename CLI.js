import axios from 'axios';
import inquirer from 'inquirer';
import chalk from 'chalk';

// Exibe o Banner ASCII no topo
function printBanner() {
  const banner = `
 ███████╗ ██╗ ████████╗  ██████╗  ██╗ ██████╗  ██╗         ██████╗ ██╗      ██╗
 ██╔════╝ ██║ ╚══██╔══╝ ██╔════╝  ██║ ██╔══██╗ ██║         ██╔════╝ ██║      ██║
 █████╗   ██║    ██║    ██║  ███╗ ██║ ██████╔╝ ██║         ██║      ██║      ██║
 ██╔══╝   ██║    ██║    ██║   ██║ ██║ ██╔══██╗ ██║         ██║      ██║      ██║
 ██║      ██║    ██║    ╚██████╔╝ ██║ ██║  ██║ ███████╗    ╚██████╗ ███████╗ ██║
 ╚═╝      ╚═╝    ╚═╝     ╚═════╝  ╚═╝ ╚═╝  ╚═╝ ╚══════╝     ╚═════╝ ╚══════╝ ╚═╝
`;
  // Aplicação de degradê alaranjado estilo OpenClaude
  const lines = banner.split('\n');
  lines.forEach((line, index) => {
    if (index < 3) {
      console.log(chalk.hex('#FF8C00')(line)); // Laranja mais claro
    } else if (index < 6) {
      console.log(chalk.hex('#FF4500')(line)); // Laranja intermediário
    } else {
      console.log(chalk.hex('#FF2400')(line)); // Laranja avermelhado
    }
  });
  console.log(chalk.gray('-------------------------------------------------------------'));
}

async function main() {
  printBanner();

  // 1. Seleção de Idioma
  const langAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'language',
      message: 'Choose your language / Escolha o idioma:',
      choices: ['Português', 'English']
    }
  ]);

  const isPt = langAnswer.language === 'Português';

  console.log(chalk.gray('-------------------------------------------------------------'));

  // 2. Pergunta o termo de busca
  const searchAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'searchTerm',
      message: isPt ? 'Digite o nome do jogo que deseja buscar:' : 'Enter the name of the game you want to search:'
    }
  ]);

  const query = searchAnswer.searchTerm.trim();
  if (!query) {
    console.log(chalk.red(isPt ? 'Busca vazia.' : 'Empty search.'));
    return;
  }

  console.log(chalk.blue(isPt ? '🔍 Buscando na base de dados...' : '🔍 Searching database...'));

  try {
    // Codifica a string de busca para suportar apóstrofos (ex: Assassin's Creed) e acentos
    const encodedSearchTerm = encodeURIComponent(query);

    const response = await axios.get(`https://fitgirl-repacks.site/wp-json/wp/v2/posts?search=${encodedSearchTerm}&per_page=15`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    const posts = response.data;

    if (posts.length === 0) {
      console.log(chalk.yellow(isPt ? '\n❌ Nenhum jogo relevante encontrado com esse nome.' : '\n❌ No relevant games found with that name.'));
      return;
    }

    // Mapeia os posts encontrados para as opções do prompt
    const choices = posts.map(post => ({
      name: post.title.rendered.replace(/&#8211;/g, '-').replace(/&#8217;/g, "'"),
      value: post.link
    }));

    console.log('');
    const selectAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'gameLink',
        message: isPt ? 'Selecione o jogo desejado:' : 'Select the desired game:',
        choices: choices,
        pageSize: 10
      }
    ]);

    console.log(chalk.green(isPt ? `\n🔗 Link selecionado: ${selectAnswer.gameLink}` : `\n🔗 Selected link: ${selectAnswer.gameLink}`));

  } catch (error) {
    console.error(chalk.red(isPt ? 'Erro ao conectar com o site:' : 'Error connecting to the site:'), error.message);
  }
}

main();