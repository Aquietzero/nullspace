/**
 * 归档页增强：
 * 1. 顶部显示 category 导航栏，点击跳转到 /categories/xxx
 * 2. 每个文章项右侧显示其所属 category
 */
hexo.extend.filter.register('after_render:html', function (str) {
  // 只对含 posts-collapse 的页面生效（archive / category / tag 列表页）
  if (str.indexOf('posts-collapse') === -1) return str;

  // --- 构建数据 ---

  // 文章 URL → category 映射
  const posts = hexo.locals.get('posts');
  const mapping = {};
  posts.forEach(function (post) {
    const url = encodeURI(hexo.config.root + post.path);
    const cats = [];
    if (post.categories && post.categories.length) {
      post.categories.forEach(function (cat) {
        cats.push({ name: cat.name, path: encodeURI(hexo.config.root + cat.path) });
      });
    }
    if (cats.length > 0) {
      mapping[url] = cats;
    }
  });

  // 所有顶级 category（取第一级），按文章数降序
  const catCount = {};
  const catPath = {};
  posts.forEach(function (post) {
    if (post.categories && post.categories.length) {
      const topCat = post.categories.toArray()[0];
      if (topCat) {
        catCount[topCat.name] = (catCount[topCat.name] || 0) + 1;
        if (!catPath[topCat.name]) {
          catPath[topCat.name] = encodeURI(hexo.config.root + topCat.path);
        }
      }
    }
  });
  const categories = Object.keys(catCount)
    .sort(function (a, b) { return catCount[b] - catCount[a]; })
    .map(function (name) { return { name: name, count: catCount[name], path: catPath[name] }; });

  const script = `
<script>
(function() {
  var mapping = ${JSON.stringify(mapping)};
  var categories = ${JSON.stringify(categories)};
  var container = document.querySelector('.posts-collapse');
  if (!container) return;

  // --- 1. 为每个文章项右侧追加 category 标签 ---
  var links = container.querySelectorAll('.post-title a.post-title-link');
  links.forEach(function(a) {
    var href = a.getAttribute('href');
    var cats = mapping[href];
    if (!cats || !cats.length) return;
    var cat = cats[cats.length - 1]; // 最深层级的 category
    var tag = document.createElement('span');
    tag.className = 'archive-category-tag';
    tag.textContent = cat.name;
    var header = a.closest('.post-header');
    if (header) header.appendChild(tag);
  });

  // --- 2. 仅在 archive 页面顶部注入 category 导航栏 ---
  var path = window.location.pathname;
  var isArchive = /\\/archives\\//.test(path) || path === '/archives';
  if (!isArchive) return;

  var postContent = container.querySelector('.post-content');
  if (!postContent) return;

  var nav = document.createElement('div');
  nav.className = 'archive-category-nav';

  categories.forEach(function(cat) {
    var link = document.createElement('a');
    link.className = 'archive-category-link';
    link.href = cat.path;
    link.innerHTML = cat.name + '<span class="archive-category-count">' + cat.count + '</span>';
    nav.appendChild(link);
  });

  postContent.insertBefore(nav, postContent.firstChild);
})();
</script>`;

  return str.replace('</body>', script + '</body>');
});
