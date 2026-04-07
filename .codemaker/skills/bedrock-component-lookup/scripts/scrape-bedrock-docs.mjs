/**
 * 批量抓取 Bedrock 组件 API 文档并写入 .cache/bedrock-docs/
 *
 * 特性：
 * - 组件列表从 Bedrock 官网侧边菜单动态读取，无需硬编码
 * - 使用 Playwright headless 浏览器渲染 SPA 页面
 * - 输出 Markdown 缓存到 .cache/bedrock-docs/{slug}.md，有效期 30 天
 *
 * 运行：node .codemaker/skills/bedrock-component-lookup/assets/scrape-bedrock-docs.mjs
 */
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), '.cache', 'bedrock-docs');
const BASE_URL = 'https://bedrock.netease.com/components';

function getExpireDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

function getNowISO() {
  return new Date().toISOString();
}

/**
 * 从 Bedrock 组件总览页的侧边菜单动态提取所有组件
 * 返回 [{ name: 'Button', slug: 'button' }, ...]
 */
async function fetchComponentList(page) {
  console.log('📋 正在从 Bedrock 官网动态读取组件列表...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await page.waitForSelector('nav a, aside a, [class*="menu"] a', { timeout: 10000 });

  const components = await page.evaluate((baseUrl) => {
    // 查找侧边菜单中所有指向 /components/xxx 的链接
    const links = document.querySelectorAll('a[href]');
    const seen = new Set();
    const result = [];
    const prefix = '/components/';

    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      // 匹配 /components/{slug} 格式，排除 /components 本身（总览页）
      const match = href.match(/\/components\/([a-z0-9-]+)\/?$/i);
      if (match) {
        const slug = match[1].toLowerCase();
        if (slug === 'overview' || slug === 'components' || seen.has(slug)) return;
        seen.add(slug);

        // 从链接文本提取组件名
        const text = a.innerText.trim();
        // 组件名通常是英文部分（如 "Button 按钮" → "Button"）
        const name = text.split(/\s+/)[0] || slug;
        result.push({ name, slug });
      }
    });

    return result;
  }, BASE_URL);

  console.log(`✅ 发现 ${components.length} 个组件`);
  return components;
}

async function scrapeComponent(page, comp) {
  const url = `${BASE_URL}/${comp.slug}`;
  console.log(`  → 抓取 ${comp.name} (${url})`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  } catch {
    // networkidle 超时时页面可能已加载完成，继续
  }
  try {
    await page.waitForSelector('main h1, main h2', { timeout: 8000 });
  } catch {
    console.log(`    ⚠️ 页面加载超时，跳过 ${comp.name}`);
    return null;
  }

  const data = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return { title: '', sections: [] };
    const title = main.querySelector('h1')?.innerText?.trim() || '';
    const sections = [];
    const headings = main.querySelectorAll('h2, h3');
    headings.forEach((h) => {
      const text = h.innerText.trim();
      if (
        text.includes('API') ||
        text.includes('Props') ||
        text.includes('Events') ||
        text.includes('Methods') ||
        text.includes('Slots') ||
        text.includes('属性') ||
        text.includes('事件') ||
        text.includes('方法')
      ) {
        let el = h.nextElementSibling;
        const tables = [];
        while (el) {
          if (el.tagName === h.tagName || (el.tagName === 'H2' && h.tagName === 'H3')) break;
          if (el.tagName === 'TABLE') {
            const rows = [];
            el.querySelectorAll('tr').forEach((tr) => {
              const cells = [];
              tr.querySelectorAll('th, td').forEach((cell) => cells.push(cell.innerText.trim().replace(/\n/g, ' ')));
              if (cells.length) rows.push(cells);
            });
            tables.push(rows);
          }
          const childTables = el.querySelectorAll('table');
          childTables.forEach((table) => {
            const rows = [];
            table.querySelectorAll('tr').forEach((tr) => {
              const cells = [];
              tr.querySelectorAll('th, td').forEach((cell) => cells.push(cell.innerText.trim().replace(/\n/g, ' ')));
              if (cells.length) rows.push(cells);
            });
            if (rows.length) tables.push(rows);
          });
          el = el.nextElementSibling;
        }
        if (tables.length) sections.push({ heading: text, tables });
      }
    });
    if (sections.length === 0) {
      const allTables = main.querySelectorAll('table');
      if (allTables.length) {
        const tables = [];
        allTables.forEach((table) => {
          const rows = [];
          table.querySelectorAll('tr').forEach((tr) => {
            const cells = [];
            tr.querySelectorAll('th, td').forEach((cell) => cells.push(cell.innerText.trim().replace(/\n/g, ' ')));
            if (cells.length) rows.push(cells);
          });
          if (rows.length) tables.push(rows);
        });
        sections.push({ heading: 'API', tables });
      }
    }
    return { title, sections };
  });
  return data;
}

function formatMarkdown(comp, data) {
  const now = getNowISO();
  const expires = getExpireDate();
  let md = `<!-- cached: ${now} -->\n`;
  md += `<!-- expires: ${expires} -->\n`;
  md += `<!-- source: Playwright batch scrape from ${BASE_URL}/${comp.slug} -->\n\n`;
  md += `# ${data.title || comp.name} API\n\n`;
  md += `> 来源：${BASE_URL}/${comp.slug}\n\n`;
  md += `## 导入\n\n\`\`\`tsx\nimport { ${comp.name} } from '@bedrock/components';\n\`\`\`\n\n`;
  if (data.sections.length === 0) {
    md += `> ⚠️ 未在页面中找到 API 表格，请手动查阅官方文档。\n`;
    return md;
  }
  for (const section of data.sections) {
    md += `## ${section.heading}\n\n`;
    for (const table of section.tables) {
      if (table.length === 0) continue;
      const header = table[0];
      md += `| ${header.join(' | ')} |\n`;
      md += `| ${header.map(() => '---').join(' | ')} |\n`;
      for (let i = 1; i < table.length; i++) {
        const cells = table[i];
        while (cells.length < header.length) cells.push('-');
        md += `| ${cells.map((c) => c.replace(/\|/g, '\\|')).join(' | ')} |\n`;
      }
      md += '\n';
    }
  }
  return md;
}

async function main() {
  console.log('🚀 开始批量抓取 Bedrock 组件文档...\n');

  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
    console.log(`📁 创建缓存目录: ${CACHE_DIR}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 第一步：动态获取组件列表
  const components = await fetchComponentList(page);
  if (components.length === 0) {
    console.log('❌ 未能获取到任何组件，请检查网络或页面结构是否变化');
    await browser.close();
    process.exit(1);
  }

  console.log(`\n📦 开始逐个抓取 ${components.length} 个组件文档...\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  // 第二步：逐个抓取 API 文档
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    const filePath = join(CACHE_DIR, `${comp.slug}.md`);

    console.log(`[${i + 1}/${components.length}] ${comp.name}`);
    try {
      const data = await scrapeComponent(page, comp);
      if (data) {
        const md = formatMarkdown(comp, data);
        writeFileSync(filePath, md, 'utf-8');
        console.log(`    ✅ 写入 ${comp.slug}.md`);
        success++;
      } else {
        console.log(`    ⚠️ 无数据，跳过`);
        failed++;
        errors.push(comp.name);
      }
    } catch (err) {
      console.log(`    ❌ 错误: ${err.message}`);
      failed++;
      errors.push(`${comp.name}: ${err.message}`);
    }
  }

  await browser.close();

  console.log('\n📊 抓取完成:');
  console.log(`  ✅ 成功: ${success}`);
  console.log(`  ❌ 失败: ${failed}`);
  if (errors.length) console.log(`  失败列表: ${errors.join(', ')}`);
}

main().catch(console.error);
